#include "oled_ctrl.h"

using namespace maix;
using namespace maix::sys;
using namespace maix::peripheral;
i2c::I2C oled_alpha(1, i2c::Mode::MASTER);
i2c::I2C oled_beta(5, i2c::Mode::MASTER);

uint8_t OLED_state = 0;
uint8_t kvm_hw_ver = 0;

/* mode = OLED_CMD
 * 		= OLED_DATA         */
void oled_write_register(uint8_t mode, uint8_t data)
{
	if(OLED_state){
		uint8_t buf[2];

		buf[0] = mode;
		buf[1] = data;
		if(kvm_hw_ver == 0){
			if(oled_alpha.writeto(OLED_ADDR, buf, 2) == (int)-err::Err::ERR_IO){
				return;
			}
		} else if(kvm_hw_ver == 1){
			if(oled_beta.writeto(OLED_ADDR, buf, 2) == (int)-err::Err::ERR_IO){
				return;
			}
		} else if(kvm_hw_ver == 2){
			if(oled_beta.writeto(OLED_PCIe_ADDR, buf, 2) == (int)-err::Err::ERR_IO){
				return;
			}
		}
		return;
	}
	return;
}

int oled_exist(void)
{
    // gpio::GPIO oled_rst("GPIOP19", gpio::Mode::OUT, gpio::Pull::PULL_UP);
    // oled_rst.high();
	// system("devmem 0x030010D4 32 0x3");
    // system("devmem 0x030010D0 32 0x2");
    // system("devmem 0x030010DC 32 0x2");

	if(access("/etc/kvm/hw", F_OK) == 0){
		uint8_t RW_Data[2];
		FILE *fp = fopen("/etc/kvm/hw", "r");
		fread(RW_Data, sizeof(char), 2, fp);
		fclose(fp);
		if(RW_Data[0] == 'b') kvm_hw_ver = 1;
		else if(RW_Data[0] == 'p') kvm_hw_ver = 2;
	}

	uint8_t buf[2];

	buf[0] = OLED_CMD;
	buf[1] = 0xAE;
	if(kvm_hw_ver == 0){
		if(oled_alpha.writeto(OLED_ADDR, buf, 2) == (int)-err::Err::ERR_IO){
			return 0;
		}
	} else if(kvm_hw_ver == 1){
		printf("beta\r\n");
		if(oled_beta.writeto(OLED_ADDR, buf, 2) == (int)-err::Err::ERR_IO){
			return 0;
		}
	} else if(kvm_hw_ver == 2){
		printf("PCIe\r\n");
		if(oled_beta.writeto(OLED_PCIe_ADDR, buf, 2) == (int)-err::Err::ERR_IO){
			return 0;
		}
	}
	return 1;
}

// 坐标设置
void OLED_Set_Pos(uint8_t x, uint8_t y) 
{ 
	// oled_write_register(OLED_CMD, 0xb0+y);
	// oled_write_register(OLED_CMD, ((x&0xf0)>>4)|0x10);
	// oled_write_register(OLED_CMD, (x&0x0f));
	if(kvm_hw_ver == 2){
		x += 32;
		y += 8;
	}
	oled_write_register(OLED_CMD, 0xb0+y);
	oled_write_register(OLED_CMD, ((x&0xf0)>>4)|0x10);
	oled_write_register(OLED_CMD, (x&0x0f));
}

//开启OLED显示    
void OLED_Display_On()
{
	oled_write_register(OLED_CMD, 0X8D);
	oled_write_register(OLED_CMD, 0X14);
	oled_write_register(OLED_CMD, 0XAF);
}

//关闭OLED显示     
void OLED_Display_Off()
{
	oled_write_register(OLED_CMD, 0X8D);
	oled_write_register(OLED_CMD, 0X10);
	oled_write_register(OLED_CMD, 0XAE);
}

//清屏函数,清完屏,整个屏幕是黑色的!和没点亮一样!!!	  
void OLED_Clear(void)  
{  
	uint8_t i,n;		    
	for(i=0;i<8;i++)  
	{  
		oled_write_register(OLED_CMD, 0xb0+i);
		oled_write_register(OLED_CMD, 0x00);
		oled_write_register(OLED_CMD, 0x10); 
		for(n=0;n<128;n++)oled_write_register(OLED_DATA, 0x00); 
	} //更新显示
}

