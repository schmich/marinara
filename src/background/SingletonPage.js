import Chrome from '../Chrome';
import Enum from './Enum';

const PageHost = new Enum({
  Tab: 0,
  Window: 1
});

function basePageUrl(url) {
  // Base page URL is the combined origin and path, lowercased,
  // excluding query strings, hashes, and trailing slashes.
  // This will only reliably work with internal extension pages.
  let parts = new URL(url);
  return `${parts.origin}${parts.pathname.replace(/\/$/, '')}`.toLowerCase();
}

async function findExistingPage(url) {
  let baseUrl = basePageUrl(url);

  let windows = chrome.extension.getViews();
  for (let window of windows) {
    if (basePageUrl(window.location.href) !== baseUrl) {
      continue;
    }

    let tabId = await new Promise(resolve => window.chrome.tabs.getCurrent(tab => resolve(tab.id)));
    return new SingletonPage(tabId);
  }

  return null;
}

class SingletonPage
{
  static async show(url, host, properties = {}, focus = true) {
    let page = await findExistingPage(url);
    if (!page) {
      if (host === PageHost.Tab) {
        let tab = await Chrome.tabs.create({ url, active: false, ...properties });
        page = new SingletonPage(tab.id);
      } else if (host === PageHost.Window) {
        let window = await Chrome.windows.create({ url, type: 'popup', ...properties });
        page = new SingletonPage(window.tabs[0].id);
      } else {
        throw new Error('Invalid page host.');
      }
    }

    if (focus) {
      page.focus();
    }

    return page;
  }

  constructor(tabId) {
    this.tabId = tabId;

    const self = this;
    chrome.tabs.onRemoved.addListener(function removed(id) {
      if (id === self.tabId) {
        chrome.tabs.onRemoved.removeListener(removed);
        self.tabId = null;
      }
    });
  }

  focus() {
    if (!this.tabId) {
      return;
    }

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
    focusTab(this.tabId);
  }

  close() {
    if (!this.tabId) {
      return;
    }

    chrome.tabs.remove(this.tabId, () => {});
  }
}

export {
  PageHost,
  SingletonPage
};