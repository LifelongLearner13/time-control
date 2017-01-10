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
let DATE_VALIDATE = /^(0[1-9]|1[012])([//])(0[1-9]|[12][0-9]|3[01])\2(19|20)\d\d$/;

/*----- ON PAGE LOAD -----*/

// Populate stored information and add listeners.
function onDOMLoaded() {
  console.log('onDOMLoaded')

  populateSavedData();

  document.getElementById('presets').addEventListener('change', clearFieldSet);
  document.getElementById('start-date').addEventListener('focus', clearFieldSet);
  document.getElementById('end-date').addEventListener('focus', clearFieldSet);

  document.getElementById('msg-button').addEventListener('click', closeMessage);

  document.getElementById('form').addEventListener('submit', onFormSubmit);
}

// Retrieve data from Chrome's local storage and, if applicable, populate the form.
function populateSavedData() {
  chrome.storage.local.get('dateConfig', function(items) {
    var dateConfig = items.dateConfig;
    console.log(dateConfig)

    // If the extension is disabled, then make sure the
    // appropriate checkbox is checked.
    if (dateConfig.isDisabled) {
      document.getElementById('disable-extension').checked = dateConfig.isDisabled;

      // If the extension is not disabled and their is a
      // stored time span, find and update the state of
      // the appropriate radio button or text field.
    } else if (typeof dateConfig.timeSpan === 'string') {
      var timeSpan = dateConfig.timeSpan;
      console.log('timeSpan: ', timeSpan);
      var dateArray = timeSpan.match(DATE_MATCH);
      console.log('dateArray: ', dateArray);
      // If the time span is custom, then populate
      // text area, else find the appropriate radio button.
      if (dateArray && dateArray.length === 2) {
        console.log(typeof dateArray[0], typeof dateArray[1])
        document.getElementById('start-date').value = dateArray[0];
        document.getElementById('end-date').value = dateArray[1];
      } else {
        var radioButtons = document.getElementsByName('time-span');
        for (var i = 0; i < radioButtons.length - 1; i++) {
          if (radioButtons[i].value == timeSpan) {
            radioButtons[i].checked = true;
          }
        }
      }
    }
  });
}

// Ensures only a preset or custom time span is submitted.
function clearFieldSet(event) {
  console.log('clearFieldSet: ', event);
  var element = event.target;
  if (element.type === 'text') {
    var radioButton = document.querySelector('input[name="time-span"]:checked');
    if (radioButton) {
      radioButton.checked = false;
    }
  } else if (element.type === 'radio') {
    var customTimeSpan = document.querySelectorAll('input[type="text"]');
    console.log('customTimeSpan: ', customTimeSpan)
    customTimeSpan[0].value = '';
    customTimeSpan[1].value = '';
  }
}

/*----- RETRIEVE AND VALIDATE FORM DATA -----*/

function onFormSubmit(event) {
  event.preventDefault();
  console.log(event);

  var isDisabled = document.getElementById('disable-extension').checked;

  if (!isDisabled) {
    var timeSpan = retrieveFormData();

    if (timeSpan !== -1) {
      console.log('onFormSubmit: ', timeSpan);
      chrome.storage.local.set({
        dateConfig: {
          timeSpan: timeSpan,
          isDisabled: false
        }
      }, function() {

        // Get the tabID of the open tab behind the popup.
        var query = {
          active: true,
          windowType: "normal",
          currentWindow: true
        };
        chrome.tabs.query(query, function(tabs) {
          var tab = tabs[0];
          console.log(tab)
          if (tab.url.indexOf('search') >= 0) {
            var newURL = tab.url + '&' + timeSpan;

            // Reload the page with the updated URL
            chrome.tabs.update(tab.id, {url: newURL});
          }
        });
      });
    }
  }
}

function retrieveFormData() {
  var timeSpan = document.querySelector('input[name="time-span"]:checked');
  console.log('timeSpan: ', timeSpan);
  var customTimeSpan = document.querySelectorAll('input[type="text"]');
  console.log('customTimeSpan: ', customTimeSpan)
  var startTime = customTimeSpan[0]
  var endTime = customTimeSpan[1]
  console.log('startTime: ', startTime, ' endTime: ', endTime)

  return basicValidation(timeSpan, startTime, endTime);
}

function basicValidation(timeSpan, startTime, endTime) {
  // Nothing was entered
  if (!timeSpan && !startTime.value && !endTime.value) {
    console.log('!timeSpan && !startTime.value && !endTime.value')
    displayErrorMessage('Please choose either a preset or custom time span',
      'presets');

    // Custom time was entered
  } else if (!timeSpan && (startTime.value || endTime.value)) {
    console.log(startTime.value, ' || ', endTime.value)
    if (!startTime.value || !endTime.value) {
      displayErrorMessage('Please enter both a start and end time for a custom time span.',
        'start-date');
    } else {
      return validateCustomTime(startTime.value, endTime.value);
    }

  // Preset was selected
  } else if (timeSpan && !startTime.value && !endTime.value) {
    return timeSpan.value;
  }

  return -1;
}

function validateCustomTime(start, end) {
  if(DATE_VALIDATE.test(start) && DATE_VALIDATE.test(end)) {
    console.log('validateCustomTime: success');
    return 'tbs=cdr:1,cd_min:' + start + ',cd_max:' + end;
  } else {
    console.log('validateCustomTime: ', DATE_VALIDATE.test(start), DATE_VALIDATE.test(end));
    displayErrorMessage('Please Enter custom dates in mm/dd/yyyy formate', 'start-date');
    return -1;
  }
}



/*----- ERROR AND SUCCESS MESSAGES -----*/

function displayErrorMessage(message, toFocusOn) {
  console.log('displayed error: ', message)
  var element = document.getElementById('msg');
  element.classList.add('alert', 'error');

  var msgText = document.getElementById('msg-txt');
  var newSpan = document.createElement('span');
  var spanContent = document.createTextNode('ERROR');
  newSpan.appendChild(spanContent);
  var content = document.createTextNode(' ' + message);
  msgText.appendChild(newSpan);
  msgText.appendChild(content);

  document.getElementById('msg-button').classList.remove('display-none');

  document.getElementById(toFocusOn).focus();
}

function closeMessage(event) {
  console.log('close message')
  var element = document.getElementById('msg');
  element.className = '';

  var msgText = document.getElementById('msg-txt');
  msgText.innerHTML = '';

  document.getElementById('msg-button').classList.add('display-none');
}

/*----- CONNECT SCRIPT AND PAGE -----*/

window.onload = onDOMLoaded();