void OLED_Fill(void)  
{  
	uint8_t i,n;		    
	for(i=0;i<8;i++)  
	{  
		oled_write_register(OLED_CMD, 0xb0+i);
		oled_write_register(OLED_CMD, 0x00);
		oled_write_register(OLED_CMD, 0x10); 
		for(n=0;n<128;n++)oled_write_register(OLED_DATA, 0xFF); 
	} //更新显示
}

//在指定位置显示一个字符,包括部分字符
//x:0~127
//y:0~63				 
//sizey:选择字体 6x8  8x16
void OLED_ShowChar(uint8_t x,uint8_t y,char chr,uint8_t sizey)
{
	uint8_t c=0,sizex=sizey/2;
	uint16_t i=0,size1;
	if(sizey==8)size1=6;
	else if(sizey==4)size1=4;
	else size1=(sizey/8+((sizey%8)?1:0))*(sizey/2);
	c=chr-' ';//得到偏移后的值
	OLED_Set_Pos(x, y);
	for(i=0; i<size1; i++)
	{
		if(i%sizex==0&&sizey==16) OLED_Set_Pos(x, y++);
		if(sizey==8) oled_write_register(OLED_DATA, oled_asc2_0806[c][i]); //6X8字号
		else if(sizey==16) oled_write_register(OLED_DATA, oled_asc2_1608[c][i]);//8x16字号
		else if(sizey==4) oled_write_register(OLED_DATA, oled_asc2_0804[c][i]);//8x4字号
		else return;
	}
}
void OLED_ShowCharTurn(uint8_t x,uint8_t y,char chr,uint8_t sizey)
{
	uint8_t c=0,sizex=sizey/2;
	uint16_t i=0,size1;
	if(sizey==8)size1=6;
	else size1=(sizey/8+((sizey%8)?1:0))*(sizey/2);
	c=chr-' ';//得到偏移后的值
	OLED_Set_Pos(x, y);
	for(i=0; i<size1; i++)
	{
		if(i%sizex==0&&sizey!=8) OLED_Set_Pos(x, y++);
		if(sizey==8) oled_write_register(OLED_DATA, ~oled_asc2_0806[c][i]); //6X8字号
		else if(sizey==16) oled_write_register(OLED_DATA, ~oled_asc2_1608[c][i]);//8x16字号
		else return;
	}
}

void OLED_ShowError(uint8_t x,uint8_t y,uint8_t _state)
{
	uint8_t i;
	if(_state){
		OLED_Set_Pos(x, y);
		for(i=0; i<6; i++)
		{
			oled_write_register(OLED_DATA, etherror[i]);
		}
	} else {
		OLED_ShowString(28, 3, " ", 8);
	}
}

uint32_t oled_pow(uint8_t m,uint8_t n)
{
	uint32_t result=1;	 
	while(n--)result*=m;    
	return result;
}

//显示数字
//x,y :起点坐标
//num:要显示的数字
//len :数字的位数
//sizey:字体大小		  
void OLED_ShowNum(uint8_t x, uint8_t y, uint8_t num, uint8_t len, uint8_t sizey)
{         	
	uint8_t t, temp, m = 0;
	uint8_t enshow = 0;
	if(sizey == 8) m = 2;
	for(t=0; t<len; t++)
	{
		temp = (num / oled_pow(10,len-t-1)) % 10;
		if(enshow == 0 && t < (len-1))
		{
			if(temp == 0)
			{
				OLED_ShowChar(x+(sizey/2+m)*t, y, ' ',sizey);
				continue;
			} else enshow=1;
		}
	 	OLED_ShowChar(x+(sizey/2+m)*t, y, temp+'0', sizey);
	}
}

//显示一个字符号串
void OLED_ShowString(uint8_t x, uint8_t y, char *chr, uint8_t sizey)
{
	uint8_t j=0;
	while (chr[j]!='\0')
	{		
		OLED_ShowChar(x, y, chr[j++], sizey);
		if(sizey==8)x+=6;
		else if(sizey==4)x+=4;
		else x+=sizey/2;
	}
}
//反显一个字符号串
void OLED_ShowStringTurn(uint8_t x, uint8_t y, char *chr, uint8_t sizey)
{
	uint8_t j=0;
	while (chr[j]!='\0')
	{		
		OLED_ShowCharTurn(x, y, chr[j++], sizey);
		if(sizey==8)x+=6;
		else x+=sizey/2;
	}
}

