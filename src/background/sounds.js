class Sounds
{
  static get all() {
    if (!this.sounds) {
      this.sounds = [
        { name: T('tone'), file: 'tone.mp3' },
        { name: T('digital_watch'), file: 'cc8b3236-66b6-43f6-be5f-6a74746320de.mp3' },
        { name: T('analog_alarm_clock'), file: '3a68a1ea-5b07-426e-b9f4-cab9773eba89.mp3' },
        { name: T('digital_alarm_clock'), file: '7a539d94-6290-48fa-935f-1685d77ecce2.mp3' },
        { name: T('electronic_chime'), file: 'electronic-chime.mp3' },
        { name: T('gong_1'), file: 'gong-1.mp3' },
        { name: T('gong_2'), file: 'gong-2.mp3' },
        { name: T('computer_magic'), file: 'computer-magic.mp3' },
        { name: T('fire_pager'), file: 'fire-pager.mp3' },
        { name: T('glass_ping'), file: 'glass-ping.mp3' },
        { name: T('music_box'), file: 'music-box.mp3' },
        { name: T('pin_drop'), file: 'pin-dropping.mp3' },
        { name: T('robot_blip_1'), file: 'robot-blip-1.mp3' },
        { name: T('robot_blip_2'), file: 'robot-blip-2.mp3' },
        { name: T('ship_bell'), file: 'ship-bell.mp3' },
        { name: T('train_horn'), file: 'train-horn.mp3' },
        { name: T('bike_horn'), file: 'bike-horn.mp3' },
        { name: T('bell_ring'), file: 'bell-ring.mp3' },
        { name: T('reception_bell'), file: 'reception-bell.mp3' },
        { name: T('toaster_oven'), file: 'toaster-oven.mp3' },
        { name: T('battle_horn'), file: 'battle-horn.mp3' },
        { name: T('ding'), file: 'ding.mp3' },
        { name: T('dong'), file: 'dong.mp3' },
        { name: T('ding_dong'), file: 'ding-dong.mp3' },
        { name: T('airplane'), file: 'din-ding.mp3' }
      ];

      for (let sound of this.sounds) {
        sound.file = `/audio/${sound.file}`;
      }
    }

    return this.sounds;
  }
}
