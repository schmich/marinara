import { SingletonPage, PageHost } from './SingletonPage';
import { Service, ServiceBroker } from '../Service';
import { pomodoroCount } from '../Filters';
import { M } from '../Messages';

class ExpirationService extends Service
{
  constructor(properties, page) {
    super();
    this.properties = properties;
    this.page = page;
  }

  async getProperties() {
    // When the expiration page asks for properties, it has loaded,
    // so we can focus it now.
    setTimeout(() => this.page.focus(), 0);
    return this.properties;
  }
}

function ExpirationMessages(pomodorosRemaining, pomodorosToday) {
  let messages = [];
  if (pomodorosRemaining > 0) {
    messages.push(M.pomodoros_until_long_break(pomodoroCount(pomodorosRemaining)));
  }
  messages.push(M.pomodoros_completed_today(pomodoroCount(pomodorosToday)));

  return messages.filter(m => !!m);
}


class ExpirationPage
{
  static async show(title_key, pomodorosRemaining, pomodorosToday, action_key, pomodoros, phase) {
    let page = await SingletonPage.show(chrome.extension.getURL('modules/expire.html'), PageHost.Tab);
    return new ExpirationPage(page, title_key, pomodorosRemaining, pomodorosToday, action_key, pomodoros, phase);
  }

  constructor(page, title_key, pomodorosRemaining, pomodorosToday, action_key, pomodoros, phase) {
    this.page = page;

    const properties = { title_key, pomodorosRemaining, pomodorosToday, pomodoros, action_key, phase };
    this.service = new ExpirationService(properties, page);
    ServiceBroker.register(this.service);

    const self = this;
    chrome.tabs.onRemoved.addListener(function removed(id) {
      if (id !== page.tabId) {
        return;
      }

      // Service no longer needed.
      ServiceBroker.unregister(self.service);
      chrome.tabs.onRemoved.removeListener(removed);
    });
  }

  close() {
    this.page.close();
  }
}

const ExpirationClient = ExpirationService.proxy;

export {
  ExpirationPage,
  ExpirationClient,
  ExpirationMessages
};
