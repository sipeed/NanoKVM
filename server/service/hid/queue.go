package hid

type QueuedReport struct {
	Data               []byte
	Execute            func(func() error) error
	Complete           func(bool)
	ResetKeyboard      func()
	ResetRelativeMouse func()
	ResetAbsoluteMouse func()
}

func (r QueuedReport) run(write func() error) error {
	if r.Execute != nil {
		return r.Execute(write)
	}
	return write()
}

func (r QueuedReport) complete(success bool) {
	if r.Complete != nil {
		r.Complete(success)
	}
}

func runCleanup(execute func(func() error) error, write func() error) error {
	if execute != nil {
		return execute(write)
	}
	return write()
}
