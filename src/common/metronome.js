function loadAudio(context, file) {
  return new Promise(async (resolve, reject) => {
    let content = await AsyncChrome.files.readBinary(file);
    context.decodeAudioData(content, buffer => resolve(buffer), error => reject(error));
  });
}

function roundUp(value, interval) {
  return interval * Math.ceil(value / interval);
}

class Metronome
{
  constructor(context, buffers, period) {
    this.buffers = buffers;
    this.period = period;
    this.context = context;
    this.interval = null;

    this.scheduledTime = 0;
    this.soundIndex = 0;
  }

  static async create(soundFiles, period) {
    let context = new AudioContext();
    context.suspend();

    let buffers = [];
    for (let file of soundFiles) {
      let buffer = await loadAudio(context, file);
      buffers.push(buffer);
    }

    return new Metronome(context, buffers, period);
  }

  async start() {
    if (!this.context || this.interval) {
      return;
    }

    const schedulePeriod = 15 * 1000;
    const scheduleSize = Math.max(2, 2 * (schedulePeriod / this.period));

    const schedule = () => {
      let frontierTime = roundUp(this.context.currentTime * 1000, this.period) + this.period * scheduleSize;
      while (this.scheduledTime < frontierTime) {
        this.scheduledTime += this.period;
        if (this.scheduledTime <= this.context.currentTime * 1000) {
          continue;
        }

        let source = this.context.createBufferSource();
        source.buffer = this.buffers[this.soundIndex];
        this.soundIndex = (this.soundIndex + 1) % this.buffers.length;

        source.connect(this.context.destination);
        source.start(this.scheduledTime / 1000);
      }
    };

    this.interval = setInterval(() => schedule(), schedulePeriod);
    schedule();

    await this.context.resume();
  }

  async stop() {
    if (!this.context || !this.interval) {
      return;
    }

    clearInterval(this.interval);
    this.interval = null;
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
