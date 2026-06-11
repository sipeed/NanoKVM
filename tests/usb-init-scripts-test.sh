#!/bin/sh
set -eu

ROOT_DIR=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
COMMON_SCRIPT="${ROOT_DIR}/kvmapp/system/init.d/S03usb-common"
NORMAL_SCRIPT="${ROOT_DIR}/kvmapp/system/init.d/S03usbdev"
HID_ONLY_SCRIPT="${ROOT_DIR}/kvmapp/system/init.d/S03usbhid"
TMP_DIRS=""
TEST_COMMON_SCRIPT=""

CONFIGFS_GADGET_ATTRS="UDC bcdUSB bcdDevice idVendor idProduct bDeviceClass bDeviceSubClass bDeviceProtocol"
CONFIGFS_STRING_ATTRS="serialnumber manufacturer product"
CONFIGFS_CONFIG_ATTRS="bmAttributes MaxPower"
CONFIGFS_CONFIG_STRING_ATTRS="configuration"
CONFIGFS_HID_ATTRS="subclass protocol report_length report_desc wakeup_on_write"
CONFIGFS_LUN_ATTRS="removable ro cdrom inquiry_string file"
CONFIGFS_OS_DESC_ATTRS="use b_vendor_code qw_sign"
CONFIGFS_RNDIS_ATTRS="class subclass protocol"
CONFIGFS_RNDIS_OS_DESC_ATTRS="compatible_id sub_compatible_id"
CONFIGFS_NCM_OS_DESC_ATTRS="compatible_id"

cleanup(){
    for dir in ${TMP_DIRS}
    do
        rm -rf "${dir}"
    done
}
trap cleanup EXIT

fail(){
    echo "FAIL: $*" >&2
    exit 1
}

assert_eq(){
    [ "$1" = "$2" ] || fail "$3: got '$1', want '$2'"
}

assert_no_file(){
    [ ! -e "$1" ] && [ ! -L "$1" ] || fail "unexpected file: $1"
}

assert_link(){
    path="$1"
    want="$2"
    [ -e "${path}" ] || [ -L "${path}" ] || fail "missing file: ${path}"
    got=$(readlink "${path}")
    assert_eq "${got}" "${want}" "symlink ${path}"
}

assert_hex(){
    assert_eq "$(od -An -tx1 -v "$1" | tr -d ' \n')" "$2" "hex $1"
}

hex_of(){
    printf '%s' "$1" | od -An -tx1 -v | tr -d ' \n'
}

assert_text_bytes(){
    assert_hex "$1" "$(hex_of "$2")"
}

USB_DEFAULT_UDC="4340000.usb"
USB_PHY_DEVICE="4340000.usb"
USB_SECONDARY_UDC="4350000.usb"
USB_SERIAL_NUMBER="0123456789ABCDEF"
USB_MANUFACTURER="sipeed"
USB_PRODUCT="NanoKVM"
USB_CONFIGURATION="NanoKVM"
USB_NORMAL_BCD_USB="0x0200"
USB_NORMAL_BCD_DEVICE="0x0510"
USB_HID_ONLY_BCD_USB="0x0110"
USB_HID_ONLY_BCD_DEVICE="0x0623"
USB_HID_ONLY_CONFIG_ATTRIBUTES="0xA0"
USB_HID_KEYBOARD_FUNC="hid.GS0"
USB_HID_RELATIVE_MOUSE_FUNC="hid.GS1"
USB_HID_ABSOLUTE_MOUSE_FUNC="hid.GS2"
USB_MASS_STORAGE_FUNC="mass_storage.disk0"
USB_RNDIS_FUNC="rndis.usb0"
USB_NCM_FUNC="ncm.usb0"
USB_LEGACY_EMPTY_DISK_BACKING="/dev/mmcblk0p3"
USB_TEST_IMAGE="/data/install.iso"

