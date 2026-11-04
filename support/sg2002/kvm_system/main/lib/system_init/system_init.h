#ifndef SYSTEM_INIT_H_
#define SYSTEM_INIT_H_
#include "config.h"

void new_img_init(void);
enum AppInitResult { APP_INIT_OK = 0, APP_INIT_FAILED = 1, APP_INIT_REBOOT = 2 };
AppInitResult new_app_init(void);
void Production_testing_patch(void);

#endif // SYSTEM_INIT_H_
