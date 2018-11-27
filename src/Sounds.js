import Chrome from './Chrome';
import M from './Messages';

function createNotificationSounds() {
  let sounds = [
    { name: M.tone, file: 'f62b45bc.mp3' },
    { name: M.digital_watch, file: 'be75f155.mp3' },
    { name: M.analog_alarm_clock, file: '0f034826.mp3' },
    { name: M.digital_alarm_clock, file: 'fee369b7.mp3' },
    { name: M.electronic_chime, file: '28d6b5be.mp3' },
    { name: M.gong_1, file: '8bce59b5.mp3' },
    { name: M.gong_2, file: '85cab25d.mp3' },
    { name: M.computer_magic, file: '5cf807ce.mp3' },
    { name: M.fire_pager, file: 'b38e515f.mp3' },
    { name: M.glass_ping, file: '2ed9509e.mp3' },
    { name: M.music_box, file: 'ebe7deb8.mp3' },
    { name: M.pin_drop, file: '2e13802a.mp3' },
    { name: M.robot_blip_1, file: 'bd50add0.mp3' },
    { name: M.robot_blip_2, file: '36e93c27.mp3' },
    { name: M.ship_bell, file: '9404f598.mp3' },
    { name: M.train_horn, file: '6a215611.mp3' },
    { name: M.bike_horn, file: '72312dd3.mp3' },
    { name: M.bell_ring, file: 'b10d75f2.mp3' },
    { name: M.reception_bell, file: '54b867f9.mp3' },
    { name: M.toaster_oven, file: 'a258e906.mp3' },
    { name: M.battle_horn, file: '88736c22.mp3' },
    { name: M.ding, file: '1a5066bd.mp3' },
    { name: M.dong, file: '5e122cee.mp3' },
    { name: M.ding_dong, file: '92ff2a8a.mp3' },
    { name: M.airplane, file: '72cb1b7f.mp3' }
  ];

  for (let sound of sounds) {
    sound.file = `/audio/${sound.file}`;
  }

  return sounds;
}

function createTimerSounds() {
  let sounds = [
    { name: M.stopwatch, files: ['4cf03078.mp3', 'edab7b0d.mp3'] },
    { name: M.wristwatch, files: ['8dc834f8.mp3', '831a5549.mp3'] },
    { name: M.clock, files: ['af607ff1.mp3', 'fd23aaf3.mp3'] },
    { name: M.wall_clock, files: ['6103cd58.mp3', 'cad167ea.mp3'] },
    { name: M.desk_clock, files: ['6a981bfc.mp3', 'fd64de98.mp3'] },
    { name: M.wind_up_clock, files: ['bc4e3db2.mp3', 'f9efd11b.mp3'] },
    { name: M.antique_clock, files: ['875326f9.mp3', 'cba5f173.mp3'] },
    { name: M.small_clock, files: ['89dafd3e.mp3', '0a0ec499.mp3'] },
    { name: M.large_clock, files: ['2122d2a4.mp3', 'a273ba0c.mp3'] },
    { name: M.wood_block, files: ['ad6eac9e.mp3'] },
    { name: M.metronome, files: ['bced7c21.mp3', '9bd67f7e.mp3'] },
    { name: M.pulse, files: ['fe5d2a62.mp3'] }
  ];

  for (let sound of sounds) {
    sound.files = sound.files.map(file => `/audio/${file}`);
  }

  return sounds;
}

async function play(filename) {
  if (!filename) {
    return;
  }

  // We use AudioContext instead of Audio since it works more
  // reliably in different browsers (Chrome, FF, Brave).
  let context = new AudioContext();

  let source = context.createBufferSource();
  source.connect(context.destination);
  source.buffer = await new Promise(async (resolve, reject) => {
    let content = await Chrome.files.readBinary(filename);
    context.decodeAudioData(content, buffer => resolve(buffer), error => reject(error));
  });

  await new Promise(resolve => {
    // Cleanup audio context after sound plays.
    source.onended = () => {
      context.close();
      resolve();
    }
    source.start();
  });
}

const notification = createNotificationSounds();
const timer = createTimerSounds();

export {
  notification,
  timer,
  play
};