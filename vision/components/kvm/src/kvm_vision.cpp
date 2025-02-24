/**
 * 待解决的问题:
 * // 分辨率跟随输出
 * // 自动切换分辨率
 * // HDMI分辨率问题
 * // H264输入空图,VENC容易炸问题
 * // MJPEG/H264切换时卡退
 * // 再加一条手动清空全部内存
 * // deinit时free全部内存
 * // free 错内存时会炸的问题
 */
#include "kvm_vision.h"

#define default_venc_chn        1

#define VENC_MJPEG              0
#define VENC_H264               1

#define KVMV_MAX_TRY_NUM	   	2
#define vi_min_width            32
#define vi_min_height           3

#define default_vi_width        1920
#define default_vi_height       1080
#define default_vpss_width      1920
#define default_vpss_height     1080
#define default_venc_type       VENC_MJPEG
#define default_mjpeg_qlty      60
#define default_h264_qlty       1000
#define default_h264_gop        30

#define kvmv_data_buffer_size   4

#define vi_width_path           "/kvmapp/kvm/width"
#define vi_height_path          "/kvmapp/kvm/height"
#define hdmi_mode_path          "/etc/kvm/hdmi_mode"
#define hdmi_state_path         "/proc/lt_int"

#define LT6911_ADDR 	0x2B
#define LT6911_READ 	0xFF
#define LT6911_WRITE 	0x00

static char NanoKVM_edit[] = {
	0x00,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0x00,0x41,0x0C,0x33,0xC2,0x66,0xBA,0x00,0x00,
	0x2B,0x1F,0x01,0x04,0xA5,0x50,0x22,0x78,0x3B,0xCC,0xE5,0xAB,0x51,0x48,0xA6,0x26,
	0x0C,0x50,0x54,0xBF,0xEF,0x00,0xD1,0xC0,0xB3,0x00,0x95,0x00,0x81,0x80,0x81,0x40,
	0x81,0xC0,0x01,0x01,0x01,0x01,0xD8,0x59,0x00,0x60,0xA3,0x38,0x28,0x40,0xA0,0x10,
	0x3A,0x10,0x20,0x4F,0x31,0x00,0x00,0x1A,0x00,0x00,0x00,0xFF,0x00,0x55,0x4B,0x30,
	0x32,0x31,0x34,0x33,0x30,0x34,0x37,0x37,0x31,0x38,0x00,0x00,0x00,0xFC,0x00,0x50,
	0x48,0x4C,0x20,0x33,0x34,0x32,0x45,0x32,0x0A,0x20,0x20,0x20,0x00,0x00,0x00,0xFD,
	0x00,0x30,0x4B,0x63,0x63,0x1E,0x01,0x0A,0x20,0x20,0x20,0x20,0x20,0x20,0x01,0x8E
};

using namespace maix;
using namespace maix::sys;
using namespace maix::peripheral;
i2c::I2C LT6911_i2c(4, i2c::Mode::MASTER);

typedef struct {
	uint16_t vi_width = default_vi_width;
	uint16_t vi_height = default_vi_height;
	uint16_t vpss_width = default_vpss_width;
	uint16_t vpss_height = default_vpss_height;
	uint8_t venc_type;
	uint16_t qlty;
	uint8_t cam_state = 0;
	uint8_t stream_stop;
	uint8_t frame_detact;
	uint8_t display;
    uint8_t reinit_flag = 1;
    uint8_t reopen_cam_flag = 0;
    uint8_t hdmi_cable_state = 0;
    uint8_t try_exit_thread = 0;
    uint8_t thread_is_running = 0;
    uint8_t Auto_res = 0;
    uint8_t hdmi_version = 0;
    uint8_t hw_version = 0;
    uint8_t hdmi_stop_flag = 0;
    uint8_t hdmi_reading_flag = 0;
    uint8_t hdmi_mode = 0;
    uint8_t vi_detect_state = 0;
} kvmv_cfg_t;

typedef struct {
	uint8_t* p_img_data = NULL;
    uint8_t img_data_type = 0;
    uint32_t img_data_size = 0;
} kvmv_data_t;

typedef struct {
    uint8_t mmf_venc_chn;
	uint8_t enc_h264_running;
	uint8_t enc_h264_init;
    mmf_venc_cfg_t kvm_venc_cfg;
} kvm_venc_t;

camera::Camera *cam = new camera::Camera(default_vpss_width, default_vpss_height, image::FMT_YVU420SP);
// camera::Camera *cam = new camera::Camera(320, 240, image::FMT_RGB888);

kvmv_cfg_t kvmv_cfg;

kvmv_data_t kvmv_data_buffer[kvmv_data_buffer_size];
kvmv_data_t kvmv_SPS_buffer = {0};
kvmv_data_t kvmv_PPS_buffer = {0};

uint8_t kvmv_data_buffer_index = 0;

uint8_t debug_en = 0;
void debug(const char *format, ...)
{
    if(debug_en){
        printf(format);
    }
}

uint8_t to_roll(int8_t _input)
{
    if(_input <                      0) return _input + kvmv_data_buffer_size;
    if(_input >= kvmv_data_buffer_size) return _input - kvmv_data_buffer_size;
    return _input;
}

int maxmin_data(int _max, int _min, int _data)
{
	if(_data > _max) return _max;
	if(_data < _min) return _min;
	return _data;
}

kvmv_data_t* get_save_buffer()
{
    kvmv_data_buffer_index = to_roll(kvmv_data_buffer_index + 1);
    // debug("[kvmv]kvmv_data_buffer_index = %d\n", kvmv_data_buffer_index);
    // debug("[kvmv]kvmv_data_buffer.p_img_data = %d\n", kvmv_data_buffer[kvmv_data_buffer_index].p_img_data);
    if(kvmv_data_buffer[kvmv_data_buffer_index].p_img_data == NULL){
        return &kvmv_data_buffer[kvmv_data_buffer_index];
    }
    return NULL;
}

// ====HDMI RES==================================================

uint16_t hdmi_res_list[][2] = {
    {1920, 1080},
    {1600, 900},
    {1440, 1080},
    {1440, 900},
    {1280, 1024},
    {1280, 960},
    {1280, 800},
    {1280, 720},
    {1152, 864},
    {1024, 768},
    {800, 600},
};

/* return 0 : VI not init;
 * return 1 : HDMI and CSI status are normal;
 * return 2 : HDMI abnormal;
 * return 3 : CSI abnormal: width too small;
 * return 4 : CSI abnormal: width too large;
 * return 5 : CSI abnormal: height too small;
 * return 6 : CSI abnormal: height too large;
 * return 7 : CSI abnormal: Unknown reason;
 */
