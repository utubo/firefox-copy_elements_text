browser.menus.create({
  id: 'copy_elements_text',
  title: browser.i18n.getMessage("Copy Element's text"),
  documentUrlPatterns: ['https://*/*', 'http://*/*'],
  contexts: ['all'],
});

browser.menus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'copy_elements_text') return;

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
          text = e.textContent || e.getAttribute('title') || e.getAttribute('alt');
        }
        text = text || '';

        ${trimFunc}

        if (navigator.clipboard) {
          navigator.clipboard.writeText(text);
        } else {
          const work = document.createElement('TEXTAREA');
          work.value = text;
          document.body.appendChild(work);
          work.select();
          document.execCommand('copy');
          document.body.removeChild(work);
        }
        return text;
      })();
    `
  });
  const text = result[0];
  if (text && res.notify) {
    browser.notifications.create({
      type: 'basic',
      title: browser.i18n.getMessage('Copied'),
      message: text
    });
  }
});

