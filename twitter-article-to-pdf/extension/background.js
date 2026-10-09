// Clicking the toolbar button opens the converter page with the current tab's address filled in.
chrome.action.onClicked.addListener(tab => {
  const url = tab && tab.url && /^https:\/\/(x|twitter)\.com\//i.test(tab.url) ? tab.url : '';
  chrome.tabs.create({ url: chrome.runtime.getURL('result.html') + (url ? '?u=' + encodeURIComponent(url) : '') });
});