uint8_t get_vi_state()
{
	char VI_State[10]={0};
	char cmd[100] = "cat /proc/cvitek/vi_dbg | grep -A 17 VIDevFPS | awk '{print $3}'";
	uint8_t FPS[2];
	uint8_t VIWHGTLSCnt[4];
	FILE* fp = popen( cmd, "r" );
    uint8_t ret = 0;
	
	if (fgets(VI_State, sizeof(VI_State), fp) != NULL){
		FPS[0] = atoi(VI_State);
		// debug("VIDevFPS = %d\n", FPS[0]);
	} else {
		pclose(fp);
		return ret;	// VI not init;
	}
	if (fgets(VI_State, sizeof(VI_State), fp) != NULL){
		FPS[1] = atoi(VI_State);
		// debug("VIFPS = %d\n", FPS[1]);
	}
	if (FPS[0] == 0){
		ret = 2;	// HDMI not OK;
	} else if (FPS[1] == 0){
		ret = 3;	// HDMI OK ; CSI not;
	} else {
		ret = 1;	// HDMI CSI OK;
	}
    if(ret == 3){
        // Ignore other information
        uint8_t count = 0;
        for(count = 0; count < 13; count ++){
            fgets(VI_State, sizeof(VI_State), fp);
        }
        // Check if the resolution might be set incorrectly
        for(count = 0; count < 4; count ++){
            if (fgets(VI_State, sizeof(VI_State), fp) != NULL){
                // debug("VI_State = %s", VI_State);
                VIWHGTLSCnt[count] = atoi(VI_State);
                // printf("count = %d, val = %d\n", count, atoi(VI_State));
            }
        }

        if(VIWHGTLSCnt[0] != 0) ret = 3;      // The vi width setting value is too small
        else if(VIWHGTLSCnt[1] != 0) ret = 4; // The vi width setting value is too large
        else if(VIWHGTLSCnt[2] != 0) ret = 5; // The vi height setting value is too small
        else if(VIWHGTLSCnt[3] != 0) ret = 6; // The vi height setting value is too large
        else ret = 7; // printf("[kvmv] Unexpected situation\n");
    }
	pclose(fp);
    return ret;
}

int get_hdmi_mode(void)
{
    if(access(hdmi_mode_path, F_OK) == 0){
        // exist
        FILE *fp;
        int file_size;
        uint8_t tmp8;
        uint8_t RW_Data[2];

        fp = fopen(hdmi_mode_path, "r");
        fread(RW_Data, sizeof(char), 1, fp);
        fclose(fp);
        RW_Data[2] = 0;
        tmp8 = atoi((char*)RW_Data);
        if(tmp8 > 2) {
            tmp8 = 0;
	        char Cmd[100]={0};
            sprintf(Cmd, "echo 0 > %s", hdmi_mode_path);
            system(Cmd);
        }
        if(tmp8 != kvmv_cfg.hdmi_mode){
            kvmv_cfg.hdmi_mode = tmp8;
            debug("[kvmv] hdmi mode = %d\n", kvmv_cfg.hdmi_mode);
            return 1;
        } else {
            return 0;
        }
    }
    kvmv_cfg.hdmi_mode = 0;
    return 0;
}

int get_manual_resolution(void)
{
    uint8_t RW_Data[35];
    FILE *fp;
    int file_size;
    uint16_t tmp_width, tmp_height;
    int res = 0;

    // get res
    if(access("/kvmapp/kvm/width", F_OK) == 0){
        fp = fopen("/kvmapp/kvm/width", "r");
        fseek(fp, 0, SEEK_END);
        file_size = ftell(fp); 
        fseek(fp, 0, SEEK_SET);
        fread(RW_Data, sizeof(char), file_size, fp);
        fclose(fp);
        RW_Data[file_size] = 0;
        tmp_width = atoi((char*)RW_Data);
    } else {
        tmp_width = 1920;
    }
    if(access("/kvmapp/kvm/height", F_OK) == 0){
        fp = fopen("/kvmapp/kvm/height", "r");
        fseek(fp, 0, SEEK_END);
        file_size = ftell(fp); 
        fseek(fp, 0, SEEK_SET);
        fread(RW_Data, sizeof(char), file_size, fp);
        fclose(fp);
        RW_Data[file_size] = 0;
        tmp_height = atoi((char*)RW_Data);
    } else {
        tmp_height = 1080;
    }

    // res min limit
    if(tmp_width < vi_min_width){
        tmp_width = vi_min_width;
	    char Cmd[100]={0};
        sprintf(Cmd, "echo %d > %s", vi_min_width, vi_width_path);
	    system(Cmd);
    }
    if(tmp_height < vi_min_height){
        tmp_height = vi_min_height;
	    char Cmd[100]={0};
        sprintf(Cmd, "echo %d > %s", vi_min_height, vi_height_path);
	    system(Cmd);
    }

    // res change ?
    if(kvmv_cfg.vi_width != tmp_width){
        kvmv_cfg.vi_width = tmp_width;
        printf("[kvmk] get new width = %d\n", kvmv_cfg.vi_width);
        res = 1;
    }
    if(kvmv_cfg.vi_height != tmp_height){
        kvmv_cfg.vi_height = tmp_height;
        printf("[kvmk] get new height = %d\n", kvmv_cfg.vi_height);
        res = 1;
    }
    return res;
}

void lt6911_enable()
{
	uint8_t buf[2];
	buf[0] = 0xff;
	buf[1] = 0x80;
	LT6911_i2c.writeto(LT6911_ADDR, buf, 2);
	
	buf[0] = 0xee;
	buf[1] = 0x01;
	LT6911_i2c.writeto(LT6911_ADDR, buf, 2);

    if(kvmv_cfg.hdmi_version == 1){
        // disable watchdog
        buf[0] = 0x10;
        buf[1] = 0x00;
        LT6911_i2c.writeto(LT6911_ADDR, buf, 2);
    }
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

	debug("hdmi_errer_code = %x, %x, %x, %x, %x, %x\n", buf[0], buf[1], buf[2], buf[3], buf[4], buf[5]);
}

