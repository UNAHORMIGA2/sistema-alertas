const fs = require('fs');
const path = require('path');

const sampleRate = 44100;
const duration = 3; // 3 seconds
const numSamples = sampleRate * duration;
const buffer = Buffer.alloc(44 + numSamples * 2);

buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + numSamples * 2, 4);
buffer.write('WAVE', 8);

buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16); 
buffer.writeUInt16LE(1, 20); 
buffer.writeUInt16LE(1, 22); 
buffer.writeUInt32LE(sampleRate, 24); 
buffer.writeUInt32LE(sampleRate * 2, 28); 
buffer.writeUInt16LE(2, 32); 
buffer.writeUInt16LE(16, 34); 

buffer.write('data', 36);
buffer.writeUInt32LE(numSamples * 2, 40);

for (let i = 0; i < numSamples; i++) {
  const t = i / sampleRate;
  const freq = 600 + 300 * Math.sin(2 * Math.PI * 4 * t);
  const sample = Math.floor(30000 * Math.sin(2 * Math.PI * freq * t));
  buffer.writeInt16LE(sample, 44 + i * 2);
}

fs.writeFileSync(path.join(__dirname, 'assets', 'sirena.wav'), buffer);
console.log('sirena.wav generated sucessfully, size: ' + buffer.length);
