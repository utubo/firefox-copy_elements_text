const notify = document.getElementById('notify');

for (const e of document.getElementsByClassName('i18n')) {
  e.textContent = browser.i18n.getMessage(e.textContent);
}

saveOptions = () => {
  browser.storage.local.set({ notify: notify.checked });
};

restoreOptions = async () => {
  const res = await browser.storage.local.get('notify');
  notify.checked = !! res.notify;
};

document.addEventListener('DOMContentLoaded', restoreOptions);
notify.addEventListener('input', saveOptions);

