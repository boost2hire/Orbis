import os
import traceback
from datetime import datetime
from flask import request, jsonify


def register_intent_route(app, socketio):

    @app.route("/voice/intent", methods=["POST"])
    def voice_intent():
        try:
            data = request.get_json() or {}
            text = (data.get("text") or "").lower().strip()
            print("🗣 Voice intent received:", repr(text))

            socketio.emit("voice_text", {"text": text})

            noise_words = {"ah","haan","hmm","huh","yo","ok","okay","uh","um"}
            if not text or text in noise_words:
                return jsonify({"ignored": True})

            # ----------------------------------------------
            # OUTFIT
            # ----------------------------------------------
            OUTFIT_KEYWORDS = {
                "suggest outfit","suggest","sujjest","so just","so jest",
                "rate my outfit","how do i look","what am i wearing",
                "analyze outfit","analyze my outfit","outfit","rate outfit",
            }

            def outfit_triggered(t):
                cleaned = t.replace(".", "").replace(",", "").replace("?", "")
                if any(k in cleaned for k in OUTFIT_KEYWORDS):
                    return True
                words = cleaned.split()
                if len(words) >= 2 and words[0] in ("so","su","sug","suggest") and "out" in words[-1]:
                    return True
                return False

            if outfit_triggered(text):
                print("👗 Outfit command detected — requesting UI frame")

                socketio.emit("request_frame_for_outfit", {"reason": "voice_request"})

                payload = {
                    "type": "OUTFIT_PENDING",
                    "say": "Hold on, capturing your outfit..."
                }

                socketio.emit("voice_response", payload)
                return jsonify(payload), 202

            # ----------------------------------------------
            # ✅ TAKE PHOTO (FIXED)
            # ----------------------------------------------
            if any(x in text for x in ("take photo", "capture photo", "photo", "snap a photo")):
                payload = {
                    "type": "REQUEST_PHOTO",
                    "say": "Capturing your photo."
                }

                socketio.emit("request_photo")          # ✅ tells Electron to capture
                socketio.emit("voice_response", payload)
                return jsonify(payload)

            # ----------------------------------------------
            # WEATHER
            # ----------------------------------------------
            if "weather" in text:
                from weather_routes import get_weather
                w = get_weather()
                payload = {
                    "type": "WEATHER",
                    "say": f"The temperature is {w['temp']}°C with {w['description']}.",
                    "weather": w
                }
                socketio.emit("voice_response", payload)
                return jsonify(payload)

            # ----------------------------------------------
            # TIME
            # ----------------------------------------------
            if "time" in text:
                now = datetime.now().strftime("%I:%M %p")
                payload = {"type": "TIME", "say": f"It is {now}."}
                socketio.emit("voice_response", payload)
                return jsonify(payload)

            # ----------------------------------------------
            # MUSIC CONTROLS
            # ----------------------------------------------
            if text.startswith("play") or "song" in text or "music" in text:
                query = text.replace("play", "").replace("music", "").replace("song", "").strip()
                if not query or query in ("songs", "music"):
                    query = "popular songs"

                socketio.emit("play_song", {"query": query})
                payload = {"type": "MUSIC", "say": f"Playing {query}."}
                socketio.emit("voice_response", payload)
                return jsonify(payload)

            if "pause" in text:
                socketio.emit("music_pause", {})
                payload = {"type": "MUSIC", "say": "Paused the music."}
                socketio.emit("voice_response", payload)
                return jsonify(payload)

            if "resume" in text or "continue" in text or "play again" in text:
                socketio.emit("music_resume", {})
                payload = {"type": "MUSIC", "say": "Resuming the music."}
                socketio.emit("voice_response", payload)
                return jsonify(payload)

            if "next" in text:
                socketio.emit("music_next", {})
                payload = {"type": "MUSIC", "say": "Playing next song."}
                socketio.emit("voice_response", payload)
                return jsonify(payload)

            if "previous" in text or "back" in text:
                socketio.emit("music_prev", {})
                payload = {"type": "MUSIC", "say": "Going to previous track."}
                socketio.emit("voice_response", payload)
                return jsonify(payload)

            if "stop music" in text or ("stop" in text and "music" in text):
                socketio.emit("music_stop", {})
                payload = {"type": "MUSIC", "say": "Stopping the music."}
                socketio.emit("voice_response", payload)
                return jsonify(payload)

            # ----------------------------------------------
            # FALLBACK
            # ----------------------------------------------
            payload = {"type": "UNKNOWN", "say": "Sorry, I didn't understand."}
            socketio.emit("voice_response", payload)
            return jsonify(payload)

        except Exception as e:
            traceback.print_exc()
            err = {"type": "ERROR", "say": "Internal error.", "error": str(e)}
            socketio.emit("voice_response", err)
            return jsonify(err), 500


