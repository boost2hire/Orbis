import cv2
import os
import time
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CAPTURE_DIR = os.path.join(BASE_DIR, "captures")
os.makedirs(CAPTURE_DIR, exist_ok=True)

CAM_INDEX = int(os.getenv("CAM_INDEX", 0))

_camera = None


def _ensure_camera():
    """Open camera with correct exposure, gain & brightness."""
    global _camera
    if _camera is not None:
        return _camera

    cam = cv2.VideoCapture(CAM_INDEX, cv2.CAP_DSHOW)

    if not cam.isOpened():
        print("❌ Camera open failed")
        return None

    # -------------------------------
    # 📸 FIX EXPOSURE + BRIGHTNESS
    # -------------------------------

    # Enable auto exposure
    cam.set(cv2.CAP_PROP_AUTO_EXPOSURE, 0.75)  # Windows special value

    # If camera supports manual exposure, this helps brighten image
    cam.set(cv2.CAP_PROP_EXPOSURE, -4)  # (-6 too dark, -3 too bright)

    # Gain helps amplify signal in low light
    cam.set(cv2.CAP_PROP_GAIN, 20)

    # Brightness correction
    cam.set(cv2.CAP_PROP_BRIGHTNESS, 150)

    # Contrast and saturation (helps clothing detection)
    cam.set(cv2.CAP_PROP_CONTRAST, 60)
    cam.set(cv2.CAP_PROP_SATURATION, 70)

    # HD Resolution
    cam.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cam.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    cam.set(cv2.CAP_PROP_BUFFERSIZE, 1)

    # Warm-up
    for _ in range(10):
        cam.read()
        time.sleep(0.03)

    _camera = cam
    return cam



def _is_good_frame(frame):
    """Skip brightness filtering — we want ANY frame."""
    return frame is not None



def get_frame():
    """Retry until we get a usable frame."""
    cam = _ensure_camera()
    if cam is None:
        return None

    for _ in range(8):
        ret, frame = cam.read()
        if ret and frame is not None:
            return frame

    return None



def capture_photo(prefix="photo"):
    frame = get_frame()
    if frame is None:
        return None

    ts = int(datetime.now().timestamp())
    fname = f"{prefix}_{ts}.jpg"
    path = os.path.join(CAPTURE_DIR, fname)

    cv2.imwrite(path, frame)
    return fname
