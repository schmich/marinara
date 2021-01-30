// Deep clone an object. Assumes only simple types and array/object aggregates of simple types.
function clone(obj) {
  if (obj instanceof Array) {
    let copy = [];
    for (let el of obj) {
      copy.push(clone(el));
    }
    return copy;
  } else if (obj instanceof Object) {
    let copy = {};
    for (let prop in obj) {
      copy[prop] = clone(obj[prop]);
    }
    return copy;
  } else {
    return obj;
  }
}

class SettingsSchema
{
  get version() {
    return 7;
  }

  get default() {
    return {
      focus: {
        duration: 25,
        timerSound: null,
        countdown: {
          host: null,
          autoclose: true,
          resolution: [500, 500]
        },
        notifications: {
          desktop: true,
          tab: true,
          sound: null
        }
      },
      shortBreak: {
        duration: 5,
        timerSound: null,
        countdown: {
          host: null,
          autoclose: true,
          resolution: [500, 500]
        },
        notifications: {
          desktop: true,
          tab: true,
          sound: null
        }
      },
      longBreak: {
        duration: 15,
        interval: 4,
        timerSound: null,
        countdown: {
          host: null,
          autoclose: true,
          resolution: [500, 500]
        },
        notifications: {
          desktop: true,
          tab: true,
          sound: null,
        }
      },
      showTimer: true,
      autostart: {
        time: null,
      },
      version: this.version
    };
  }

  from1To2(v1) {
    return {
      focus: {
        duration: v1.focus.duration,
        notifications: {
          desktop: v1.focus.desktopNotification,
          tab: v1.focus.newTabNotification,
          sound: v1.focus.sound ? new URL(v1.focus.sound).pathname : null
        }
      },
      shortBreak: {
        duration: v1.break.duration,
        notifications: {
          desktop: v1.break.desktopNotification,
          tab: v1.break.newTabNotification,
          sound: v1.break.sound ? new URL(v1.break.sound).pathname : null
        }
      },
      longBreak: {
        duration: 15,
        interval: 4,
        notifications: {
          desktop: v1.break.desktopNotification,
          tab: v1.break.newTabNotification,
          sound: v1.break.sound ? new URL(v1.break.sound).pathname : null
        }
      },
      version: 2
    };
  }

  from2To3(v2) {
    const fileNameMap = {
      '/audio/battle-horn.mp3': '/audio/88736c22.mp3',
      '/audio/bell-ring.mp3': '/audio/b10d75f2.mp3',
      '/audio/bike-horn.mp3': '/audio/72312dd3.mp3',
      '/audio/computer-magic.mp3': '/audio/5cf807ce.mp3',
      '/audio/din-ding.mp3': '/audio/72cb1b7f.mp3',
      '/audio/ding-dong.mp3': '/audio/92ff2a8a.mp3',
      '/audio/ding.mp3': '/audio/1a5066bd.mp3',
      '/audio/dong.mp3': '/audio/5e122cee.mp3',
      '/audio/electronic-chime.mp3': '/audio/28d6b5be.mp3',
      '/audio/fire-pager.mp3': '/audio/b38e515f.mp3',
      '/audio/glass-ping.mp3': '/audio/2ed9509e.mp3',
      '/audio/gong-1.mp3': '/audio/8bce59b5.mp3',
      '/audio/gong-2.mp3': '/audio/85cab25d.mp3',
      '/audio/music-box.mp3': '/audio/ebe7deb8.mp3',
      '/audio/pin-dropping.mp3': '/audio/2e13802a.mp3',
      '/audio/reception-bell.mp3': '/audio/54b867f9.mp3',
      '/audio/robot-blip-1.mp3': '/audio/bd50add0.mp3',
      '/audio/robot-blip-2.mp3': '/audio/36e93c27.mp3',
      '/audio/ship-bell.mp3': '/audio/9404f598.mp3',
      '/audio/toaster-oven.mp3': '/audio/a258e906.mp3',
      '/audio/tone.mp3': '/audio/f62b45bc.mp3',
      '/audio/train-horn.mp3': '/audio/6a215611.mp3'
    };

    let v3 = clone(v2);
    v3.version = 3;

    for (let group of [v3.focus, v3.shortBreak, v3.longBreak].map(s => s.notifications)) {
      if (group.sound) {
        let newName = fileNameMap[group.sound.toLowerCase()];
        group.sound = newName || group.sound;
      }
    }

    return v3;
  }

  from3To4(v3) {
    let v4 = clone(v3);
    v4.version = 4;

    v4.focus.timerSound = null;
    v4.shortBreak.timerSound = null;
    v4.longBreak.timerSound = null;

    return v4;
  }

  from4To5(v4) {
    let v5 = clone(v4);
    v5.version = 5;

    v5.autostart = {
      time: null
    };

    return v5;
  }

  from5To6(v5) {
    let v6 = clone(v5);
    v6.version = 6;

    if (v6.focus.timerSound) {
      v6.focus.timerSound = {
        metronome: v6.focus.timerSound
      };
    }

    return v6;
  }

  from6To7(v6) {
    let v7 = clone(v6);
    v7.version = 7;

    v7.focus.countdown = {
      host: null,
      autoclose: true,
      resolution: [500, 500]
    };

    v7.shortBreak.countdown = {
      host: null,
      autoclose: true,
      resolution: [500, 500]
    };

    v7.longBreak.countdown = {
      host: null,
      autoclose: true,
      resolution: [500, 500]
    };

    return v7;
  }
}

class PersistentSettings
{
  static async create(settingsManager) {
    let settings = await settingsManager.get();

    // When the settings change, we update the underlying settigs object, which
    // allows users of the settings to see the updated values.
    settingsManager.on('change', newSettings => settings = newSettings);

    // We return a proxy object that forwards all getters
    // to the underlying settings object.
    return new Proxy(function() {}, {
      get(target, prop, receiver) {
        return settings[prop];
      }
    });
  }
}

export {
  SettingsSchema,
  PersistentSettings
};