uint8_t lt6911_get_hdmi_res()
{
	uint8_t buf[2];
	uint8_t revbuf[4];
	uint16_t Vactive;
	uint16_t Hactive;


    if(kvmv_cfg.hdmi_version == 0){
        // LT6911C
        buf[0] = 0xff;
        buf[1] = 0xd2;
        LT6911_i2c.writeto(LT6911_ADDR, buf, 2);

        buf[0] = 0x83;
        buf[1] = 0x11;
        LT6911_i2c.writeto(LT6911_ADDR, buf, 2);

        time::sleep_ms(5);

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

        debug("[hdmi]HDMI res modification event\n");
        debug("[hdmi]new res: %d * %d\n", Hactive, Vactive);

        delete dat0;
        delete dat1;

        if (Vactive != 0 && Hactive != 0){
            return 1;
        } else {
            // system("echo 0 > %s", vi_height_path);
            // system("echo 0 > %s", vi_width_path);
            return 0;
        }
    } else if (kvmv_cfg.hdmi_version == 1){
        // LT6911UXC
        buf[0] = 0xff;
        buf[1] = 0x86;
        LT6911_i2c.writeto(LT6911_ADDR, buf, 2);

        buf[0] = 0xff;
        buf[1] = 0x86;
        LT6911_i2c.writeto(LT6911_ADDR, buf, 2);

        // HDMI signal disappear/stable
        buf[0] = 0xA3;
        LT6911_i2c.writeto(LT6911_ADDR, buf, 1);
        maix::Bytes *dat0 = LT6911_i2c.readfrom(LT6911_ADDR, 1);

        revbuf[0] = (uint8_t)dat0->data[0];
        delete dat0;

        debug("[hdmi]HDMI-UXC res modification event\n");

        if(revbuf[0] == 0x55)       return 1;
        else if(revbuf[0] == 0x88)  return 0;
        else return 0;
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

	debug("[hdmi]HDMI CLK = %d\n", clk);

	delete dat0;
}

uint8_t lt6911_get_csi_res(uint16_t *p_width, uint16_t *p_height)
{
	uint8_t ret = 0;
	uint8_t buf[2];
	uint8_t revbuf[4];
	static uint16_t old_Vactive;
	static uint16_t old_Hactive;
	uint16_t Vactive;
	uint16_t Hactive;
	char Cmd[100]={0};


    if(kvmv_cfg.hdmi_version == 0){
        // LT6911C	
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
        
        delete dat0;
        delete dat1;

        Vactive = (revbuf[0] << 8)|revbuf[1];
        Hactive = (revbuf[2] << 8)|revbuf[3];
    } else if(kvmv_cfg.hdmi_version == 1) {
        // LT6911UXC
        debug("[hdmi]UXC get csi res\n");
        buf[0] = 0xff;
        buf[1] = 0x85;
        LT6911_i2c.writeto(LT6911_ADDR, buf, 2);

        // Vactive
        buf[0] = 0xF0;
        LT6911_i2c.writeto(LT6911_ADDR, buf, 1);
        maix::Bytes *dat0 = LT6911_i2c.readfrom(LT6911_ADDR, 2);

        // Hactive
        buf[0] = 0xEA;
        LT6911_i2c.writeto(LT6911_ADDR, buf, 1);
        maix::Bytes *dat1 = LT6911_i2c.readfrom(LT6911_ADDR, 2);

        revbuf[0] = (uint8_t)dat0->data[0];
        revbuf[1] = (uint8_t)dat0->data[1];
        revbuf[2] = (uint8_t)dat1->data[0];
        revbuf[3] = (uint8_t)dat1->data[1];

        delete dat0;
        delete dat1;

        Vactive = (revbuf[0] << 8)|revbuf[1];
        Hactive = (revbuf[2] << 8)|revbuf[3];
    } else {
        return ret;
    }

	if(old_Hactive != Hactive || old_Vactive != Vactive){
		old_Hactive = Hactive;
		old_Vactive = Vactive;
		// p_kvm_cfg->width = Hactive;
		// p_kvm_cfg->height = Vactive;
		*p_width = Hactive;
		*p_height = Vactive;
		ret = 1;
	}

	debug("[hdmi]CSI res: %d * %d; new res = %d\n", Hactive, Vactive, ret);
	// setenv("KVM_CSI_HEIGHT", to_string(Hactive).c_str(), 1);
	// setenv("KVM_CSI_WIDTH",  to_string(Vactive).c_str(), 1);

	sprintf(Cmd, "echo %d > %s", Hactive, vi_width_path);
	system(Cmd);
	sprintf(Cmd, "echo %d > %s", Vactive, vi_height_path);
	system(Cmd);
	system("sync");


	return ret;
}

void lt6911_write_reg(uint8_t reg, uint8_t val)
{
	uint8_t buf[2];
	buf[0] = reg;
	buf[1] = val;
	LT6911_i2c.writeto(LT6911_ADDR, buf, 2);
}

void lt6911_read_reg(uint8_t reg)
{
	uint8_t buf[16];
	buf[0] = reg;
	LT6911_i2c.writeto(LT6911_ADDR, buf, 1);

	maix::Bytes *dat = LT6911_i2c.readfrom(LT6911_ADDR, 16);	

	for(int i = 0; i < 16; i++){
		buf[i] = (uint8_t)dat->data[i];
	}

	delete dat;

	debug("[hdmi]%3x %3x %3x %3x %3x %3x %3x %3x |%3x %3x %3x %3x %3x %3x %3x %3x \n", \
			buf[0], buf[1], buf[2], buf[3], buf[4], buf[5], buf[6], buf[7], \
			buf[8], buf[9], buf[10], buf[11], buf[12], buf[13], buf[14], buf[15]);
}

uint8_t lt6911_read_one_reg(uint8_t reg)
{
	uint8_t ret;
	ret = reg;
	LT6911_i2c.writeto(LT6911_ADDR, &ret, 1);

	maix::Bytes *dat = LT6911_i2c.readfrom(LT6911_ADDR, 1);	

	ret = (uint8_t)dat->data[0];

	delete dat;
	return ret;
}

void lt6911_write_edid(void)
{
	uint8_t i, j;
	uint8_t buf[2];
	lt6911_enable();

	// to 90
	lt6911_write_reg(0xff, 0x90);
	buf[0] = lt6911_read_one_reg(0x02);
	buf[0] &= 0xDF;
	lt6911_write_reg(0x02, buf[0]);
	buf[0] |= 0x20;
	lt6911_write_reg(0x02, buf[0]);

	// to 80
	lt6911_write_reg(0xff, 0x80);
	// wren enable
	lt6911_write_reg(0x5A, 0x86);
	lt6911_write_reg(0x5A, 0x82);

	for(i = 0; i < 16; i++){
		// 写wren命令(为一个pulse，此时不需要考虑wrrd_mode，spi_paddr[1:0]的值)
		lt6911_write_reg(0x5A, 0x86);
		lt6911_write_reg(0x5A, 0x82);

		// 配置spi_len[3:0]= 15，可配置，spi内部加1，即配置一次写入16个字节
		lt6911_write_reg(0x5E, 0xEF);
		lt6911_write_reg(0x5A, 0xA2);
		lt6911_write_reg(0x5A, 0x82);
		
		lt6911_write_reg(0x58, 0x01);

		if(i < 8) {
			for(j = 0; j < 16; j++){
				lt6911_write_reg(0x59, NanoKVM_edit[i*16+j]);
			}
		} else {
			for(j = 0; j < 16; j++){
				lt6911_write_reg(0x59, 0x00);
			}
		}

		// 把fifo数据写到flash(当wrrd_mode = 1，spi_paddr= 2’b10,addr[23:0](地址在写入过程中需要保持不变)准备好的情况下，给一个spi_sta的pulse，就开始写入flash)
		lt6911_write_reg(0x5B, 0x00);
		lt6911_write_reg(0x5C, 0x21);
		lt6911_write_reg(0x5D, i*16);
		lt6911_write_reg(0x5E, 0xE0);
		lt6911_write_reg(0x5A, 0x92);
		lt6911_write_reg(0x5A, 0x82);

	}

	lt6911_write_reg(0x5A, 0x8A);
	lt6911_write_reg(0x5A, 0x82);

	lt6911_disable();
	debug("[hdmi]lt6911_write_edid OK\n");
}

void lt6911_read_edid(void)
{
	uint8_t i, j;
	lt6911_enable();

	// to 80
	lt6911_write_reg(0xff, 0x80);
	lt6911_write_reg(0xEE, 0x01);

	// configure parameter
	lt6911_write_reg(0x5A, 0x80);
	lt6911_write_reg(0x5E, 0xC0);
	lt6911_write_reg(0x58, 0x00);
	lt6911_write_reg(0x59, 0x51);
	lt6911_write_reg(0x5A, 0x90);
	time::sleep_ms(1);
	lt6911_write_reg(0x5A, 0x80);

	for(i = 0; i < 16; i++){
		// to 90
		lt6911_write_reg(0xff, 0x90);
		// fifo rst_n
		lt6911_write_reg(0x02, 0xdf);
		time::sleep_ms(1);
		lt6911_write_reg(0x02, 0xff);

		// wren
		// to 80
		lt6911_write_reg(0xff, 0x80);
		// fifo rst_n
		lt6911_write_reg(0x5A, 0x84);
		time::sleep_ms(1);
		lt6911_write_reg(0x5A, 0x80);

		// flash to fifo
		lt6911_write_reg(0x5E, 0x6F);
		lt6911_write_reg(0x5A, 0xA0);
		time::sleep_ms(1);
		lt6911_write_reg(0x5A, 0x80);
		lt6911_write_reg(0x5B, 0x00);
		lt6911_write_reg(0x5C, 0x21);
		lt6911_write_reg(0x5D, 16*i);
		lt6911_write_reg(0x5A, 0x90);
		time::sleep_ms(5);
		lt6911_write_reg(0x5A, 0x80);
		lt6911_write_reg(0x58, 0x01);

		// for(j = 0; j < 16; j++){
		debug("[hdmi] EDID: ");
		lt6911_read_reg(0x5F);
		// }
		time::sleep_ms(10);
	}

	// wrdi
	lt6911_write_reg(0x5A, 0x88);
	time::sleep_ms(1);
	lt6911_write_reg(0x5A, 0x80);

	lt6911_disable();
	debug("[hdmi]lt6911_read_edid OK\n");
}

void lt6911_read_fw(void)
{
	uint32_t i, j;
	uint8_t buf[3];
	lt6911_enable();

	// to 80
	lt6911_write_reg(0xff, 0x80);
	lt6911_write_reg(0xEE, 0x01);

	// configure parameter
	lt6911_write_reg(0x5A, 0x80);
	lt6911_write_reg(0x5E, 0xC0);
	lt6911_write_reg(0x58, 0x00);
	lt6911_write_reg(0x59, 0x51);
	lt6911_write_reg(0x5A, 0x90);
	time::sleep_ms(1);
	lt6911_write_reg(0x5A, 0x80);

	for(i = 0x1; i < 50000; i++){
		buf[0] = ((i*16) & 0xFF0000) >> 16;
		buf[1] = ((i*16) & 0xFF00) >> 8;
		buf[2] = ((i*16) & 0xFF);
		// to 90
		lt6911_write_reg(0xff, 0x90);
		// fifo rst_n
		lt6911_write_reg(0x02, 0xdf);
		time::sleep_ms(1);
		lt6911_write_reg(0x02, 0xff);

		// wren
		// to 80
		lt6911_write_reg(0xff, 0x80);
		// fifo rst_n
		lt6911_write_reg(0x5A, 0x84);
		time::sleep_ms(1);
		lt6911_write_reg(0x5A, 0x80);

		// flash to fifo
		lt6911_write_reg(0x5E, 0x6F);
		lt6911_write_reg(0x5A, 0xA0);
		time::sleep_ms(1);
		lt6911_write_reg(0x5A, 0x80);
		lt6911_write_reg(0x5B, buf[0]);
		lt6911_write_reg(0x5C, buf[1]);
		lt6911_write_reg(0x5D, buf[2]);
		lt6911_write_reg(0x5A, 0x90);
		time::sleep_ms(5);
		lt6911_write_reg(0x5A, 0x80);
		lt6911_write_reg(0x58, 0x01);

		// for(j = 0; j < 16; j++){
		debug("[hdmi]REG %6x: ", i*16);
		lt6911_read_reg(0x5F);
		// }
		time::sleep_ms(10);
	}

	// wrdi
	lt6911_write_reg(0x5A, 0x88);
	time::sleep_ms(1);
	lt6911_write_reg(0x5A, 0x80);

	lt6911_disable();
	debug("[hdmi]lt6911_read_edid OK\n");
}

// ==============================================================

void* vi_subsystem_detection(void * arg)
{
	uint64_t __attribute__((unused)) int_time;

	FILE *fp;
	uint8_t RW_Data[2];
    uint8_t file_size;
    uint8_t tmp8;
    uint8_t rising_times = 0;
    uint8_t falling_times = 0;
	uint8_t cam_need_restart = 0;
    kvmv_cfg.thread_is_running = 1;
	if(access("/proc/lt_int", F_OK) != 0){
		time::sleep_ms(10);
		debug("[hdmi]/proc/lt_int not ok\n");
	}

	if(access("/etc/kvm/hdmi_version", F_OK) == 0){
        fp = fopen("/etc/kvm/hdmi_version", "r");
        fread(RW_Data, sizeof(char), 1, fp);
        fclose(fp);
        if(RW_Data[0] == 'u'){
            // 6911uxc
            kvmv_cfg.hdmi_version = 1;
            debug("[hdmi]HDMI-UXC exist!\n");
        } else {
            // 6911c
            kvmv_cfg.hdmi_version = 0;
            debug("[hdmi]HDMI-C exist!\n");
        }
        RW_Data[0] = 0;
    } else {
        kvmv_cfg.hdmi_version = 0;
    }

    // while(!app::need_exit())
    uint8_t while_count_get_hdmi_mode = 0;
    uint8_t while_count_detect_res = 0;
    uint8_t auto_trying_times = 0;
    while(true)
    {
        uint8_t get_new_hdmi_mode = 0;
        if(kvmv_cfg.try_exit_thread == 1)
            break;
        
        // Low-frequency detection mode change
        if (while_count_get_hdmi_mode >= 100){
            while_count_get_hdmi_mode = 0;
            get_new_hdmi_mode = get_hdmi_mode();
        } else {
            while_count_get_hdmi_mode ++;
        }

        switch (kvmv_cfg.hdmi_mode){
        case 0:
            // Switching to Mode 0 requires restarting HDMI (effective only for PCIe version)
            // Handling of automatic detection situations
            if(get_new_hdmi_mode == 1){
                kvmv_cfg.vi_detect_state = 0;
                // reset hdmi_state
                char Cmd[100]={0};
                sprintf(Cmd, "echo 0 > %s", hdmi_state_path);
                system(Cmd);
                // reset hdmi
                kvmv_hdmi_control(0);
                time::sleep_ms(10);
                kvmv_hdmi_control(1);
            }
            // Initialize VI with I2C information after HDMI insertion
            fp = fopen(hdmi_state_path, "r+");
            if(fp != NULL){
                // fseek(fp, 0, SEEK_END);
                // file_size = ftell(fp); 
                // fseek(fp, 0, SEEK_SET);
                fread(RW_Data, sizeof(char), 2, fp);
                tmp8 = atoi((char*)RW_Data);
                // debug("[hdmi]UXC tmp8 = %d\n", tmp8);
                if(tmp8 != 0){
                    // reset hdmi_state
                    fputs("0", fp);
                    // count edge ints
                    rising_times = tmp8%10;   // RISING times
                    falling_times = tmp8/10;   // FALLING times

                    if(kvmv_cfg.hdmi_stop_flag != 1){
                        kvmv_cfg.hdmi_reading_flag = 1;
                        if(kvmv_cfg.hdmi_version == 0){
                            // LT6911C
                            if(rising_times != 0){
                                lt6911_enable();
                                if(lt6911_get_hdmi_res()){
                                    // hdmi get res
                                    debug("[hdmi] C HDMI cable insertion!\n");
                                    kvmv_cfg.hdmi_cable_state = 1;
                                    kvmv_cfg.reopen_cam_flag = lt6911_get_csi_res(&kvmv_cfg.vi_width, &kvmv_cfg.vi_height);
                                } else {
                                    // HDMI res = 0*0/x*0
                                    debug("[hdmi] C HDMI cable unplugged!\n");
                                    kvmv_cfg.hdmi_cable_state = 0;
                                }
                                lt6911_disable();
                            }
                        } else if (kvmv_cfg.hdmi_version == 1){
                            // LT6911UXC
                                debug("[hdmi] UXC int\n");
                            if(falling_times != 0){
                                debug("[hdmi] UXC int && \n");
                                lt6911_enable();
                                if(lt6911_get_hdmi_res()){
                                    // hdmi get res
                                    debug("[hdmi] UXC HDMI cable insertion!\n");
                                    kvmv_cfg.hdmi_cable_state = 1;
                                    kvmv_cfg.reopen_cam_flag = lt6911_get_csi_res(&kvmv_cfg.vi_width, &kvmv_cfg.vi_height);
                                } else {
                                    // HDMI res = 0*0/x*0
                                    debug("[hdmi] UXC HDMI cable unplugged!\n");
                                    kvmv_cfg.hdmi_cable_state = 0;
                                }
                                lt6911_disable();
                            }
                        }
                        kvmv_cfg.hdmi_reading_flag = 0;
                    }
                }
                fclose(fp);
            }
            break;
        /* Mode 1 & 2 will disable API access to the image during detection, 
           and will output -4: Modifying image resolution, please wait.*/
        case 1: // Automatically trying common resolutions
            /* kvmv_cfg.vi_detect_state : 
             * 0: HDMI standard mode, detection program does not interfere with the camera
             * 1: Preparing / Testing in progress
             * 2: Test completed: Suitable resolution found,
             */
            if(get_new_hdmi_mode == 1){
                kvmv_cfg.vi_detect_state = 1;
                auto_trying_times = 0;
            }
            if(kvmv_cfg.vi_detect_state == 1){
                uint8_t err_code = get_vi_state();
                debug("[kvmv] get_vi_state() = %d\n", err_code);
                switch(err_code){
                case 0:
                    // shouldn't be possible to run here
                    printf("[kvmv] VI not init\n");
                    break;
                case 1:
                    printf("[kvmv] VI subsystem is normal\n");
                    kvmv_cfg.vi_detect_state = 2;
                    break;
                case 2:
                    // HDMI not detected or resolution not supported; interval checks will continue
                    printf("[kvmv] Cannot obtain HDMI input\n");
                    break;
                case 3: // width too small
                case 4: // width too large
                case 5: // height too small
                case 6: // height too large
                    // CSI abnormal due to resolution error
                    // The test list is short; sequential testing can be performed
                    if(auto_trying_times < sizeof(hdmi_res_list)/4){
                        char Cmd[100]={0};
                        printf("[kvmv] Trying %d * %d res ..\n", hdmi_res_list[auto_trying_times][0], hdmi_res_list[auto_trying_times][1]);
                        sprintf(Cmd, "echo %d > %s", hdmi_res_list[auto_trying_times][0], vi_width_path);
                        system(Cmd);
                        sprintf(Cmd, "echo %d > %s", hdmi_res_list[auto_trying_times][1], vi_height_path);
                        system(Cmd);
                        printf("[kvmv] restart cam...\n");
                        cam->restart(default_vpss_width, default_vpss_height, image::FMT_YVU420SP);
                        auto_trying_times++;
                        time::sleep_ms(10);
                    } else {
                        printf("[kvmv] Suitable resolution not found, switching to manual input mode automatically\n");
                        kvmv_cfg.vi_detect_state = 1;
                        char Cmd[100]={0};
                        sprintf(Cmd, "echo 2 > %s", hdmi_mode_path);
                        system(Cmd);
                        while_count_get_hdmi_mode = 100;    // Take effect immediately
                    }
                    break;
                case 7: // Unknown reason
                    printf("[kvmv] CSI abnormal: Unknown reason\n");
                    break;
                }
            } else if (kvmv_cfg.vi_detect_state == 2){
                // Low-frequency detection of HDMI status, no log output
                uint8_t err_code = get_vi_state();
                if (err_code != 1) {
                    kvmv_cfg.vi_detect_state = 1;
                    auto_trying_times = 0;
                }
                time::sleep_ms(1000); 
            } else {
                kvmv_cfg.vi_detect_state = 1;
            }
            break;
        case 2:
            // Manually initialize VI.
            if (while_count_detect_res >= 100){
                while_count_detect_res = 0;
                if (kvmv_cfg.vi_detect_state == 1){
                    // detect_res
                    if (get_manual_resolution()) {
                        printf("[kvmv] restart cam...\n");
                        cam->restart(default_vpss_width, default_vpss_height, image::FMT_YVU420SP);
                    }

                    // dbg info
                    uint8_t err_code = get_vi_state();
                    switch(err_code){
                    case 0:
                        debug("[kvmv] VI not init\n");
                        break;
                    case 1:
                        debug("[kvmv] HDMI and CSI status are normal\n");
                        kvmv_cfg.vi_detect_state = 2;
                        break;
                    case 2:
                        debug("[kvmv] HDMI abnormal\n");
                        break;
                    case 3:
                        debug("[kvmv] CSI abnormal: width too small\n");
                        break;
                    case 4:
                        debug("[kvmv] CSI abnormal: width too large\n");
                        break;
                    case 5:
                        debug("[kvmv] CSI abnormal: height too small\n");
                        break;
                    case 6:
                        debug("[kvmv] CSI abnormal: height too large\n");
                        break;
                    case 7:
                        debug("[kvmv] CSI abnormal: Unknown reason\n");
                        break;
                    }
                } else if (kvmv_cfg.vi_detect_state == 2){
                    // detection of HDMI status, no log output
                    uint8_t err_code = get_vi_state();
                    if (err_code != 1) kvmv_cfg.vi_detect_state = 1;
                } else {
                    kvmv_cfg.vi_detect_state = 1;
                }

            } else {
                while_count_detect_res ++;
            }
            break;
        
        default:
            debug("Non-existent hdmi state = %d\n", kvmv_cfg.hdmi_mode);
            break;
        }

		time::sleep_ms(10);
    }
    kvmv_cfg.thread_is_running = 0;
}

int sync_vi_res()
{
    int res = 0;
    uint8_t RW_Data[35];
    FILE *fp;
    int file_size;
    uint16_t tmp16;

    // vi_width:
    if (access(vi_width_path, F_OK) != 0){
        kvmv_cfg.vi_width = default_vi_width;
        kvmv_cfg.vi_height = default_vi_height;
        res = -1;
        return res;
    } else {
        fp = fopen(vi_width_path, "r");
        fseek(fp, 0, SEEK_END);
        file_size = ftell(fp); 
        fseek(fp, 0, SEEK_SET);
        fread(RW_Data, sizeof(char), file_size, fp);
        fclose(fp);
        RW_Data[file_size] = 0;
        tmp16 = atoi((char*)RW_Data);
        if(tmp16 != kvmv_cfg.vi_width){
            kvmv_cfg.vi_width = tmp16;
            debug("[hdmi] Get new HDMI width = %d\r\n", kvmv_cfg.vi_width);
            res = 1;
        }
    }
    // vi_height:
    if (access(vi_height_path, F_OK) != 0){
        kvmv_cfg.vi_height = default_vi_height;
        res = -1;
        return res;
    } else {
        fp = fopen(vi_height_path, "r");
        fseek(fp, 0, SEEK_END);
        file_size = ftell(fp); 
        fseek(fp, 0, SEEK_SET);
        fread(RW_Data, sizeof(char), file_size, fp);
        fclose(fp);
        RW_Data[file_size] = 0;
        tmp16 = atoi((char*)RW_Data);
        if(tmp16 != kvmv_cfg.vi_height){
            kvmv_cfg.vi_height = tmp16;
            debug("[hdmi] Get new HDMI height = %d\r\n", kvmv_cfg.vi_height);
            res = 1;
        }
    }
    return res;
}

void jpg_dump(kvmv_data_t* dump_to, image::Image *raw)
{
    dump_to->p_img_data = (uint8_t *)malloc(raw->data_size());
    dump_to->img_data_size = raw->data_size();
    dump_to->img_data_type = VENC_MJPEG;
    memcpy(dump_to->p_img_data, (uint8_t *)raw->data(), raw->data_size());
}

uint8_t kvmvenc_gop = default_h264_gop;
kvm_venc_t kvm_venc;
mmf_venc_cfg_t cfg;
void init_venc_h264(uint16_t _width, uint16_t _height, uint16_t _qlty)
{
    cfg.type = 2; //1, h265, 2, h264
    cfg.w = _width;
    cfg.h = _height;
    cfg.fmt = mmf_invert_format_to_mmf(image::Format::FMT_YVU420SP);
    cfg.jpg_quality = 0;       // unused
    cfg.gop = kvmvenc_gop;
    cfg.intput_fps = 60;
    cfg.output_fps = 60;
    cfg.bitrate = _qlty;  // 码率

    kvm_venc.mmf_venc_chn = default_venc_chn;
    kvm_venc.enc_h264_init = 0;
    kvm_venc.kvm_venc_cfg = cfg;

	// if(mmf_vdec_is_used(kvm_venc.mmf_venc_chn)){
		mmf_del_venc_channel(kvm_venc.mmf_venc_chn);
	// }
    if (0 != mmf_add_venc_channel(kvm_venc.mmf_venc_chn, &kvm_venc.kvm_venc_cfg)) {
        err::check_raise(err::ERR_RUNTIME, "mmf venc init failed!");
    }
    kvm_venc.enc_h264_init = 1;

	// init_kvm_h264_stream(&kvm_h264_stream, mmf_stream_buf);
	// init_h264_stream_struct(&kvm_h264_stream);
}

int h264_stream_dump(kvmv_data_t* dump_to, mmf_stream_t* dump_from)
{
    static int8_t I_Frame_index = -1;
    // debug("[kvmv]dump_from->count = %d\n", dump_from->count);
    if (dump_from->count == 3) {
        // debug("[kvmv]dump I-Frame\r\n");
        if(kvmv_SPS_buffer.p_img_data != NULL || kvmv_PPS_buffer.p_img_data != NULL)
            return IMG_BUFFER_FULL;

        kvmv_SPS_buffer.p_img_data  = (uint8_t *)malloc(dump_from->data_size[0]);
        kvmv_PPS_buffer.p_img_data  = (uint8_t *)malloc(dump_from->data_size[1]);
        dump_to->p_img_data         = (uint8_t *)malloc(dump_from->data_size[2]);

        kvmv_SPS_buffer.img_data_size   = dump_from->data_size[0];
        kvmv_PPS_buffer.img_data_size   = dump_from->data_size[1];
        dump_to->img_data_size          = dump_from->data_size[2];

        kvmv_SPS_buffer.img_data_type   = IMG_H264_TYPE_SPS;
        kvmv_PPS_buffer.img_data_type   = IMG_H264_TYPE_PPS;
        dump_to->img_data_type          = IMG_H264_TYPE_IF;

        memcpy(kvmv_SPS_buffer.p_img_data,  dump_from->data[0], dump_from->data_size[0]);
        memcpy(kvmv_PPS_buffer.p_img_data,  dump_from->data[1], dump_from->data_size[1]);
        memcpy(dump_to->p_img_data,         dump_from->data[2], dump_from->data_size[2]);

        debug("[kvmv]SPS size = %d\n", kvmv_SPS_buffer.img_data_size);
        debug("[kvmv]PPS size = %d\n", kvmv_PPS_buffer.img_data_size);
        debug("[kvmv]I-Frame size = %d\n", dump_to->img_data_size);

        return IMG_H264_TYPE_IF;

    } else if (dump_from->count == 1) {
        // debug("[kvmv]dump P-Frame\r\n");
        I_Frame_index = -1;
        dump_to->p_img_data = (uint8_t *)malloc(dump_from->data_size[0]);
        dump_to->img_data_size = dump_from->data_size[0];
        dump_to->img_data_type = IMG_H264_TYPE_PF;
        memcpy(dump_to->p_img_data, dump_from->data[0], dump_from->data_size[0]);
        return IMG_H264_TYPE_PF;
    } else {
        debug("[kvmv]venc error!\r\n");
        return IMG_VENC_ERROR;
    }
}

void set_h264_gop(uint8_t _gop)
{
    kvm_venc.enc_h264_init = 0; // call
    kvmvenc_gop = maxmin_data(100, 10, (int)_gop);
}

// uint8_t get_h264_gop(void)
// {
//     return kvm_venc.kvm_venc_cfg.gop;
// }

// uint8_t get_hdmi_width(void)
// {
//     return kvm_venc.kvm_venc_cfg.gop;
// }

int8_t raw_to_h264(image::Image *raw, kvmv_data_t* ret_stream, uint16_t _qlty)
{
	uint64_t __attribute__((unused)) start_time;
	uint64_t __attribute__((unused)) frame_time;
	int8_t ret = 0;
	static uint8_t P_Frame_Count = 0;
		// start_time = time::time_ms();
		// log::info("getimg: %d \r\n", (int)(time::time_ms()));
    mmf_stream_t _stream = {0};
    if(kvm_venc.enc_h264_init != 1 || raw->width() != kvm_venc.kvm_venc_cfg.w || raw->height() != kvm_venc.kvm_venc_cfg.h || _qlty != kvm_venc.kvm_venc_cfg.bitrate){
		debug("[kvmv]init_venc_h264	enc_h264_init = %d; raw->width() = %d | %d raw->height() = %d | %d \n", 
				kvm_venc.enc_h264_init, 
				raw->width(), kvm_venc.kvm_venc_cfg.w, 
				raw->height(), kvm_venc.kvm_venc_cfg.h);

		init_venc_h264(raw->width(), raw->height(), _qlty);		
        debug("[kvmv]init_venc_h264 finish enc_h264_init = %d; raw->width() = %d | %d raw->height() = %d | %d \n", 
				kvm_venc.enc_h264_init, 
				raw->width(), kvm_venc.kvm_venc_cfg.w, 
				raw->height(), kvm_venc.kvm_venc_cfg.h);
        // if(kvm_venc.enc_h264_init == 1){
		// 	init_venc_h264(raw->width(), raw->height(), _qlty);
		// } else {
		// 	init_venc_h264(default_vpss_width, default_vpss_height, default_h264_qlty);
		// }
    }
	// log::info("init(): %d \r\n", (int)(time::time_ms() - start_time));
    if (mmf_venc_push(kvm_venc.mmf_venc_chn, (uint8_t *)raw->data(), raw->width(), raw->height(), mmf_invert_format_to_mmf(raw->format()))) {
        mmf_del_venc_channel(kvm_venc.mmf_venc_chn);
        kvm_venc.enc_h264_init = 0;
        // rtmp->unlock();
		debug("[kvmv]mmf venc push failed!\n");
        // err::check_raise(err::ERR_RUNTIME, "mmf venc push failed!\r\n");
        return -1;
    }		
	// log::info("push(): %d \r\n", (int)(time::time_ms() - start_time));		
    if (mmf_venc_pop(kvm_venc.mmf_venc_chn, &_stream)) {
        // log::error("mmf_venc_pop failed\n");
        mmf_venc_free(kvm_venc.mmf_venc_chn);
        mmf_del_venc_channel(kvm_venc.mmf_venc_chn);
        kvm_venc.enc_h264_init = 0;
		debug("[kvmv]mmf venc push failed!\n");
        // rtmp->unlock();
        return -1;
    }
	// log::info("pop(): %d \r\n", (int)(time::time_ms() - start_time));	
    ret = h264_stream_dump(ret_stream, &_stream);
    mmf_venc_free(kvm_venc.mmf_venc_chn);
	// log::info("dump(): %d \r\n", (int)(time::time_ms() - start_time));	

	// debug("[kvmv]_stream.data[0][4] = %d;\n", _stream.data[0][4]);
	debug("[kvmv]Frame size = %d;\n", ret_stream->img_data_size);

    if(ret == IMG_H264_TYPE_IF){
		debug("[kvmv]================ GOP = %d ================\n", kvm_venc.kvm_venc_cfg.gop);
		debug("[kvmv]SPS; PPS; I-Frame, I-Frame size = %d\n", ret_stream->img_data_size);
		P_Frame_Count = 0;

    } else if(ret == IMG_H264_TYPE_PF){
		debug("[kvmv]P-Frame size = %d, P-count = %d\n", ret_stream->img_data_size, P_Frame_Count);
		P_Frame_Count++;
    }
    debug("[kvmv]dump ret = %d\n", ret);
    return ret;
}

void kvmv_init(uint8_t _debug_info_en)
{
    pthread_t thread;
    if(_debug_info_en == 0) debug_en = 0;
    else                    debug_en = 1;

    // debug("[kvmv]kvmv_init - 1\r\n");

    cam->hmirror(1);
    cam->vflip(1);
    cam->restart(default_vpss_width, default_vpss_height, image::FMT_YVU420SP);
    for(int i = 0; i < kvmv_data_buffer_size; i++){
        kvmv_data_buffer[i].p_img_data = NULL;
    }
    kvmv_SPS_buffer.p_img_data = NULL;
    kvmv_PPS_buffer.p_img_data = NULL;

    kvmv_cfg.try_exit_thread = 0;
    // debug("[kvmv]kvmv_init - 2\r\n");
    
    if(kvmv_cfg.thread_is_running == 1){
        debug("[kvmv]thread is running!\r\n");
    } else {
        if (0 != pthread_create(&thread, NULL, vi_subsystem_detection, NULL)) {
            debug("[kvmv]create thread failed!\r\n");
            // return -1;
        }
    }
    // debug("[kvmv]kvmv_init - 3\r\n");
}

uint8_t check_kvmv(uint8_t _try_num)
{
    if(kvmv_cfg.hdmi_cable_state == 0){
        debug("[kvmv]HDMI Cable not exist!\n");
        return 0;
    }
    if(_try_num >= KVMV_MAX_TRY_NUM){
        debug("[kvmv]try_num >= KVMV_MAX_TRY_NUM!\n");
        return 0;
    }
    // if(sync_vi_res() != 0){
    if(kvmv_cfg.reopen_cam_flag == 1){
        // vi size changed
        kvmv_cfg.reopen_cam_flag = 0;
        // cam->open(kvmv_cfg.vpss_width, kvmv_cfg.vpss_height, image::FMT_YVU420SP, 3);
        cam->restart(default_vpss_width, default_vpss_height, image::FMT_YVU420SP);
        debug("[kvmv]vi size changed, try again\n");
        return 1;
    }
    debug("[kvmv]just try again\n");
    return 1;
}


/**********************************************************************************
 * @name    kvmv_read_img
 * @author  Sipeed BuGu
 * @date    2024/10/25
 * @version R1.0
 * @brief   Acquire the encoded image with auto init
 * @param	_width				@input: 	Output image width
 * @param	_height				@input: 	Output image height
 * @param	_type				@input: 	Encode type
 * @param	_qlty				@input: 	MJPEG: (50-100) | H264:  (500-10000)
 * @param	_pp_kvm_data		@output: 	Encode data
 * @param	_p_kvmv_data_size	@output: 	Encode data size
 * @return
        -4: Modifying image resolution, please wait
        -3: img buffer full
        -2: VENC Errorl
        -1: No images were acquired
         0: Acquire MJPEG encoded images
         1: Acquire H264 encoded images(SPS)
         2: Acquire H264 encoded images(PPS)
         3: Acquire H264 encoded images(I)
         4: Acquire H264 encoded images(P)
 **********************************************************************************/
int kvmv_read_img(uint16_t _width, uint16_t _height, uint8_t _type, uint16_t _qlty, uint8_t** _pp_kvm_data, uint32_t* _p_kvmv_data_size)
{
	// uint64_t __attribute__((unused)) start_time = time::time_ms();
    if (kvmv_cfg.vi_detect_state == 1){
        return -4;
    }
    uint8_t try_num = 0;
    do {
        if(kvmv_cfg.vpss_width != _width || kvmv_cfg.vpss_height != _height){
            if(_width == 0 || _height == 0){
                // Follow the HDMI output
                kvmv_cfg.vpss_width = kvmv_cfg.vi_width;
                kvmv_cfg.vpss_height = kvmv_cfg.vi_height;

                if(kvmv_cfg.Auto_res == 0){
                    kvmv_cfg.Auto_res = 1;
                    cam->set_resolution(kvmv_cfg.vpss_width, kvmv_cfg.vpss_height);
                    kvmv_cfg.reinit_flag = 1;
                }

            } else {
                kvmv_cfg.Auto_res = 0;
                // Set the output
                kvmv_cfg.vpss_width = _width;
                kvmv_cfg.vpss_height = _height;
                
                cam->set_resolution(kvmv_cfg.vpss_width, kvmv_cfg.vpss_height);
                kvmv_cfg.reinit_flag = 1;
            }
        }

        //
        if (kvmv_cfg.reinit_flag == 1) { 
            cam->hmirror(1);
            cam->vflip(1);
			kvmv_cfg.reinit_flag = 0;
        }
        // debug("[kvmv]befor read img: %d \r\n", (int)(time::time_ms() - start_time));
        image::Image *img = cam->read();
        // debug("[kvmv]read img: %d \r\n", (int)(time::time_ms() - start_time));
        if(img != NULL){
			if(kvmv_cfg.cam_state == 0) {
				kvmv_cfg.cam_state = 1;
                kvmv_cfg.hdmi_cable_state = 1;
				system("echo 1 > /kvmapp/kvm/state");
			}
        } else {
			if(kvmv_cfg.cam_state == 1) {
				kvmv_cfg.cam_state = 0;
				system("echo 0 > /kvmapp/kvm/state");
			}
			delete img;
            debug("[kvmv]can`t get img...\n");
            continue;
        }
        // debug("[kvmv]cheak img null?: %d \r\n", (int)(time::time_ms() - start_time));

        // img exist
        // Encode
        if(_type == VENC_H264 && kvmv_cfg.venc_type != _type){
            kvm_venc.enc_h264_init = 1;
            // debug("[kvmv] change to h264\n");
        }
        kvmv_cfg.venc_type = _type;

        if(kvmv_cfg.venc_type == VENC_MJPEG){
            image::Image *jpg = img->to_jpeg(maxmin_data(99, 51, (int)_qlty));
            kvmv_data_t* p_kvmv_data = get_save_buffer();
            if(p_kvmv_data == NULL){
                // buffer full
                delete jpg;
			    delete img;
                debug("[kvmv]jpg buffer full\n");
                *_pp_kvm_data = NULL;
                return IMG_BUFFER_FULL;
            } 
            jpg_dump(p_kvmv_data, jpg);
            delete jpg;
			delete img;
            *_pp_kvm_data = p_kvmv_data->p_img_data;
            *_p_kvmv_data_size = p_kvmv_data->img_data_size;
            return IMG_MJPEG_TYPE;
        } else if (kvmv_cfg.venc_type == VENC_H264){
            int ret;
            kvmv_data_t* p_kvmv_data = get_save_buffer();
            if(p_kvmv_data == NULL){
                // buffer full
			    delete img;
                *_pp_kvm_data = NULL;
                return IMG_BUFFER_FULL;
            } 
            // debug("[kvmv]get_save_buffer: %d \r\n", (int)(time::time_ms() - start_time));
            ret = raw_to_h264(img, p_kvmv_data, maxmin_data(10000, 500, (int)_qlty));
            // debug("[kvmv]venc raw_to_h264: %d \r\n", (int)(time::time_ms() - start_time));
			delete img;
            *_pp_kvm_data = p_kvmv_data->p_img_data;
            *_p_kvmv_data_size = p_kvmv_data->img_data_size;
            return ret;
        }
    } while (check_kvmv(try_num++));
    // debug("[kvmv]return: %d \r\n", (int)(time::time_ms() - start_time));
    *_pp_kvm_data = NULL;
    return IMG_NOT_EXIST;
}

int kvmv_get_sps_frame(uint8_t** _pp_kvm_data, uint32_t* _p_kvmv_data_size)
{
    if(kvmv_SPS_buffer.p_img_data == NULL){ 
        return IMG_NOT_EXIST;
    } else {
        *_pp_kvm_data = kvmv_SPS_buffer.p_img_data;
        *_p_kvmv_data_size = kvmv_SPS_buffer.img_data_size;
        return IMG_H264_TYPE_SPS;
    }
    return IMG_NOT_EXIST;
}

int kvmv_get_pps_frame(uint8_t** _pp_kvm_data, uint32_t* _p_kvmv_data_size)
{
    if(kvmv_PPS_buffer.p_img_data == NULL){
        return IMG_NOT_EXIST;
    } else {
        *_pp_kvm_data = kvmv_PPS_buffer.p_img_data;
        *_p_kvmv_data_size = kvmv_PPS_buffer.img_data_size;
        return IMG_H264_TYPE_PPS;
    }
    return IMG_NOT_EXIST;
}

int free_kvmv_data(uint8_t ** _pp_kvm_data)
{
        // debug("[kvmv]free_kvmv_data - 1\r\n");
    for(int i = 0; i < kvmv_data_buffer_size; i++){
        if(*_pp_kvm_data == kvmv_data_buffer[i].p_img_data){
            // debug("[kvmv]free buffer : %d\n", *_pp_kvm_data);
            if (*_pp_kvm_data != NULL){
        // debug("[kvmv]free_kvmv_data - 2\r\n");
                free(*_pp_kvm_data);
        // debug("[kvmv]free_kvmv_data - 3\r\n");
                kvmv_data_buffer[i].p_img_data = NULL;
                uint8_t _type = kvmv_data_buffer[i].img_data_type;
                if(_type == IMG_H264_TYPE_IF){
                    free(kvmv_SPS_buffer.p_img_data);
                    free(kvmv_PPS_buffer.p_img_data);
                    kvmv_SPS_buffer.p_img_data = NULL;
                    kvmv_PPS_buffer.p_img_data = NULL;
                }
                return _type;
            } else {
                return IMG_NOT_EXIST;
            }
        }
    }
    return IMG_NOT_EXIST;
}

void free_all_kvmv_data()
{
    for(int i = 0; i <= kvmv_data_buffer_size; i++){
        if(kvmv_data_buffer[i].p_img_data != NULL){
            free(kvmv_data_buffer[i].p_img_data);
            kvmv_data_buffer[i].p_img_data = NULL;
        }
    }
    if(kvmv_SPS_buffer.p_img_data != NULL) free(kvmv_SPS_buffer.p_img_data);
    if(kvmv_PPS_buffer.p_img_data != NULL) free(kvmv_PPS_buffer.p_img_data);
    kvmv_SPS_buffer.p_img_data = NULL;
    kvmv_PPS_buffer.p_img_data = NULL;
}

void kvmv_deinit()
{
    kvmv_cfg.try_exit_thread = 1;
    cam->close();
    mmf_deinit();
    free_all_kvmv_data();
}

uint8_t kvmv_hdmi_control(uint8_t _en)
{
    if(kvmv_cfg.hw_version == 0){

        FILE *fp;
	    uint8_t RW_Data[2];
        if(access("/etc/kvm/hw", F_OK) == 0){
            fp = fopen("/etc/kvm/hw", "r");
            fread(RW_Data, sizeof(char), 1, fp);
            fclose(fp);
            switch(RW_Data[0]){
                case 'a':
                case 'b':
                case 'p':
                    kvmv_cfg.hw_version = RW_Data[0];
                    break;
                default :
                    kvmv_cfg.hw_version = 'a';
            }
        }
    }
    if(kvmv_cfg.hw_version != 'p'){
        debug("[kvmv]Hardware not support!\n");
        return -1;
    }
    if(access("/sys/class/gpio/gpio451/value", F_OK) != 0){
        system("echo 451 > /sys/class/gpio/export");
        system("echo out > /sys/class/gpio/gpio451/direction");
    }
    if(_en == 0){
        kvmv_cfg.hdmi_stop_flag = 1;
        while(kvmv_cfg.hdmi_reading_flag == 1) time::sleep_ms(10);
        system("echo 0 > /sys/class/gpio/gpio451/value");
        return 0;
    } else {
        kvmv_cfg.hdmi_stop_flag = 0;
        system("echo 1 > /sys/class/gpio/gpio451/value");
        return 0;
    }
    return -1;
}