//反显函数
void OLED_ColorTurn(uint8_t i)
{
	if(i==0)
	{
		oled_write_register(OLED_CMD, 0xA6); //正常显示
	}
	if(i==1)
	{
		oled_write_register(OLED_CMD, 0xA7);//反色显示
	}
}

//屏幕旋转180度
void OLED_DisplayTurn(uint8_t i)
{
	if(i==0)
	{
		oled_write_register(OLED_CMD, 0xC8);//正常显示
		oled_write_register(OLED_CMD, 0xA1);
	}
	if(i==1)
	{
		oled_write_register(OLED_CMD, 0xC0);//反转显示
		oled_write_register(OLED_CMD, 0xA0);
	}
}

//初始化				    
void OLED_Init(void)
{
	// pinmap::set_pin_function("A19", "GPIOP19");
    
	// OLED_RES_Clr();
  	// delay_ms(200);
	// OLED_RES_Set();
	
	oled_write_register(OLED_CMD, 0xAE);//--turn off oled_alpha panel
	oled_write_register(OLED_CMD, 0x00);//---set low column address
	oled_write_register(OLED_CMD, 0x10);//---set high column address
	oled_write_register(OLED_CMD, 0x40);//--set start line address  Set Mapping RAM Display Start Line (0x00~0x3F)
	oled_write_register(OLED_CMD, 0x81);//--set contrast control register
	oled_write_register(OLED_CMD, 0xCF);// Set SEG Output Current Brightness
	oled_write_register(OLED_CMD, 0xA1);//--Set SEG/Column Mapping     0xa0左右反置 0xa1正常
	oled_write_register(OLED_CMD, 0xC8);//Set COM/Row Scan Direction   0xc0上下反置 0xc8正常
	oled_write_register(OLED_CMD, 0xA6);//--set normal display
	oled_write_register(OLED_CMD, 0xA8);//--set multiplex ratio(1 to 64)
	oled_write_register(OLED_CMD, 0x3f);//--1/64 duty
	oled_write_register(OLED_CMD, 0xD3);//-set display offset	Shift Mapping RAM Counter (0x00~0x3F)
	oled_write_register(OLED_CMD, 0x00);//-not offset
	oled_write_register(OLED_CMD, 0xd5);//--set display clock divide ratio/oscillator frequency
	oled_write_register(OLED_CMD, 0x80);//--set divide ratio, Set Clock as 100 Frames/Sec
	oled_write_register(OLED_CMD, 0xD9);//--set pre-charge period
	oled_write_register(OLED_CMD, 0xF1);//Set Pre-Charge as 15 Clocks & Discharge as 1 Clock
	oled_write_register(OLED_CMD, 0xDA);//--set com pins hardware configuration
	oled_write_register(OLED_CMD, 0x12);//
	oled_write_register(OLED_CMD, 0xDB);//--set vcomh
	oled_write_register(OLED_CMD, 0x40);//Set VCOM Deselect Level
	oled_write_register(OLED_CMD, 0x20);//-Set Page Addressing Mode (0x00/0x01/0x02)
	oled_write_register(OLED_CMD, 0x02);//
	oled_write_register(OLED_CMD, 0x8D);//--set Charge Pump enable/disable
	oled_write_register(OLED_CMD, 0x14);//--set(0x10) disable
	oled_write_register(OLED_CMD, 0xA4);// Disable Entire Display On (0xa4/0xa5)
	oled_write_register(OLED_CMD, 0xA6);// Disable Inverse Display On (0xa6/a7) 
	OLED_Clear();
	oled_write_register(OLED_CMD, 0xAF); /*display ON*/ 
}

void OLED_ShowStringtoend(uint8_t x, uint8_t y, char *chr, uint8_t sizey, uint8_t end)
{
	uint8_t j=0;
	while (chr[j] != end)
	{		
		OLED_ShowChar(x, y, chr[j++], sizey);
		if(sizey==8)x+=6;
		else x+=sizey/2;
	}
}

