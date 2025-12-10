"# Orbis Project" 

// Orbis File Structure 

orbis/
├── README.md
├── .gitignore
├── .gitattributes

├── backend/                         # Flask AI Backend (Brain)
│   ├── .env
│   ├── app.py
│   ├── intent_router.py
│   ├── chat_routes.py
│   ├── camera.py
│   ├── photo.py
│   ├── photo_routes.py
│   ├── outfit_images.py
│   ├── qr_routes.py
│   ├── weather_routes.py
│   ├── cleanup_photos.py
│   ├── test_camera.py
│   ├── test_output.jpg
│   ├── requirements.txt
│
│   ├── captures/                   # Runtime camera photos (ignored)
│   ├── services/
│   │   ├── photos.py
│   │   ├── vision.py
│   │   └── debug/
│   └── venv/                       # Python virtual env (ignored)

├── frontend/                        # Smart Mirror UI (React + Electron)
│   ├── .env
│   ├── .gitignore
│   ├── bun.lockb
│   ├── components.json
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── postcss.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   ├── README.md
│
│   ├── electron/
│   │   └── app-shell/
│   │       ├── main.js
│   │       ├── preload.js
│   │       ├── package.json
│   │       └── package-lock.json
│
│   └── src/
│       ├── App.tsx
│       ├── App.css
│       ├── index.css
│       ├── main.tsx
│       ├── vite-env.d.ts
│       │
│       ├── voice/
│       │   ├── actions/
│       │   │   ├── handlePhoto.ts
│       │   │   └── handleQR.ts
│       │   ├── useHybridVoiceEngine.ts
│       │   ├── useVoice.ts
│       │   ├── useVoiceSocket.ts
│       │   └── wakeWord.ts
│       │
│       ├── components/
│       │   ├── mirror/
│       │   │   ├── MusicPlayer.tsx
│       │   │   ├── TimeDisplay.tsx
│       │   │   ├── WeatherWidget.tsx
│       │   │   └── CalendarWidget.tsx
│       │   └── ui/
│       │
│       ├── pages/
│       ├── hooks/
│       ├── assets/
│       └── utils/

├── voice/
│   └── lumiVoice/                  # Offline Voice AI Engine
│       ├── .env
│       ├── voice_engine.py
│       ├── test_whisper.py
│       ├── test.wav
│       ├── test.wav.json
│       ├── cmd.wav
│       ├── LICENSE.txt
│       ├── vfcompat.dll
│       ├── appverifUI.dll
│       │
│       ├── keywords/
│       │   └── Hey-Lumi_en_windows_v3_0_0.ppn
│       │
│       ├── models/
│       │   ├── ggml-tiny.en.bin
│       │   └── porcupine_params.pv
│       │
│       └── whisper/
│           ├── main.exe
│           ├── server.exe
│           ├── stream.exe
│           ├── whisper.dll
│           └── Release/
│               ├── whisper-cli.exe
│               ├── whisper-server.exe
│               ├── ggml.dll
│               └── libopenblas.dll

├── vision/                         # Reserved for future CV experiments


## 🚀 Setup Instructions
Prerequisites

Before installation, make sure you have:

Python 3.10+ installed

Node.js 18+ and npm installed

OpenAI API key (for chat + vision)

Microphone + Camera (for voice + mirror UI)

(Optional) Electron for desktop mirror mode

🧠 Backend Setup (Flask AI Brain)
1. Navigate to backend directory
cd backend

2. Create a virtual environment
python -m venv venv

3. Activate the environment

Windows

venv\Scripts\activate

1. Install dependencies
pip install -r requirements.txt

1. Create .env file

Inside backend/.env, add:

OPENAI_API_KEY=your_openai_api_key_here
WEATHER_API_KEY=your_weather_key_here

(Add anything else your backend uses.)
6. Run the backend server
python app.py


Backend will run at:

http://localhost:5001

🖥️ Frontend Setup (React + Vite Smart Mirror UI)
1. Navigate to frontend directory
cd frontend

2. Install dependencies
npm install

3. Run development server
npm run dev


Frontend runs at:

http://localhost:5173

4. Build for production
npm run build

🖥️ Electron App Setup (Desktop Mirror Mode)

Inside frontend:

cd frontend/electron/app-shell
npm install
npm start


This launches a frameless desktop app designed to run on a wall-mounted smart mirror.

🎤 Lumi Voice Engine Setup (Offline Wake Word + Whisper)
1. Navigate to LumiVoice engine
cd voice/lumiVoice

2. Install dependencies
pip install -r requirements.txt   # if you create one


(Your folder includes binaries + Python scripts.)

3. Add .env file

Inside voice/lumiVoice/.env:

PICOVOICE_ACCESS_KEY=your_api_key_here

4. Run the voice engine
python voice_engine.py


This enables:

“Hey Lumi” wake word (Porcupine)

Whisper STT (offline)

Real-time voice commands

Communication with frontend via socket

📱 How to Use Orbis
1. Start all systems:

Backend → http://localhost:5000

Frontend → http://localhost:5173

Electron app (optional)

LumiVoice engine (optional but recommended)

2. Open the frontend in a browser or Electron
3. Allow camera + microphone permissions
4. Speak voice commands or use UI buttons

Examples:

“Lumi, play music”

“Lumi, show me today’s weather”

“Lumi, take my photo”

“Lumi, what outfit should I wear?”

5. Mirror UI updates in real time
🔒 Safety & Privacy

Orbis always follows safety rules:

Safe: clothing, outfit details, colors, style

Never: gender, race, age, attractiveness

Local processing: wake word + STT run offline in LumiVoice

Your camera images stay on device unless you choose to save them

🌐 Deploying Orbis on a Smart Mirror Device
1. Deploy backend on a server or local Raspberry Pi

Update frontend .env:

VITE_BACKEND_URL=http://your-server-ip:5000

2. Build frontend
npm run build

3. Serve dist/ folder using any static server:
cd frontend/dist
python -m http.server 8080

4. Open the mirror UI via the mirror’s browser or fullscreen Electron
🛠️ Troubleshooting
❌ Camera not working

Ensure permissions granted

Check another app isn’t using the camera

❌ Voice not working

Microphone permissions not granted

Whisper DLLs missing (Windows)

Wake word engine not running

❌ Frontend can't reach backend

Check backend running on port 5000

Fix CORS in backend if needed

Update VITE_BACKEND_URL

❌ Electron crashes

Delete node_modules inside app-shell and reinstall

📦 Technologies Used
Backend

Flask

Python CV tools

OpenAI GPT APIs

Socket.IO

Frontend

React 19

TypeScript

Vite

Tailwind CSS

Socket.IO Client

Voice Engine

Porcupine (wake word)

Whisper (offline STT)

Python audio stack