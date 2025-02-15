import * as fs from 'fs';

// Audio parameters
const harmonicPacking = 2;
const sampleRate = 44100;
const duration = 5; // length of one iteration
const reps = 60 / duration; // Total of 1 minute
const baseFreq = 300;
const numHarmonics = 10; // Number of harmonics

const twoPi = 2 * Math.PI;
const oneRepSamples = sampleRate * duration;
const totalSamples = oneRepSamples * reps;
const amplitude = 32767 * 0.3; // Max for 16-bit signed


type Harmonic = {
  amp: number,
  freq: number
};

const harmBuffer: Harmonic[][] = []; // indexed by sample, only runs as long as one repetition


for (let i = 0; i < oneRepSamples; i++) {
  const harms: Harmonic[] = [];
  for (let n = 0; n < numHarmonics; n++) {
    // During the course of one loop we move up by one octave
    const freq = baseFreq * Math.pow(2, i / oneRepSamples + (n - Math.floor(numHarmonics / 2)) / harmonicPacking);

    // Amplitude envelope for smooth blending
    const logdiff = Math.log2(freq / baseFreq);
    const cutoff = 4;
    const amp = 1 / (1 + Math.pow(2, cutoff * logdiff * logdiff));
    harms.push({ amp, freq });
  }
  harmBuffer.push(harms);
}

// console.log(harmBuffer[0]);
// console.log(harmBuffer[oneRepSamples - 1]);

const sampleBuffer: number[] = []; // float samples, lasts as long as whole sound
const phases: number[] = harmBuffer[0].map(x => 0);


for (let r = 0; r < reps; r++) {
  for (let i = 0; i < oneRepSamples; i++) {
    let sample = 0;
    harmBuffer[i % oneRepSamples].forEach((harm, i) => {
      sample += harm.amp * Math.sin(twoPi * phases[i]);
      phases[i] += harm.freq / sampleRate;
      if (phases[i] > 1) phases[i] -= 1;
    });
    sampleBuffer.push(sample);
  }
  // For continuity, we need to shift the phases over every repetition
  for (let i = 0; i < harmonicPacking; i++) {
    phases.unshift(0);
    phases.pop();
  }
}

// console.log(sampleBuffer.length);
const buffer = Buffer.alloc(totalSamples * 2); // 16-bit signed integers

for (let i = 0; i < totalSamples; i++) {
  // Clamp to 16-bit range
  const intSample = Math.floor(Math.max(-32768, Math.min(32767, 32768 * sampleBuffer[i] / numHarmonics)));
  // if (i % 10000 == 0) console.log(i, intSample);
  buffer.writeInt16LE(intSample, i * 2);
}

// Write to a file
fs.writeFileSync('/tmp/shepard_tone.sw', buffer);
console.log('Shepard tone generated as /tmp/shepard_tone.sw');
