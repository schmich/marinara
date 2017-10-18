function loadLocalizedContent() {
  for (let el of document.querySelectorAll('[data-t]')) {
    let param = el.dataset.tp;
    el.innerText = T(el.dataset.t, param);
  }
}

document.addEventListener('DOMContentLoaded', loadLocalizedContent);
