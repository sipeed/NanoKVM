#pragma once

#include <errno.h>
#include <fcntl.h>
#include <poll.h>
#include <stdint.h>
#include <unistd.h>

#include <limits>
#include <map>
#include <sstream>
#include <string>

// Shared by libkvm and kvm_system; independent of MaixCDK and the capture SDK.
namespace lontium_hdmi {

enum class Signal { Unknown, Off, Absent, Unstable, Valid, Error };

struct Timings {
    bool valid = false;
    uint32_t width = 0;
    uint32_t height = 0;
    uint32_t htotal = 0;
    uint32_t vtotal = 0;
    uint64_t pixelclock_hz = 0;
    uint32_t fps_millihz = 0; // Zero means unknown, including LT6911C.
};

struct Status {
    uint32_t abi = 0;
    uint64_t sequence = 0;
    uint64_t updated_ns = 0; // Kernel CLOCK_BOOTTIME; not a userspace deadline.
    std::string chip;
    bool powered = false; // Requested state; the reset wire may be absent.
    bool power_control = false;
    Signal signal = Signal::Unknown;
    int32_t error = 0; // Receiver error, separate from read/parse failures.
    Timings input; // ABI 1 supplies only valid, width and height for HDMI input.
    Timings csi;

    bool capture_ready() const
    {
        return powered && signal == Signal::Valid && error == 0 && csi.valid;
    }
};

inline const char *signal_name(Signal signal)
{
    switch (signal) {
    case Signal::Off: return "off";
    case Signal::Absent: return "absent";
    case Signal::Unstable: return "unstable";
    case Signal::Valid: return "valid";
    case Signal::Error: return "error";
    default: return "unknown";
    }
}

namespace detail {

static const size_t max_status_size = 4096;
using Fields = std::map<std::string, std::string>;

inline bool unsigned_value(const std::string &text, uint64_t limit, uint64_t &value)
{
    if (text.empty()) return false;
    value = 0;
    for (char c : text) {
        if (c < '0' || c > '9') return false;
        unsigned int digit = c - '0';
        if (digit > limit || value > (limit - digit) / 10) return false;
        value = value * 10 + digit;
    }
    return true;
}

template <typename T>
inline bool number(const Fields &fields, const char *name, T &value)
{
    auto field = fields.find(name);
    uint64_t parsed;
    if (field == fields.end() ||
        !unsigned_value(field->second, std::numeric_limits<T>::max(), parsed)) {
        return false;
    }
    value = static_cast<T>(parsed);
    return true;
}

inline bool valid_size(const Timings &timings)
{
    return timings.valid ? timings.width != 0 && timings.height != 0 :
                           timings.width == 0 && timings.height == 0;
}

} // namespace detail

// Return 0 or a negative errno. Every failure clears the output, so callers
// cannot accidentally reuse dimensions from a previous successful read.
inline int parse_status(const std::string &text, Status &status)
{
    status = Status();
    if (text.size() > detail::max_status_size) return -EOVERFLOW;
    if (text.find('\0') != std::string::npos) return -EPROTO;

    detail::Fields fields;
    std::istringstream stream(text);
    std::string token;
    while (stream >> token) {
        size_t separator = token.find('=');
        if (separator == std::string::npos || separator == 0 ||
            separator + 1 == token.size() || token.find('=', separator + 1) != std::string::npos) {
            return -EPROTO;
        }
        if (!fields.emplace(token.substr(0, separator), token.substr(separator + 1)).second) {
            return -EPROTO;
        }
    }

    Status parsed;
    if (!detail::number(fields, "abi", parsed.abi)) return -EPROTO;
    if (parsed.abi != 1) return -EPROTONOSUPPORT;

    // Field order and whitespace are not significant. Unknown fields allow
    // compatible additions; every field in ABI 1 is still required.
    if (!detail::number(fields, "sequence", parsed.sequence) ||
        !detail::number(fields, "updated_ns", parsed.updated_ns) ||
        !detail::number(fields, "power_control", parsed.power_control) ||
        !detail::number(fields, "input_valid", parsed.input.valid) ||
        !detail::number(fields, "input_width", parsed.input.width) ||
        !detail::number(fields, "input_height", parsed.input.height) ||
        !detail::number(fields, "csi_valid", parsed.csi.valid) ||
        !detail::number(fields, "csi_width", parsed.csi.width) ||
        !detail::number(fields, "csi_height", parsed.csi.height) ||
        !detail::number(fields, "csi_htotal", parsed.csi.htotal) ||
        !detail::number(fields, "csi_vtotal", parsed.csi.vtotal) ||
        !detail::number(fields, "csi_pixelclock_hz", parsed.csi.pixelclock_hz) ||
        !detail::number(fields, "csi_fps_millihz", parsed.csi.fps_millihz)) {
        return -EPROTO;
    }

    auto chip = fields.find("chip");
    auto power = fields.find("power");
    auto signal = fields.find("signal");
    auto error = fields.find("error");
    if (chip == fields.end() || power == fields.end() ||
        signal == fields.end() || error == fields.end()) {
        return -EPROTO;
    }
    parsed.chip = chip->second;
    if (power->second == "on") parsed.powered = true;
    else if (power->second != "off") return -EPROTO;

    if (signal->second == "unknown") parsed.signal = Signal::Unknown;
    else if (signal->second == "off") parsed.signal = Signal::Off;
    else if (signal->second == "absent") parsed.signal = Signal::Absent;
    else if (signal->second == "unstable") parsed.signal = Signal::Unstable;
    else if (signal->second == "valid") parsed.signal = Signal::Valid;
    else if (signal->second == "error") parsed.signal = Signal::Error;
    else return -EPROTO;

    uint64_t magnitude;
    const std::string &receiver_error = error->second;
    if (receiver_error == "0") parsed.error = 0;
    else if (receiver_error[0] == '-' &&
             detail::unsigned_value(receiver_error.substr(1),
                                    uint64_t(INT32_MAX) + 1, magnitude)) {
        parsed.error = static_cast<int32_t>(-static_cast<int64_t>(magnitude));
    } else return -EPROTO;

    if (!detail::valid_size(parsed.input) || !detail::valid_size(parsed.csi) ||
        (!parsed.powered && parsed.signal != Signal::Off) ||
        (parsed.powered && parsed.signal == Signal::Off)) {
        return -EPROTO;
    }
    if (parsed.signal == Signal::Valid) {
        if (!parsed.csi.valid || parsed.error != 0) return -EPROTO;
    } else if (parsed.input.valid || parsed.csi.valid || parsed.csi.htotal != 0 ||
               parsed.csi.vtotal != 0 || parsed.csi.pixelclock_hz != 0 ||
               parsed.csi.fps_millihz != 0) {
        return -EPROTO;
    }

    // No size whitelist, clamping, inferred HDMI input size or default FPS.
    status = parsed;
    return 0;
}

// Each reader owns its descriptor and event acknowledgement. Use one reader
// per monitoring thread; opening a new descriptor for every poll loses events.
class StatusReader {
public:
    StatusReader() = default;
    ~StatusReader() { close(); }
    StatusReader(const StatusReader &) = delete;
    StatusReader &operator=(const StatusReader &) = delete;

