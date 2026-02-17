package proto

type UsbDescriptor struct {
	VendorName   string `json:"vendorName"`
	ProductName  string `json:"productName"`
	SerialNumber string `json:"serialNumber"`
	Vid          string `json:"vid"`
	Pid          string `json:"pid"`
}

type GetUsbDescriptorRsp struct {
	Descriptor UsbDescriptor `json:"descriptor"`
}

type SetUsbDescriptorReq struct {
	VendorName   string `json:"vendorName"`
	ProductName  string `json:"productName"`
	SerialNumber string `json:"serialNumber"`
	Vid          string `json:"vid" validate:"required"`
	Pid          string `json:"pid" validate:"required"`
}
