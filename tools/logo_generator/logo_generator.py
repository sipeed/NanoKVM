from PIL import Image
import numpy as np
import sys
import os
from textual.app import App, ComposeResult
from textual.widgets import Header, Footer, Button, Input, Label, Static
from textual.containers import Container, Horizontal, Vertical, Center, Middle
from textual.binding import Binding
from textual import events
from textual.message import Message


# Language dictionary for i18n support
LANGUAGES = {
    'zh': {
        'app_title': '🖼️ [ NanoKVM Logo 生成器 ]',
        'app_title_editor': '✏️ NanoKVM Logo 编辑器',
        'contrast_minus': '对比度-',
        'contrast_plus': '对比度+',
        'current_contrast': '当前对比度：{}',
        'click_hint': '💡 点击图片以修改像素',
        'btn_invert': '🔃 反转',
        'btn_reset': '🔄 重置',
        'btn_export': '💾 导出',
        'btn_quit': '❌ 退出',
        'help_text_with_image': '快捷键：↑↓ 调整±10 | ←→ 调整±1 | I 反转 | R 重置 | D 导出 | Q 退出',
        'help_text_editor': '快捷键：I 反转 | R 清空 | D 导出 | Q 退出',
        'status_blank_canvas': '空白画布 - 点击像素开始绘制',
        'status_loaded': '已加载：{}',
        'status_load_failed': '无法加载图片：{}',
        'status_contrast': '对比度：{}',
        'status_inverted': '已反转所有像素',
        'status_reset_image': '已重置为原始图片',
        'status_reset_canvas': '已清空画布',
        'status_export_error': '错误：没有可导出的数据',
        'status_exported': '✅ 已导出 logo 文件',
        'status_pixel_toggled': '切换像素 ({}, {})',
        'lang_select_title': '选择语言 / Select Language',
        'btn_chinese': '中文 (Chinese)',
        'btn_english': 'English',
        'binding_quit': '退出',
        'binding_export': '导出',
        'binding_reset': '重置',
        'binding_invert': '反转',
        'binding_threshold_up': '阈值 +10',
        'binding_threshold_down': '阈值 -10',
        'binding_threshold_up_small': '阈值 +1',
        'binding_threshold_down_small': '阈值 -1',
    },
    'en': {
        'app_title': '🖼️ [ NanoKVM Logo Generator ]',
        'app_title_editor': '✏️ NanoKVM Logo Editor',
        'contrast_minus': 'Contrast-',
        'contrast_plus': 'Contrast+',
        'current_contrast': 'Contrast: {}',
        'click_hint': '💡 Click image to toggle pixels',
        'btn_invert': '🔃 Invert',
        'btn_reset': '🔄 Reset',
        'btn_export': '💾 Export',
        'btn_quit': '❌ Quit',
        'help_text_with_image': 'Shortcuts: ↑↓ ±10 | ←→ ±1 | I Invert | R Reset | D Export | Q Quit',
        'help_text_editor': 'Shortcuts: I Invert | R Clear | D Export | Q Quit',
        'status_blank_canvas': 'Blank canvas - Click pixels to draw',
        'status_loaded': 'Loaded: {}',
        'status_load_failed': 'Failed to load image: {}',
        'status_contrast': 'Contrast: {}',
        'status_inverted': 'All pixels inverted',
        'status_reset_image': 'Reset to original image',
        'status_reset_canvas': 'Canvas cleared',
        'status_export_error': 'Error: No data to export',
        'status_exported': '✅ Exported logo file',
        'status_pixel_toggled': 'Toggled pixel ({}, {})',
        'lang_select_title': '选择语言 / Select Language',
        'btn_chinese': '中文 (Chinese)',
        'btn_english': 'English',
        'binding_quit': 'Quit',
        'binding_export': 'Export',
        'binding_reset': 'Reset',
        'binding_invert': 'Invert',
        'binding_threshold_up': 'Threshold +10',
        'binding_threshold_down': 'Threshold -10',
        'binding_threshold_up_small': 'Threshold +1',
        'binding_threshold_down_small': 'Threshold -1',
    }
}


