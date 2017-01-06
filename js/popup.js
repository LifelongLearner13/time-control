/*----- Popup Script -----*/
// Controls the interactivity of the extensions
// popup. This script is executed in a sandbox,
// so DOM modifications made here will not effect
// the overall page.

function retrieveFormData() {
  var timeSpan = document.querySelector('input[name="time-span"]:checked').value;
  console.log(timeSpan);
  if(timeSpan = 'custom-range') {
      var startTime = document.getElementById('start-date');
      var endTime = document.getElementById('end-date');
      console.log('startTime: ', startTime, ' endTime: ', endTime)
  } else {
    return timeSpan;
  }
}

function onFormSubmit(event) {
  event.preventDefault();
  console.log(event);

  var isDisabled = document.getElementById('disable-extension').checked;

  if(!isDisabled) {
    var timeSpan = retrieveFormData();
    console.log(timeSpan);
    chrome.storage.local.set({
      dateConfig: {
        timeSpan: timeSpan,
      },
    }, function () {

      // Get the tabID of the open tab behind the popup.
      var query = { active:true, windowType:"normal", currentWindow: true };
      chrome.tabs.query(query, function(tabs) {
        var tab = tabs[0];
        console.log(tab)
        if(tab.url.indexOf('search') >= 0) {
          var newURL = tab.url + '&' + timeSpan;

          // Reload the page with the updated URL
          chrome.tabs.update(tab.id, {
              url: newURL,
          });
        }
      });
    });
  }
}

// Populate the popup with stored information.
function onDOMLoaded() {
  console.log('onDOMLoaded')
  chrome.storage.local.get('dateConfig', function (items) {
    var dateConfig = items.dateConfig;
    console.log(dateConfig)
    if(dateConfig.isDisabled) {
      var isDisabled = dateConfig.isDisabled;
      document.getElementById('disable-extension').checked = isDisabled;
    } else if(dateConfig.timeSpan) {
      var timeSpan = dateConfig.timeSpan;
      var radioButtons = document.getElementsByName('time-span');

      for(var i = 0; i < radioButtons.length; i++) {
        if(radioButtons[i].value == timeSpan) {
          radioButtons[i].checked = true;
        }
      }
    }
  });
}

function onExpandableChange(event) {
  console.log('hi');
  console.log(event)
  var radioButton = document.getElementById('expandable');
  event.target.parentElement.setAttribute('aria-expanded', 'true');
  var collapsible = document.getElementById('collapsible');
  collapsible.classList.toggle('display-none');
  collapsible.setAttribute('aria-hidden', 'false');
}

document.getElementById('expandable').addEventListener('change', onExpandableChange);

document.getElementById('form').addEventListener('submit', onFormSubmit);

document.addEventListener("DOMContentLoaded", onDOMLoaded);
