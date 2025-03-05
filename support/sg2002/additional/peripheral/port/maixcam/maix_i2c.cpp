/**
 * @author neucrack@sipeed, lxowalle@sipeed
 * @copyright Sipeed Ltd 2023-
 * @license Apache 2.0
 * @update 2023.9.8: Add framework, create this file.
 */


#include "maix_i2c.hpp"
#include "maix_basic.hpp"
#include "cstdio"
#include <fcntl.h>
#include <unistd.h>
#include <linux/i2c-dev.h>
#include <linux/i2c.h>
#include <sys/ioctl.h>

#define DEV_PATH "/dev/i2c-%d"

namespace maix::peripheral::i2c
{

    std::vector<int> list_devices()
    {
        std::vector<int> data;
        // list all files in /dev, find i2c-*
        std::vector<std::string> *files = fs::listdir("/dev");
        for (auto &file : *files)
        {
            if (file.find("i2c-") != std::string::npos)
            {
                try
                {
                    data.push_back(std::stoi(file.substr(4)));
                }
                catch (const std::exception &e)
                {
                    log::error("i2c bus id %s format error", file.c_str());
                }
            }
        }
        delete files;
        return data;
    }

    I2C::I2C(int id, i2c::Mode mode, int freq, i2c::AddrSize addr_size)
    {
        char buf[32];

        snprintf(buf, sizeof(buf), DEV_PATH, id);
        if(access(buf, F_OK) == 0){
            if (mode == i2c::SLAVE)
            {
                throw err::Exception(err::Err::ERR_NOT_IMPL, "i2c::SLAVE mode not implemented");
            }
            if (addr_size != i2c::SEVEN_BIT)
            {
                throw err::Exception(err::Err::ERR_NOT_IMPL, "addr_size " + std::to_string(addr_size) + " not support");
            }

            int fd = ::open(buf, O_RDWR);
            if (fd < 0)
            {
                throw err::Exception(err::Err::ERR_IO, "open " + std::string(buf) + " failed");
            }
            _fd = fd;
            _freq = freq;
            _mode = mode;
            _addr_size = addr_size;
        } else {
            printf("not exit i2c\r\n");
        }
    }

    I2C::~I2C()
    {
        if (_fd > 0)
        {
            ::close(_fd);
        }
    }

    std::vector<int> I2C::scan(int addr)
    {
        std::vector<int> data;
        int addr_start = 0x08;
        int addr_end = 0x77;
        if(addr > 0)
        {
            addr_start = addr;
            addr_end = addr;
        }

        if (_mode != i2c::Mode::MASTER)
        {
            log::error("Only for master mode");
            return data;
        }

        switch (_addr_size)
        {
        case i2c::AddrSize::SEVEN_BIT:
            for (int address = addr_start; address <= addr_end; ++address)
            {
                if (::ioctl(_fd, I2C_SLAVE, address) < 0)
                {
                    continue;
                }

                unsigned char buffer[1];
                if (::read(_fd, buffer, sizeof(buffer)) >= 0)
                {
                    data.push_back(address);
                }
            }
            break;
        default:
            log::error("bit %d not support", _addr_size);
            return data;
        }

        return data;
    }

    int I2C::writeto(int addr, const uint8_t *data, int len)
    {
        if (_mode != i2c::Mode::MASTER)
        {
            log::error("Only for master mode");
            return (int)-err::Err::ERR_NOT_PERMIT;
        }

        if (0 != ioctl(_fd, I2C_SLAVE, addr))
        {
            // log::error("set slave address failed");
            return (int)-err::Err::ERR_IO;
        }

        if (len != ::write(_fd, data, len))
        {
            log::error("write failed");
            return (int)-err::Err::ERR_IO;
        }

        return len;
    }

    int I2C::writeto(int addr, const std::vector<unsigned char> data)
    {
        return writeto(addr, data.data(), (int)data.size());
    }

    int I2C::writeto(int addr, const Bytes &data)
    {
        return writeto(addr, data.data, (int)data.size());
    }

    Bytes* I2C::readfrom(int addr, int len)
    {
        Bytes *data = new Bytes(nullptr, len);

        if (_mode != i2c::Mode::MASTER)
        {
            log::error("Only for master mode");
            return nullptr;
        }

        if (0 != ioctl(_fd, I2C_SLAVE, addr))
        {
            // log::error("set slave address failed");
            return nullptr;
        }

        if (len != ::read(_fd, data->data, len))
        {
            log::error("read failed");
            delete data;
            return nullptr;
        }
        return data;
    }

