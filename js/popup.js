function runSubmit(event) {
  event.preventDefault();
  console.log(event);
  var sel = document.getElementById("time-options");
  var value = sel.options[sel.selectedIndex].value;
  console.log(value);
  chrome.storage.local.set({
    dateConfig: value
  }, function () {
    chrome.tabs.executeScript({file: 'js/formSubmit.js'});
  });

}

document.getElementById('form').addEventListener('submit', runSubmit);
