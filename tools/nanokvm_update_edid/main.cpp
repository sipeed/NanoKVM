#include "nanokvm_update_edid.h"
#include "lontium_hdmi.hpp"

#include <array>
#include <cerrno>
#include <csignal>
#include <cstdio>
#include <cstring>
#include <dirent.h>
#include <fcntl.h>
#include <fstream>
#include <map>
#include <sstream>
#include <stdexcept>
#include <string>
#include <sys/file.h>
#include <sys/stat.h>
#include <sys/wait.h>
#include <unistd.h>
#include <vector>

namespace {
constexpr const char *driver = "/sys/bus/i2c/drivers/lontium_hdmi";
constexpr const char *marker = "/run/nanokvm-hdmi-maintenance";
constexpr const char *service = "/etc/init.d/S95nanokvm";
volatile sig_atomic_t interrupted = 0;
void on_signal(int number) { interrupted = number; }

[[noreturn]] void fail(const std::string &message) { throw std::runtime_error(message); }
std::string os_error(const std::string &operation) { return operation + ": " + std::strerror(errno); }

struct FD {
    int value;
    explicit FD(int number) : value(number) {}
    ~FD() { if (value >= 0) close(value); }
    FD(const FD &) = delete;
    FD &operator=(const FD &) = delete;
};

void write_all(int fd, const void *bytes, size_t length)
{
    const char *data = static_cast<const char *>(bytes);
    while (length) {
        ssize_t count = write(fd, data, length);
        if (count < 0 && errno == EINTR) continue;
        if (count <= 0) fail(os_error("write file"));
        data += count;
        length -= count;
    }
}

void write_control(const std::string &path, const std::string &command)
{
    FD fd(open(path.c_str(), O_WRONLY | O_CLOEXEC));
    if (fd.value < 0) fail(os_error("open " + path));
    ssize_t count;
    do { count = write(fd.value, command.data(), command.size()); } while (count < 0 && errno == EINTR);
    if (count != static_cast<ssize_t>(command.size())) {
        if (count >= 0) errno = EIO;
        fail(os_error("write " + path));
    }
}

std::string read_file(const std::string &path, size_t limit)
{
    FD fd(open(path.c_str(), O_RDONLY | O_CLOEXEC | O_NOFOLLOW));
    if (fd.value < 0) fail(os_error("open " + path));
    std::string text;
    char buffer[512];
    for (;;) {
        ssize_t count = read(fd.value, buffer, sizeof(buffer));
        if (count < 0 && errno == EINTR) continue;
        if (count < 0) fail(os_error("read " + path));
        if (!count) return text;
        text.append(buffer, static_cast<size_t>(count));
        if (text.size() > limit) fail(path + ": file is too large");
    }
}

void save_file(const std::string &path, const void *data, size_t size)
{
    FD fd(open(path.c_str(), O_WRONLY | O_CREAT | O_EXCL | O_CLOEXEC | O_NOFOLLOW, 0600));
    if (fd.value < 0) fail(os_error("create " + path));
    write_all(fd.value, data, size);
    if (fsync(fd.value) != 0) fail(os_error("sync " + path));
    std::string directory = path.substr(0, path.find_last_of('/'));
    if (path.find_last_of('/') == std::string::npos) directory = ".";
    if (directory.empty()) directory = "/";
    FD parent(open(directory.c_str(), O_RDONLY | O_DIRECTORY | O_CLOEXEC));
    if (parent.value < 0 || fsync(parent.value) != 0) fail(os_error("sync directory " + directory));
}

void validate_edid(const uint8_t *data, size_t size)
{
    static const uint8_t header[] = {0, 255, 255, 255, 255, 255, 255, 0};
    if (size != EDID_BUFFER_SIZE || std::memcmp(data, header, sizeof(header)) || data[126] != 1)
        fail("EDID must contain exactly two 128-byte blocks with a valid header and extension count");
    for (size_t block = 0; block < 2; ++block) {
        uint8_t sum = 0;
        for (size_t i = 0; i < 128; ++i) sum += data[128 * block + i];
        if (sum) fail("EDID checksum is invalid");
    }
}

chip_version_t chip_type(const std::string &name)
{
    if (name == "LT6911C") return CHIP_LT6911C;
    if (name == "LT6911UXC") return CHIP_LT6911UXC;
    if (name == "LT6911D") return CHIP_LT6911D;
    if (name == "LT7911EXS") return CHIP_LT7911EXS;
    fail("unsupported kernel receiver: " + name);
}

unsigned receiver_address(chip_version_t chip)
{
    return chip == CHIP_LT7911EXS ? 0x41 : 0x2b;
}

struct Client {
    std::string name;
    unsigned bus = 0, address = 0;
};

Client parse_client(const std::string &name)
{
    Client client;
    const size_t dash = name.find('-');
    if (!dash || dash == std::string::npos || name.size() != dash + 5) fail("invalid I2C client name");
    for (size_t i = 0; i < dash; ++i) if (name[i] < '0' || name[i] > '9') fail("invalid I2C bus");
    for (size_t i = dash + 1; i < name.size(); ++i)
        if (!((name[i] >= '0' && name[i] <= '9') || (name[i] >= 'a' && name[i] <= 'f'))) fail("invalid I2C address");
    unsigned long bus = std::stoul(name.substr(0, dash));
    if (bus > 65535) fail("invalid I2C bus");
    client.bus = static_cast<unsigned>(bus);
    client.address = static_cast<unsigned>(std::stoul(name.substr(dash + 1), nullptr, 16));
    if (client.address != 0x2b && client.address != 0x41) fail("unexpected receiver address");
    client.name = name;
    return client;
}

Client bound_client()
{
    DIR *directory = opendir(driver);
    if (!directory) fail(os_error("open receiver driver"));
    std::string name;
    while (dirent *entry = readdir(directory)) {
        if (entry->d_name[0] < '0' || entry->d_name[0] > '9') continue;
        if (!name.empty()) { closedir(directory); fail("multiple receivers are bound"); }
        name = entry->d_name;
    }
    closedir(directory);
    if (name.empty()) fail("no receiver is bound");
    return parse_client(name);
}

bool is_bound(const Client &client)
{
    struct stat state;
    return lstat((std::string(driver) + "/" + client.name).c_str(), &state) == 0;
}

lontium_hdmi::Status status()
{
    lontium_hdmi::Status current;
    int result = lontium_hdmi::read_status(current);
    if (result < 0) fail("read receiver status: " + std::string(std::strerror(-result)));
    return current;
}

int command(const std::vector<std::string> &arguments, int lock = -1, bool quiet = false)
{
    std::vector<char *> argv;
    for (const auto &argument : arguments) argv.push_back(const_cast<char *>(argument.c_str()));
    argv.push_back(nullptr);
    pid_t pid = fork();
    if (pid < 0) fail(os_error("fork service command"));
    if (!pid) {
        if (lock >= 0) {
            if (dup2(lock, 9) < 0 || fcntl(9, F_SETFD, 0) != 0) _exit(126);
            if (setenv("NANOKVM_SERVICE_LOCK_FD", "9", 1) != 0) _exit(126);
        }
        if (quiet) {
            int output = open("/dev/null", O_WRONLY);
            if (output < 0 || dup2(output, STDOUT_FILENO) < 0 || dup2(output, STDERR_FILENO) < 0) _exit(126);
        }
        execvp(argv[0], argv.data());
        _exit(127);
    }
    int result;
    while (waitpid(pid, &result, 0) < 0) if (errno != EINTR) fail(os_error("wait for service command"));
    return WIFEXITED(result) ? WEXITSTATUS(result) : 128 + WTERMSIG(result);
}

bool running(const char *process) { return command({"pidof", process}, -1, true) == 0; }

struct Journal {
    std::string chip;
    Client client;
    bool server = false, system = false, io = false;