KEYBOARD_REPORT_DESC="05010906a101050719e029e71500250175019508810295017508810395057501050819012905910295017503910395067508150025e70507190029e78100c0"
HID_ONLY_KEYBOARD_REPORT_DESC="05010906a101050719e029e71500250175019508810295017508810395057501050819012905910295017503910395067508150025650507190029658100c0"
RELATIVE_MOUSE_REPORT_DESC="05010902a1010901a1000509190129031500250195037501810295017505810305010930093109381581257f750895038106c0c0"
ABSOLUTE_MOUSE_REPORT_DESC="05010902a1010901a10005091901290515002501950575018102950175038101050109300931150026ff7f350046ff7f751095028102050109381581257f35004500750895018106c0c0"
HID_ONLY_ABSOLUTE_MOUSE_REPORT_DESC="05010902a1010901a10005091901290315002501950375018102950175058101050109300931150026ff7f350046ff7f751095028102050109381581257f35004500750895018106c0c0"

setup_fake_configfs_tools(){
    base=$(mktemp -d)
    TMP_DIRS="${TMP_DIRS} ${base}"
    fake_bin="${base}/bin"
    mkdir -p "${fake_bin}"

    real_mkdir=$(command -v mkdir)
    real_rmdir=$(command -v rmdir)

    cat > "${fake_bin}/mkdir" <<EOF
#!/bin/sh
"${real_mkdir}" "\$@" || exit \$?
touch_attrs(){
    dir="\$1"
    shift
    for attr in "\$@"
    do
        touch "\${dir}/\${attr}"
    done
}
prepare_fake_configfs_dir(){
    dir="\$1"
    case "\${dir}" in
      g0|*/g0)
        "${real_mkdir}" -p "\${dir}/strings" "\${dir}/configs" "\${dir}/functions" "\${dir}/os_desc"
        touch_attrs "\${dir}" ${CONFIGFS_GADGET_ATTRS}
        touch_attrs "\${dir}/os_desc" ${CONFIGFS_OS_DESC_ATTRS}
        ;;
      strings/0x409|*/strings/0x409)
        touch_attrs "\${dir}" ${CONFIGFS_STRING_ATTRS}
        ;;
      configs/c.1|*/configs/c.1)
        touch_attrs "\${dir}" ${CONFIGFS_CONFIG_ATTRS}
        ;;
      configs/c.1/strings/0x409|*/configs/c.1/strings/0x409)
        touch_attrs "\${dir}" ${CONFIGFS_CONFIG_STRING_ATTRS}
        ;;
      functions/hid.GS*|*/functions/hid.GS*)
        printf '%s' '0' > "\${dir}/subclass"
        touch_attrs "\${dir}" ${CONFIGFS_HID_ATTRS}
        ;;
      functions/rndis.*|*/functions/rndis.*)
        "${real_mkdir}" -p "\${dir}/os_desc/interface.rndis"
        touch_attrs "\${dir}" ${CONFIGFS_RNDIS_ATTRS}
        touch_attrs "\${dir}/os_desc/interface.rndis" ${CONFIGFS_RNDIS_OS_DESC_ATTRS}
        ;;
      functions/ncm.*|*/functions/ncm.*)
        "${real_mkdir}" -p "\${dir}/os_desc/interface.ncm"
        touch_attrs "\${dir}/os_desc/interface.ncm" ${CONFIGFS_NCM_OS_DESC_ATTRS}
        ;;
      functions/mass_storage.*/lun.0|*/functions/mass_storage.*/lun.0)
        touch_attrs "\${dir}" ${CONFIGFS_LUN_ATTRS}
        ;;
      functions/mass_storage.*|*/functions/mass_storage.*)
        "${real_mkdir}" -p "\${dir}/lun.0"
        prepare_fake_configfs_dir "\${dir}/lun.0"
        ;;
    esac
}
for arg in "\$@"
do
    case "\${arg}" in
      -*) ;;
      *) [ -d "\${arg}" ] && prepare_fake_configfs_dir "\${arg}" ;;
    esac
done
EOF

    cat > "${fake_bin}/rmdir" <<EOF
