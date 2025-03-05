#ifndef OLED_UI_H_
#define OLED_UI_H_
#include "config.h"
#include "oled_ctrl.h"

void kvm_main_ui_disp(uint8_t first_disp, uint8_t subpage_changed);
void kvm_wifi_config_ui_disp(uint8_t first_disp, uint8_t subpage_changed);
void oled_auto_sleep_time_update(void);
void oled_auto_sleep(void);

#endif // OLED_UI_H_