def reverse_byte(byte):
    """Reverse the bits in a byte"""
    result = 0
    for i in range(8):
        if (byte >> i) & 1:
            result |= (1 << (7 - i))
    return result


def process_image(image_path, threshold=128):
    """
    Process image to 16x16 binary data

    Args:
        image_path: Path to the image file
        threshold: Binarization threshold (0-255)

    Returns:
        16x16 numpy array of binary values
    """
    if not os.path.exists(image_path):
        return None

    try:
        img = Image.open(image_path).convert('L')
    except Exception as e:
        print(f"Error: Failed to open image - {e}")
        return None

    # If not square, crop the center region
    if img.width != img.height:
        size = min(img.width, img.height)
        left = (img.width - size) // 2
        top = (img.height - size) // 2
        img = img.crop((left, top, left + size, top + size))

    # Resize to 16x16 and binarize
    img = img.resize((16, 16), Image.Resampling.LANCZOS)
    binary = (np.array(img) < threshold).astype(np.uint8)

    return binary


def create_blank_image():
    """Create a blank 16x16 image (all black)"""
    return np.zeros((16, 16), dtype=np.uint8)


def binary_to_bytes(binary):
    """Convert 16x16 binary data to 32 bytes"""
    data = []

    for x in range(16):
        for page in range(2):
            byte = 0
            start_row = page * 8
            for bit in range(8):
                row = start_row + bit
                if row < 16 and binary[row][x] == 1:
                    byte |= (1 << (7 - bit))
            data.append(reverse_byte(byte))

    return bytes(data)


def binary_to_image(binary_data, size=64):
    """
    Convert 16x16 binary data to 64x64 RGBA image

    Args:
        binary_data: 16x16 numpy array of binary values
        size: Size to scale the image to (default 64)

    Returns:
        PIL Image in RGBA mode
    """
    # Create 16x16 RGBA image from binary data
    img_16 = Image.new('RGBA', (16, 16), (0, 0, 0, 255))  # Black for 1
    pixels = img_16.load()
    
    for y in range(16):
        for x in range(16):
            if binary_data[y][x] == 1:
                pixels[x, y] = (255, 255, 255, 255)  # White
            else:
                pixels[x, y] = (0, 0, 0, 255)  # Black
    
    # Scale to 64x64 using NEAREST for pixel-perfect scaling
    img_64 = img_16.resize((size, size), Image.Resampling.NEAREST)
    return img_64


def image_to_ico(image_path=None, binary_data=None, output_path="logo.ico", size=64):
    """
    Convert image or binary data to 64x64 32-bit ICO file

    Args:
        image_path: Path to the source image (optional if binary_data is provided)
        binary_data: 16x16 numpy array of binary values (optional if image_path is provided)
        output_path: Output ICO file path
        size: Size to scale the icon to (default 64)
    """
    try:
        if image_path and os.path.exists(image_path):
            img = Image.open(image_path).convert('RGBA')
            
            # If not square, crop the center region
            if img.width != img.height:
                min_size = min(img.width, img.height)
                left = (img.width - min_size) // 2
                top = (img.height - min_size) // 2
                img = img.crop((left, top, left + min_size, top + min_size))

            # Resize to 64x64 using LANCZOS for high quality
            img_64 = img.resize((size, size), Image.Resampling.LANCZOS)
        elif binary_data is not None:
            # Convert binary data to image and scale
            img_64 = binary_to_image(binary_data, size)
        else:
            print("Error: No image source provided")
            return False
            
    except Exception as e:
        print(f"Error: Failed to create ICO - {e}")
        return False

    # Save as ICO with 32-bit color depth
    img_64.save(output_path, format='ICO', sizes=[(size, size)])
    return True


