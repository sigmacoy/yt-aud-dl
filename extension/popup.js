// Server configuration
const SERVER_URL = 'http://localhost:5000';

// DOM elements
const urlDisplay = document.getElementById('urlDisplay');
const customTitleInput = document.getElementById('customTitle');
const autoTitleBtn = document.getElementById('autoTitleBtn');
const downloadBtn = document.getElementById('downloadBtn');
const statusDiv = document.getElementById('status');
const serverStatusDiv = document.getElementById('serverStatus');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');

let progressInterval;
let currentVideoTitle = '';
let currentVideoUrl = '';

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${SERVER_URL}/health`);
    if (response.ok) {
      serverStatusDiv.innerHTML = '🟢 Server online';
      serverStatusDiv.className = 'server-status server-online';
      return true;
    } else {
      throw new Error('Server not responding');
    }
  } catch (error) {
    serverStatusDiv.innerHTML = '🔴 Server offline - Run: python3 server/app.py';
    serverStatusDiv.className = 'server-status server-offline';
    return false;
  }
}

// Get current YouTube URL from active tab
async function getYouTubeUrl() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab.url;
    
    if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
      urlDisplay.textContent = url;
      currentVideoUrl = url;
      downloadBtn.disabled = false;
      customTitleInput.disabled = false;
      
      // Fetch video title
      await fetchVideoTitle(url);
      
      return url;
    } else {
      urlDisplay.textContent = '❌ Not a YouTube video';
      customTitleInput.disabled = true;
      customTitleInput.placeholder = 'Not a YouTube video';
      downloadBtn.disabled = true;
      return null;
    }
  } catch (error) {
    urlDisplay.textContent = '❌ Error getting URL';
    customTitleInput.disabled = true;
    downloadBtn.disabled = true;
    return null;
  }
}

// Fetch video title from server
async function fetchVideoTitle(url) {
  try {
    customTitleInput.placeholder = 'Loading title...';
    
    const response = await fetch(`${SERVER_URL}/info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: url })
    });
    
    if (response.ok) {
      const data = await response.json();
      currentVideoTitle = data.title;
      customTitleInput.placeholder = currentVideoTitle;
      customTitleInput.value = currentVideoTitle;
    } else {
      customTitleInput.placeholder = 'Could not fetch title';
    }
  } catch (error) {
    customTitleInput.placeholder = 'Error loading title';
  }
}

// Auto-fill with video title
autoTitleBtn.addEventListener('click', () => {
  if (currentVideoTitle) {
    customTitleInput.value = currentVideoTitle;
    showStatus('Auto-filled with video title', 'success');
  } else {
    showStatus('No video title available', 'error');
  }
});

// Show status message
function showStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  
  setTimeout(() => {
    if (statusDiv.className.includes(type)) {
      statusDiv.style.display = 'none';
      statusDiv.className = 'status';
    }
  }, 3000);
  statusDiv.style.display = 'block';
}

// Clean filename (remove invalid characters)
function cleanFilename(title) {
  // Remove invalid filename characters
  let cleaned = title.replace(/[<>:"/\\|?*]/g, '');
  // Remove extra spaces
  cleaned = cleaned.trim();
  return cleaned;
}




// Download audio from YouTube
async function downloadAudio(url, customTitle) {
  try {
    downloadBtn.disabled = true;
    customTitleInput.disabled = true;
    downloadBtn.textContent = '⏳ Downloading...';
    showStatus('Processing video... This may take a minute', 'loading');

    // Start progress bar
    startProgress();

    // Send request to Flask server
    const response = await fetch(`${SERVER_URL}/download`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        url: url,
        custom_title: customTitle
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Download failed');
    }

    // Get the MP3 file
    const blob = await response.blob();

    // Finish progress bar
    finishProgress();

    // Get filename from response
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `${customTitle}.mp3`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?(.+)"?/);
      if (match) filename = match[1];
    }

    // Trigger download - Brave saves to its default location
    const downloadUrl = URL.createObjectURL(blob);
    chrome.downloads.download({
      url: downloadUrl,
      filename: filename,
      conflictAction: 'uniquify'
    }, (downloadId) => {
      URL.revokeObjectURL(downloadUrl);
      if (chrome.runtime.lastError) {
        showStatus('Download failed: ' + chrome.runtime.lastError.message, 'error');
      } else {
        showStatus(`✅ Downloaded: ${filename}`, 'success');
      }
    });

  } catch (error) {
    console.error('Download error:', error);
    showStatus(`❌ Error: ${error.message}`, 'error');

    // Stop progress bar on error
    finishProgress();

  } finally {
    downloadBtn.disabled = false;
    customTitleInput.disabled = false;
    downloadBtn.textContent = '📥 Download MP3';
  }
}



// Handle download button click
downloadBtn.addEventListener('click', async () => {
  if (!currentVideoUrl) {
    await getYouTubeUrl();
  }
  
  if (currentVideoUrl) {
    const serverOnline = await checkServer();
    if (serverOnline) {
      let customTitle = customTitleInput.value.trim();
      if (!customTitle) {
        customTitle = currentVideoTitle || 'audio';
      }
      // Clean the filename
      customTitle = cleanFilename(customTitle);
      await downloadAudio(currentVideoUrl, customTitle);
    } else {
      showStatus('❌ Server is not running. Start server with: python3 server/app.py', 'error');
    }
  }
});

function startProgress() {
  progressContainer.style.display = 'block';
  progressBar.style.width = '0%';

  let progress = 0;
  progressInterval = setInterval(() => {
    if (progress < 90) {
      progress += Math.random() * 5;
      progressBar.style.width = progress + '%';
    }
  }, 300);
}

function finishProgress() {
  clearInterval(progressInterval);
  progressBar.style.width = '100%';

  setTimeout(() => {
    progressContainer.style.display = 'none';
    progressBar.style.width = '0%';
  }, 500);
}

// Initialize popup
async function init() {
  await checkServer();
  await getYouTubeUrl();
}

// Run initialization
init();