#!/bin/sh
remove_fake_configfs_attrs(){
    dir="\$1"
    case "\${dir}" in
      g0|*/g0)
        rm -f "\${dir}/UDC" "\${dir}/bcdUSB" "\${dir}/bcdDevice" "\${dir}/idVendor" "\${dir}/idProduct" "\${dir}/bDeviceClass" "\${dir}/bDeviceSubClass" "\${dir}/bDeviceProtocol"
        ;;
      strings/0x409|*/strings/0x409)
        rm -f "\${dir}/serialnumber" "\${dir}/manufacturer" "\${dir}/product"
        ;;
      configs/c.1|*/configs/c.1)
        rm -f "\${dir}/bmAttributes" "\${dir}/MaxPower"
        ;;
      configs/c.1/strings/0x409|*/configs/c.1/strings/0x409)
        rm -f "\${dir}/configuration"
        ;;
      functions/hid.GS*|*/functions/hid.GS*)
        rm -f "\${dir}/subclass" "\${dir}/protocol" "\${dir}/report_length" "\${dir}/report_desc" "\${dir}/wakeup_on_write"
        ;;
      functions/mass_storage.*/lun.0|*/functions/mass_storage.*/lun.0)
        rm -f "\${dir}/removable" "\${dir}/ro" "\${dir}/cdrom" "\${dir}/inquiry_string" "\${dir}/file"
        ;;
    esac
}
for arg in "\$@"
do
    case "\${arg}" in
      -*) ;;
      *)
        [ -d "\${arg}" ] && remove_fake_configfs_attrs "\${arg}"
        case "\${arg}" in
          g0|*/g0)
            [ ! -L "\${arg}/os_desc/c.1" ] || exit 1
            rm -rf "\${arg}"
            exit 0
            ;;
        esac
        ;;
    esac
done
"${real_rmdir}" "\$@"
EOF

    chmod +x "${fake_bin}/mkdir" "${fake_bin}/rmdir"

    TEST_COMMON_SCRIPT="${base}/S03usb-common"
    awk -v fake_bin="${fake_bin}" '
        /^PATH=/ {
            print "PATH=\"" fake_bin ":/sbin:/usr/sbin:/bin:/usr/bin${PATH:+:${PATH}}\""
            next
        }
        { print }
    ' "${COMMON_SCRIPT}" > "${TEST_COMMON_SCRIPT}"
}

assert_hid_attr(){
    assert_eq "$(cat "$1/functions/$2/$3")" "$4" "$5"
}

assert_hid_boot_interfaces(){
    g="$1"
    label="$2"
    assert_hid_attr "${g}" "${USB_HID_KEYBOARD_FUNC}" subclass 1 "${label} keyboard boot subclass"
    assert_hid_attr "${g}" "${USB_HID_KEYBOARD_FUNC}" protocol 1 "${label} keyboard protocol"
    assert_hid_attr "${g}" "${USB_HID_RELATIVE_MOUSE_FUNC}" subclass 1 "${label} mouse boot subclass"
    assert_hid_attr "${g}" "${USB_HID_RELATIVE_MOUSE_FUNC}" protocol 2 "${label} mouse protocol"
    assert_hid_attr "${g}" "${USB_HID_ABSOLUTE_MOUSE_FUNC}" subclass 0 "${label} touch non-boot subclass"
    assert_hid_attr "${g}" "${USB_HID_ABSOLUTE_MOUSE_FUNC}" protocol 2 "${label} touch protocol"
}

assert_hid_function(){
    assert_link "$1/configs/c.1/$2" "functions/$2"
    assert_hid_attr "$1" "$2" subclass "$4" "$3 subclass"
    assert_hid_attr "$1" "$2" protocol "$5" "$3 protocol"
    assert_hid_attr "$1" "$2" report_length "$6" "$3 report length"
    assert_hex "$1/functions/$2/report_desc" "$7"
    assert_hid_attr "$1" "$2" wakeup_on_write "$8" "$3 wake"
}

assert_hid_functions(){
    assert_hid_function "$1" "${USB_HID_KEYBOARD_FUNC}" "$2 keyboard" 1 1 8 "$3" "$5"
    assert_hid_function "$1" "${USB_HID_RELATIVE_MOUSE_FUNC}" "$2 mouse" 1 2 4 "${RELATIVE_MOUSE_REPORT_DESC}" "$5"
    assert_hid_function "$1" "${USB_HID_ABSOLUTE_MOUSE_FUNC}" "$2 touch" 0 2 6 "$4" "$5"
}

