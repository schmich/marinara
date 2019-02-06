import M from '../Messages';
import { OptionsClient } from './Services';

class Menu
{
  constructor(contexts, ...groups) {
    this.contexts = contexts;
    this.groups = groups;
  }

  addGroup(group) {
    this.groups.push(group);
  }

  apply() {
    chrome.contextMenus.removeAll();

    let firstGroup = true;
    for (let group of this.groups) {
      let firstItem = true;
      for (let item of group.items) {
        if (!item.visible) {
          continue;
        }

        if (firstItem && !firstGroup) {
          chrome.contextMenus.create({ type: 'separator', contexts: this.contexts });
        }

        firstGroup = false;
        firstItem = false;

        if (item instanceof ParentMenu) {
          let id = chrome.contextMenus.create({
            title: item.title,
            contexts: this.contexts
          });

          for (let child of item.children) {
            if (!child.visible) {
              continue;
            }

            chrome.contextMenus.create({
              title: child.title,
              contexts: this.contexts,
              onclick: () => child.run(),
              parentId: id
            });
          }
        } else {
          chrome.contextMenus.create({
            title: item.title,
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

  get title() {
    return '';
  }

  get visible() {
    return false;
  }
}

class RestartTimerParentMenu extends ParentMenu
{
  constructor(...children) {
    super(...children);
  }

  get title() {
    return M.restart_timer;
  }

  get visible() {
    return true;
  }
}

class Action
{
  get title() {
    return '';
  }

  get visible() {
    return false;
  }

  run() {
  }
}

class StartFocusingAction extends Action
{
  constructor(timer) {
    super();
    this.timer = timer;
  }

  get title() {
    return M.start_focusing;
  }

  get visible() {
    return true;
  }

  run() {
    this.timer.startFocus();
  }
}

class StartShortBreakAction extends Action
{
  constructor(timer) {
    super();
    this.timer = timer;
  }

  get title() {
    return this.timer.hasLongBreak ? M.start_short_break : M.start_break;
  }

  get visible() {
    return true;
  }

  run() {
    this.timer.startShortBreak();
  }
}

class StartLongBreakAction extends Action
{
  constructor(timer) {
    super();
    this.timer = timer;
  }

  get title() {
    return M.start_long_break;
  }

  get visible() {
    return this.timer.hasLongBreak;
  }

  run() {
    this.timer.startLongBreak();
  }
}

class StopTimerAction extends Action
{
  constructor(timer) {
    super();
    this.timer = timer;
  }

  get title() {
    return M.stop_timer;
  }

  get visible() {
    return this.timer.isRunning || this.timer.isPaused;
  }

  run() {
    this.timer.stop();
  }
}

class PauseTimerAction extends Action
{
  constructor(timer) {
    super();
    this.timer = timer;
  }

  get title() {
    return M.pause_timer;
  }

  get visible() {
    return this.timer.isRunning;
  }

  run() {
    this.timer.pause();
  }
}

class ResumeTimerAction extends Action
{
  constructor(timer) {
    super();
    this.timer = timer;
  }

  get title() {
    return M.resume_timer;
  }

  get visible() {
    return this.timer.isPaused;
  }

  run() {
    this.timer.resume();
  }
}

class PomodoroHistoryAction extends Action
{
  constructor() {
    super();
  }

  get title() {
    return M.pomodoro_history;
  }

  get visible() {
    return true;
  }

  async run() {
    await OptionsClient.once.showHistoryPage();
  }
}

class StartPomodoroCycleAction extends Action
{
  constructor(timer) {
    super();
    this.timer = timer;
  }

  get title() {
    if (this.timer.isRunning || this.timer.isPaused) {
      return M.restart_pomodoro_cycle;
    } else {
      return M.start_pomodoro_cycle;
    }
  }

  get visible() {
    return this.timer.hasLongBreak;
  }

  run() {
    this.timer.startCycle();
  }
}

class PomodoroMenuSelector
{
  constructor(timer, inactive, active) {
    this.timer = timer;
    this.inactive = inactive;
    this.active = active;
  }

  apply() {
    let menu = (this.timer.isRunning || this.timer.isPaused) ? this.active : this.inactive;
    menu.apply();
  }
}

function createPomodoroMenu(timer) {
  let pause = new PauseTimerAction(timer);
  let resume = new ResumeTimerAction(timer);
  let stop = new StopTimerAction(timer);

  let startCycle = new StartPomodoroCycleAction(timer);
  let startFocus = new StartFocusingAction(timer);
  let startShortBreak = new StartShortBreakAction(timer);
  let startLongBreak = new StartLongBreakAction(timer);
  let viewHistory = new PomodoroHistoryAction();

  let inactive = new Menu(['browser_action'],
    new MenuGroup(
      startCycle,
      startFocus,
      startShortBreak,
      startLongBreak
    ),
    new MenuGroup(
      viewHistory
    )
  );

  let active = new Menu(['browser_action'],
    new MenuGroup(
      pause,
      resume,
      stop,
      new RestartTimerParentMenu(
        startFocus,
        startShortBreak,
        startLongBreak
      ),
      startCycle
    ),
    new MenuGroup(
      viewHistory
    )
  );

  return new PomodoroMenuSelector(timer, inactive, active);
}

export {
  createPomodoroMenu
};