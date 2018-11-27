function save(filename, data) {
  let link = document.createElement('a');
  link.style = 'display: none; width: 0; height: 0;';
  link.download = filename;
  link.href = `data:application/octet-stream,${encodeURIComponent(data)}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function readText(acceptFileType) {
  let input = document.createElement('input');
  input.type = 'file';
  input.accept = acceptFileType;
  input.style = 'display: none; width: 0; height: 0';

  // See note below about file input cancellation.
  let cancelTimeout = null;
  let onBodyFocusIn = null;

  try {
    return await new Promise((resolve, reject) => {
      input.onchange = e => {
        clearTimeout(cancelTimeout);

        let file = e.target.files[0];
        let reader = new FileReader();

        reader.onload = async f => {
          let content = f.target.result;
          resolve(content);
        };

        reader.readAsText(file);
      };

      input.onabort = () => resolve(null);
      input.onclose = () => resolve(null);
      input.oncancel = () => resolve(null);
      input.onerror = e => reject(e);

      // File input cancellation is not defined in the HTML5 spec, so cancellation
      // events are not directly surfaced through the element. As a workaround, we listen
      // to the body focusin event to determine when the open file dialog is closed,
      // then wait 5 seconds, and finally, we see if the file input element has any selected
      // files. If no files are selected, we assume the dialog was canceled.
      onBodyFocusIn = () => {
        if (!cancelTimeout) {
          cancelTimeout = setTimeout(() => {
            if (input.value.length == 0) {
              resolve(null);
            }
          }, 5 * 1000);
        }
      };

      document.body.addEventListener('focusin', onBodyFocusIn);
      document.body.appendChild(input);
      input.click();
    });
  } finally {
    document.body.removeChild(input);
    document.body.removeEventListener('focusin', onBodyFocusIn);
  }
}

export {
  save,
  readText
};