assert_normal_composite_descriptors(){
    g="$1"
    label="$2"
    assert_eq "$(cat "${g}/bDeviceClass")" "0xEF" "${label} device class"
    assert_eq "$(cat "${g}/bDeviceSubClass")" "0x02" "${label} device subclass"
    assert_eq "$(cat "${g}/bDeviceProtocol")" "0x01" "${label} device protocol"
}

assert_os_descriptors(){
    g="$1"
    label="$2"
    assert_link "${g}/os_desc/c.1" "configs/c.1"
    assert_eq "$(cat "${g}/os_desc/use")" "1" "${label} OS descriptor enabled"
    assert_eq "$(cat "${g}/os_desc/b_vendor_code")" "0xCD" "${label} vendor code"
    assert_eq "$(cat "${g}/os_desc/qw_sign")" "MSFT100" "${label} OS descriptor signature"
}

assert_rndis_function(){
    g="$1"
    label="$2"
    assert_link "${g}/configs/c.1/${USB_RNDIS_FUNC}" "functions/${USB_RNDIS_FUNC}"
    assert_eq "$(cat "${g}/functions/${USB_RNDIS_FUNC}/class")" "e0" "${label} RNDIS class"
    assert_eq "$(cat "${g}/functions/${USB_RNDIS_FUNC}/subclass")" "01" "${label} RNDIS subclass"
    assert_eq "$(cat "${g}/functions/${USB_RNDIS_FUNC}/protocol")" "03" "${label} RNDIS protocol"
    assert_eq "$(cat "${g}/functions/${USB_RNDIS_FUNC}/os_desc/interface.rndis/compatible_id")" "RNDIS" "${label} RNDIS compatible id"
    assert_eq "$(cat "${g}/functions/${USB_RNDIS_FUNC}/os_desc/interface.rndis/sub_compatible_id")" "5162001" "${label} RNDIS sub-compatible id"
}

assert_no_hid_functions(){
    g="$1"
    for func in "${USB_HID_KEYBOARD_FUNC}" "${USB_HID_RELATIVE_MOUSE_FUNC}" "${USB_HID_ABSOLUTE_MOUSE_FUNC}"
    do
        assert_no_file "${g}/configs/c.1/${func}"
        assert_no_file "${g}/functions/${func}"
    done
}

new_env(){
    base=$(mktemp -d)
    TMP_DIRS="${TMP_DIRS} ${base}"
    mkdir -p "${base}/boot" "${base}/dwc2" "${base}/gadget" "${base}/udc" "${base}/proc/cviusb"
    touch "${base}/dwc2/bind" "${base}/dwc2/unbind"
    touch "${base}/udc/${USB_DEFAULT_UDC}"
    touch "${base}/proc/cviusb/otg_role"
    echo "${base}"
}

run_script_action(){
    script="$1"
    action="$2"
    base="$3"
    USB_COMMON="${TEST_COMMON_SCRIPT}" \
    USB_BOOT_DIR="${base}/boot" \
    USB_GADGET_ROOT="${base}/gadget" \
    USB_UDC_CLASS="${base}/udc" \
    USB_OTG_ROLE="${base}/proc/cviusb/otg_role" \
    USB_PHY_DEVICE="${USB_PHY_DEVICE}" \
    USB_DWC2_BIND="${base}/dwc2/bind" \
    USB_DWC2_UNBIND="${base}/dwc2/unbind" \
    sh "${script}" "${action}" >/dev/null
}

run_start(){
    script="$1"
    base="$2"
    run_script_action "${script}" start "${base}"
}

