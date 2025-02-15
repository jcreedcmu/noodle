all:
	cd /tmp/frames && ffmpeg -framerate 24 -i %04d.png -c:v libx264 -pix_fmt yuv420p -y /tmp/output.mp4
