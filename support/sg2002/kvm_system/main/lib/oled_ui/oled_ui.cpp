#include "oled_ui.h"

#include <ctype.h>
#include <errno.h>
#include <sys/stat.h>

using namespace maix;
using namespace maix::sys;

extern kvm_sys_state_t kvm_sys_state;
extern kvm_oled_state_t kvm_oled_state;

namespace {
const char *const OLED_SLEEP_FILE = "/etc/kvm/oled_sleep";
const char *const OLED_VIEWERS_FILE = "/run/nanokvm/oled_viewers";

uint64_t hash_bytes(uint64_t value, const void *data, size_t size)
{
	const uint8_t *bytes = static_cast<const uint8_t *>(data);
	for(size_t i = 0; i < size; ++i) value = (value ^ bytes[i]) * 1099511628211ULL;
	return value;
}

uint64_t render_signature()
{
	uint64_t value = 1469598103934665603ULL;
	value = hash_bytes(value, &kvm_sys_state.eth_state, sizeof(kvm_sys_state.eth_state));
	value = hash_bytes(value, &kvm_sys_state.wifi_state, sizeof(kvm_sys_state.wifi_state));
	value = hash_bytes(value, &kvm_sys_state.usb_state, sizeof(kvm_sys_state.usb_state));
	value = hash_bytes(value, &kvm_sys_state.hdmi_state, sizeof(kvm_sys_state.hdmi_state));
	value = hash_bytes(value, &kvm_sys_state.hdmi_width, sizeof(kvm_sys_state.hdmi_width));
	value = hash_bytes(value, &kvm_sys_state.hdmi_height, sizeof(kvm_sys_state.hdmi_height));
	value = hash_bytes(value, &kvm_sys_state.type, sizeof(kvm_sys_state.type));
	value = hash_bytes(value, &kvm_sys_state.now_fps, sizeof(kvm_sys_state.now_fps));
	value = hash_bytes(value, &kvm_sys_state.qlty, sizeof(kvm_sys_state.qlty));
	value = hash_bytes(value, kvm_sys_state.eth_addr, sizeof(kvm_sys_state.eth_addr));
	value = hash_bytes(value, kvm_sys_state.wifi_addr, sizeof(kvm_sys_state.wifi_addr));
	value = hash_bytes(value, &kvm_oled_state.main_page, sizeof(kvm_oled_state.main_page));
	value = hash_bytes(value, &kvm_oled_state.pixel_shift_x, sizeof(kvm_oled_state.pixel_shift_x));
	value = hash_bytes(value, &kvm_oled_state.pixel_shift_y, sizeof(kvm_oled_state.pixel_shift_y));
	value = hash_bytes(value, &kvm_oled_state.viewers, sizeof(kvm_oled_state.viewers));
	return value;
}

bool parse_number(const char *text, long *value)
{
	if(text == NULL || *text == '\0') return false;
	char *end = NULL;
	errno = 0;
	long parsed = strtol(text, &end, 10);
	while(end != NULL && isspace(static_cast<unsigned char>(*end))) ++end;
	if(errno != 0 || end == text || (end != NULL && *end != '\0')) return false;
	*value = parsed;
	return true;
}

bool read_text_file(const char *path, char *buffer, size_t size)
{
	if(size == 0) return false;
	FILE *file = fopen(path, "r");
	if(file == NULL) return false;
	size_t count = fread(buffer, 1, size - 1, file);
	bool complete = !ferror(file);
	fclose(file);
	buffer[count] = '\0';
	return complete;
}

void note_local_activity(uint64_t now)
{
	kvm_sys_state.oled_local_activity_ms = now;
	kvm_oled_state.oled_sleep_start = now;
}

void reset_idle_policy(uint64_t now)
{
	note_local_activity(now);
	kvm_oled_state.main_page = 0;
	kvm_oled_state.pixel_shift_x = 0;
	kvm_oled_state.pixel_shift_y = 0;
	kvm_oled_state.pixel_shift_dx = 1;
	kvm_oled_state.pixel_shift_dy = 1;
	kvm_oled_state.next_page_switch_ms = 0;
	kvm_oled_state.next_pixel_shift_ms = 0;
	kvm_oled_state.force_full_redraw = 1;
}

void reload_oled_config(uint64_t now)
{
	struct stat info;
	static time_t sleep_mtime = -1;
	static ino_t sleep_ino = 0;
	if(stat(OLED_SLEEP_FILE, &info) == 0){
		if(info.st_mtime != sleep_mtime || info.st_ino != sleep_ino){
			sleep_mtime = info.st_mtime;
			sleep_ino = info.st_ino;
			char sleep_buffer[32] = {0};
			long sleep = OLED_SLEEP_DELAY_DEFAULT;
			if(read_text_file(OLED_SLEEP_FILE, sleep_buffer, sizeof(sleep_buffer))){
				long parsed = 0;
				if(parse_number(sleep_buffer, &parsed) && (parsed == 0 || (parsed >= OLED_SLEEP_DELAY_MIN && parsed <= 3600))) sleep = parsed;
				else {
					printf("[kvms] invalid OLED sleep setting; keeping last valid setting\n");
					sleep = kvm_oled_state.oled_sleep_param;
				}
			} else sleep = kvm_oled_state.oled_sleep_param;
			if(kvm_oled_state.oled_sleep_param != sleep){
				kvm_oled_state.oled_sleep_param = static_cast<uint16_t>(sleep);
				reset_idle_policy(now);
			}
		}
	} else if(sleep_mtime != 0) {
		sleep_mtime = 0;
		sleep_ino = 0;
		if(kvm_oled_state.oled_sleep_param != OLED_SLEEP_DELAY_DEFAULT){
			kvm_oled_state.oled_sleep_param = OLED_SLEEP_DELAY_DEFAULT;
			reset_idle_policy(now);
		}
	}
}

void refresh_viewers(uint64_t now)
{
	static time_t mtime = -1;
	static ino_t inode = 0;
	struct stat info;
	if(stat(OLED_VIEWERS_FILE, &info) == 0){
		if(info.st_mtime != mtime || info.st_ino != inode){
			mtime = info.st_mtime;
			inode = info.st_ino;
			char buffer[32] = {0};
			long viewers = 0;
			if(read_text_file(OLED_VIEWERS_FILE, buffer, sizeof(buffer)) && parse_number(buffer, &viewers) && viewers >= 0){
				if(viewers > 99) viewers = 99;
				kvm_oled_state.viewers = static_cast<uint8_t>(viewers);
				kvm_oled_state.viewer_file_seen_ms = now;
			}
		}
	}
	if(kvm_oled_state.viewer_file_seen_ms == 0 || now - kvm_oled_state.viewer_file_seen_ms > 5000) kvm_oled_state.viewers = 0;
}

bool passive_state_changed()
{
	static uint64_t previous = 0;
	uint64_t value = 1469598103934665603ULL;
	value = hash_bytes(value, &kvm_sys_state.eth_state, sizeof(kvm_sys_state.eth_state));
	value = hash_bytes(value, &kvm_sys_state.wifi_state, sizeof(kvm_sys_state.wifi_state));
	value = hash_bytes(value, &kvm_sys_state.usb_state, sizeof(kvm_sys_state.usb_state));
	value = hash_bytes(value, &kvm_sys_state.hdmi_state, sizeof(kvm_sys_state.hdmi_state));
	value = hash_bytes(value, &kvm_sys_state.hdmi_width, sizeof(kvm_sys_state.hdmi_width));
	value = hash_bytes(value, &kvm_sys_state.hdmi_height, sizeof(kvm_sys_state.hdmi_height));
	value = hash_bytes(value, kvm_sys_state.eth_addr, sizeof(kvm_sys_state.eth_addr));
	value = hash_bytes(value, kvm_sys_state.wifi_addr, sizeof(kvm_sys_state.wifi_addr));
	bool changed = previous != 0 && previous != value;
	previous = value;
	return changed;
}

void address_or_off(char *output, size_t size, const char *label, int8_t state, const uint8_t *address)
{
	if(state > 0 && address[0] != 0) snprintf(output, size, "%s %s", label, reinterpret_cast<const char *>(address));
	else snprintf(output, size, "%s OFF", label);
}

void draw_cube_network()
{
	char line[22] = {0};
	address_or_off(line, sizeof(line), "ETH", kvm_sys_state.eth_state, kvm_sys_state.eth_addr);
	OLED_ShowString(0, 1, line, 8);
	address_or_off(line, sizeof(line), "WIFI", kvm_sys_state.wifi_state, kvm_sys_state.wifi_addr);
	OLED_ShowString(0, 2, line, 8);
	snprintf(line, sizeof(line), "USB %s HDMI %s", kvm_sys_state.usb_state > 0 ? "ON" : "OFF", kvm_sys_state.hdmi_state > 0 ? "ON" : "OFF");
	OLED_ShowString(0, 3, line, 8);
	OLED_ShowString(0, 4, "NETWORK", 8);
}

void draw_cube_video()
{
	char line[22] = {0};
	OLED_ShowString(0, 1, kvm_sys_state.hdmi_state > 0 ? "HDMI ON" : "NO SIGNAL", 8);
	if(kvm_sys_state.hdmi_state > 0) snprintf(line, sizeof(line), "RES %dx%d", kvm_sys_state.hdmi_width, kvm_sys_state.hdmi_height);
	else snprintf(line, sizeof(line), "RES --");
	OLED_ShowString(0, 2, line, 8);
	snprintf(line, sizeof(line), "%s %d FPS", kvm_sys_state.type == KVM_TYPE_H264 ? "H264" : "MJPG", kvm_sys_state.now_fps);
	OLED_ShowString(0, 3, line, 8);
	snprintf(line, sizeof(line), "QUALITY %d", kvm_sys_state.qlty);
	OLED_ShowString(0, 4, line, 8);
}

void draw_cube_session()
{
	char line[22] = {0};
	snprintf(line, sizeof(line), "VIEWERS %u", kvm_oled_state.viewers);
	OLED_ShowString(0, 1, line, 8);
	snprintf(line, sizeof(line), "USB %s HID %s", kvm_sys_state.usb_state > 0 ? "ON" : "OFF", kvm_sys_state.hid_state > 0 ? "ON" : "OFF");
	OLED_ShowString(0, 2, line, 8);
	snprintf(line, sizeof(line), "QUALITY %d", kvm_sys_state.qlty);
	OLED_ShowString(0, 3, line, 8);
	address_or_off(line, sizeof(line), "ETH", kvm_sys_state.eth_state, kvm_sys_state.eth_addr);
	OLED_ShowString(0, 4, line, 8);
}

void draw_cube_main()
{
	OLED_SetLayoutOffset(kvm_oled_state.pixel_shift_x);
	OLED_SetVerticalOffset(kvm_oled_state.pixel_shift_y);
	OLED_Clear();
	switch(kvm_oled_state.main_page){
		case 0: draw_cube_network(); break;
		case 1: draw_cube_video(); break;
		default: draw_cube_session(); break;
	}
	OLED_SetLayoutOffset(0);
}

bool carousel_enabled()
{
	// Preserve the original Cube dashboard through the 10-minute option.
	// Never-off, 30-minute, and one-hour modes opt into anti-burn carousel.
	return kvm_oled_state.oled_sleep_param == 0 || kvm_oled_state.oled_sleep_param > 600;
}

bool carousel_active(uint64_t local_idle)
{
	return carousel_enabled() && local_idle >= OLED_CAROUSEL_START_DELAY * 1000ULL;
}

void draw_cube_legacy()
{
	OLED_SetLayoutOffset(0);
	OLED_SetVerticalOffset(0);
	OLED_Clear();
	OLED_ShowKVMLogo();
	OLED_ShowLogo();
	OLED_ShowKVMState(HDMI_STATE, kvm_sys_state.hdmi_state > 0 ? 1 : 0);
	OLED_ShowKVMState(HID_STATE, kvm_sys_state.usb_state > 0 ? 1 : 0);
	OLED_ShowKVMState(ETH_STATE, kvm_sys_state.eth_state > 0 ? 1 : 0);
	OLED_ShowKVMState(WIFI_STATE, kvm_sys_state.wifi_state > 0 ? 1 : 0);
	OLED_Showline();
	uint8_t empty = 0;
	OLED_ShowKVMStreamState(KVM_INIT, &empty);
	if(kvm_sys_state.eth_state > 0 && kvm_sys_state.eth_addr[0] != 0)
		OLED_ShowKVMStreamState(KVM_ETH_IP, kvm_sys_state.eth_addr);
	else if(kvm_sys_state.wifi_state > 0 && kvm_sys_state.wifi_addr[0] != 0)
		OLED_ShowKVMStreamState(KVM_WIFI_IP, kvm_sys_state.wifi_addr);
	else
		OLED_ShowKVMStreamState(KVM_ETH_IP, &empty);
	OLED_Show_Res(kvm_sys_state.hdmi_width, kvm_sys_state.hdmi_height);
	OLED_ShowKVMStreamState(KVM_STEAM_TYPE, &kvm_sys_state.type);
	OLED_ShowKVMStreamState(KVM_STEAM_FPS, &kvm_sys_state.now_fps);
	OLED_ShowKVMStreamState(KVM_JPG_QLTY, &kvm_sys_state.qlty);
}

void draw_pcie_legacy()
{
	OLED_SetLayoutOffset(0);
	OLED_SetVerticalOffset(0);
	OLED_Clear();
	OLED_Revolve();
	OLED_Showline_1();
	OLED_ShowLogo();
	OLED_ShowKVMState(HDMI_STATE, kvm_sys_state.hdmi_state > 0 ? 1 : 0);
	OLED_ShowKVMState(HID_STATE, kvm_sys_state.usb_state > 0 ? 1 : 0);
	OLED_ShowKVMState(ETH_STATE, kvm_sys_state.eth_state > 0 ? 1 : 0);
	OLED_ShowKVMState(WIFI_STATE, kvm_sys_state.wifi_state > 0 ? 1 : 0);
	OLED_ShowKVMStreamState(KVM_ETH_IP, kvm_sys_state.eth_addr);
	OLED_Show_Res(kvm_sys_state.hdmi_width, kvm_sys_state.hdmi_height);
	OLED_ShowKVMStreamState(KVM_STEAM_FPS, &kvm_sys_state.now_fps);
}

void show_text_wifi_config(char *password)
{
	OLED_Clear();
	OLED_ShowString(0, 0, "SSID:", 8);
	OLED_ShowString_AlignRight(63, 1, "NanoKVM", 8);
	OLED_ShowString(0, 2, "PASS:", 8);
	OLED_ShowString_AlignRight(63, 3, password, 8);
}

void show_wifi_config_ip()
{
	char url[30] = {0};
	char key[30] = {0};
	OLED_Clear();
	get_ip_addr(WiFi_IP);
	snprintf(url, sizeof(url), "%s/#/", kvm_sys_state.wifi_addr);
	snprintf(key, sizeof(key), "WIFI?P=%s", kvm_sys_state.wifi_ap_pass);
	OLED_ShowString(1, 0, "Config URL", 8);
	OLED_ShowString_AlignRight(63, 2, url, 4);
	OLED_ShowString_AlignRight(63, 3, key, 4);
}

void draw_qr_code(QRCode *qr)
{
	char data[132];
	memset(data, 0xFF, sizeof(data));
	for(int y = 0; y < 29; ++y){
		for(int x = 0; x < 29; ++x){
			if(qrIsBlacke(qr, y, x)){
				uint16_t index = ((y + 2) / 8) * 33 + (x + 2);
				data[index] &= ~(0x01 << ((y + 2) % 8));
			}
		}
	}
	OLED_Fill();
	OLED_ShowIMG(29, 0, data, 33, 4);
}

void show_wifi_qr()
{
	char command[70] = {0};
	get_ip_addr(WiFi_IP);
	snprintf(command, sizeof(command), "http://%s/#/WIFI?P=%s", kvm_sys_state.wifi_addr, kvm_sys_state.wifi_ap_pass);
	int error = QR_ERR_NONE;
	QRCode *qr = qrInit(3, QR_EM_8BIT, 1, 4, &error);
	if(qr == NULL) return;
	qrAddData(qr, reinterpret_cast<const qr_byte_t *>(command), strlen(command));
	if(qrFinalize(qr)) draw_qr_code(qr);
	qrDestroy(qr);
}
}

