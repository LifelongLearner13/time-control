chrome.storage.local.get('dateConfig', function (items) {
    var oldLocation = window.location.href;
    window.location = oldLocation + '&' + items.dateConfig;
    chrome.storage.local.remove('dateConfig');
});
