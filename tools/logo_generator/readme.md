# NanoKVM Logo Generator

**Compatible Hardware:** NanoKVM-Cube, NanoKVM-PCIe

🛠️ **Tool Description:**
This is a logo generator for the NanoKVM OLED display and Web. You can use it to create a `logo.bin` and `logo.ico` file and place them in the `/boot` directory of your NanoKVM system.

📋 **Instructions:**

1.  **Install required libraries:**
    ```bash
    pip install Pillow numpy textual
    ```

2.  **Prepare your logo image:**
    Make sure it's as square as possible for best results 🖼️

3.  **Run the script:**
    ```bash
    python logo_generator.py path/to/your_logo.png
    ```

4.  **Choose your language:**
    Select either English or Chinese

5.  **Adjust the contrast:**
    Fine-tune the contrast based on the preview below until you're happy with how it looks ✨

6.  **Fine-tune pixel by pixel:**
    Click on individual pixels to adjust details. If you prefer an inverted display, just click the invert button 🔄

7.  **Export and deploy:**
    Export the `logo.bin` & `logo.ico`, then copy it to the `/boot` directory of your NanoKVM system. You can do this by:
    *   Enabling SSH and using SCP to copy the file 💻
    *   Or directly placing it in the boot partition of your TF card 💾

8.  **Reboot and enjoy:**
    Make sure your NanoKVM application version is greater than 2.3.6 ✅
    Reboot your NanoKVM, and you should see your custom logo on the OLED display! 🎉