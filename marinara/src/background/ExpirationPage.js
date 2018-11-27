import SingletonPage from './SingletonPage';

class ExpirationPage
{
  static async show(title, messages, action, pomodoros, phase) {
    let page = await SingletonPage.show(chrome.extension.getURL('modules/expire.html'), false);
    return new ExpirationPage(page, title, messages, action, pomodoros, phase);
  }

  constructor(page, title, messages, action, pomodoros, phase) {
    this.page = page;

    function updated(id, changeInfo, _) {
      if (id === page.tabId && changeInfo.status === 'complete') {
        chrome.tabs.sendMessage(id, {
          title: title,
          messages: messages,
          pomodoros: pomodoros,
          action: action,
          phase: phase
        }, {}, () => page.focus());
      }
    }

    chrome.tabs.onRemoved.addListener(function removed(id) {
      if (id === page.tabId) {
        chrome.tabs.onRemoved.removeListener(removed);
        chrome.tabs.onUpdated.removeListener(updated);
      }
    });

    chrome.tabs.onUpdated.addListener(updated);
  }

  close() {
    this.page.close();
  }
}

export default ExpirationPage;