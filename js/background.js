/*----- Background Script -----*/
// Runs ccontinuously in the background listening and
// reacting to browser events.

// Fires when the extension is installed or updated
chrome.runtime.onInstalled.addListener(function() {
  // Replace all rules ...
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    // Add a new rule to active extension when page matches the specified
    // criteria, i.e. host contains "google.com", the path contains search,
    // and the css contains the class ".gsfi"
    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [new chrome.declarativeContent.PageStateMatcher({
            pageUrl: {
              hostSuffix: 'google.com',
              pathContains: 'search',
            },
              css: [".gsfi"]
            })],
        // Activate/show extension
        actions: [new chrome.declarativeContent.ShowPageAction()]
      }
    ]);
  });
});

// Listens for navigation events. If a url matches the filters listed
// below, the listener intercepts the request before it is loaded
// in the browser. If a date range has been saved in the browser's
// storage, the appropriate parameter is added to the end of the url
// and the page is reloaded.
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
