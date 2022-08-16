for (const e of document.getElementsByClassName('i18n')) {
  e.textContent = browser.i18n.getMessage(e.textContent);
}

const form = document.forms.config;

saveOptions = () => {
  browser.storage.local.set({
    notify: form.notify.checked,
    trim: form.trim.value,
  });
};

restoreOptions = async () => {
  const res = await browser.storage.local.get();
  form.notify.checked = !! res.notify;
  form.trim.value = res.trim || 'disable';
};

document.addEventListener('DOMContentLoaded', restoreOptions);

for (const ipt of document.getElementsByTagName('INPUT')) {
  ipt.addEventListener('input', saveOptions);
}

