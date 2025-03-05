#include "hdmi.h"

using namespace maix;
using namespace maix::sys;
using namespace maix::peripheral;
i2c::I2C LT6911_i2c(4, i2c::Mode::MASTER);

void lt6911_enable()
{
	uint8_t buf[2];
	buf[0] = 0xff;
	buf[1] = 0x80;
	LT6911_i2c.writeto(LT6911_ADDR, buf, 2);
	
	buf[0] = 0xee;
	buf[1] = 0x01;
	LT6911_i2c.writeto(LT6911_ADDR, buf, 2);
}

void lt6911_disable()
{
	uint8_t buf[2];
	buf[0] = 0xff;
	buf[1] = 0x80;
	LT6911_i2c.writeto(LT6911_ADDR, buf, 2);
	
	buf[0] = 0xee;
	buf[1] = 0x00;
	LT6911_i2c.writeto(LT6911_ADDR, buf, 2);
}

void lt6911_start()
{
	uint8_t buf[2];

	buf[0] = 0xff;
	buf[1] = 0x80;
	LT6911_i2c.writeto(LT6911_ADDR, buf, 2);

	buf[0] = 0x5A;
	buf[1] = 0x80;
	LT6911_i2c.writeto(LT6911_ADDR, buf, 2);
}

void lt6911_stop()
{
	uint8_t buf[2];

	buf[0] = 0xff;
	buf[1] = 0x80;
	LT6911_i2c.writeto(LT6911_ADDR, buf, 2);

	buf[0] = 0x5A;
	buf[1] = 0x88;
	LT6911_i2c.writeto(LT6911_ADDR, buf, 2);
}

void lt6911_reset()
{
	lt6911_stop();
	time::sleep_ms(1);
	lt6911_start();
}

void lt6911_get_hdmi_errer()
{
	uint8_t buf[6];

	buf[0] = 0xff;
	buf[1] = 0xC0;
	LT6911_i2c.writeto(LT6911_ADDR, buf, 2);

	buf[0] = 0x20;
	buf[1] = 0x01;
	LT6911_i2c.writeto(LT6911_ADDR, buf, 2);

	time::sleep_ms(100);

	buf[0] = 0x24;
	LT6911_i2c.writeto(LT6911_ADDR, buf, 1);

	maix::Bytes *dat = LT6911_i2c.readfrom(LT6911_ADDR, 6);

	buf[0] = 0x20;
	buf[1] = 0x07;
	LT6911_i2c.writeto(LT6911_ADDR, buf, 2);

	for(int i = 0; i < 6; i++){
		buf[i] = (uint8_t)dat->data[i];
	}
	delete dat;

	printf("hdmi_errer_code = %x, %x, %x, %x, %x, %x\n", buf[0], buf[1], buf[2], buf[3], buf[4], buf[5]);
}

uint8_t lt6911_get_hdmi_res()
{
	uint8_t buf[2];
	uint8_t revbuf[4];
	uint16_t Vactive;
	uint16_t Hactive;

	buf[0] = 0xff;
	buf[1] = 0xd2;
	LT6911_i2c.writeto(LT6911_ADDR, buf, 2);

	buf[0] = 0x83;
	buf[1] = 0x11;
	LT6911_i2c.writeto(LT6911_ADDR, buf, 2);

	time::sleep_ms(100);

	// Vactive
	buf[0] = 0x96;
	LT6911_i2c.writeto(LT6911_ADDR, buf, 1);
	maix::Bytes *dat0 = LT6911_i2c.readfrom(LT6911_ADDR, 2);

	// Hactive
	buf[0] = 0x8b;
	LT6911_i2c.writeto(LT6911_ADDR, buf, 1);
	maix::Bytes *dat1 = LT6911_i2c.readfrom(LT6911_ADDR, 2);

	revbuf[0] = (uint8_t)dat0->data[0];
	revbuf[1] = (uint8_t)dat0->data[1];
	revbuf[2] = (uint8_t)dat1->data[0];
	revbuf[3] = (uint8_t)dat1->data[1];

	Vactive = (revbuf[0] << 8)|revbuf[1];
	Hactive = (revbuf[2] << 8)|revbuf[3];
	Hactive *= 2;

	printf("HDMI res modification event\n");
	printf("new res: %d * %d\n", Hactive, Vactive);

	delete dat0;
	delete dat1;

	if (Vactive != 0 && Hactive != 0){
		return 1;
	} else {
		return 0;
	}
}

