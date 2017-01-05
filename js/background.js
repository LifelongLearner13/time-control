// When the extension is installed or upgraded ...
chrome.runtime.onInstalled.addListener(function() {
  // Replace all rules ...
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    // With a new rule ...
    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [new chrome.declarativeContent.PageStateMatcher({
            pageUrl: {
              urlContains: 'google'
            }
          })],
        // And shows the extension's page action.
        actions: [new chrome.declarativeContent.ShowPageAction()]
      }
    ]);
  });
});

chrome.webNavigation.onBeforeNavigate.addListener(function(details) {
  console.log(details)
  chrome.storage.local.get('dateConfig', function(items) {
    console.log('dateConfig', items);
    if (items.dateConfig) {
      if (details.url.indexOf(items.dateConfig) === -1 && details.url.indexOf('tbs=qdr') === -1 && details.url.indexOf('tbs=cdr') === -1) {
        console.log('inside if')
        var newURL = details.url + '&' + items.dateConfig;
        chrome.tabs.update(details.tabId, {url: newURL});
      }
    }
  });
}, {
  url: [
    {
      hostSuffix: 'google.com',
      pathContains: 'search',
      queryContains: 'q='
    }
  ]
});
// There is a lot of variation in how google's urls are organized across services and countries
// The above filters should limit the event to searches made through the American version
// of google.com.