void OLED_ROW(uint8_t _EN)
{
    if(_EN){
        oled_write_register(OLED_CMD, 0x2e);    //关闭滚动
        oled_write_register(OLED_CMD, 0x27);    //水平向左或者右滚动 26/27
        oled_write_register(OLED_CMD, 0x00);    //虚拟字节
        oled_write_register(OLED_CMD, 0x00);    //起始页 0
        oled_write_register(OLED_CMD, 0x07);    //滚动时间间隔
        oled_write_register(OLED_CMD, 0x07);    //终止页 7
        oled_write_register(OLED_CMD, 0x0f);    //虚拟字节
        oled_write_register(OLED_CMD, 0x7f);    //虚拟字节

        oled_write_register(OLED_CMD, 0x2f);    //开启滚动
    } else {
        oled_write_register(OLED_CMD, 0x2e);    //关闭滚动
    }
}

void OLED_ShowState(uint8_t x,uint8_t y,char chr,uint8_t size)
{
	uint16_t i=0;
	OLED_Set_Pos(x, y);
	for(i=0; i<size; i++)
	{
		oled_write_register(OLED_DATA, oled_kvm_0621[chr][i]);
	}
}

void OLED_ShowLogo()
{
	uint16_t i=0;
    uint8_t x = 20;
    uint8_t y = 0;
	for(i=0; i<116; i++)
	{   
        if(i%2==0){
            x++;
            y = 0;
        } else {
            y = 1;
        }
        OLED_Set_Pos(x, y);
		oled_write_register(OLED_DATA, oled_kvm_logo[i]);
	}
}

void OLED_Showline_1()
{
	uint16_t i=0;
    uint8_t x = 17;
    uint8_t y = 0;
	for(i=112; i<116; i++)
	{   
        if(i%2==0){
            x++;
            y = 0;
        } else {
            y = 1;
        }
        OLED_Set_Pos(x, y);
		oled_write_register(OLED_DATA, oled_kvm_logo[i]);
	}
}

void OLED_ShowSipeedLogo()
{
	uint16_t i=0;
    uint8_t x = 0;
    uint8_t y = 0;
	uint8_t start_position = 0;
	if(kvm_hw_ver == 2) start_position = 4;
	for(i = start_position; i < 32; i++)
	{   
        if(i%2==0){
            x++;
            y = 0;
        } else {
            y = 1;
        }
        OLED_Set_Pos(x, y);
		oled_write_register(OLED_DATA, oled_sipeed_logo[i]);
	}
}

void OLED_Showline()
{
    uint8_t x = 3;
    uint8_t y = 2;
    for(y = 2; y < 8; y++){
        OLED_Set_Pos(x, y);
        if(y == 2){
            oled_write_register(OLED_DATA, 0xC0);
            oled_write_register(OLED_DATA, 0xC0);
            oled_write_register(OLED_DATA, 0xC0);
        } else {
            oled_write_register(OLED_DATA, 0xFF);
            oled_write_register(OLED_DATA, 0xFF);
            oled_write_register(OLED_DATA, 0xFF);
        }
    }
}

void OLED_ShowString_AlignRight(uint8_t x_end, uint8_t y, char *chr, uint8_t size)
{
	uint8_t j = 0;
	uint8_t x = x_end;
	while(chr[j] != '\0'){
		j ++;
	}
	while (j)
	{	
		if(size == 8) x -= 6;
		else x -= 4;
		OLED_ShowChar(x, y, chr[j-1], size);
		j --;
	}
}

void OLED_Revolve(void)
{
	oled_write_register(OLED_CMD, 0xA0);
	oled_write_register(OLED_CMD, 0xC0);
}

void OLED_ShowIMG(uint8_t x,uint8_t y,char *chr,uint8_t width,uint8_t height)
{
	uint16_t size = width * height;
	for(int count = 0; count < size; count++){
		if(count%width == 0){
			OLED_Set_Pos(x, y+(count/width));
		}
		oled_write_register(OLED_DATA, chr[count]);
	}
}

