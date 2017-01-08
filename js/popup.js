// POPUP SCRIPT
// Controls the interactivity of the extension's
// popup. This script is executed in a sandbox,
// so DOM modifications made here will not effect
// the overall page.

/*----- REGULAR EXPRESSIONS -----*/
// Matches a date in mm/dd/yyyy formate from 01/01/1900 throug 12/31/2099.
// credit: http://www.regular-expressions.info/dates.html
let DATE_MATCH = /(0[1-9]|1[012])([//])(0[1-9]|[12][0-9]|3[01])\2(19|20)\d\d/g;
// Same as above but this will be used to validate user input.
let DATE_VALIDATE = /^(0[1-9]|1[012])([//])(0[1-9]|[12][0-9]|3[01])\2(19|20)\d\d$/g;

/*----- ON PAGE LOAD -----*/

// Populate the popup with stored information.
function onDOMLoaded() {
  console.log('onDOMLoaded')

  addRatioListeners();
  populateSavedData();
  document.getElementById('form').addEventListener('submit', onFormSubmit);
}

function addRatioListeners() {
  console.log('addRatioListeners')
  var radioButtons = document.querySelectorAll("input[type=radio]");
  for(var i = 0; i < radioButtons.length; i++) {
    radioButtons[i].addEventListener('change', expandDateInput);
  }
}

document.addEventListener("DOMContentLoaded", onDOMLoaded);

function populateSavedData() {
  chrome.storage.local.get('dateConfig', function (items) {
    var dateConfig = items.dateConfig;
    console.log(dateConfig)
    // If the extension is disabled, then make sure the
    // appropriate checkbox is checked.
    if(dateConfig.isDisabled) {
      var isDisabled = dateConfig.isDisabled;
      document.getElementById('disable-extension').checked = isDisabled;

    // If the extension is not disabled and their is a
    // stored time span, find and update the state of
    // the appropriate radio button.
    } else if(dateConfig.timeSpan) {
      var timeSpan = dateConfig.timeSpan;
      var dateArray = timeSppan.match(DATE_MATCH);

      // If the time span is custom, then the text
      // input area must be expanded and populated.
      if(dateArray && dateArray.length === 2) {
        expandDateInput(dateArray[0], dateArray[1]);
      } else {
        var radioButtons = document.getElementsByName('time-span');
        for(var i = 0; i < radioButtons.length - 1; i++) {
          if(radioButtons[i].value == timeSpan) {
            radioButtons[i].checked = true;
          }
        }
      }
    }
  });
}

/*----- EXPAND DATE ENTRY AREA -----*/

function expandDateInput(event) {
  console.log("Checked: "+this.checked);
  console.log("Name: "+this.name);
  console.log("Value: "+this.value);
  console.log("Parent: "+this.parentElement);

  var radioButton = this;
  var label = document.getElementById('expandable-label');
  var collapsible = document.getElementById('collapsible');
  console.log(collapsible.getAttribute('aria-hidden'))
  // Expand the text area
  console.log('radioButton.value === custom-range', radioButton.value === 'custom-range','radioButton.checked', radioButton.checked)
  console.log('collapsible.getAttribute(aria-hidden):', collapsible.getAttribute('aria-hidden'));
  if(radioButton.value === 'custom-range' && radioButton.checked) {
    label.setAttribute('aria-expanded', 'true');
    collapsible.classList.toggle('display-none');
    collapsible.setAttribute('aria-hidden', 'false');
    console.log('inside if: ', typeof collapsible.getAttribute('aria-hidden'), collapsible.getAttribute('aria-hidden'))
  // Custom-range radio button is not checked, close the text area
} else if(collapsible.getAttribute('aria-hidden') === 'false') {
    console.log('inside else if')
    label.setAttribute('aria-expanded', 'false');
    collapsible.classList.toggle('display-none');
    collapsible.setAttribute('aria-hidden', 'true');
  }
}

// function onExpandableChange(event) {
//   console.log(event)
//   expandDateInput('', '');
// }

// document.getElementById('expandable').addEventListener('change', onExpandableChange);

/*----- RETRIEVE AND VALIDATE FORM DATA -----*/

function retrieveFormData() {
  var timeSpan = document.querySelector('input[name="time-span"]:checked').value;
  console.log(timeSpan);
  if(timeSpan = 'custom-range') {
      var startTime = document.getElementById('start-date');
      var endTime = document.getElementById('end-date');
      console.log('startTime: ', startTime.value, ' endTime: ', endTime.value)
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
