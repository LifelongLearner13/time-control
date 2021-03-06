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
  chrome.storage.local.get('dateConfig', function(items) {
    var dateConfig = items.dateConfig;
    if (dateConfig.timeSpan && !dateConfig.isDisabled) {
      var timeSpan = dateConfig.timeSpan;
      if (details.url.indexOf(timeSpan) === -1 && details.url.indexOf('tbs=qdr') === -1 && details.url.indexOf('tbs=cdr') === -1) {
        var newURL = details.url + '&' + timeSpan;
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
