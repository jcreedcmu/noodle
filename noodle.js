const DEBUG = false;
const R = 2/3; // cantor set density
const CLIP_LIMIT = 0.5;
const rho = 70; // unscaled major radius in pixels
const REC_LEVELS = 3; // recursion levels

function lerp(a, b, t) {
  return b * t + a * (1-t);
}

function cantor(n, small, big, f) {
  if (n == 0) {
	 f(small, big);
  }
  else {
	 cantor(n-1, small, lerp(small, big, R/2), f);
	 cantor(n-1, lerp(small, big, 1-R/2), big, f);
  }
}

function render(d, levels, rho, w, h, t) {
  function shape(cx, cy, mn, mj, t) {
	 const theta = Math.PI * 2 * t;
	 const phi = Math.PI * 2 * (1 + t) / 2;

	 function lead_clip_path() {
		d.beginPath();
		d.moveTo(cx, cy);
		d.lineTo(cx + 2 * mj, cy);
		d.arc(cx, cy, 2 * mj, 4 * Math.PI / 2 , phi+ Math.PI);
	 }
	 function trail_clip_path() {
		d.beginPath();
		d.moveTo(cx, cy);
		d.lineTo(cx - 2 * mj, cy);
		d.arc(cx, cy, 2 * mj, 3 * Math.PI, phi+ Math.PI,  true);
	 }

	 d.save();

	 if (DEBUG) {
		d.strokeStyle = "#eaa";
		d.beginPath();
		d.arc(cx, cy, mj + mn , 0, 2 * Math.PI);
		d.arc(cx, cy, mj , 0, 2 * Math.PI);
		d.arc(cx, cy, mj - mn , 0, 2 * Math.PI);
		d.stroke();

		if (t > CLIP_LIMIT) {
		  d.fillStyle = "#def";
		  lead_clip_path();
		  d.fill();
		  d.stroke();

		  d.fillStyle = "#edf";
		  trail_clip_path();
		  d.fill();
		  d.stroke();
		}
	 }
	 d.strokeStyle = "black";

	 d.beginPath();
	 d.arc(cx, cy, mj - mn , Math.PI + theta, Math.PI, true);
	 d.stroke();

	 // isolate the trailing piece
	 if (t > CLIP_LIMIT) {
		d.save();
		d.beginPath();
		trail_clip_path();
		d.clip();
	 }
	 d.beginPath();
	 d.arc(cx - mj, cy, mn, 0, Math.PI);
	 d.stroke();
	 if (t > CLIP_LIMIT) {
		d.restore();
	 }

	 d.beginPath();
	 d.arc(cx, cy, mj + mn , Math.PI, Math.PI + theta);
	 d.stroke();

	 // isolate the leading piece
	 if (t > CLIP_LIMIT) {
		d.save();
		d.beginPath();
		lead_clip_path();
		d.clip();
	 }
	 d.beginPath();
	 d.arc(Math.cos(theta) * -mj + cx, Math.sin(theta) * -mj + cy, mn, Math.PI + theta, 2 * Math.PI + theta);
	 d.stroke();
	 if (t > CLIP_LIMIT) {
		d.restore();
	 }

	 d.restore();
  }

  d.fillStyle = "#eec";
  d.fillRect(0,0,w,h);
  d.save();
  d.translate(320, 240);
  if (DEBUG) {
	 d.beginPath();
	 d.moveTo(-1000,0.5);
	 d.lineTo(1000,0.5);
	 d.moveTo(0.5,-1000);
	 d.lineTo(0.5,1000);
	 d.stroke();
  }

  const M = R * rho / (2 - R);
  const m = M * (1 - R);
  const SC = Math.pow((rho + M) / M, (1-t));
  cantor(levels, m, M, (mn1, mn2) => {
	 shape(SC * rho * (1-t),0, SC * mn1, SC * rho, t)
	 shape(SC * rho * (1-t),0, SC * mn2, SC * rho, t)
  });
  d.restore();
}

function renderSmooth(d1, d2, c2, L, rho, w, h, t) {
  // for visual smoothness, at t=0 we render L levels,
  // and at t=1 we render L-1.
  d1.globalAlpha = 1;
  render(d1, L, rho, w, h, t);
  render(d2, L-1, rho, w, h, t);
  d1.globalAlpha = t;
  d1.drawImage(c2, 0, 0, w, h);
}

if (typeof module != 'undefined') {
  module.exports.render = renderSmooth;
  module.exports.REC_LEVELS = REC_LEVELS;
  module.exports.rho = rho;
}
else {
  c = document.getElementById("c");
  dd = c.getContext('2d');
  const w = c.width = 640;
  const h = c.height = 480;

  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const offd = off.getContext('2d');

  function renderSmoothAt(t) {
	 renderSmooth(dd, offd, off, REC_LEVELS, rho, w, h, t);
  }

  document.getElementById("inp").oninput = ch;

  renderSmoothAt(0);

  function ch(e) {
	 const bigt = 8 * parseFloat(e.target.value);
	 const t = bigt - Math.floor(bigt);
	 renderSmoothAt(t);
  }
}