test_normal_hid_descriptors(){
    base=$(new_env)
    run_start "${NORMAL_SCRIPT}" "${base}"
    g="${base}/gadget/g0"

    assert_eq "$(cat "${g}/bcdUSB")" "${USB_NORMAL_BCD_USB}" "normal bcdUSB"
    assert_eq "$(cat "${g}/bcdDevice")" "${USB_NORMAL_BCD_DEVICE}" "normal bcdDevice"
    assert_normal_composite_descriptors "${g}" normal
    assert_text_bytes "${g}/strings/0x409/manufacturer" "${USB_MANUFACTURER}"
    assert_text_bytes "${g}/strings/0x409/product" "${USB_PRODUCT}"
    assert_text_bytes "${g}/strings/0x409/serialnumber" "${USB_SERIAL_NUMBER}"
    assert_text_bytes "${g}/configs/c.1/strings/0x409/configuration" "${USB_CONFIGURATION}"

    assert_hid_functions "${g}" normal "${KEYBOARD_REPORT_DESC}" "${ABSOLUTE_MOUSE_REPORT_DESC}" 1
    assert_eq "$(cat "${g}/UDC")" "${USB_DEFAULT_UDC}" "normal UDC"
    assert_eq "$(cat "${base}/proc/cviusb/otg_role")" "device" "normal OTG role"
}

test_normal_bios_flag_keeps_only_boot_hid_interfaces(){
    base=$(new_env)
    touch "${base}/boot/BIOS"
    run_start "${NORMAL_SCRIPT}" "${base}"
    g="${base}/gadget/g0"

    assert_hid_boot_interfaces "${g}" BIOS
}

test_normal_disable_hid_removes_hid_functions(){
    base=$(new_env)
    touch "${base}/boot/disable_hid"
    run_start "${NORMAL_SCRIPT}" "${base}"
    g="${base}/gadget/g0"

    assert_no_hid_functions "${g}"
}

test_normal_legacy_mass_storage(){
    base=$(new_env)
    : > "${base}/boot/usb.disk0"
    run_start "${NORMAL_SCRIPT}" "${base}"
    g="${base}/gadget/g0"

    assert_link "${g}/configs/c.1/${USB_MASS_STORAGE_FUNC}" "functions/${USB_MASS_STORAGE_FUNC}"
    assert_eq "$(cat "${g}/functions/${USB_MASS_STORAGE_FUNC}/lun.0/removable")" "1" "mass storage removable"
    assert_eq "$(cat "${g}/functions/${USB_MASS_STORAGE_FUNC}/lun.0/file")" "${USB_LEGACY_EMPTY_DISK_BACKING}" "legacy empty disk backing"
}

test_normal_mounted_image_and_network(){
    base=$(new_env)
    printf '%s' "${USB_TEST_IMAGE}" > "${base}/boot/usb.disk0"
    touch "${base}/boot/usb.disk0.ro"
    touch "${base}/boot/usb.rndis0"
    run_start "${NORMAL_SCRIPT}" "${base}"
    g="${base}/gadget/g0"

    assert_normal_composite_descriptors "${g}" normal-network
    assert_rndis_function "${g}" normal-network
    assert_os_descriptors "${g}" normal-network
    assert_eq "$(cat "${g}/functions/${USB_MASS_STORAGE_FUNC}/lun.0/file")" "${USB_TEST_IMAGE}" "mounted image"
    assert_eq "$(cat "${g}/functions/${USB_MASS_STORAGE_FUNC}/lun.0/ro")" "1" "media ro flag"
    assert_eq "$(cat "${g}/functions/${USB_MASS_STORAGE_FUNC}/lun.0/cdrom")" "0" "media cdrom flag"
}

test_network_restart_removes_os_desc_link(){
    base=$(new_env)
    touch "${base}/boot/usb.rndis0"
    run_start "${NORMAL_SCRIPT}" "${base}"
    run_start "${NORMAL_SCRIPT}" "${base}"
    g="${base}/gadget/g0"

    assert_os_descriptors "${g}" network-restart
    assert_rndis_function "${g}" network-restart
    assert_hid_functions "${g}" network-restart "${KEYBOARD_REPORT_DESC}" "${ABSOLUTE_MOUSE_REPORT_DESC}" 1
}

