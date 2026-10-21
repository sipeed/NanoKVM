package router

import (
	"github.com/gin-gonic/gin"

	"NanoKVM-Server/authn"
	"NanoKVM-Server/middleware"
	"NanoKVM-Server/service/vm"
)

func vmRouter(r *gin.Engine) {
	service := vm.NewService()

	use := func(permission authn.Permission) gin.IRoutes {
		return r.Group("/api").Use(middleware.CheckToken(), middleware.RequirePermission(permission))
	}
	// The app shell reads the site title on every page, including the pages an
	// account without console access can open, so it asks for no feature grant.
	base := r.Group("/api").Use(middleware.CheckToken())
	view := use(authn.PermConsoleView)
	control := use(authn.PermConsoleControl)
	power := use(authn.PermPower)
	terminal := use(authn.PermTerminal)
	device := use(authn.PermDevice)
	network := use(authn.PermNetwork)

	view.GET("/vm/info", service.GetInfo)         // get device information
	view.GET("/vm/hardware", service.GetHardware) // get hardware version

	power.POST("/vm/gpio", service.SetGpio) // update gpio
	power.GET("/vm/gpio", service.GetGpio)  // get gpio

	// Video encoding and capture recovery are view operations: a user who may
	// only watch still has to be able to pick a quality their link can carry,
	// and every account holds console.view. Mapping pointer motion onto the
	// target screen stays console.control.
	view.POST("/vm/screen", service.SetScreen) // update screen

	view.GET("/vm/input-region", service.GetInputRegion)
	control.POST("/vm/input-region", service.SetInputRegion)
	view.GET("/vm/input-resolution", service.GetInputResolution)

	terminal.GET("/vm/terminal", service.Terminal) // web terminal

	terminal.GET("/vm/script", service.GetScripts)           // get script
	terminal.POST("/vm/script/upload", service.UploadScript) // upload script
	terminal.POST("/vm/script/run", service.RunScript)       // run script
	terminal.DELETE("/vm/script", service.DeleteScript)      // delete script

	// The emulated USB devices are device settings, not media or network ones:
	// the virtual disk hands the raw data partition to the target machine and the
	// RNDIS adapter hands it a network interface, so neither belongs to the
	// media library the disk serves or to the network settings of this side.
	device.GET("/vm/device/virtual", service.GetVirtualDevice)     // get virtual device
	device.POST("/vm/device/virtual", service.UpdateVirtualDevice) // update virtual device

	device.GET("/vm/memory/limit", service.GetMemoryLimit)  // get memory limit
	device.POST("/vm/memory/limit", service.SetMemoryLimit) // set memory limit

	device.GET("/vm/oled", service.GetOLED)  // get OLED configuration
	device.POST("/vm/oled", service.SetOLED) // set OLED configuration

	// Only supported by PCIe version
	//
	// Toggling the HDMI capture engine is a device setting, but resetting it is
	// capture recovery: a watcher whose screen went black needs it to see
	// anything at all, the same way it needs to pick a video mode and a quality.
	// Enabling, disabling and the idle timeout stay with the device grant, since
	// they change how the device behaves for everyone rather than recover a
	// broken picture.
	view.GET("/vm/hdmi", service.GetHdmiState)           // get HDMI state
	view.POST("/vm/hdmi/reset", service.ResetHdmi)       // reset hdmi
	device.POST("/vm/hdmi/enable", service.EnableHdmi)   // enable hdmi
	device.POST("/vm/hdmi/disable", service.DisableHdmi) // disable hdmi
	device.POST("/vm/hdmi/timeout", service.SetHdmiIdleTimeout)

	device.GET("/vm/ssh", service.GetSSHState)         // get SSH state
	device.POST("/vm/ssh/enable", service.EnableSSH)   // enable SSH
	device.POST("/vm/ssh/disable", service.DisableSSH) // disable SSH

	device.GET("/vm/swap", service.GetSwap)  // get swap file size
	device.POST("/vm/swap", service.SetSwap) // set swap file size

	device.GET("/vm/mouse-jiggler", service.GetMouseJiggler)   // get mouse jiggler
	device.POST("/vm/mouse-jiggler/", service.SetMouseJiggler) // set mouse jiggler

	view.GET("/vm/hostname", service.GetHostname)    // Get Hostname
	device.POST("/vm/hostname", service.SetHostname) // Set Hostname

	base.GET("/vm/web-title", service.GetWebTitle)    // Get web title
	device.POST("/vm/web-title", service.SetWebTitle) // Set web title

	device.GET("/vm/mdns", service.GetMdnsState)         // get mDNS state
	device.POST("/vm/mdns/enable", service.EnableMdns)   // enable mDNS
	device.POST("/vm/mdns/disable", service.DisableMdns) // disable mDNS

	network.POST("/vm/tls", service.SetTls) // enable/disable TLS

	terminal.GET("/vm/autostart", service.GetAutostart)              // get autostart list
	terminal.GET("/vm/autostart/:name", service.GetAutostartContent) // get autostart content
	terminal.DELETE("/vm/autostart/:name", service.DeleteAutostart)  // delete autostart script
	terminal.POST("/vm/autostart/:name", service.UploadAutostart)    // upload autostart script

	device.POST("/vm/system/reboot", service.Reboot) // reboot system
}