void lt6911_get_hdmi_clk()
{
	uint8_t buf[2];
	uint8_t revbuf[3];
	uint32_t clk;

	buf[0] = 0xff;
	buf[1] = 0xa0;
	LT6911_i2c.writeto(LT6911_ADDR, buf, 2);

	buf[0] = 0x34;
	buf[1] = 0x0b;
	LT6911_i2c.writeto(LT6911_ADDR, buf, 2);

	time::sleep_ms(50);

	// clk
	buf[0] = 0xff;
	buf[1] = 0xb8;
	LT6911_i2c.writeto(LT6911_ADDR, buf, 2);

	buf[0] = 0xb1;
	LT6911_i2c.writeto(LT6911_ADDR, buf, 1);
	maix::Bytes *dat0 = LT6911_i2c.readfrom(LT6911_ADDR, 3);

	revbuf[0] = (uint8_t)dat0->data[0];
	revbuf[1] = (uint8_t)dat0->data[1];
	revbuf[2] = (uint8_t)dat0->data[2];
	revbuf[0] &= 0x07;

	clk = revbuf[0];
	clk <<= 8;
	clk |= revbuf[1];
	clk <<= 8;
	clk |= revbuf[2];

	printf("HDMI CLK = %d\n", clk);

	delete dat0;
}

uint8_t lt6911_get_csi_res()
{
	uint8_t ret = 0;
	uint8_t buf[2];
	uint8_t revbuf[4];
	static uint16_t old_Vactive;
	static uint16_t old_Hactive;
	uint16_t Vactive;
	uint16_t Hactive;
	char Cmd[100]={0};

	buf[0] = 0xff;
	buf[1] = 0xc2;
	LT6911_i2c.writeto(LT6911_ADDR, buf, 2);

	// Vactive
	buf[0] = 0x06;
	LT6911_i2c.writeto(LT6911_ADDR, buf, 1);
	maix::Bytes *dat0 = LT6911_i2c.readfrom(LT6911_ADDR, 2);

	// Hactive
	buf[0] = 0x38;
	LT6911_i2c.writeto(LT6911_ADDR, buf, 1);
	maix::Bytes *dat1 = LT6911_i2c.readfrom(LT6911_ADDR, 2);

	revbuf[0] = (uint8_t)dat0->data[0];
	revbuf[1] = (uint8_t)dat0->data[1];
	revbuf[2] = (uint8_t)dat1->data[0];
	revbuf[3] = (uint8_t)dat1->data[1];

	Vactive = (revbuf[0] << 8)|revbuf[1];
	Hactive = (revbuf[2] << 8)|revbuf[3];

	if(old_Hactive != Hactive || old_Vactive != Vactive){
		old_Hactive = Hactive;
		old_Vactive = Vactive;
		ret = 1;
	}

	printf("CSI res: %d * %d\n", Hactive, Vactive);
	// setenv("KVM_CSI_HEIGHT", to_string(Hactive).c_str(), 1);
	// setenv("KVM_CSI_WIDTH",  to_string(Vactive).c_str(), 1);

	sprintf(Cmd, "echo %d > /kvmapp/kvm/width", Hactive);
	system(Cmd);
	sprintf(Cmd, "echo %d > /kvmapp/kvm/height", Vactive);
	system(Cmd);

	delete dat0;
	delete dat1;

	return ret;
}