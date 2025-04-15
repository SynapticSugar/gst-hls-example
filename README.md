# Gstreamer Live HLS
This example showcases a live HLS streaming setup using GStreamer, Node.js, and hls.js. GStreamer generates .ts segments and an m3u8 playlist, which Node/Express serves from the ./hls folder. In the browser, hls.js (or native Safari support) handles playback by continuously fetching new segments. The included configuration (liveSyncDurationCount, liveMaxLatencyDurationCount) helps keep the video stream near the live edge, providing a near–real-time experience.
It also supports multicast without requiring the pipeline to be re-instanced.

## Initialize the Project
npm init -y

## Install Dependancies
npm install express   # For a web server

## Run the code
node ./server.js <IPADDRESS>

## Connect Webpage
Use a browser to connect to http://<IPADDRESS>:9001

Note: Browsers should use the actual ETH0 IP address instead of 127.0.0.1 or localhost when served via Ubuntu WSL2