test_ncm_network_descriptors(){
    base=$(new_env)
    touch "${base}/boot/usb.ncm"
    touch "${base}/boot/usb.rndis0"
    run_start "${NORMAL_SCRIPT}" "${base}"
    g="${base}/gadget/g0"

    assert_link "${g}/configs/c.1/${USB_NCM_FUNC}" "functions/${USB_NCM_FUNC}"
    assert_no_file "${g}/configs/c.1/${USB_RNDIS_FUNC}"
    assert_eq "$(cat "${g}/functions/${USB_NCM_FUNC}/os_desc/interface.ncm/compatible_id")" "WINNCM" "NCM compatible id"
    assert_normal_composite_descriptors "${g}" ncm
    assert_os_descriptors "${g}" ncm
}

test_mode_switches_rebuild_gadget_contents(){
    base=$(new_env)
    touch "${base}/boot/usb.disk0"
    touch "${base}/boot/usb.rndis0"

    run_start "${NORMAL_SCRIPT}" "${base}"
    g="${base}/gadget/g0"
    assert_eq "$(cat "${g}/bcdDevice")" "${USB_NORMAL_BCD_DEVICE}" "normal mode bcdDevice"
    assert_link "${g}/configs/c.1/${USB_MASS_STORAGE_FUNC}" "functions/${USB_MASS_STORAGE_FUNC}"
    assert_rndis_function "${g}" mode-switch-normal
    assert_os_descriptors "${g}" mode-switch-normal

    run_start "${HID_ONLY_SCRIPT}" "${base}"
    g="${base}/gadget/g0"
    assert_eq "$(cat "${g}/bcdDevice")" "${USB_HID_ONLY_BCD_DEVICE}" "hid-only mode bcdDevice"
    assert_eq "$(cat "${g}/bDeviceClass")" "" "hid-only device class"
    assert_eq "$(cat "${g}/bDeviceSubClass")" "" "hid-only device subclass"
    assert_eq "$(cat "${g}/bDeviceProtocol")" "" "hid-only device protocol"
    assert_hid_functions "${g}" switched-hid-only "${HID_ONLY_KEYBOARD_REPORT_DESC}" "${HID_ONLY_ABSOLUTE_MOUSE_REPORT_DESC}" 1
    assert_no_file "${g}/configs/c.1/${USB_MASS_STORAGE_FUNC}"
    assert_no_file "${g}/configs/c.1/${USB_RNDIS_FUNC}"
    assert_no_file "${g}/os_desc/c.1"

    run_start "${NORMAL_SCRIPT}" "${base}"
    g="${base}/gadget/g0"
    assert_eq "$(cat "${g}/bcdDevice")" "${USB_NORMAL_BCD_DEVICE}" "switched-back normal bcdDevice"
    assert_normal_composite_descriptors "${g}" switched-normal
    assert_hid_functions "${g}" switched-normal "${KEYBOARD_REPORT_DESC}" "${ABSOLUTE_MOUSE_REPORT_DESC}" 1
    assert_link "${g}/configs/c.1/${USB_MASS_STORAGE_FUNC}" "functions/${USB_MASS_STORAGE_FUNC}"
    assert_rndis_function "${g}" switched-normal
    assert_os_descriptors "${g}" switched-normal
}

test_hid_only_descriptors_and_no_wake(){
    base=$(new_env)
    touch "${base}/boot/usb.notwakeup"
    touch "${base}/boot/usb.disk0"
    touch "${base}/boot/usb.rndis0"
    run_start "${HID_ONLY_SCRIPT}" "${base}"
    g="${base}/gadget/g0"

    assert_eq "$(cat "${g}/bcdUSB")" "${USB_HID_ONLY_BCD_USB}" "hid-only bcdUSB"
    assert_eq "$(cat "${g}/bcdDevice")" "${USB_HID_ONLY_BCD_DEVICE}" "hid-only bcdDevice"
    assert_eq "$(cat "${g}/configs/c.1/bmAttributes")" "${USB_HID_ONLY_CONFIG_ATTRIBUTES}" "hid-only bmAttributes"
    assert_text_bytes "${g}/strings/0x409/serialnumber" "${USB_SERIAL_NUMBER}"
    assert_text_bytes "${g}/strings/0x409/manufacturer" "${USB_MANUFACTURER}"
    assert_text_bytes "${g}/strings/0x409/product" "${USB_PRODUCT}"
    assert_text_bytes "${g}/configs/c.1/strings/0x409/configuration" "${USB_CONFIGURATION}"
    assert_hid_functions "${g}" hid-only "${HID_ONLY_KEYBOARD_REPORT_DESC}" "${HID_ONLY_ABSOLUTE_MOUSE_REPORT_DESC}" ""
    assert_no_file "${g}/configs/c.1/${USB_MASS_STORAGE_FUNC}"
    assert_no_file "${g}/configs/c.1/${USB_RNDIS_FUNC}"
}

