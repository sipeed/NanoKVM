import os
import shutil
import time
import zipfile
import pathlib
import requests

temporary: str = "/root/.kvm-cache/"


def mkdir() -> None:
    if pathlib.Path(temporary).exists():
        shutil.rmtree(temporary)
    pathlib.Path(temporary).mkdir()
    print(f"Created temporary directory {temporary}")


def read(file: str) -> str:
    return pathlib.Path(file).read_text().replace("\n", "")


def download_firmware() -> None:
    print("Downloading firmware...")

    now = int(time.time())
    url = f"https://cdn.sipeed.com/nanokvm/latest.zip?n={now}"
    print(f"Downloading firmware from {url}")

    response = requests.get(url)

    if response.status_code != 200:
        raise Exception(f"Failed to download firmware, status: {response.status_code}")

    content_type = response.headers.get("content-type")
    if content_type != "application/zip":
        raise Exception(f"Failed to download firmware, content_type: {content_type}")

    zip_file = f"{temporary}/latest.zip"
    with open(zip_file, "wb") as f:
        for chunk in response.iter_content(chunk_size=1024):
            f.write(chunk)

    with zipfile.ZipFile(zip_file, "r") as f:
        f.extractall(temporary)

    print("Completed downloading firmware.")


def download_lib():
    print("download lib...")

    device_key = read("/device_key")

    url = f"https://maixvision.sipeed.com/api/v1/nanokvm/encryption?uid={device_key}"
    headers = {"token": "MaixVision2024"}
    response = requests.get(url, headers=headers, stream=True)

    if response.status_code != 200:
        raise Exception(f"download lib failed, status: {response.status_code}")

    content_type = response.headers.get("content-type")
    if content_type != "application/octet-stream":
        raise Exception(f"download lib failed, content_type: {content_type}")

    lib_file = f"{temporary}/libmaixcam_lib.so"
    with open(lib_file, "wb") as f:
        f.write(response.content)

    lib_dir = f"{temporary}/latest/kvm_system/dl_lib/"
    shutil.copy(lib_file, lib_dir)

    print("download lib done")


def update() -> None:
    backup_dir   = pathlib.Path("/root/old")
    firmware_dir = pathlib.Path("/kvmapp")

    if backup_dir.exists():
      shutil.rmtree(backup_dir)

    if firmware_dir.exists():
      firmware_dir.rename(backup_dir)

    pathlib.Path(f"{temporary}/latest").rename(firmware_dir)


def change_permissions() -> None:
    for root, dirs, files in os.walk("/kvmapp"):
        os.chmod(root, 0o755)

        for file in files:
            file_path = os.path.join(root, file)
            os.chmod(file_path, 0o755)

    print("change permissions done")
 

def main() -> None:
    try:
        print("Stopping nanokvm service...")
        os.system("/etc/init.d/S95nanokvm stop")

        print("Staring update...")

        mkdir()
        download_firmware()
        # download_lib()
        update()
        change_permissions()

        version = read("/kvmapp/version")
        print(f"Successfully updated to version: {version}")
        print("restart service\nthe nanokvm will reboot")
    except Exception as e:
        print(f"update failed\n{e}")
    finally:
        shutil.rmtree(temporary)
        os.system("/etc/init.d/S95nanokvm restart")


if __name__ == "__main__":
    main()
