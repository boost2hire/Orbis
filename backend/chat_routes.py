# chat_routes.py

import os
import requests
from flask import Blueprint, jsonify, request
from dotenv import load_dotenv

load_dotenv()

chat_bp = Blueprint("chat_bp", __name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions"


@chat_bp.route("/chat", methods=["POST"])
def chat():
    # PRINT RAW DEBUG
    print("RAW BODY:", request.data)
    print("HEADERS:", request.headers)

    # SAFE JSON PARSE
    data = request.get_json(silent=True)
    print("PARSED JSON:", data)

    if not data or "message" not in data:
        return jsonify({"reply": "No message received"}), 400

    user_msg = data["message"]

    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {"role": "system",
             "content": "You are lumi, a smart mirror assistant. Reply short and friendly."},
            {"role": "user", "content": user_msg},
        ],
        "temperature": 0.8,
    }

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    resp = requests.post(GROQ_CHAT_URL, json=payload, headers=headers)
    data = resp.json()

    try:
        reply = data["choices"][0]["message"]["content"]
    except:
        reply = "Iris had trouble understanding."

    return jsonify({"reply": reply})
