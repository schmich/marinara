class Notification
{
  static async show(controller, title, messages, action) {
    let options = {
      type: 'basic',
      title: title,
      message: messages.filter(m => m && m.trim() !== '').join("\n"),
      iconUrl: 'icons/128.png',
      isClickable: true,
      requireInteraction: true,
      buttons: [{ title: action, iconUrl: 'icons/start.png' }]
    };

    let notificationId = await AsyncChrome.notifications.create(options);
    return new Notification(controller, notificationId);
  }

  constructor(controller, notificationId) {
    this.controller = controller;
    this.notificationId = notificationId;

    let notificationClicked = id => {
      if (id === this.notificationId) {
        this.controller.start();
        chrome.notifications.clear(id);
      }
    };

    let buttonClicked = id => {
      if (id === this.notificationId) {
        this.controller.start();
        chrome.notifications.clear(id);
      }
    };

    let notificationClosed = id => {
      if (id === this.notificationId) {
        chrome.notifications.onClicked.removeListener(notificationClicked);
        chrome.notifications.onButtonClicked.removeListener(buttonClicked);
        chrome.notifications.onClosed.removeListener(notificationClosed);
        this.notificationId = null;
      }
    };

    chrome.notifications.onClicked.addListener(notificationClicked);
    chrome.notifications.onButtonClicked.addListener(buttonClicked);
    chrome.notifications.onClosed.addListener(notificationClosed);
  }

  close() {
    if (this.notificationId) {
      chrome.notifications.clear(this.notificationId);
    }
  }
}

class SingletonPage
{
  static async show(url, focus = true) {
    if (!this.pages) {
      this.pages = {};
    }

    let page = this.pages[url];
    if (!page) {
      // Associate the new tab with the currently active tab.
      // When the new tab is closed, the currently active tab will be reactivated.
      let tabs = await AsyncChrome.tabs.query({ active: true, currentWindow: true });
      let openerTabId = (tabs && tabs.length > 0) ? tabs[0].id : null;

      let tab = await AsyncChrome.tabs.create({ url, openerTabId, active: false });
      page = new SingletonPage(url, tab.id);
      this.pages[url] = page;
    }

    if (focus) {
      page.focus();
    }

    return page;
  }

  constructor(url, tabId) {
    let self = this;
    this.url = url;
    this._tabId = tabId;

    chrome.tabs.onRemoved.addListener(function removed(id) {
      if (id === self._tabId) {
        chrome.tabs.onRemoved.removeListener(removed);
        self._tabId = null;
        delete SingletonPage.pages[self.url];
      }
    });
  }

  get tabId() {
    return this._tabId;
  }

  focus() {
    const focusWindow = tab => chrome.windows.update(tab.windowId, { focused: true });
    const focusTab = id => {
      try {
        chrome.tabs.update(id, { active: true, highlighted: true }, focusWindow);
      } catch (e) {
        // Firefox doesn't currently allow setting highlighted for chrome.tabs.update()
        // TODO: File a FF bug for this
        chrome.tabs.update(id, { active: true }, focusWindow);
      }
    };
    focusTab(this._tabId);
  }

  close() {
    if (this._tabId) {
      chrome.tabs.remove(this._tabId, () => {});
    }
  }
}

class ExpirationPage
{
  static async show(title, messages, action, pomodoros, phase) {
    let page = await SingletonPage.show(chrome.extension.getURL('expire/expire.html'), false);
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
