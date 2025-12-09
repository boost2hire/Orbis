import os
import time
import threading

CAPTURE_DIR = "captures"
EXPIRY_SECONDS = 2 * 24 * 60 * 60   # 2 days


def delete_old_photos():
    while True:
        now = time.time()

        if not os.path.exists(CAPTURE_DIR):
            time.sleep(3600)
            continue

        for filename in os.listdir(CAPTURE_DIR):
            path = os.path.join(CAPTURE_DIR, filename)

            if not os.path.isfile(path):
                continue

            created = os.path.getmtime(path)

            if now - created > EXPIRY_SECONDS:
                try:
                    os.remove(path)
                    print(f"🗑 Deleted old photo: {filename}")
                except:
                    pass

        time.sleep(3600)  # Run every hour


def start_cleanup_thread():
    thread = threading.Thread(target=delete_old_photos, daemon=True)
    thread.start()
    print("🧹 Auto-cleanup thread started")