void oled_auto_sleep_time_update(void)
{
	note_local_activity(time::ticks_ms());
}

void oled_note_wifi_activity(void)
{
	kvm_sys_state.oled_wifi_activity_ms = time::ticks_ms();
}

void oled_policy_tick(void)
{
	// All OLED deadlines use the monotonic clock. Wall-clock time can jump by
	// years when an RTC-less device synchronizes with NTP during startup.
	uint64_t now = time::ticks_ms();
	if(kvm_sys_state.oled_local_activity_ms == 0) reset_idle_policy(now);
	reload_oled_config(now);
	refresh_viewers(now);

	if(passive_state_changed() && !kvm_sys_state.oled_manual_off && kvm_sys_state.page == 0){
		// A quiet period starts a new event burst. Repeated link flaps extend
		// only the current burst, never beyond its 60-second hard limit.
		if(kvm_oled_state.event_wake_last_ms == 0 || now - kvm_oled_state.event_wake_last_ms > 2000)
			kvm_oled_state.event_wake_started_ms = now;
		kvm_oled_state.event_wake_last_ms = now;
		uint64_t deadline = now + OLED_EVENT_WAKE_DELAY * 1000ULL;
		uint64_t maximum = kvm_oled_state.event_wake_started_ms + OLED_EVENT_WAKE_MAX * 1000ULL;
		kvm_oled_state.event_wake_deadline_ms = deadline < maximum ? deadline : maximum;
	}

	bool wifi = kvm_sys_state.page == 1;
	if(wifi && kvm_oled_state.wifi_context_started_ms == 0){
		kvm_oled_state.wifi_context_started_ms = now;
		oled_note_wifi_activity();
		kvm_oled_state.force_full_redraw = 1;
	} else if(!wifi) {
		kvm_oled_state.wifi_context_started_ms = 0;
	}

	uint64_t local_activity = kvm_sys_state.oled_local_activity_ms;
	uint64_t wifi_activity = kvm_sys_state.oled_wifi_activity_ms;
	uint64_t local_idle = now >= local_activity ? now - local_activity : 0;
	uint64_t wifi_idle = now >= wifi_activity ? now - wifi_activity : 0;
	uint8_t desired = 1;
	if(wifi){
		if(wifi_idle >= OLED_WIFI_SLEEP_DELAY * 1000ULL) desired = 0;
	} else if(kvm_sys_state.oled_manual_off) {
		desired = 0;
	} else if(kvm_oled_state.event_wake_deadline_ms > now) {
		desired = 1;
	} else if(kvm_oled_state.oled_sleep_param > 0 && local_idle >= kvm_oled_state.oled_sleep_param * 1000ULL) {
		desired = 0;
	}

	if(desired != kvm_oled_state.power_state){
		if(desired == 0) {
			OLED_EnterSleep();
			kvm_oled_state.wake_pending = 0;
		}
		else if(kvm_oled_state.power_state == 0) {
			OLED_PrepareFrame();
			kvm_oled_state.wake_pending = 1;
		}
		kvm_oled_state.power_state = desired;
		kvm_oled_state.oled_sleep_state = desired == 0;
		kvm_oled_state.force_full_redraw = desired != 0;
	}

	if(!wifi && kvm_hw_ver != 2 && kvm_oled_state.power_state != 0 && carousel_active(local_idle)){
		if(kvm_oled_state.next_page_switch_ms == 0) kvm_oled_state.next_page_switch_ms = now + OLED_CAROUSEL_DELAY * 1000ULL;
		if(kvm_oled_state.next_pixel_shift_ms == 0) kvm_oled_state.next_pixel_shift_ms = now + OLED_PIXEL_SHIFT_DELAY * 1000ULL;
		if(now >= kvm_oled_state.next_page_switch_ms){
			kvm_oled_state.main_page = (kvm_oled_state.main_page + 1) % 3;
			kvm_oled_state.next_page_switch_ms = now + OLED_CAROUSEL_DELAY * 1000ULL;
			kvm_oled_state.force_full_redraw = 1;
		}
		if(now >= kvm_oled_state.next_pixel_shift_ms){
			int16_t next_x = kvm_oled_state.pixel_shift_x + kvm_oled_state.pixel_shift_dx;
			int16_t next_y = kvm_oled_state.pixel_shift_y + kvm_oled_state.pixel_shift_dy;
			if(next_x < 0 || next_x > OLED_PIXEL_SHIFT_X){
				kvm_oled_state.pixel_shift_dx = -kvm_oled_state.pixel_shift_dx;
				next_x = kvm_oled_state.pixel_shift_x + kvm_oled_state.pixel_shift_dx;
			}
			if(next_y < 0 || next_y > OLED_PIXEL_SHIFT_Y){
				kvm_oled_state.pixel_shift_dy = -kvm_oled_state.pixel_shift_dy;
				next_y = kvm_oled_state.pixel_shift_y + kvm_oled_state.pixel_shift_dy;
			}
			kvm_oled_state.pixel_shift_x = static_cast<uint8_t>(next_x);
			kvm_oled_state.pixel_shift_y = static_cast<uint8_t>(next_y);
			kvm_oled_state.next_pixel_shift_ms = now + OLED_PIXEL_SHIFT_DELAY * 1000ULL;
			kvm_oled_state.force_full_redraw = 1;
		}
	} else if(!carousel_active(local_idle) && (kvm_oled_state.main_page != 0 || kvm_oled_state.pixel_shift_x != 0 || kvm_oled_state.pixel_shift_y != 0)) {
		kvm_oled_state.main_page = 0;
		kvm_oled_state.pixel_shift_x = 0;
		kvm_oled_state.pixel_shift_y = 0;
		kvm_oled_state.pixel_shift_dx = 1;
		kvm_oled_state.pixel_shift_dy = 1;
		kvm_oled_state.next_page_switch_ms = 0;
		kvm_oled_state.next_pixel_shift_ms = 0;
		kvm_oled_state.force_full_redraw = 1;
	}
}

