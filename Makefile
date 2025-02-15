all:
	cd /tmp/frames && ffmpeg -framerate 24 -i %04d.png -c:v libx264 -pix_fmt yuv420p -y /tmp/output.mp4

yt:
	cd /tmp/frames && ffmpeg -framerate 60 -stream_loop 59 -i %04d.png -c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p -movflags +faststart -bf 2 -g 50 -y /tmp/output.mp4

audio:
	node shepard.js
	sox -r 44100 -e signed -b 16 -c 1 /tmp/shepard_tone.sw /tmp/shepard_tone.wav