    void save() const
    {
        std::string text = "abi=1 chip=" + chip + " client=" + client.name +
            " server=" + (server ? "1" : "0") + " system=" + (system ? "1" : "0") + " io=" + (io ? "1" : "0") + "\n";
        std::string temporary = std::string(marker) + "." + std::to_string(getpid());
        save_file(temporary, text.data(), text.size());
        if (rename(temporary.c_str(), marker) != 0) fail(os_error("publish maintenance state"));
    }

    static Journal load()
    {
        std::istringstream stream(read_file(marker, 1024));
        std::map<std::string, std::string> fields;
        std::string token;
        while (stream >> token) {
            size_t equals = token.find('=');
            if (equals == std::string::npos || !fields.emplace(token.substr(0, equals), token.substr(equals + 1)).second)
                fail("invalid maintenance state");
        }
        if (fields.size() != 6 || fields["abi"] != "1") fail("unsupported maintenance state");
        Journal saved;
        saved.chip = fields["chip"];
        chip_version_t chip = chip_type(saved.chip);
        saved.client = parse_client(fields["client"]);
        if (saved.client.address != receiver_address(chip)) fail("invalid maintenance receiver");
        for (const char *key : {"server", "system", "io"})
            if (fields[key] != "0" && fields[key] != "1") fail("invalid maintenance state");
        saved.server = fields["server"] == "1";
        saved.system = fields["system"] == "1";
        saved.io = fields["io"] == "1";
        return saved;
    }
};

void await_receiver(const std::string &chip)
{
    std::string last = "status unavailable";
    for (unsigned attempt = 0; attempt < 100; ++attempt) {
        try {
            auto current = status();
            if (current.chip != chip) fail("receiver type changed after rebind");
            if (current.powered && current.error == 0 &&
                (current.signal == lontium_hdmi::Signal::Valid || current.signal == lontium_hdmi::Signal::Absent)) return;
            last = lontium_hdmi::signal_name(current.signal);
        } catch (const std::exception &error) { last = error.what(); }
        usleep(50000);
    }
    fail("receiver did not recover: " + last);
}

bool restore(const Journal &saved, int lock)
{
    try {
        if (!is_bound(saved.client)) write_control(std::string(driver) + "/bind", saved.client.name);
        if (bound_client().name != saved.client.name) fail("receiver binding changed");
        if (saved.io) {
            // SPI access can stop the firmware. Only the kernel owns reset.
            auto current = status();
            if (!current.power_control) fail("receiver reload requires a connected reset GPIO or a manual power cycle");
            write_control("/proc/lontium/power", "0\n");
            write_control("/proc/lontium/power", "1\n");
            // Address signatures are evaluated again after firmware restart.
            write_control(std::string(driver) + "/unbind", saved.client.name);
            write_control(std::string(driver) + "/bind", saved.client.name);
        }
        await_receiver(saved.chip);
        if (command({service, "maintenance-resume", saved.server ? "1" : "0", saved.system ? "1" : "0"}, lock) != 0)
            fail("failed to restore previously running services");
        if (unlink(marker) != 0) fail(os_error("remove maintenance state"));
        return true;
    } catch (const std::exception &error) {
        std::fprintf(stderr, "Recovery incomplete: %s\nServices remain protected by %s; run --recover after fixing the receiver.\n", error.what(), marker);
        return false;
    }
}

void usage(const char *name)
{
    std::printf("Usage: %s EDID.bin\n       %s --read OUTPUT.bin\n       %s --check [EDID.bin]\n       %s --recover\n", name, name, name, name);
}

int run(int argc, char **argv)
{
    if (argc == 2 && std::string(argv[1]) == "--help") { usage(argv[0]); return 0; }
    std::string operation, path;
    if (argc == 2 && std::string(argv[1]) == "--recover") operation = "recover";
    else if ((argc == 2 || argc == 3) && std::string(argv[1]) == "--check") {
        operation = "check";
        if (argc == 3) path = argv[2];
    } else if (argc == 3 && std::string(argv[1]) == "--read") { operation = "read"; path = argv[2]; }
    else if (argc == 2 && argv[1][0] != '-') { operation = "write"; path = argv[1]; }
    else { usage(argv[0]); return 2; }

    std::string requested;
    if (operation == "write" || (operation == "check" && !path.empty())) {
        requested = read_file(path, EDID_BUFFER_SIZE);
        validate_edid(reinterpret_cast<const uint8_t *>(requested.data()), requested.size());
    }
    FD lock(open("/run/nanokvm-service.lock", O_RDWR | O_CREAT | O_CLOEXEC | O_NOFOLLOW, 0600));
    if (lock.value < 0 || flock(lock.value, LOCK_EX | LOCK_NB) != 0) fail(os_error("lock NanoKVM service operations"));
    if (operation == "recover") {
        if (command({service, "maintenance-check", "1"}, lock.value) != 0)
            fail("install matching S95nanokvm and S16lontium scripts before maintenance recovery");
        Journal saved = Journal::load();
        if (running("NanoKVM-Server") || running("kvm_system")) {
            if (command({service, "maintenance-stop"}, lock.value) != 0) fail("failed to stop services before recovery");
        }
        bool recovered = restore(saved, lock.value);
        return recovered ? (interrupted ? 128 + interrupted : 0) : 1;
    }
    if (access(marker, F_OK) == 0) fail("an interrupted maintenance operation needs --recover");
    auto current = status();
    auto chip = chip_type(current.chip);
    Client client = bound_client();
    std::string chip_file = read_file("/proc/lontium/chip", 32);
    if (chip_file != current.chip + "\n") fail("receiver changed during preflight");
    if (client.address != receiver_address(chip)) fail("receiver address does not match the kernel type");
    std::printf("chip=%s client=%s power=%s signal=%s power_control=%d edid_supported=1\n", current.chip.c_str(), client.name.c_str(), current.powered ? "on" : "off", lontium_hdmi::signal_name(current.signal), current.power_control);
    if (operation == "check") return 0;
    if (!current.powered) fail("enable HDMI before EDID maintenance");
    if (!current.power_control) fail("EDID maintenance needs reset control to restart receiver firmware");
    if (current.error) fail("receiver has an I2C error; refusing flash access");
    if (operation == "read" && access(path.c_str(), F_OK) == 0) fail("output file already exists");
    if (command({service, "maintenance-check", "1"}, lock.value) != 0)
        fail("install matching S95nanokvm and S16lontium scripts before EDID maintenance");

    Journal saved{current.chip, client, running("NanoKVM-Server"), running("kvm_system"), false};
    for (const auto &item : {std::make_pair(saved.server, "/tmp/server/NanoKVM-Server"), std::make_pair(saved.system, "/tmp/kvm_system/kvm_system")})
        if (item.first && access(item.second, X_OK) != 0) fail("cannot restore the running service: " + std::string(item.second));
    saved.save();
    bool opened = false;
    std::string failure;
    try {
        if (command({service, "maintenance-stop"}, lock.value) != 0) fail("failed to stop NanoKVM for maintenance");
        if (running("NanoKVM-Server") || running("kvm_system")) fail("capture applications are still running");
        if (interrupted) fail("maintenance interrupted before I2C access");
        write_control(std::string(driver) + "/unbind", client.name);
        if (is_bound(client) || access("/proc/lontium/status", F_OK) == 0) fail("receiver did not unbind");
        saved.io = true;
        saved.save();
        if (edid_open(("/dev/i2c-" + std::to_string(client.bus)).c_str(), client.address) != 0) fail(os_error("open receiver I2C"));
        opened = true;
        std::array<uint8_t, EDID_BUFFER_SIZE> readback{};
        if (operation == "read") {
            if (edid_read(chip, readback.data()) != 0) fail("failed to read EDID");
            if (interrupted) fail("maintenance interrupted before saving EDID");
            validate_edid(readback.data(), readback.size());
            save_file(path, readback.data(), readback.size());
        } else {
            if (interrupted) fail("maintenance interrupted before programming");
            // Defer termination until programming and readback have finished.
            if (edid_write(chip, reinterpret_cast<const uint8_t *>(requested.data())) != 0)
                fail("EDID programming failed");
            if (edid_read(chip, readback.data()) != 0) fail("failed to read back programmed EDID");
            if (std::memcmp(readback.data(), requested.data(), readback.size()) != 0) fail("EDID flash verification failed");
        }
    } catch (const std::exception &error) { failure = error.what(); }
    if (opened && edid_close(chip) != 0) {
        std::fprintf(stderr, "SPI/register access cleanup failed; attempting receiver reset\n");
        if (failure.empty()) failure = "receiver register cleanup failed";
    }
    bool recovered = restore(saved, lock.value);
    if (!failure.empty()) std::fprintf(stderr, "%s\n", failure.c_str());
    if (!recovered) return 1;
    if (interrupted) return 128 + interrupted;
    if (!failure.empty()) return 1;
    std::puts(operation == "write" ? "EDID written and verified; receiver and services restored." : "EDID read; receiver and services restored.");
    return 0;
}
} // namespace

int main(int argc, char **argv)
{
    for (int number : {SIGINT, SIGTERM, SIGHUP}) {
        struct sigaction action = {};
        action.sa_handler = on_signal;
        action.sa_flags = SA_RESTART;
        sigemptyset(&action.sa_mask);
        if (sigaction(number, &action, nullptr) != 0) { std::perror("install signal handler"); return 1; }
    }
    try { return run(argc, argv); }
    catch (const std::exception &error) { std::fprintf(stderr, "%s\n", error.what()); return 1; }
}
