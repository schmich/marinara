class Sounds
{
  static get notification() {
    if (!this.notificationSounds) {
      this.notificationSounds = [
        { name: T('tone'), file: 'f62b45bc.mp3' },
        { name: T('digital_watch'), file: 'be75f155.mp3' },
        { name: T('analog_alarm_clock'), file: '0f034826.mp3' },
        { name: T('digital_alarm_clock'), file: 'fee369b7.mp3' },
        { name: T('electronic_chime'), file: '28d6b5be.mp3' },
        { name: T('gong_1'), file: '8bce59b5.mp3' },
        { name: T('gong_2'), file: '85cab25d.mp3' },
        { name: T('computer_magic'), file: '5cf807ce.mp3' },
        { name: T('fire_pager'), file: 'b38e515f.mp3' },
        { name: T('glass_ping'), file: '2ed9509e.mp3' },
        { name: T('music_box'), file: 'ebe7deb8.mp3' },
        { name: T('pin_drop'), file: '2e13802a.mp3' },
        { name: T('robot_blip_1'), file: 'bd50add0.mp3' },
        { name: T('robot_blip_2'), file: '36e93c27.mp3' },
        { name: T('ship_bell'), file: '9404f598.mp3' },
        { name: T('train_horn'), file: '6a215611.mp3' },
        { name: T('bike_horn'), file: '72312dd3.mp3' },
        { name: T('bell_ring'), file: 'b10d75f2.mp3' },
        { name: T('reception_bell'), file: '54b867f9.mp3' },
        { name: T('toaster_oven'), file: 'a258e906.mp3' },
        { name: T('battle_horn'), file: '88736c22.mp3' },
        { name: T('ding'), file: '1a5066bd.mp3' },
        { name: T('dong'), file: '5e122cee.mp3' },
        { name: T('ding_dong'), file: '92ff2a8a.mp3' },
        { name: T('airplane'), file: '72cb1b7f.mp3' }
      ];

      for (let sound of this.notificationSounds) {
        sound.file = `/audio/${sound.file}`;
      }
    }

    return this.notificationSounds;
  }

  static get timer() {
    if (!this.timerSounds) {
      this.timerSounds = [
        { name: T('stopwatch'), files: ['4cf03078.mp3', 'edab7b0d.mp3'] },
        { name: T('wristwatch'), files: ['8dc834f8.mp3', '831a5549.mp3'] },
        { name: T('clock'), files: ['af607ff1.mp3', 'fd23aaf3.mp3'] },
        { name: T('wall_clock'), files: ['6103cd58.mp3', 'cad167ea.mp3'] },
        { name: T('desk_clock'), files: ['6a981bfc.mp3', 'fd64de98.mp3'] },
        { name: T('wind_up_clock'), files: ['bc4e3db2.mp3', 'f9efd11b.mp3'] },
        { name: T('antique_clock'), files: ['875326f9.mp3', 'cba5f173.mp3'] },
        { name: T('small_clock'), files: ['89dafd3e.mp3', '0a0ec499.mp3'] },
        { name: T('large_clock'), files: ['2122d2a4.mp3', 'a273ba0c.mp3'] },
        { name: T('wood_block'), files: ['ad6eac9e.mp3'] },
        { name: T('metronome'), files: ['bced7c21.mp3', '9bd67f7e.mp3'] },
        { name: T('pulse'), files: ['fe5d2a62.mp3'] }
      ];

      for (let sound of this.timerSounds) {
        sound.files = sound.files.map(file => `/audio/${file}`);
      }
    }

    return this.timerSounds;
  }
}