void OLED_ShowKVMStreamState(uint8_t kvm_state_s, void* pdata)
{
    switch(kvm_state_s){
        case KVM_INIT:
			if(kvm_hw_ver != 2){
				OLED_ShowString(10, 3, "IP:                ", 8);
				OLED_ShowString(10, 4, "RES:               ", 8);
				OLED_ShowString(10, 5, "TYPE:              ", 8);
				OLED_ShowString(10, 6, "STREAM:            ", 8);
				OLED_ShowString(10, 7, "QUALITY:           ", 8);
			}
        break;
        case KVM_ETH_IP:
			if(kvm_hw_ver != 2)
            	OLED_ShowString(10, 3, "IP:                ", 8);
            	// OLED_ShowString(10, 3, "ETH:               ", 8);
			else
				OLED_ShowString_AlignRight(AlignRightEND_P, 2, "               ", 4);
			if(*(char*)pdata != 0){
				if(kvm_hw_ver != 2)
            		OLED_ShowString_AlignRight(AlignRightEND, 3, (char*)pdata, 8);
				else{
					OLED_ShowString(0, 2, "E", 4);
					OLED_ShowString_AlignRight(AlignRightEND_P, 2, (char*)pdata, 4);
				}
			} else {
				if(kvm_hw_ver != 2)
					OLED_ShowString_AlignRight(AlignRightEND, 3, "--", 8);
				else{
					OLED_ShowString(0, 2, "E", 4);
					OLED_ShowString_AlignRight(AlignRightEND_P, 2, "--", 4);
				}
					
			}
        break;
        case KVM_WIFI_IP:
			if(kvm_hw_ver != 2)
            	OLED_ShowString(10, 3, "W:               ", 8);
			else
				OLED_ShowString_AlignRight(AlignRightEND_P, 2, "               ", 4);
			if(*(char*)pdata != 0){
				if(kvm_hw_ver != 2)
            		OLED_ShowString_AlignRight(AlignRightEND, 3, (char*)pdata, 8);
				else{
					OLED_ShowString(0, 2, "W", 4);
					OLED_ShowString_AlignRight(AlignRightEND_P, 2, (char*)pdata, 4);
				}
			} else {
				if(kvm_hw_ver != 2)
					OLED_ShowString_AlignRight(AlignRightEND, 3, "--", 8);
				else {
					OLED_ShowString(0, 2, "W", 4);
					OLED_ShowString_AlignRight(AlignRightEND_P, 2, "--", 4);
				}
			}
        break;
        case KVM_HDMI_RES:
        break;
			// if(kvm_hw_ver != 2){
			// 	OLED_ShowString(10, 4, "RES:               ", 8);
			// 	switch (*(uint8_t*)pdata)
			// 	{
			// 	case KVM_RES_none:
			// 		OLED_ShowString_AlignRight(AlignRightEND, 4, "--", 8);
			// 	break;
			// 	case KVM_RES_480P:
			// 		OLED_ShowString_AlignRight(AlignRightEND, 4, "480P", 8);
			// 	break;
			// 	case KVM_RES_600P:
			// 		OLED_ShowString_AlignRight(AlignRightEND, 4, "600P", 8);
			// 	break;
			// 	case KVM_RES_720P:
			// 		OLED_ShowString_AlignRight(AlignRightEND, 4, "720P", 8);
			// 	break;
			// 	case KVM_RES_1080P:
			// 		OLED_ShowString_AlignRight(AlignRightEND, 4, "1080P", 8);
			// 	break;
				
			// 	default:
			// 		OLED_ShowString_AlignRight(AlignRightEND, 4, "--", 8);
			// 	break;
			// 	}
			// }
        break;
        case KVM_STEAM_TYPE:
			if(kvm_hw_ver != 2){
				OLED_ShowString(10, 5, "TYPE:              ", 8);
				switch (*(uint8_t*)pdata)
				{
				case KVM_TYPE_MJPG:
					OLED_ShowString_AlignRight(AlignRightEND, 5, "MJPG", 8);
				break;
				case KVM_TYPE_H264:
					OLED_ShowString_AlignRight(AlignRightEND, 5, "H264", 8);
				break;
				
				default:
					OLED_ShowString_AlignRight(AlignRightEND, 5, "--", 8);
					break;
				}
			}
        break;
        case KVM_STEAM_FPS:
            // OLED_ShowString(10, 6, "STREAM:            ", 8);
			if(kvm_hw_ver != 2){
				OLED_ShowString_AlignRight(AlignRightEND, 6, "FPS", 8);
				OLED_ShowNum(88, 6, *(uint8_t*)pdata, 3, 8);
			} else {
				OLED_ShowString_AlignRight(AlignRightEND_P, 3, "  FPS", 4);
				OLED_ShowNum(42, 3, *(uint8_t*)pdata, 3, 4);
				char fps_num[10];
				sprintf(fps_num, "%d", *(uint8_t*)pdata);
				OLED_ShowString_AlignRight(AlignRightEND_P-13, 3, fps_num, 4);
			}
        break;
        case KVM_JPG_QLTY:
			if(kvm_hw_ver != 2){
				OLED_ShowString(10, 7, "QUALITY:           ", 8);
				// OLED_ShowString_AlignRight(AlignRightEND, 7, "%", 8);
				// OLED_ShowNum(AlignRightEND - 26, 7, *(uint8_t*)pdata, 3, 8);
				switch (*(uint8_t*)pdata)
				{
					// LOW Middle HIGH EXTRA
				case 0:
					OLED_ShowString_AlignRight(AlignRightEND, 7, "--", 8);
				break;
				case 1:
					OLED_ShowString_AlignRight(AlignRightEND, 7, "LOW", 8);
				break;
				case 2:
					OLED_ShowString_AlignRight(AlignRightEND, 7, "Middle", 8);
				break;
				case 3:
					OLED_ShowString_AlignRight(AlignRightEND, 7, "HIGH", 8);
				break;
				case 4:
					OLED_ShowString_AlignRight(AlignRightEND, 7, "EXTRA", 8);
				break;
				
				default:
					OLED_ShowString_AlignRight(AlignRightEND, 7, "--", 8);
				break;
				}
			}
        break;
        case KVM_CPU_IDLE:
			if(kvm_hw_ver != 2){
				OLED_ShowString(10, 7, "CPU IDLE:          ", 8);
				OLED_ShowString_AlignRight(AlignRightEND, 7, "%", 8);
				OLED_ShowNum(AlignRightEND - 26, 7, *(uint8_t*)pdata, 3, 8);
			}
        break;
    }
}

