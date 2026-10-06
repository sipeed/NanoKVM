#!/usr/bin/env python3
"""Exercise panel transitions using the production UI functions and mock I2C."""
import os
import re
from pathlib import Path
import subprocess
import tempfile

root = Path(__file__).resolve().parents[1]
source = (root / "support/sg2002/kvm_system/main/lib/oled_ui/oled_ui.cpp").read_text()
source = re.sub(r"//[^\n]*", "", source)

def function(signature):
    start = source.index(signature + "\n{")
    opening = source.index("{", start)
    depth = 1
    end = opening + 1
    while depth:
        depth += (source[end] == "{") - (source[end] == "}")
        end += 1
    return source[start:end]

harness = r"""
#include <cassert>
#include <cstdint>
struct { uint8_t sub_page=0, oled_sleep_state=0; } kvm_oled_state;
int on_count=0, off_count=0;
using ip_addr_t = int;
void OLED_Display_On() { ++on_count; }
void OLED_Display_Off() { ++off_count; }
void OLED_Clear() {}
bool kvm_state_is_changed() { return false; }
void oled_auto_sleep_time_update() {}
int show_which_ip() { return 0; }
template<typename... T> void ignore(T...) {}
#define kvm_oled_clear ignore
#define kvm_main_disp ignore
#define kvm_eth_state_disp ignore
#define kvm_wifi_state_disp ignore
#define kvm_usb_state_disp ignore
#define kvm_hdmi_state_disp ignore
#define kvm_fps_disp ignore
#define kvm_res_disp ignore
#define kvm_type_disp ignore
#define kvm_qlty_disp ignore
"""
harness += function("static void oled_set_sleep_state(uint8_t sleeping)")
harness += function("void kvm_main_ui_disp(uint8_t first_disp, uint8_t subpage_changed)")
harness += r"""
int main() {
    kvm_oled_state.sub_page=1;
    kvm_main_ui_disp(0, 1);
    assert(off_count==1 && on_count==0 && kvm_oled_state.oled_sleep_state==1);
    kvm_main_ui_disp(0, 0);
    assert(off_count==1);
    kvm_oled_state.sub_page=0;
    kvm_main_ui_disp(0, 1);
    assert(on_count==1 && kvm_oled_state.oled_sleep_state==0);
    kvm_main_ui_disp(0, 0);
    assert(on_count==1);
    oled_set_sleep_state(1);
    kvm_oled_state.sub_page=0;
    kvm_main_ui_disp(0, 1);
    assert(on_count==2 && off_count==2);
}
"""
with tempfile.TemporaryDirectory() as tmp:
    cpp=Path(tmp)/"oled.cpp"
    binary=Path(tmp)/"oled-test"
    cpp.write_text(harness)
    subprocess.run([os.environ.get("CXX", "c++"), "-std=c++11", "-Wall", "-Wextra", "-Werror", str(cpp), "-o", str(binary)], check=True)
    subprocess.run([str(binary)], check=True)
print("OLED sleep/wake transitions passed (mock panel)")
