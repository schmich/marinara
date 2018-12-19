import Chrome from '../Chrome';
import Mutex from '../Mutex';

class Notification
{
  constructor(title, message, onClick = null) {
    this.title = title;
    this.message = message;
    this.buttons = [];
    this.notificationId = null;
    this.onClick = onClick;
  }

  addButton(title, onClick) {
    this.buttons.push({ title, onClick });
  }

  async show() {
    if (this.notificationId != null) {
      return;
    }

    let options = {
      type: 'basic',
      title: this.title,
      message: this.message,
      iconUrl: 'images/128.png',
      isClickable: !!this.action,
      requireInteraction: true,
      buttons: this.buttons.map(b => {
        return {
          title: b.title,
          iconUrl: 'images/start.png'
        };
      })
    };

    this.notificationId = await Chrome.notifications.create(options);

    let notificationClicked = notificationId => {
      if (notificationId !== this.notificationId) {
        return;
      }
      this.onClick && this.onClick();
      chrome.notifications.clear(notificationId);
    };

    let buttonClicked = (notificationId, buttonIndex) => {
      if (notificationId !== this.notificationId) {
        return;
      }
      this.buttons[buttonIndex].onClick();
      chrome.notifications.clear(notificationId);
    };

    let notificationClosed = notificationId => {
      if (notificationId !== this.notificationId) {
        return;
      }
      chrome.notifications.onClicked.removeListener(notificationClicked);
      chrome.notifications.onButtonClicked.removeListener(buttonClicked);
      chrome.notifications.onClosed.removeListener(notificationClosed);
      this.notificationId = null;
    };

    chrome.notifications.onClicked.addListener(notificationClicked);
    chrome.notifications.onButtonClicked.addListener(buttonClicked);
    chrome.notifications.onClosed.addListener(notificationClosed);
  }

  close() {
    if (this.notificationId != null) {
      chrome.notifications.clear(this.notificationId);
    }
  }
}

export default Notification;