function loadLocalizedContent() {
  for (let el of document.querySelectorAll('[data-t]')) {
    el.innerText = T(...el.dataset.t.split(','));
  }

  for (let el of document.querySelectorAll('[data-a]')) {
    let parts = el.dataset.a.split(':');
    el[parts[0]] = T(...parts[1].split(','));
  }
}

document.addEventListener('DOMContentLoaded', loadLocalizedContent);
