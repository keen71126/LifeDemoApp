# LifeDemoApp

Minimal Expo React Native + Node.js FFmpeg demo:

- Loads a 10-second sample video
- Adds a diagonal yellow text overlay "Life Demo" centered
- Exports in 9:16 (1080x1920) using FFmpeg
- Hosts output locally and also uploads to file.io for a temporary public link

## Prereqs

- Node 18+
- FFmpeg not required locally (bundled via ffmpeg-static)
- Expo CLI: `npm i -g expo` (optional)

## Install

```bash
npm install
```

## Run (two terminals)

Terminal A (server):

```bash
npm run server
```

Terminal B (Expo):

```bash
npm run start
```

By default the app calls `http://localhost:5000`. For Android emulator use:

```bash
$env:EXPO_PUBLIC_SERVER_URL="http://10.0.2.2:5000"; npm run start   # PowerShell
# or
EXPO_PUBLIC_SERVER_URL="http://10.0.2.2:5000" npm run start          # macOS/Linux
```

On a physical device, set `EXPO_PUBLIC_SERVER_URL` to your computer's LAN IP, e.g. `http://192.168.1.50:5000`.

## How it works

- `server/index.js` downloads a small stock clip (if missing), runs FFmpeg to scale/pad to 1080x1920 and overlays a rotated "Life Demo" text, then exposes a static download and attempts to upload to `file.io` for a temporary public link.
- The Expo app posts to `/render`, shows a preview with `expo-av`, and provides an open/download link.

## Deliverables to record

Record a < 1-minute screen capture showing:

1. Running the server and Expo app locally
2. Tapping "Generate 10s Video"
3. The generated video preview and opening the download link

## Notes

- Output auto-deletes after ~10 minutes from the server; `file.io` links are temporary by design.
- If `file.io` is rate-limiting, the local download link still works on the same network.

# LifeDemoApp