bool oled_is_awake(void)
{
	return kvm_oled_state.power_state != 0;
}

void oled_finish_frame(void)
{
	if(kvm_oled_state.wake_pending && kvm_oled_state.power_state != 0){
		OLED_CommitAndWake();
		kvm_oled_state.wake_pending = 0;
	}
}

void kvm_main_ui_disp(uint8_t first_disp, uint8_t subpage_changed)
{
	if(!oled_is_awake()) return;
	uint64_t signature = render_signature();
	if(!first_disp && !subpage_changed && !kvm_oled_state.force_full_redraw && signature == kvm_oled_state.render_signature) return;
	if(kvm_hw_ver == 2) draw_pcie_legacy();
	else {
		uint64_t now = time::ticks_ms();
		uint64_t local_activity = kvm_sys_state.oled_local_activity_ms;
		uint64_t local_idle = now >= local_activity ? now - local_activity : 0;
		if(carousel_active(local_idle)) draw_cube_main();
		else draw_cube_legacy();
	}
	kvm_oled_state.render_signature = signature;
	kvm_oled_state.force_full_redraw = 0;
}

void kvm_wifi_config_ui_disp(uint8_t first_disp, uint8_t subpage_changed)
{
	if(!oled_is_awake()) return;
	if(first_disp){
		kvm_start_wifi_config_process();
		oled_note_wifi_activity();
	}
	if(!first_disp && !subpage_changed && !kvm_oled_state.force_full_redraw) return;
	OLED_SetLayoutOffset(0);
	OLED_SetVerticalOffset(0);
	switch(kvm_sys_state.sub_page){
		case 0: OLED_Clear(); OLED_ShowString(0, 1, "WiFi AP is", 8); OLED_ShowString(0, 2, "Starting..", 8); break;
		case 1: show_wifi_qr(); break;
		case 2: show_text_wifi_config(kvm_sys_state.wifi_ap_pass); break;
		case 3: show_wifi_qr(); break;
		case 4: show_wifi_config_ip(); break;
		case 5: OLED_Clear(); OLED_ShowString(0, 1, "WiFi", 8); OLED_ShowString(0, 2, "Connect...", 8); break;
		default: OLED_Clear(); break;
	}
	kvm_oled_state.force_full_redraw = 0;
}

void oled_auto_sleep(void)
{
	// Kept as an API compatibility shim. The real state transition lives in
	// oled_policy_tick(), which is called only by the OLED thread.
	oled_policy_tick();
}

void kvm_show_UE(void)
{
	OLED_SetLayoutOffset(0);
	OLED_SetVerticalOffset(0);
	OLED_Clear();
	OLED_ShowString(0, 0, "HDMI: UE", 16);
}
