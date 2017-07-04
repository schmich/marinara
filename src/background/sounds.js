class Sounds
{
  static get all() {
    if (!this.sounds) {
      this.sounds = [
        { name: 'Tone', file: 'tone.mp3' },
        { name: 'Electronic Chime', file: 'electronic-chime.mp3' },
        { name: 'Gong 1', file: 'gong-1.mp3' },
        { name: 'Gong 2', file: 'gong-2.mp3' },
        { name: 'Computer Magic', file: 'computer-magic.mp3' },
        { name: 'Fire Pager', file: 'fire-pager.mp3' },
        { name: 'Glass Ping', file: 'glass-ping.mp3' },
        { name: 'Music Box', file: 'music-box.mp3' },
        { name: 'Pin Dropping', file: 'pin-dropping.mp3' },
        { name: 'Robot Blip 1', file: 'robot-blip-1.mp3' },
        { name: 'Robot Blip 2', file: 'robot-blip-2.mp3' },
        { name: 'Ship Bell', file: 'ship-bell.mp3' },
        { name: 'Train Horn', file: 'train-horn.mp3' },
        { name: 'Bike Horn', file: 'bike-horn.mp3' },
        { name: 'Bell Ring', file: 'bell-ring.mp3' },
        { name: 'Reception Bell', file: 'reception-bell.mp3' },
        { name: 'Toaster Oven', file: 'toaster-oven.mp3' },
        { name: 'Battle Horn', file: 'battle-horn.mp3' },
        { name: 'Ding', file: 'ding.mp3' },
        { name: 'Dong', file: 'dong.mp3' },
        { name: 'Ding Dong', file: 'ding-dong.mp3' },
        { name: 'Din Ding', file: 'din-ding.mp3' }
      ];

      for (let sound of this.sounds) {
        sound.file = `/audio/${sound.file}`;
      }
    }

    return this.sounds;
  }
}
