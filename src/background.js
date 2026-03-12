const MENU_ID = 'copy_elements_text';
const TITLE = browser.i18n.getMessage("Copy Element's text");
const COPY = 'Copy';

browser.menus.create({
  id: MENU_ID,
  title: TITLE,
  documentUrlPatterns: ['https://*/*', 'http://*/*'],
  contexts: ['all'],
});

let targetText = null;

browser.menus.onShown.addListener(async (info, tab) => {
  if (info.targetElementId) {
    try {
      targetText = await getText(info, tab);
    } catch {
      // nop
    }
    if (targetText) {
      browser.menus.update(MENU_ID, {
        enabled: true,
        title: `${COPY}: "${trunc(targetText, 10)}"`,
      });
    } else {
      browser.menus.update(MENU_ID, { enabled: false, title: TITLE });
    }
  } else {
    // only parmitted when click
    browser.menus.update(MENU_ID, { enabled: true, title: TITLE });
    targetText = null;
  }
  browser.menus.refresh();
});

browser.menus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'copy_elements_text') return;
  const text = targetText || await getText(info, tab);
  if (!text) return;
  navigator.clipboard.writeText(text);
  const res = await browser.storage.local.get();
  if (res.notify) {
    browser.notifications.create({
      type: 'basic',
      title: browser.i18n.getMessage('Copied'),
      message: text
    });
  }
});

const getText = async (info, tab) => {
  const res = await browser.storage.local.get();
  let trimFunc = '';
  if (res.trim === 'keep_indent') {
    trimFunc = `
      const lines = text.replace(/^\\s+|\\s+$/g, '').split('\\n');
      const indent = RegExp('^' + lines[0].replace(/\\S.*/, ''));
      const newLines = [];
      for (const line of lines) {
        newLines.push(line.replace(indent, '').replace('/\\s+$/', ''))
      }
      text = newLines.join('\\n');
    `;
  } else if (res.trim === 'trim_all_lines') {
    trimFunc = `text = text.replace(/(^|\\n)\\s+/g, '$1').replace(/\\s+($|\\n)/g, '$1');`;
  } else if (res.trim === 'remove_all_line_breaks') {
    trimFunc = `text = text.replace(/^\\s+|\\s+$/g, '').replace(/\\s+/g, ' ');`;
  }

  const result = await browser.tabs.executeScript(tab.id, {
    code: `
      (() => {
        const e = browser.menus.getTargetElement(${info.targetElementId});
        let text = '';
        switch (e.tagName) {
        case 'TEXTAREA':
        case 'INPUT':
          text = e.value || e.getAttribute('placeholder');
          break;
        case 'SELECT':
          text = e.options[e.selectedIndex].text;
          break;
        default:
          text = e.innerText || e.getAttribute('title') || e.getAttribute('alt') || e.textContent;
        }
        text = text || '';

        ${trimFunc}

        return text;
      })();
    `
  });
  return result[0];
};

const trunc = (str, n) => (n < str.length) ? str.slice(0, n - 3) + '...' : str;

