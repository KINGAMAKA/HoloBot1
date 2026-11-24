# AMAKA AI — first working robot interface

This is the first runnable version of the AMAKA AI robot: a full-screen hologram-inspired face, animated listening/thinking/speaking states, chat, browser speech recognition (where supported), Android/browser text-to-speech, PWA installation, and a configurable local-model API connector.

## Run it

### Quick preview
Open `index.html` in a modern browser. Chat works in demo mode. Speech features depend on browser permissions and support.

### Publish on GitHub Pages
1. Create or open the repository for the robot.
2. Upload the contents of this folder (not the ZIP itself).
3. In GitHub, open **Settings → Pages**.
4. Choose **Deploy from a branch**, select `main` and `/root`, then save.
5. Open the published URL on your Android phone and use **Add to Home screen**.

## Connect a local model

Open the gear icon and enter the model server's **OpenAI-compatible chat completions URL**, model name and optional API key.

Typical llama.cpp endpoint:
`http://127.0.0.1:8080/v1/chat/completions`

Important:
- The server must be running on the same phone.
- A GitHub Pages site is HTTPS. Android browsers generally block a secure HTTPS page from calling an insecure HTTP localhost endpoint (mixed-content / local-network restrictions).
- Therefore the GitHub Pages version is a visual prototype and can connect to remote HTTPS endpoints, but reliable same-phone local inference should use the Android WebView wrapper described below.
- PocketPal/AiPaca API availability and endpoint format depend on the app/version. Do not assume an app's local API is active just because a model is loaded.

## Recommended next step: Android WebView wrapper

Package this same web folder in a small Kotlin Android project. Load the files from the app's local assets (`file:///android_asset/...`) or use WebViewAssetLoader, then expose a narrowly scoped JavaScript bridge for native Android functions. The native layer can:
- call the local model endpoint without the GitHub Pages HTTPS-to-HTTP restriction;
- provide Android TextToSpeech and SpeechRecognizer;
- store model URL/settings locally;
- keep the interface offline.

Do not enable unrestricted `addJavascriptInterface` for arbitrary web pages. Only load trusted bundled assets and expose a small, explicit bridge.

## Current limitations

- This build is a polished 2D holographic face, not a true 3D scanned human or physical hologram.
- Speech recognition support varies by browser/device and may require an internet-backed recognition service. Android TTS may need an installed offline voice.
- The app does not yet control phone settings, read notifications, access files, or perform actions. Those require explicit Android permissions and native implementation.
- No AI model is bundled; the model stays in the local inference app/runtime.

## API format expected

The connector sends:
`POST /v1/chat/completions`
with `{ "model": "...", "messages": [...], "temperature": 0.7, "max_tokens": 400 }`

It expects a response shaped like:
`{ "choices": [{ "message": { "content": "..." } }] }`

## Project files

- `index.html` — interface and settings
- `styles.css` — holographic face and responsive layout
- `app.js` — chat, voice, and local API connector
- `manifest.webmanifest` + `sw.js` — installable/offline web shell
