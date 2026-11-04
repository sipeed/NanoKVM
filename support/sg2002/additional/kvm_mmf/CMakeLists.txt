cmake_minimum_required(VERSION 3.16)

if(COMMAND register_component)
    if(NOT EXISTS "$ENV{KVM_MMF_PREFIX}/lib/libkvm_mmf.so")
        message(FATAL_ERROR "Build standalone kvm_mmf first and set KVM_MMF_PREFIX (support/sg2002/build does this)")
    endif()
    list(APPEND ADD_INCLUDE "$ENV{KVM_MMF_PREFIX}/include")
    file(GLOB video_libraries "$ENV{KVM_MMF_PREFIX}/lib/*.so")
    list(APPEND ADD_DYNAMIC_LIB ${video_libraries})
    register_component()
    return()
endif()

project(kvm_mmf VERSION 1.0 LANGUAGES C CXX)
include(GNUInstallDirs)
find_package(Threads REQUIRED)

set(SOPHGO_MIDDLEWARE_DIR "" CACHE PATH "CVI SDK middleware root containing v2/")
set(SOPHGO_RUNTIME_DIR "" CACHE PATH "Firmware-matched SDK .so directory; defaults to middleware v2/lib")
set(SOPHGO_CHIP cv181x CACHE STRING "CVI SDK chip family")
option(KVM_MMF_INSTALL_SDK_LIBS "Install the SDK runtime libraries alongside kvm_mmf" ON)
if(NOT EXISTS "${SOPHGO_MIDDLEWARE_DIR}/v2/include/cvi_venc.h")
    message(FATAL_ERROR "Set SOPHGO_MIDDLEWARE_DIR to the CVI SDK middleware root containing v2/include/cvi_venc.h")
endif()
get_filename_component(middleware "${SOPHGO_MIDDLEWARE_DIR}/v2" REALPATH)
if(SOPHGO_RUNTIME_DIR)
    get_filename_component(runtime "${SOPHGO_RUNTIME_DIR}" REALPATH)
else()
    set(runtime "${middleware}/lib")
endif()
set(common "${middleware}/sample/common")
set(sensor "${middleware}/component/isp/sensor/sg200x/lontium_lt6911")

add_library(kvm_mmf SHARED
    src/kvm_mmf.cpp
    "${common}/sample_common_sys.c"
    "${common}/sample_common_vi.c"
    "${common}/sample_common_isp.c"
    "${common}/sample_common_bin.c"
    "${common}/sample_common_platform.c"
    "${common}/sample_common_sensor.c"
    "${sensor}/lt6911_cmos.c" "${sensor}/lt6911_sensor_ctl.c"
)
target_compile_features(kvm_mmf PRIVATE cxx_std_17)
target_compile_definitions(kvm_mmf PRIVATE SENSOR_LONTIUM_LT6911 SENSOR2_TYPE=LONTIUM_LT6911_2M_60FPS_8BIT)
target_compile_options(kvm_mmf PRIVATE -Wall -ffunction-sections -fdata-sections)
target_include_directories(kvm_mmf PUBLIC
    $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
    $<INSTALL_INTERFACE:${CMAKE_INSTALL_INCLUDEDIR}>
)
target_include_directories(kvm_mmf PRIVATE
    "${common}" "${middleware}/include" "${middleware}/uapi"
    "${middleware}/include/isp/${SOPHGO_CHIP}"
    "${middleware}/component/panel/${SOPHGO_CHIP}"
    "${middleware}/3rdparty/inih"
)
foreach(name cvi_bin ae af awb cvi_bin_isp isp isp_algo sys venc vpu ini)
    unset(sdk_${name} CACHE)
    find_library(sdk_${name} NAMES ${name} PATHS "${runtime}" "${runtime}/3rd" NO_DEFAULT_PATH REQUIRED)
    target_link_libraries(kvm_mmf PRIVATE "${sdk_${name}}")
    if(KVM_MMF_INSTALL_SDK_LIBS AND sdk_${name} MATCHES "\\.so$")
        install(FILES "${sdk_${name}}" DESTINATION ${CMAKE_INSTALL_LIBDIR})
    endif()
endforeach()
target_link_libraries(kvm_mmf PRIVATE Threads::Threads m atomic)
target_link_options(kvm_mmf PRIVATE -Wl,--as-needed -Wl,--gc-sections -Wl,-z,defs -Wl,--no-allow-shlib-undefined)
set_target_properties(kvm_mmf PROPERTIES
    C_VISIBILITY_PRESET hidden CXX_VISIBILITY_PRESET hidden VISIBILITY_INLINES_HIDDEN YES
    BUILD_WITH_INSTALL_RPATH YES INSTALL_RPATH "\$ORIGIN")
install(TARGETS kvm_mmf LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR})
install(FILES include/kvm_mmf.hpp DESTINATION ${CMAKE_INSTALL_INCLUDEDIR})