    int open(const char *path = "/proc/lontium/status")
    {
        close();
        fd_ = ::open(path, O_RDONLY | O_CLOEXEC);
        return fd_ < 0 ? -errno : 0;
    }

    void close()
    {
        if (fd_ >= 0) ::close(fd_);
        fd_ = -1;
    }

    int read(Status &status)
    {
        status = Status();
        if (fd_ < 0) return -EBADF;
        // The driver snapshots on offset zero and acknowledges only that
        // snapshot's sequence when drained. A later event stays pending.
        if (lseek(fd_, 0, SEEK_SET) < 0) return -errno;
        std::string text;
        char buffer[256];
        for (;;) {
            ssize_t count = ::read(fd_, buffer, sizeof(buffer));
            if (count < 0) {
                if (errno == EINTR) continue;
                return -errno;
            }
            if (count == 0) break;
            if (text.size() + static_cast<size_t>(count) > detail::max_status_size) {
                return -EOVERFLOW;
            }
            text.append(buffer, static_cast<size_t>(count));
        }
        return parse_status(text, status);
    }

    // 1: a snapshot is pending; 0: timeout; negative errno: failure.
    // EINTR is returned so the monitoring thread can check its stop flag.
    // On ENODEV close and reopen before retrying after driver rebind.
    int wait(int timeout_ms)
    {
        if (fd_ < 0) return -EBADF;
        if (timeout_ms < -1) return -EINVAL;
        struct pollfd event = {fd_, POLLIN | POLLRDNORM, 0};
        int result = poll(&event, 1, timeout_ms);
        if (result < 0) return -errno;
        if (event.revents & POLLNVAL) return -EBADF;
        if (event.revents & (POLLERR | POLLHUP)) return -ENODEV;
        return event.revents & (POLLIN | POLLRDNORM) ? 1 : 0;
    }

private:
    int fd_ = -1;
};

inline int read_status(Status &status, const char *path = "/proc/lontium/status")
{
    status = Status();
    StatusReader reader;
    int result = reader.open(path);
    return result == 0 ? reader.read(status) : result;
}

} // namespace lontium_hdmi
