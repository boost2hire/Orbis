from flask import Blueprint, jsonify, render_template_string
import os, qrcode, base64
from io import BytesIO

qr_bp = Blueprint("qr", __name__)
gallery_bp = Blueprint("gallery", __name__)

CAPTURE_DIR = "captures"
BASE_URL = "http://127.0.0.1:5001"


# ==========================================================
# 1️⃣ GALLERY PAGE – Shows ALL saved photos
# ==========================================================
@gallery_bp.route("/gallery", methods=["GET"])
def gallery_page():
    if not os.path.exists(CAPTURE_DIR):
        return "No photos found."

    files = [
        f for f in os.listdir(CAPTURE_DIR)
        if f.lower().endswith((".jpg", ".jpeg"))
    ]
    files.sort()

    html = """
    <html>
      <body style="font-family: Arial; padding: 20px; background: #111; color: #fff;">
        <h2 style="margin-bottom: 20px;">📸 Smart Mirror Gallery</h2>

        {% for f in files %}
          <div style="margin-bottom: 30px;">
            <img 
              src="{{ base }}/captures/{{ f }}" 
              style="width: 95%; border-radius: 12px; margin-bottom: 10px;"
            >
            <div>{{ f }}</div>
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
