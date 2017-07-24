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

        if (item instanceof ParentMenu) {
          let id = chrome.contextMenus.create({
            title: item.title(),
            contexts: this.contexts
          });

          for (let child of item.children) {
            if (!child.visible()) {
              continue;
            }

            chrome.contextMenus.create({
              title: child.title(),
              contexts: this.contexts,
              onclick: () => child.run(),
              parentId: id
            });
          }
        } else {
          chrome.contextMenus.create({
            title: item.title(),
            contexts: this.contexts,
            onclick: () => item.run()
          });
        }
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

class ParentMenu
{
  constructor(...children) {
    this.children = children;
  }

  addChild(child) {
    this.children.push(child);
  }

  title() {
    return '';
  }

  visible() {
    return false;
  }
}

class StartTimerParentMenu extends ParentMenu
{
  constructor(...children) {
    super(...children)
  }

  title() {
    return 'Start Timer';
  }

  visible() {
    return true;
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

class PomodoroHistoryMenuItem extends MenuItem
{
  constructor(controller) {
    super();
    this.controller = controller;
  }

  title() {
    return 'Pomodoro History';
  }

  visible() {
    return true;
  }

  run() {
    this.controller.showOptionsPage('#history');
  }
}

class StartPomodoroCycleMenuItem extends MenuItem
{
  constructor(controller) {
    super();
    this.controller = controller;
  }

  title() {
    return 'Start Pomodoro Cycle';
  }

  visible() {
    return this.controller.settings.longBreak.interval > 0;
  }

  run() {
    this.controller.startCycle();
  }
}
