
list(APPEND ADD_INCLUDE 
                        "include"
                        "lib/libqr"
                        "lib/system_ctrl"
                        "lib/system_state"
                        "lib/system_init"
                        "lib/oled_ctrl"
                        "lib/oled_ui"
                        "lib/hdmi"
                        )

list(APPEND ADD_PRIVATE_INCLUDE "")

append_srcs_dir(ADD_SRCS    
                        "src"
                        "lib/libqr"
                        "lib/system_ctrl"
                        "lib/system_state"
                        "lib/system_init"
                        "lib/oled_ctrl"
                        "lib/oled_ui"
                        "lib/hdmi"
                        )       # append source file in src dir to var ADD_SRCS

list(APPEND ADD_REQUIREMENTS basic peripheral)

register_component()
