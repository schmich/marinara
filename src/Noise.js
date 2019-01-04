class Noise
{
  static async create(createNode) {
    let context = new AudioContext();
    await context.suspend();

    let node = createNode(context);
    node.connect(context.destination);
    return new Noise(context);
  }

  constructor(context) {
    this.context = context;
  }

  async start() {
    await this.context.resume();
  }

  async stop() {
    await this.context.suspend();
  }

  async close() {
    if (!this.context) {
      return;
    }

    await this.stop();
    await this.context.close();
    this.context = null;
  }
}

// Noise generation adapted from Zach Denton's noise.js.
// https://github.com/zacharydenton/noise.js
// https://noisehack.com/generate-noise-web-audio-api/

function whiteNoise(context) {
  const bufferSize = 4096;

  let node = context.createScriptProcessor(bufferSize, 1, 1);
  node.onaudioprocess = e => {
    let output = e.outputBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
      output[i] *= 0.01;
    }
  };

  return node;
}

function pinkNoise(context) {
  const bufferSize = 4096;
  let b0, b1, b2, b3, b4, b5, b6;
  b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;

  let node = context.createScriptProcessor(bufferSize, 1, 1);
  node.onaudioprocess = e => {
    let output = e.outputBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      let white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.005;
      b6 = white * 0.115926;
    }
  };

  return node;
}

function brownNoise(context) {
  const bufferSize = 4096;
  let lastOut = 0.0;

  let node = context.createScriptProcessor(bufferSize, 1, 1);
  node.onaudioprocess = e => {
    let output = e.outputBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      let white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 0.2;
    }
  }

  return node;
}

export {
  Noise,
  whiteNoise,
  pinkNoise,
  brownNoise
};