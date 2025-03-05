
list(APPEND ADD_REQUIREMENTS basic ini)
list(APPEND ADD_INCLUDE "include")

# sophgo-middleware
set(middleware_src_path "${CMAKE_CURRENT_SOURCE_DIR}/../3rd_party/sophgo-middleware/sophgo-middleware")


set(source_dir "src")
append_srcs_dir(ADD_SRCS "${source_dir}")

# middleware
set(middleware_include_dir .
    ${middleware_src_path}/v2/component/panel/${CONFIG_SOPHGO_MIDDLEWARE_CHIP}
    ${middleware_src_path}/v2/include
    ${middleware_src_path}/v2/include/isp/${CONFIG_SOPHGO_MIDDLEWARE_CHIP}
    ${middleware_src_path}/v2/sample/common
    ${middleware_src_path}/v2/uapi
    ${middleware_src_path}/v2/3rdparty/inih
    ${middleware_src_path}/v2/modules/ive/include/
)
list(APPEND ADD_INCLUDE ${middleware_include_dir})
set_property(SOURCE ${middleware_include_dir} PROPERTY GENERATED 1)

append_srcs_dir(middleware_src_dir  ${middleware_src_path}/v2/sample/common
                                    ${middleware_src_path}/v2/component/isp/sensor/sg200x/lontium_lt6911
                                    )
list(APPEND ADD_SRCS        ${middleware_src_dir}
                            "${source_dir}/kvm_mmf.cpp")
set_property(SOURCE ${middleware_src_dir} PROPERTY GENERATED 1)

set(middleware_static_lib_file  "")
    list(APPEND ADD_STATIC_LIB ${middleware_static_lib_file})
set_property(SOURCE ${middleware_static_lib_file} PROPERTY GENERATED 1)

set(mmf_lib_dir ${middleware_src_path}/v2/lib)

if(CONFIG_SOPHGO_MIDDLEWARE_C_LIBRARY STREQUAL "musl")
    set(middleware_dynamic_lib_file     ${mmf_lib_dir}/libcvi_bin.so
                                        ${mmf_lib_dir}/libae.so
                                        ${mmf_lib_dir}/libaf.so
                                        ${mmf_lib_dir}/libawb.so
                                        ${mmf_lib_dir}/libcvi_bin_isp.so
                                        ${mmf_lib_dir}/libisp_algo.so
                                        ${mmf_lib_dir}/libisp.so
                                        ${mmf_lib_dir}/libsys.so
                                        ${mmf_lib_dir}/libvdec.so
                                        ${mmf_lib_dir}/libvenc.so
                                        ${mmf_lib_dir}/libvpu.so
                                        ${mmf_lib_dir}/3rd/libini.so)
elseif(CONFIG_SOPHGO_MIDDLEWARE_C_LIBRARY STREQUAL "glibc")
    set(middleware_dynamic_lib_file     ${mmf_lib_dir}/libcvi_vb.so
                                        ${mmf_lib_dir}/libcvi_sys.so
                                        ${mmf_lib_dir}/libcvi_debug.so
    )
else()
    message(FATAL_ERROR "No sophgo middleware c library support, please check menuoconfig to select c library")
endif()
list(APPEND ADD_DYNAMIC_LIB ${middleware_dynamic_lib_file})
set_property(SOURCE ${middleware_dynamic_lib_file} PROPERTY GENERATED 1)

list(APPEND ADD_DEFINITIONS_PRIVATE -DSENSOR_LONTIUM_LT6911
                                -DSENSOR2_TYPE=LONTIUM_LT6911_2M_60FPS_8BIT)


register_component(DYNAMIC)
