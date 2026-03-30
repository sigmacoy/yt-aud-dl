from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import yt_dlp
import os
import uuid
import re
import tempfile
import shutil

app = Flask(__name__)
CORS(app)  # Allow Brave extension to talk to this server

# Set Desktop path
DESKTOP_PATH = os.path.expanduser('~/Desktop')

@app.route('/download', methods=['POST'])
def download_audio():
    """
    Receive YouTube URL, download audio as MP3, save to Desktop
    """
    tmp_dir = None
    try:
        # Get URL and custom title from request
        data = request.get_json()
        url = data.get('url')
        custom_title = data.get('custom_title', 'audio')

        if not url:
            return jsonify({'error': 'No URL provided'}), 400

        print(f"📥 Downloading: {url}")
        print(f"📝 Custom title: {custom_title}")

        # Clean custom title for filename
        clean_title = re.sub(r'[<>:"/\\|?*]', '', custom_title)
        clean_title = clean_title.replace(' ', '_')

        # Create a temporary directory
        tmp_dir = tempfile.mkdtemp()
        unique_id = str(uuid.uuid4())[:8]
        temp_file = os.path.join(tmp_dir, f'{clean_title}_{unique_id}.%(ext)s')

        # Configure yt-dlp
        ydl_opts = {
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
            'outtmpl': temp_file,
            'quiet': False,
            'no_warnings': False,
        }

        # Download and convert
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            title = info.get('title', 'audio')
            print(f"✅ Downloaded: {title}")

            # Find the actual mp3 file
            mp3_file = None
            for file in os.listdir(tmp_dir):
                if file.endswith('.mp3'):
                    mp3_file = os.path.join(tmp_dir, file)
                    break

            if not mp3_file:
                return jsonify({'error': 'Could not find downloaded file'}), 500

            # Handle duplicates on Desktop
            final_filename = f'{clean_title}.mp3'
            final_path = os.path.join(DESKTOP_PATH, final_filename)
            
            counter = 1
            while os.path.exists(final_path):
                final_filename = f'{clean_title}_{counter}.mp3'
                final_path = os.path.join(DESKTOP_PATH, final_filename)
                counter += 1

            # Move file to Desktop
            shutil.move(mp3_file, final_path)
            print(f"📁 Moved to: {final_path}")

            # Return success response
            return jsonify({
                'success': True,
                'message': f'Saved to Desktop: {final_filename}',
                'path': final_path
            })

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        # Clean up on error
        if tmp_dir and os.path.exists(tmp_dir):
            shutil.rmtree(tmp_dir, ignore_errors=True)
        return jsonify({'error': str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    """Check if server is running"""
    return jsonify({'status': 'ok', 'message': 'Server is running'})


@app.route('/info', methods=['POST'])
def get_video_info():
    """
    Get video title without downloading
    """
    try:
        data = request.get_json()
        url = data.get('url')

        if not url:
            return jsonify({'error': 'No URL provided'}), 400

        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': True,  # Don't download, just get info
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            title = info.get('title', 'Unknown')

        return jsonify({'title': title})

    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    print("🎵 YouTube Audio Downloader Server")
    print(f"📁 Files will be saved to: {DESKTOP_PATH}")
    print("📍 Running at: http://localhost:5000")
    print("Press Ctrl+C to stop\n")
    app.run(host='0.0.0.0', port=5000, debug=True)