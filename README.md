# YouTube Audio Downloader

A browser extension that downloads audio from YouTube videos as MP3 files. Uses yt-dlp and ffmpeg with a Flask backend. Perfect for those hard-to-find compilations, J-Pop mixes, and rare tracks that aren't available on Spotify. <br>

$Warning:$ By using your account with yt-dlp, you run the risk of it being banned (temporarily or permanently). Be mindful with the request rate and amount of downloads you make with an account. Use it only when necessary, or consider using a throwaway account.

## Features

- Download audio from any YouTube video
- Custom MP3 filename before downloading
- Direct streaming - no files saved on server
- Saves to Brave's default download location

## Tech Stack
- **Frontend**: JavaScript (Brave/Chrome Extension)
- **Backend**: Python Flask
- **Downloader**: yt-dlp
- **Audio Conversion**: ffmpeg

## Prerequisites

- Python 3.8+
- Brave Browser (or any Chromium-based browser)
- Homebrew (for macOS)
- yt-dlp
- ffmpeg

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/sigmacoy/yt-aud-dl.git
```

### 2. Install ffmpeg (macOS)
```bash
brew install ffmpeg
```

### 3. Set Up Python Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate  # On macOS/Linux
# On Windows: venv\Scripts\activate
```

### 4. Install Python Dependencies
```bash
pip install flask flask-cors yt-dlp
```

### 5. Run Flask server
```bash
python server/app.py
```

### Keep the venv terminal window open <br> NOTE: Turn off Airplay Receiever MacOS

### 6. Load the Extension in Brave/Google
1. Open Brave/Google and go to brave://extensions or Google's ( chrome://extensions/ )
2. Enable Developer mode (top right)
3. Click Load unpacked
4. Select the extension folder from the project
5. The extension icon will appear in the toolbar