class PixelGrid(Static):
    """16x16 pixel grid component"""

    class PixelClick(Message):
        def __init__(self, x: int, y: int):
            super().__init__()
            self.x = x
            self.y = y

    DEFAULT_CSS = """
    PixelGrid {
        width: auto;
        height: auto;
        padding: 0;
        background: $surface;
    }
    """

    def __init__(self, binary_data=None, id=None):
        super().__init__(id=id)
        self.binary_data = binary_data if binary_data is not None else np.zeros((16, 16), dtype=np.uint8)
        self.can_focus = True

    def update_data(self, binary_data):
        self.binary_data = binary_data
        self.refresh()

    def render(self):
        """Render the pixel grid"""
        lines = []
        # Top border
        lines.append("┌" + "─" * 32 + "┐")

        for y in range(16):
            line = "│"
            for x in range(16):
                if self.binary_data[y][x] == 1:
                    line += "██"
                else:
                    line += "  "
            line += "│"
            lines.append(line)

        # Bottom border
        lines.append("└" + "─" * 32 + "┘")

        return "\n".join(lines)

    def on_click(self, event: events.Click):
        """Handle click event"""
        # Get coordinates relative to the component
        # Use event.offset to get coordinates relative to the component
        try:
            local_x = event.offset_x
            local_y = event.offset_y
        except AttributeError:
            # If offset attribute doesn't exist, use event coordinates
            local_x = event.x if hasattr(event, 'x') else 0
            local_y = event.y if hasattr(event, 'y') else 0

        # Render format:
        # Row 0: ┌────────────────────────────────┐ (top border)
        # Rows 1-16: │██  ██  ...  │ (pixel rows, 16 pixels per row, 2 chars per pixel)
        # Row 17: └────────────────────────────────┘ (bottom border)
        # Column positions: 0 is left border │, 1-32 is pixel area (2 chars per pixel), 33 is right border │

        # Check if within pixel grid area (y from 1 to 16, since row 0 is top border)
        if local_y >= 1 and local_y <= 16:
            grid_y = local_y - 1
            # Check if x is within valid range (1 to 32, since there are borders on both sides)
            if local_x >= 1 and local_x <= 32:
                # Each pixel takes 2 chars, (1,2) is column 0, (3,4) is column 1, etc.
                grid_x = (local_x - 1) // 2
                if 0 <= grid_x < 16 and 0 <= grid_y < 16:
                    self.post_message(self.PixelClick(grid_x, grid_y))


class LanguageSelectApp(App):
    """Language selection screen"""

    CSS = """
    Screen {
        background: $surface;
    }

    #lang-container {
        width: 100%;
        height: 100%;
        content-align: center middle;
    }

    #lang-title {
        text-align: center;
        text-style: bold;
        padding: 2 0;
    }

    #lang-buttons {
        width: auto;
        height: auto;
        content-align: center middle;
    }

    Button {
        margin: 1 2;
        min-width: 20;
    }
    """

    def __init__(self):
        super().__init__()
        self.selected_language = 'zh'  # Default to Chinese

    def compose(self) -> ComposeResult:
        with Container(id="lang-container"):
            yield Label("选择语言 / Select Language", id="lang-title")
            with Horizontal(id="lang-buttons"):
                yield Button("中文 (Chinese)", id="btn-chinese", variant="primary")
                yield Button("English", id="btn-english", variant="success")

    def on_button_pressed(self, event: Button.Pressed):
        if event.button.id == "btn-chinese":
            self.selected_language = 'zh'
            self.exit('zh')
        elif event.button.id == "btn-english":
            self.selected_language = 'en'
            self.exit('en')


