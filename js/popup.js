function runSubmit(event) {
  event.preventDefault();
  console.log(event);
  var sel = document.getElementById("time-options");
  var value = sel.options[sel.selectedIndex].value;
  console.log(value);
  chrome.storage.local.set({
    dateConfig: value
  }, function () {
    var query = { active: true, currentWindow: true };
    chrome.tabs.query(query, function(tabs) {
      var tabID = tabs[0].id;
      console.log(tabID)
      var oldURL = window.location.href;
      var newURL = oldURL + '&' + value;
      chrome.tabs.update(tabID, {
          url: newURL,
      });
    });
  });

}

document.getElementById('form').addEventListener('submit', runSubmit);
