from flask import Blueprint, jsonify, render_template_string
import os, qrcode, base64
from io import BytesIO

qr_bp = Blueprint("qr", __name__)
gallery_bp = Blueprint("gallery", __name__)

CAPTURE_DIR = "captures"
import socket

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    finally:
        s.close()
    return ip

BASE_URL = f"http://{get_local_ip()}:5001"



# ==========================================================
# 1️⃣ GALLERY PAGE – Shows ALL saved photos
# ==========================================================
@gallery_bp.route("/gallery", methods=["GET"])
def gallery_page():
    if not os.path.exists(CAPTURE_DIR):
        return "No photos found."

    files = [
        f for f in os.listdir(CAPTURE_DIR)
        if f.lower().endswith((".jpg", ".jpeg", ".png"))
    ]
    files.sort(reverse=True)

    html = """
    <html>
      <body style="font-family: Arial; padding: 20px; background: #111; color: #fff;">

        <h2 style="margin-bottom: 20px;">📸 Smart Mirror Gallery</h2>

        {% for f in files %}
          <div style="margin-bottom: 40px;">

            <!-- PHOTO PREVIEW -->
            <img 
              src="{{ base }}/captures/{{ f }}" 
              style="width: 100%; border-radius: 12px; margin-bottom: 10px;"
            >

            <!-- FILE NAME -->
            <div style="margin-bottom: 10px; font-size: 16px;">
              {{ f }}
            </div>

            <!-- DOWNLOAD BUTTON -->
            <a 
              href="{{ base }}/captures/{{ f }}" 
              download="{{ f }}" 
              style="
                display: inline-block; 
                padding: 10px 20px; 
                background: #0af; 
                color: white; 
                text-decoration: none; 
                border-radius: 8px;
                font-weight: bold;">
              ⬇️ Download
            </a>

          </div>
        {% endfor %}

      </body>
    </html>
    """

    return render_template_string(html, files=files, base=BASE_URL)


# ==========================================================
# 2️⃣ QR CODE – Only points to /gallery (NOT multiple URLs)
# ==========================================================
@qr_bp.route("/gallery-qr", methods=["GET"])
def gallery_qr():
    gallery_url = f"{BASE_URL}/gallery"

    qr = qrcode.QRCode(
        version=2,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )

    qr.add_data(gallery_url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buf = BytesIO()
    img.save(buf, format="PNG")

    qr_b64 = base64.b64encode(buf.getvalue()).decode()

    return jsonify({
        "qr_base64": f"data:image/png;base64,{qr_b64}",
        "gallery_url": gallery_url
    })
