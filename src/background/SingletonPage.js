import Chrome from '../Chrome';

class SingletonPage
{
  static async show(url, focus = true) {
    if (!this.pages) {
      this.pages = {};
    }

    let page = this.pages[url];
    if (!page) {
      let tab = await Chrome.tabs.create({ url, active: false });
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

export default SingletonPage;