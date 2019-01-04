import Metronome from './Metronome';
import { Noise, whiteNoise, pinkNoise, brownNoise } from './Noise';

async function createTimerSound(timerSound) {
  if (!timerSound) {
    return null;
  }

  if (timerSound.metronome) {
    let { files, bpm } = timerSound.metronome;
    let period = (60 / bpm) * 1000;
    return await Metronome.create(files, period);
  }

  let node = {
    'white-noise': whiteNoise,
    'pink-noise': pinkNoise,
    'brown-noise': brownNoise
  }[timerSound.procedural];

  if (!node) {
    throw new Error('Invalid procedural timer sound.');
  }

  return await Noise.create(node);
}

export default createTimerSound;