class LogoApp(App):
    """Logo conversion TUI application"""

    CSS = """
    Screen {
        background: $surface;
    }

    #main-container {
        width: 100%;
        height: 100%;
        padding: 1 2;
    }

    #title {
        text-align: center;
        text-style: bold;
        padding: 1 0;
    }

    #threshold-container {
        width: 100%;
        height: auto;
        padding: 1 2;
        content-align: center middle;
    }

    #threshold-value {
        text-align: center;
        padding: 0 1;
        width: 20;
    }

    #button-container {
        width: 100%;
        height: auto;
        content-align: center middle;
        padding: 1 0;
    }

    Button {
        margin: 0 1;
    }

    #status {
        text-align: center;
        padding: 1 0;
        text-style: italic;
    }

    #help-text {
        text-align: center;
        padding: 1 0;
        color: $text-muted;
    }
    """

    BINDINGS = [
        Binding("q", "quit", "Quit"),
        Binding("d", "export", "Export"),
        Binding("r", "reset", "Reset"),
        Binding("i", "invert", "Invert"),
        Binding("up", "threshold_up", "Threshold +10"),
        Binding("down", "threshold_down", "Threshold -10"),
        Binding("left", "threshold_down_small", "Threshold -1"),
        Binding("right", "threshold_up_small", "Threshold +1"),
    ]

    def __init__(self, image_path=None, language='zh'):
        super().__init__()
        self.image_path = image_path
        self.language = language
        self.lang = LANGUAGES[language]
        self.original_binary = None
        self.current_binary = None
        self.threshold = 128
        self.has_image = image_path is not None

        # Update bindings with selected language
        self.BINDINGS = [
            Binding("q", "quit", self.lang['binding_quit']),
            Binding("d", "export", self.lang['binding_export']),
            Binding("r", "reset", self.lang['binding_reset']),
            Binding("i", "invert", self.lang['binding_invert']),
            Binding("up", "threshold_up", self.lang['binding_threshold_up']),
            Binding("down", "threshold_down", self.lang['binding_threshold_down']),
            Binding("left", "threshold_down_small", self.lang['binding_threshold_down_small']),
            Binding("right", "threshold_up_small", self.lang['binding_threshold_up_small']),
        ]

    def compose(self) -> ComposeResult:
        yield Header()
        with Container(id="main-container"):
            if self.has_image:
                yield Label(self.lang['app_title'], id="title")
                # Contrast control area: [Contrast-] Current value [Contrast+]
                with Horizontal(id="threshold-container"):
                    yield Button(self.lang['contrast_minus'], id="threshold-minus-btn", variant="primary")
                    yield Label(self.lang['current_contrast'].format(self.threshold), id="threshold-value-label")
                    yield Button(self.lang['contrast_plus'], id="threshold-plus-btn", variant="primary")
            else:
                yield Label(self.lang['app_title_editor'], id="title")
            yield PixelGrid(id="pixel-grid")
            yield Label(self.lang['click_hint'], id="click-hint")
            # Action button area: Invert | Reset | Export | Quit
            with Horizontal(id="button-container"):
                yield Button(self.lang['btn_invert'], id="invert-btn", variant="default")
                yield Button(self.lang['btn_reset'], id="reset-btn", variant="warning")
                yield Button(self.lang['btn_export'], id="export-btn", variant="success")
                yield Button(self.lang['btn_quit'], id="quit-btn", variant="error")
            yield Label("", id="status")
            if self.has_image:
                yield Label(self.lang['help_text_with_image'], id="help-text")
            else:
                yield Label(self.lang['help_text_editor'], id="help-text")
        yield Footer()

    def on_mount(self):
        """When app starts"""
        self.pixel_grid = self.query_one("#pixel-grid", PixelGrid)
        self.threshold_value_label = self.query_one("#threshold-value-label", Label) if self.has_image else None
        self.status = self.query_one("#status", Label)

        if self.has_image:
            self.load_image(self.image_path)
        else:
            self.current_binary = create_blank_image()
            self.pixel_grid.update_data(self.current_binary)
            self.status.update(self.lang['status_blank_canvas'])

    def load_image(self, path):
        """Load image"""
        self.original_binary = process_image(path, self.threshold)
        if self.original_binary is not None:
            self.current_binary = self.original_binary.copy()
            self.pixel_grid.update_data(self.current_binary)
            self.status.update(self.lang['status_loaded'].format(path))
        else:
            self.status.update(self.lang['status_load_failed'].format(path))

    def update_threshold(self, new_value: int):
        """Update threshold"""
        new_value = max(0, min(255, new_value))
        if new_value != self.threshold:
            self.threshold = new_value
            if self.threshold_value_label:
                self.threshold_value_label.update(self.lang['current_contrast'].format(self.threshold))
            if self.original_binary is not None:
                self.current_binary = process_image(self.image_path, self.threshold)
                self.pixel_grid.update_data(self.current_binary)
            self.status.update(self.lang['status_contrast'].format(self.threshold))

    def on_button_pressed(self, event: Button.Pressed):
        """Button press event"""
        button_id = event.button.id

        if button_id == "invert-btn":
            self.action_invert()
        elif button_id == "reset-btn":
            self.action_reset()
        elif button_id == "export-btn":
            self.action_export()
        elif button_id == "quit-btn":
            self.action_quit()
        elif button_id == "threshold-plus-btn":
            self.action_threshold_up()
        elif button_id == "threshold-minus-btn":
            self.action_threshold_down()

    def on_pixel_grid_pixel_click(self, event: PixelGrid.PixelClick):
        """Pixel click event"""
        if self.current_binary is not None:
            # Toggle pixel value
            self.current_binary[event.y][event.x] = 1 - self.current_binary[event.y][event.x]
            self.pixel_grid.update_data(self.current_binary)
            self.status.update(self.lang['status_pixel_toggled'].format(event.x, event.y))

    def action_invert(self):
        """Invert all pixels"""
        if self.current_binary is not None:
            self.current_binary = 1 - self.current_binary
            self.pixel_grid.update_data(self.current_binary)
            self.status.update(self.lang['status_inverted'])

    def action_reset(self):
        """Reset to original image or clear"""
        if self.has_image and self.original_binary is not None:
            self.current_binary = self.original_binary.copy()
            self.pixel_grid.update_data(self.current_binary)
            self.status.update(self.lang['status_reset_image'])
        else:
            self.current_binary = create_blank_image()
            self.pixel_grid.update_data(self.current_binary)
            self.status.update(self.lang['status_reset_canvas'])

    def action_export(self):
        """Export logo.bin and logo.ico"""
        if self.current_binary is None:
            self.status.update(self.lang['status_export_error'])
            return

        data = binary_to_bytes(self.current_binary)

        with open("logo.bin", "wb") as f:
            f.write(data)

        # Export 64x64 32-bit ICO file
        if self.has_image and self.image_path:
            image_to_ico(self.image_path, "logo.ico", size=64)
        else:
            # Export from current canvas (16x16 -> 64x64)
            image_to_ico(binary_data=self.current_binary, output_path="logo.ico", size=64)

        self.status.update(self.lang['status_exported'])

    def action_threshold_up(self):
        """Increase threshold by 10"""
        if self.has_image:
            self.update_threshold(self.threshold + 10)

    def action_threshold_down(self):
        """Decrease threshold by 10"""
        if self.has_image:
            self.update_threshold(self.threshold - 10)

    def action_threshold_up_small(self):
        """Increase threshold by 1"""
        if self.has_image:
            self.update_threshold(self.threshold + 1)

    def action_threshold_down_small(self):
        """Decrease threshold by 1"""
        if self.has_image:
            self.update_threshold(self.threshold - 1)

    def action_quit(self):
        self.exit()


def main():
    image_path = None

    # First, show language selection screen
    lang_app = LanguageSelectApp()
    selected_language = lang_app.run()

    if len(sys.argv) >= 2:
        image_path = sys.argv[1]
        if not os.path.exists(image_path):
            print(f"Error: File not found - {image_path}")
            return

    app = LogoApp(image_path, language=selected_language)
    app.run()


if __name__ == "__main__":
    main()
