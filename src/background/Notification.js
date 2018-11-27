import Chrome from '../Chrome';

class Notification
{
  static async show(controller, title, messages, action) {
    let options = {
      type: 'basic',
      title: title,
      message: messages.filter(m => m && m.trim() !== '').join("\n"),
      iconUrl: 'images/128.png',
      isClickable: true,
      requireInteraction: true,
      buttons: [{ title: action, iconUrl: 'images/start.png' }]
    };

    let notificationId = await Chrome.notifications.create(options);
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

export default Notification;