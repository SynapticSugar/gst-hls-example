// server.js
const express = require('express');
const path = require('path');
const { spawn } = require('child_process');

// The folder where we'll store our HLS segments
// Make sure this 'hls' folder exists before running!
const hlsFolder = path.join(__dirname, 'hls');

// 1. Start an Express app
const app = express();

// 2. Serve the hls folder as static content at /hls
app.use('/hls', express.static(hlsFolder));

// 3. Serve the main HTML page
app.get('/', (req, res) => {
  // Renders the index.html file
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 4. Start the server on port 9001
const PORT = 9001;
app.listen(PORT, () => {
  console.log(`Server listening on http://172.26.253.159:${PORT}`);
  // Once Express is running, spawn GStreamer
  startGStreamerHLS();
});

/**
 * Spawns GStreamer to produce HLS segments in the `hls/` folder.
 */
function startGStreamerHLS() {
  // Command: gst-launch-1.0
  // Pipeline:
  //   videotestsrc is-live=true ! video/x-raw,width=320,height=240,framerate=30/1 !
  //   clockoverlay time-format="%Y/%m/%d %H:%M:%S" !
  //   x264enc tune=zerolatency speed-preset=ultrafast key-int-max=30 bitrate=2000 !
  //   mpegtsmux !
  //   hlssink playlist-root="http://127.0.0.1:9001/hls" location="./hls/segment_%05d.ts"
  //            playlist-location="./hls/playlist.m3u8" target-duration=2 max-files=5
  //
  // Explanation:
  //   - videotestsrc is-live=true: produce frames in real time.
  //   - clockoverlay: show a timestamp on video.
  //   - x264enc tune=zerolatency: no extra buffering, for lower latency.
  //   - speed-preset=ultrafast: minimal CPU usage & latency (lower quality though).
  //   - key-int-max=30: forces an IDR frame roughly every 1s if running at 30 fps.
  //   - bitrate=2000: 2 Mbps, you can adjust as needed.
  //   - hlssink target-duration=2: each .ts segment ~2 seconds long.
  //   - max-files=5: keeps only ~5 segments in the playlist for a rolling "live" window.

  const gstArgs = [
    'videotestsrc', 'is-live=true',
    '!', 'video/x-raw,width=320,height=240,framerate=30/1',
    '!', 'clockoverlay', 'time-format="%Y/%m/%d %H:%M:%S"',
    '!', 'x264enc', 'tune=zerolatency', 'speed-preset=ultrafast',
         'key-int-max=15', 'bitrate=5000',
    '!', 'mpegtsmux',
    '!', 'hlssink',
         `playlist-root=http://172.26.253.159:${PORT}/hls`,
         `location=${path.join(hlsFolder, 'segment_%05d.ts')}`,
         `playlist-location=${path.join(hlsFolder, 'playlist.m3u8')}`,
         'target-duration=1',
         'max-files=3'
  ];

  console.log('Starting GStreamer pipeline:\n', gstArgs.join(' '));

  const gstProcess = spawn('gst-launch-1.0', gstArgs, { stdio: 'inherit' });

  gstProcess.on('error', (err) => {
    console.error('Failed to start gst-launch-1.0:', err);
  });

  gstProcess.on('exit', (code, signal) => {
    console.log(`GStreamer exited with code ${code} (signal ${signal})`);
  });
}
