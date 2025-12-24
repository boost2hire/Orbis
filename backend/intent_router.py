import traceback
import json
from datetime import datetime
from flask import request, jsonify
from ai.lumi_ai import lumi_think
from intent_parser import parse_alarm
from tts_engine import speak_async  # or wherever speak_async lives


def register_intent_route(app, socketio):

    @app.route("/voice/intent", methods=["POST"])
    def voice_intent():
        try:
            data = request.get_json() or {}
            text = (data.get("text") or "").lower().strip()
            print("🗣 Voice intent received:", repr(text))

            socketio.emit("voice_text", {"text": text})

            # ---------------------------------
            # IGNORE NOISE
            # ---------------------------------
            noise_words = {"ah", "haan", "hmm", "huh", "yo", "ok", "okay", "uh", "um"}
            if not text or text in noise_words:
                socketio.emit("voice_end")
                return jsonify({"ignored": True})

            # ---------------------------------
            # 🤖 GPT INTENT LAYER
            # ---------------------------------
            try:
                result = lumi_think(text)
                print("🤖 GPT RESULT:", result)
            except Exception as e:
                print("❌ GPT CALL FAILED:", e)
                payload = {"type": "ERROR", "say": "GPT service is unavailable."}
                socketio.emit("voice_response", payload)
                socketio.emit("voice_end")
                return jsonify(payload), 500

           # ---------------------------------
            # CASE 1: NORMAL CHAT / OUTFIT (STRING)
            # ---------------------------------
            if isinstance(result, str):
                payload = {"type": "CHAT", "say": result}

                # 🔊 SPEAK FIRST
                speak_async("Yes?")

                # Optional UI sync
                socketio.emit("voice_response", payload)
                socketio.emit("voice_end")

                return jsonify(payload)


            # ---------------------------------
            # CASE 2: STRUCTURED GPT RESPONSE (DICT)
            # ---------------------------------
            gpt = result

            # ---------------------------------
            # CONFIRMATION REQUIRED
            # ---------------------------------
            if gpt.get("needs_confirmation"):
                socketio.emit("confirm_intent", gpt)
                socketio.emit("voice_end")
                return jsonify({"confirm": True})

            intent = gpt.get("intent", "").upper()

            # ---------------------------------
            # ⏰ ALARM (GPT CONFIRMED)
            # ---------------------------------
            if intent == "SET_ALARM":
                details = gpt.get("details", {})
                socketio.emit("alarm_set", details)

                payload = {
                    "type": "SET_ALARM",
                    "say": gpt.get("confirmation_message", "Alarm set.")
                }
                socketio.emit("voice_response", payload)
                socketio.emit("voice_end")
                return jsonify(payload)

            # ---------------------------------
            # 👕 OUTFIT (REQUEST FRAME)
            # ---------------------------------
            if intent == "OUTFIT_SUGGEST":
                socketio.emit("request_frame_for_outfit", {"reason": "voice_request"})
                payload = {
                    "type": "OUTFIT_PENDING",
                    "say": "Hold on, capturing your outfit..."
                }
                socketio.emit("voice_response", payload)
                socketio.emit("voice_end")
                return jsonify(payload), 202

            # ---------------------------------
            # 📷 QR CODE (MUST COME BEFORE PHOTO)
            # ---------------------------------
            QR_WORDS = ("qr", "qr code", "show qr", "download photo", "download photos")
            if any(k in text for k in QR_WORDS):
                try:
                    import qrcode, base64, socket
                    from io import BytesIO

                    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                    try:
                        s.connect(("8.8.8.8", 80))
                        local_ip = s.getsockname()[0]
                    finally:
                        s.close()

                    gallery_url = f"http://{local_ip}:5001/gallery"

                    qr = qrcode.QRCode(
                        version=1,
                        error_correction=qrcode.constants.ERROR_CORRECT_H,
                        box_size=12,
                        border=2,
                    )
                    qr.add_data(gallery_url)
                    qr.make(fit=True)

                    img = qr.make_image(fill_color="black", back_color="white")
                    buf = BytesIO()
                    img.save(buf, format="PNG")
                    qr_b64 = base64.b64encode(buf.getvalue()).decode()

                    payload = {
                        "type": "SHOW_QR",
                        "say": "Here is the QR code to download your photos.",
                        "qr": "data:image/png;base64," + qr_b64
                    }

                    socketio.emit("voice_response", payload)
                    socketio.emit("voice_end")
                    return jsonify(payload)

                except Exception as e:
                    print("QR ERROR:", e)
                    payload = {"type": "ERROR", "say": "Failed to generate QR."}
                    socketio.emit("voice_response", payload)
                    socketio.emit("voice_end")
                    return jsonify(payload), 500

            # ---------------------------------
            # 📸 PHOTO (AFTER QR)
            # ---------------------------------
            PHOTO_WORDS = ("take photo", "capture photo", "snap a photo", "take my photo")
            if any(k in text for k in PHOTO_WORDS):
                socketio.emit("request_photo")
                payload = {
                    "type": "REQUEST_PHOTO",
                    "say": "Capturing your photo."
                }
                socketio.emit("voice_response", payload)
                socketio.emit("voice_end")
                return jsonify(payload)

            # ---------------------------------
            # 🌦 WEATHER
            # ---------------------------------
            if "weather" in text:
                from weather_routes import get_weather
                w = get_weather()
                payload = {
                    "type": "WEATHER",
                    "say": f"The temperature is {w['temp']}°C with {w['description']}.",
                    "weather": w
                }
                socketio.emit("voice_response", payload)
                socketio.emit("voice_end")
                return jsonify(payload)

            # ---------------------------------
            # ⏱ TIME
            # ---------------------------------
            if "time" in text:
                now = datetime.now().strftime("%I:%M %p")
                payload = {"type": "TIME", "say": f"It is {now}."}
                socketio.emit("voice_response", payload)
                socketio.emit("voice_end")
                return jsonify(payload)

            # ---------------------------------
            # 🎵 MUSIC
            # ---------------------------------
            if text.startswith("play") or "song" in text or "music" in text:
                query = (
                    text.replace("play", "")
                        .replace("music", "")
                        .replace("song", "")
                        .strip()
                    or "popular songs"
                )
                socketio.emit("play_song", {"query": query})
                payload = {"type": "MUSIC", "say": f"Playing {query}."}
                socketio.emit("voice_response", payload)
                socketio.emit("voice_end")
                return jsonify(payload)

            if "pause" in text:
                socketio.emit("music_pause")
                socketio.emit("voice_end")
                return jsonify({"type": "MUSIC", "say": "Paused the music."})

            if "resume" in text or "continue" in text:
                socketio.emit("music_resume")
                socketio.emit("voice_end")
                return jsonify({"type": "MUSIC", "say": "Resuming music."})

            if "next" in text:
                socketio.emit("music_next")
                socketio.emit("voice_end")
                return jsonify({"type": "MUSIC", "say": "Playing next song."})

            if "previous" in text or "back" in text:
                socketio.emit("music_prev")
                socketio.emit("voice_end")
                return jsonify({"type": "MUSIC", "say": "Playing previous track."})

            if "stop music" in text:
                socketio.emit("music_stop")
                socketio.emit("voice_end")
                return jsonify({"type": "MUSIC", "say": "Stopping the music."})

            # ---------------------------------
            # FALLBACK
            # ---------------------------------
            payload = {"type": "UNKNOWN", "say": "Sorry, I didn't understand."}
            socketio.emit("voice_response", payload)
            socketio.emit("voice_end")
            return jsonify(payload)

        except Exception as e:
            traceback.print_exc()
            payload = {"type": "ERROR", "say": "Internal error."}
            socketio.emit("voice_response", payload)
            socketio.emit("voice_end")
            return jsonify(payload), 500
