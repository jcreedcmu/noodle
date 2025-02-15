const fs = require('fs');

// Audio parameters
const sampleRate = 44100;
const duration = 1; // 5 seconds
const reps = 12; // Total of 1 minute
const baseFreq = 440; // Base frequency (A4)
const numHarmonics = 8; // Number of harmonics

const twoPi = 2 * Math.PI;
const oneRepSamples = sampleRate * duration;
const totalSamples = oneRepSamples * reps;
const amplitude = 32767 * 0.3; // Max for 16-bit signed


// Generate Shepard tone samples
const buffer = Buffer.alloc(totalSamples * 2); // 16-bit signed integers

for (let r = 0; r < reps; r++) {
  for (let i = 0; i < oneRepSamples; i++) {
    const t = (r * oneRepSamples + i) / sampleRate; // Time in seconds
    const localt = i / sampleRate; // Time in seconds
    let sample = 0;

    for (let n = 0; n < numHarmonics; n++) {
      const freq = baseFreq * Math.pow(2, localt / duration + n - Math.floor(numHarmonics / 2));
      // baseFreq * Math.pow(2, localt / duration + n - Math.floor(numHarmonics / 2));
      // const wrappedFreq = wrapFrequency(freq);
      const wrappedFreq = freq;

      // Amplitude envelope (Gaussian) for smooth blending
      const envelope = Math.exp(-Math.pow(Math.log2(wrappedFreq / baseFreq), 2) / 0.3);

      if (i == 0) {
        console.log(`start: (t = ${t}) adding to sample harmonic ${wrappedFreq} with envelope ${envelope}`);
      }
      if (i == Math.floor(oneRepSamples  / 2)) {
        console.log(`end: (t = ${t}) adding to sample harmonic ${wrappedFreq} with envelope ${envelope}`);
      }

      sample += envelope * Math.sin(twoPi * wrappedFreq * localt);
    }

    sample = sample / numHarmonics * amplitude; // Normalize amplitude

    // Clamp to 16-bit range
    const intSample = Math.floor(Math.max(-32768, Math.min(32767, sample)));
    buffer.writeInt16LE(intSample, (r * oneRepSamples + i) * 2);
  }
}

// Write to a file
fs.writeFileSync('/tmp/shepard_tone.sw', buffer);
console.log('Shepard tone generated as shepard_tone.sw');

// play shepard_tone.wav
