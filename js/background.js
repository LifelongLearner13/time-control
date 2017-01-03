
// When the extension is installed or upgraded ...
chrome.runtime.onInstalled.addListener(function() {
  // Replace all rules ...
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    // With a new rule ...
    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { urlContains: 'google' },
          })
        ],
        // And shows the extension's page action.
        actions: [ new chrome.declarativeContent.ShowPageAction() ]
      }
    ]);
  });
});

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
    console.log(details)
    chrome.storage.local.get('dateConfig', function (items) {
      console.log('dateConfig', items);
      if(items.dateConfig) {
        if(details.url.indexOf("www.google.com/search") !== -1 && details.url.indexOf(items.dateConfig) === -1) {
          console.log('inside if')
          var newURL = details.url + '&' + items.dateConfig;
          chrome.tabs.update(details.tabId, {
              url: newURL,
          });
        }
      }
    });
  }
);
