list(APPEND ADD_REQUIREMENTS vision basic peripheral)
list(APPEND ADD_INCLUDE "include")

append_srcs_dir(ADD_SRCS "src")

register_component(DYNAMIC)