void OLED_Show_Res(uint16_t _w, uint16_t _h)
{
	// PCIe
	if(_w != 0 || _h != 0){
		char res_char[20]={0};
		sprintf(res_char,"%d*%d", _w, _h);
		
		if(kvm_hw_ver != 2){
			// cube
			OLED_ShowString(10, 4, "RES:               ", 8);
			OLED_ShowString_AlignRight(AlignRightEND, 4, res_char, 8);
		} else {
			// pcie
			res_char[10]=0;
			OLED_ShowString_AlignRight(36, 3, "         ", 4);
			OLED_ShowString_AlignRight(36, 3, res_char, 4);
		}
	} else {
		if(kvm_hw_ver != 2){
			// cube
			OLED_ShowString(10, 4, "RES:             --", 8);
		} else {
			// pcie
			OLED_ShowString_AlignRight(36, 3, "         ", 4);
		}
	}
}

void OLED_ShowKVMState(uint8_t _Interface, int8_t _EN)
{
	uint8_t x0 = 84;
	uint8_t x1 = 104;
	
	if(kvm_hw_ver == 2){
		x0 -= 60;
		x1 -= 61;
	}
    if(_Interface & HDMI_STATE){
        if(_EN) OLED_ShowState(x1, 1, 1, 21);
        else    OLED_ShowState(x1, 1, 0, 21);
    }
    if(_Interface & HID_STATE){
        if(_EN) OLED_ShowState(x0, 1, 3, 15);
        else    OLED_ShowState(x0, 1, 2, 15);
    }
    if(_Interface & ETH_STATE){
        if(_EN) OLED_ShowState(x0, 0, 5, 15);
        else    OLED_ShowState(x0, 0, 4, 15);
    }
    if(_Interface & WIFI_STATE){
        if(_EN == 1) OLED_ShowState(x1, 0, 7, 15);
        else if(_EN == 0) OLED_ShowState(x1, 0, 6, 15);
		else  OLED_ShowString(x1, 0, " -- ", 4);
    }
}

void OLED_Show_Network_Error(uint8_t _state)
{
	if(_state){
		if(kvm_hw_ver != 2)
			OLED_ShowError(28, 3, 1);	// [!]
		// else
			// OLED_ShowString_AlignRight(5, 2, "!", 4);

	} else {
		if(kvm_hw_ver != 2)
			OLED_ShowError(28, 3, 0);
		// else
			// OLED_ShowString_AlignRight(5, 2, " ", 4);
	}
}