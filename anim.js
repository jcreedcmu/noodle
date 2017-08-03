const fs = require('fs');
const Canvas = require('canvas');
const noodle = require('./noodle');

const c = new Canvas(640, 480);
const off = new Canvas(640, 480);
const dd = c.getContext('2d');
const offd = off.getContext('2d');

function renderSmoothAt(t) {
  noodle.render(dd, offd, off, noodle.REC_LEVELS, noodle.rho, 640, 480, t);
}

renderSmoothAt(0.5);


const out = fs.createWriteStream(__dirname + '/text.png');
c.pngStream().on('data', chunk => out.write(chunk));
