class Menu
{
  constructor(...contexts) {
    this.contexts = contexts;
    this.groups = [];
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
  constructor(items = []) {
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

class StartBreakMenuItem extends MenuItem
{
  constructor(controller) {
    super();
    this.controller = controller;
  }

  title() {
    return 'Start Break';
  }

  visible() {
    return true;
  }

  run() {
    this.controller.startBreak();
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
    let state = this.controller.state();
    return (state === 'running') || (state === 'paused');
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
    return this.controller.state() === 'running';
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
    return this.controller.state() === 'paused';
  }

  run() {
    this.controller.resume();
  }
}
