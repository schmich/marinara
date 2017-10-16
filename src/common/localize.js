function loadLocalizedContent() {
  for (let el of document.querySelectorAll('[data-t]')) {
    el.innerText = chrome.i18n.getMessage(el.dataset.t);
  }
}

document.addEventListener('DOMContentLoaded', loadLocalizedContent);
