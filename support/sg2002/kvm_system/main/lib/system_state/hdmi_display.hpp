#pragma once

#include "lontium_hdmi.hpp"

// The OLED thread owns this view. Its fields describe the HDMI icon and CSI
// resolution drawn from one kernel snapshot.
namespace hdmi_display {

struct View {
    bool signal_valid = false;
    uint32_t width = 0;
    uint32_t height = 0;

    bool has_signal() const
    {
        return signal_valid;
    }

    bool operator==(const View &other) const
    {
        return signal_valid == other.signal_valid && width == other.width && height == other.height;
    }

    bool operator!=(const View &other) const { return !(*this == other); }
};

inline View make_view(const lontium_hdmi::Status &status, int read_result)
{
    View view;
    if (read_result == 0 && status.capture_ready()) {
        view.signal_valid = true;
        view.width = status.csi.width;
        view.height = status.csi.height;
    }
    return view;
}

inline View read_view(const char *path = "/proc/lontium/status")
{
    lontium_hdmi::Status status;
    int result = lontium_hdmi::read_status(status, path);
    return make_view(status, result);
}

} // namespace hdmi_display
