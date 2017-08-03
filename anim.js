const fs = require('fs');
const Canvas = require('canvas');
const sprintf = require('sprintf');
const noodle = require('./noodle');


for (i = 0; i < 60; i++) {
  const c = new Canvas(640, 480);
  const off = new Canvas(640, 480);
  const dd = c.getContext('2d');
  const offd = off.getContext('2d');
  function renderSmoothAt(t) {
	 noodle.render(dd, offd, off, noodle.REC_LEVELS, noodle.rho, 640, 480, t);
  }
  renderSmoothAt(i/60);
  const out = fs.createWriteStream(sprintf(__dirname + '/frames/%03d.png', i));
  c.pngStream().on('data', chunk => out.write(chunk));
}

// after running this script, can do
// $ convert -delay 1.66 -loop 0 frames/*.png anim.gif
// to generate frames
