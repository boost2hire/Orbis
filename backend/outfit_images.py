import requests
from flask import Blueprint, request, jsonify
import re

images_bp = Blueprint("images", __name__)
PEXELS_API_KEY = "658dJWiWYz54iKLopZ1iFOZayussH64cjglLeJv83PCZkqmJ1ksGg85x"

# ---------------------------------------------------------
# 1️⃣ SMART CLOTHING ITEM EXTRACTOR
# ---------------------------------------------------------
def extract_clothing_items(text: str):
    keywords = [
        "bomber jacket", "denim jacket", "leather jacket",
        "hoodie", "zip-up", "coat", "sweater", "t-shirt", "shirt",
        "jeans", "pants", "trousers", "cargo", "denim",
        "sneakers", "shoes", "boots", "chelsea boots", "loafers"
    ]

    found = []
    text_lower = text.lower()

    for item in keywords:
        if item in text_lower:
            # Capture color + item (e.g., "white hoodie")
            pattern = r"(\b[\w\-]+\s+)?(" + re.escape(item) + r"\b)"
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                found.append(match.group().strip())

    # Sort by longest phrase (more specific)
    found = list(set(found))
    found.sort(key=lambda x: len(x), reverse=True)

    # Return top 1–2 important items
    return found[:2]


# ---------------------------------------------------------
# 2️⃣ PRE-FLIGHT HANDLER (fixes Chrome automatic prefetch)
# ---------------------------------------------------------
@images_bp.route("/images", methods=["OPTIONS"])
def images_options():
    return jsonify({"ok": True}), 200


# ---------------------------------------------------------
# 3️⃣ FETCH CLEAN OUTFIT IMAGES (FILTERED)
# ---------------------------------------------------------
def fetch_clean_outfit_images(query: str):
    headers = {"Authorization": PEXELS_API_KEY}

    url = (
        "https://api.pexels.com/v1/search"
        f"?query={query} outfit fashion streetwear men style"
        "&per_page=10"
    )

    res = requests.get(url, headers=headers).json()
    photos = res.get("photos", [])

    clean_images = []

    for p in photos:
        alt = p.get("alt", "").lower()

        # Filter only relevant fashion/outfit images
        if not any(word in alt for word in [
            "outfit", "fashion", "streetwear", "style", "jacket",
            "hoodie", "pants", "jeans", "coat", "mens fashion"
        ]):
            continue

        clean_images.append({
            "url": p["src"]["medium"],
            "caption": alt or "Recommended outfit"
        })

        if len(clean_images) >= 3:
            break

    # Fallback: use first 3 images if filtering gives nothing
    if not clean_images:
        clean_images = [{
            "url": p["src"]["medium"],
            "caption": p.get("alt", "Outfit idea")
        } for p in photos[:3]]

    return clean_images[:3]  # Ensure max 3 images


# ---------------------------------------------------------
# 4️⃣ API ROUTE — SMART OUTFIT IMAGE SUGGESTION
# ---------------------------------------------------------
@images_bp.route("/images", methods=["POST"])
def get_outfit_images():
    # This prevents 415 errors from Chrome/Edge prefetch
    data = request.get_json(silent=True)

    # If the browser sent an empty/AUTO preflight POST → return safely
    if not data or "query" not in data:
        return jsonify({
            "error": "Missing query",
            "items": [],
            "query_used": "",
            "images": []
        }), 200

    suggestion = data.get("query", "").strip()

    # Extract clothing items
    items = extract_clothing_items(suggestion)

    # Build smart query
    if len(items) > 0:
        query = items[0]  # Most specific detected clothing item
    else:
        query = "men fashion outfit"

    # Fetch filtered outfit images
    images = fetch_clean_outfit_images(query)

    return jsonify({
        "items": items,
        "query_used": query,
        "images": images
    })
