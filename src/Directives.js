const focus = {
  inserted(el) {
    let input = el.querySelector('input');
    (input || el).focus();
  }
}

export {
  focus
};