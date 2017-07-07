class Menu
{
  constructor(contexts, ...groups) {
    this.contexts = contexts;
    this.groups = groups;
    this.refresh();
  }

  addGroup(group) {
    this.groups.push(group);
    this.refresh();
  }

  refresh() {
    chrome.contextMenus.removeAll();

    let firstGroup = true;
    for (let group of this.groups) {
      let firstItem = true;
      for (let item of group.items) {
        if (!item.visible()) {
          continue;
        }

        if (firstItem && !firstGroup) {
          chrome.contextMenus.create({ type: 'separator', contexts: this.contexts });
        }

        firstGroup = false;
        firstItem = false;

        chrome.contextMenus.create({
          title: item.title(),
          contexts: this.contexts,
          onclick: () => item.run()
        });
      }
    }
  }
}

class MenuGroup
{
  constructor(...items) {
    this.items = items;
  }

  addItem(item) {
    this.items.push(item);
  }
}

class MenuItem
{
  title() {
    return '';
  }

  visible() {
    return false;
  }

  run() {
  }
}

class StartFocusingMenuItem extends MenuItem
{
  constructor(controller) {
    super();
    this.controller = controller;
  }

  title() {
    return 'Start Focusing';
  }

  visible() {
    return true;
  }

  run() {
    this.controller.startFocus();
  }
}

class StartShortBreakMenuItem extends MenuItem
{
  constructor(controller) {
    super();
    this.controller = controller;
  }

  title() {
    let hasLong = this.controller.settings.longBreak.interval > 0;
    return hasLong ? 'Start Short Break' : 'Start Break';
  }

  visible() {
    return true;
  }

  run() {
    this.controller.startShortBreak();
  }
}

class StartLongBreakMenuItem extends MenuItem
{
  constructor(controller) {
    super();
    this.controller = controller;
  }

  title() {
    return 'Start Long Break';
  }

  visible() {
    return this.controller.settings.longBreak.interval > 0;
  }

  run() {
    this.controller.startLongBreak();
  }
}

class StopTimerMenuItem extends MenuItem
{
  constructor(controller) {
    super();
    this.controller = controller;
  }

  title() {
    return 'Stop Timer';
  }

  visible() {
    let state = this.controller.state;
    return (state === TimerState.Running) || (state === TimerState.Paused);
  }

  run() {
    this.controller.stop();
  }
}

class PauseTimerMenuItem extends MenuItem
{
  constructor(controller) {
    super();
    this.controller = controller;
  }

  title() {
    return 'Pause Timer';
  }

  visible() {
    return this.controller.state === TimerState.Running;
  }

  run() {
    this.controller.pause();
  }
}

class ResumeTimerMenuItem extends MenuItem
{
  constructor(controller) {
    super();
    this.controller = controller;
  }

  title() {
    return 'Resume Timer';
  }

  visible() {
    return this.controller.state === TimerState.Paused;
  }

  run() {
    this.controller.resume();
  }
}
