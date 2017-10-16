class Sounds
{
  static get all() {
    if (!this.sounds) {
      this.sounds = [
        { name: L('tone'), file: 'tone.mp3' },
        { name: L('electronic_chime'), file: 'electronic-chime.mp3' },
        { name: L('gong_1'), file: 'gong-1.mp3' },
        { name: L('gong_2'), file: 'gong-2.mp3' },
        { name: L('computer_magic'), file: 'computer-magic.mp3' },
        { name: L('fire_pager'), file: 'fire-pager.mp3' },
        { name: L('glass_ping'), file: 'glass-ping.mp3' },
        { name: L('music_box'), file: 'music-box.mp3' },
        { name: L('pin_drop'), file: 'pin-dropping.mp3' },
        { name: L('robot_blip_1'), file: 'robot-blip-1.mp3' },
        { name: L('robot_blip_2'), file: 'robot-blip-2.mp3' },
        { name: L('ship_bell'), file: 'ship-bell.mp3' },
        { name: L('train_horn'), file: 'train-horn.mp3' },
        { name: L('bike_horn'), file: 'bike-horn.mp3' },
        { name: L('bell_ring'), file: 'bell-ring.mp3' },
        { name: L('reception_bell'), file: 'reception-bell.mp3' },
        { name: L('toaster_oven'), file: 'toaster-oven.mp3' },
        { name: L('battle_horn'), file: 'battle-horn.mp3' },
        { name: L('ding'), file: 'ding.mp3' },
        { name: L('dong'), file: 'dong.mp3' },
        { name: L('ding_dong'), file: 'ding-dong.mp3' },
        { name: L('airplane'), file: 'din-ding.mp3' }
      ];

      for (let sound of this.sounds) {
        sound.file = `/audio/${sound.file}`;
      }
    }

    return this.sounds;
  }
}
