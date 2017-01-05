/*----- Popup Script -----*/
// Controls the interactivity of the extensions
// popup. This script is executed in a sandbox,
// so DOM modifications made here will not effect
// the overall page.

function runSubmit(event) {
  event.preventDefault();
  console.log(event);
  var sel = document.getElementById("time-options");
  var value = sel.options[sel.selectedIndex].value;
  console.log(value);
  chrome.storage.local.set({
    dateConfig: value
  }, function () {

    // Get the tabID of the open tab behind the popup.
    var query = { active:true,windowType:"normal", currentWindow: true };
    chrome.tabs.query(query, function(tabs) {
      var tabID = tabs[0].id;
      console.log(tabID)
      var oldURL = window.location.href;
      var newURL = oldURL + '&' + value;

      // Reload the page with the new parameter
      chrome.tabs.update(tabID, {
          url: newURL,
      });
    });
  });

}

document.getElementById('form').addEventListener('submit', runSubmit);