test_uses_one_udc(){
    base=$(new_env)
    touch "${base}/udc/${USB_SECONDARY_UDC}"
    run_start "${NORMAL_SCRIPT}" "${base}"

    assert_eq "$(cat "${base}/gadget/g0/UDC")" "${USB_DEFAULT_UDC}" "first UDC selected"
}

test_stop_unbinds_and_sets_host_role(){
    base=$(new_env)
    run_start "${NORMAL_SCRIPT}" "${base}"
    run_script_action "${NORMAL_SCRIPT}" stop "${base}"

    assert_eq "$(cat "${base}/gadget/g0/UDC")" "" "stopped UDC"
    assert_eq "$(cat "${base}/proc/cviusb/otg_role")" "host" "stopped OTG role"
}

test_stop_then_start_rebuilds_gadget(){
    base=$(new_env)
    run_start "${NORMAL_SCRIPT}" "${base}"
    run_script_action "${NORMAL_SCRIPT}" stop "${base}"
    run_script_action "${NORMAL_SCRIPT}" start "${base}"
    g="${base}/gadget/g0"

    assert_eq "$(cat "${g}/UDC")" "${USB_DEFAULT_UDC}" "stop-start UDC"
    assert_eq "$(cat "${base}/proc/cviusb/otg_role")" "device" "stop-start OTG role"
    assert_hid_functions "${g}" stop-start "${KEYBOARD_REPORT_DESC}" "${ABSOLUTE_MOUSE_REPORT_DESC}" 1
}

test_restart_phy_rebuilds_gadget(){
    base=$(new_env)
    run_start "${NORMAL_SCRIPT}" "${base}"
    run_script_action "${NORMAL_SCRIPT}" restart_phy "${base}"
    g="${base}/gadget/g0"

    assert_eq "$(cat "${base}/dwc2/unbind")" "${USB_PHY_DEVICE}" "phy unbind"
    assert_eq "$(cat "${base}/dwc2/bind")" "${USB_PHY_DEVICE}" "phy bind"
    assert_eq "$(cat "${g}/UDC")" "${USB_DEFAULT_UDC}" "restart-phy UDC"
    assert_eq "$(cat "${base}/proc/cviusb/otg_role")" "device" "restart-phy OTG role"
    assert_hid_functions "${g}" restart-phy "${KEYBOARD_REPORT_DESC}" "${ABSOLUTE_MOUSE_REPORT_DESC}" 1
}

test_restart_rebinds_udc(){
    base=$(new_env)
    run_start "${NORMAL_SCRIPT}" "${base}"
    run_script_action "${NORMAL_SCRIPT}" restart "${base}"

    assert_eq "$(cat "${base}/gadget/g0/UDC")" "${USB_DEFAULT_UDC}" "restarted UDC"
}

setup_fake_configfs_tools
test_normal_hid_descriptors
test_normal_bios_flag_keeps_only_boot_hid_interfaces
test_normal_disable_hid_removes_hid_functions
test_normal_legacy_mass_storage
test_normal_mounted_image_and_network
test_network_restart_removes_os_desc_link
test_ncm_network_descriptors
test_mode_switches_rebuild_gadget_contents
test_hid_only_descriptors_and_no_wake
test_uses_one_udc
test_stop_unbinds_and_sets_host_role
test_stop_then_start_rebuilds_gadget
test_restart_phy_rebuilds_gadget
test_restart_rebinds_udc

echo "usb init script tests passed"