    int I2C::writeto_mem(int addr, int mem_addr, const uint8_t *data, int len, int mem_addr_size, bool mem_addr_le)
    {
        if (_mode != i2c::Mode::MASTER)
        {
            log::error("Only for master mode");
            return (int)-err::Err::ERR_NOT_PERMIT;
        }
        if(mem_addr_size % 8 != 0)
        {
            log::error("mem_addr_size must be multiple of 8");
            return (int)-err::Err::ERR_IO;
        }

        if (0 != ioctl(_fd, I2C_SLAVE, addr))
        {
            // log::error("set slave address failed");
            return (int)-err::Err::ERR_IO;
        }

        std::vector<unsigned char> data_final;

        if(mem_addr_size == 8)
        {
            data_final.push_back((unsigned char)mem_addr);
        }
        else
        {
            if(mem_addr_le)
            {
                for(int i = 0; i < mem_addr_size / 8; i++)
                {
                    data_final.push_back((unsigned char)(mem_addr & 0xff));
                    mem_addr >>= 8;
                }
            }
            else
            {
                for(int i = 0; i < mem_addr_size / 8; i++)
                {
                    data_final.push_back((unsigned char)(mem_addr >> (8 * (mem_addr_size / 8 - i - 1))));
                }
            }
        }
        for(int i = 0; i < len; i++)
        {
            data_final.push_back(data[i]);
        }
        int write_len = ::write(_fd, data_final.data(), data_final.size());
        if (data_final.size() != (size_t)write_len)
        {
            log::error("write failed, write_len: %d", write_len);
            return (int)-err::Err::ERR_IO;
        }

        return len;
    }

    int I2C::writeto_mem(int addr, int mem_addr, const std::vector<unsigned char> data, int mem_addr_size, bool mem_addr_le)
    {
        return writeto_mem(addr, mem_addr, data.data(), (int)data.size(), mem_addr_size, mem_addr_le);
    }

    int I2C::writeto_mem(int addr, int mem_addr, const Bytes &data, int mem_addr_size, bool mem_addr_le)
    {
        return writeto_mem(addr, mem_addr, data.data, (int)data.size(), mem_addr_size, mem_addr_le);
    }

    Bytes* I2C::readfrom_mem(int addr, int mem_addr, int len, int mem_addr_size, bool mem_addr_le)
    {
        // write mem_addr and restart to read
        if (_mode != i2c::Mode::MASTER)
        {
            log::error("Only for master mode");
            return nullptr;
        }
        if(mem_addr_size % 8 != 0)
        {
            log::error("mem_addr_size must be multiple of 8");
            return nullptr;
        }

        // write mem_addr first and restart to read
        if (0 != ioctl(_fd, I2C_SLAVE, addr))
        {
            // log::error("set slave address failed");
            return nullptr;
        }

        std::vector<unsigned char> data_final;
        if(mem_addr_size == 8)
        {
            data_final.push_back((unsigned char)mem_addr);
        }
        else
        {
            if(mem_addr_le)
            {
                for(int i = 0; i < mem_addr_size / 8; i++)
                {
                    data_final.push_back((unsigned char)(mem_addr & 0xff));
                    mem_addr >>= 8;
                }
            }
            else
            {

                for(int i = 0; i < mem_addr_size / 8; i++)
                {
                    data_final.push_back((unsigned char)(mem_addr >> (8 * (mem_addr_size / 8 - i - 1))));
                }
            }
        }
        // write read with I2C_RDWR
        struct i2c_msg msgs[2];
        msgs[0].addr = addr;
        msgs[0].flags = 0;
        msgs[0].len = data_final.size();
        msgs[0].buf = data_final.data();

        Bytes *data = new Bytes(nullptr, len);
        msgs[1].addr = addr;
        msgs[1].flags = I2C_M_RD;
        msgs[1].len = len;
        msgs[1].buf = data->data;

        struct i2c_rdwr_ioctl_data msgset;
        msgset.msgs = msgs;
        msgset.nmsgs = 2;

        int read_len = ioctl(_fd, I2C_RDWR, &msgset);
        if (read_len != 2)
        {
            log::error("read failed");
            delete data;
            return nullptr;
        }

        return data;
    }
}
