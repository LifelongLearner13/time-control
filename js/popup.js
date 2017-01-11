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
// Clean the url of any previous date spans
let CLEAN_DATE_SPANS = /&tbs=qdr:[ahdwmy]|&tbs=cdr:1,cd_min:\d{1,2}[//]\d{1,2}[//]\d{2,4},cd_max:\d{1,2}[//]\d{1,2}[//]\d{2,4}/g;
/*----- ON PAGE LOAD -----*/

// Populate stored information and add listeners.
function onDOMLoaded() {
  populateSavedData();

  document.getElementById('presets').addEventListener('change', clearFieldSet);
  document.getElementById('start-date').addEventListener('focus', clearFieldSet);
  document.getElementById('end-date').addEventListener('focus', clearFieldSet);

  document.getElementById('msg-button').addEventListener('click', closeMessage);

  document.getElementById('disable-extension').addEventListener('click', disableExtension);

  document.getElementById('form').addEventListener('submit', onFormSubmit);
}

// Helper function, called from onDOMLoaded
// Retrieve data from Chrome's local storage and,
// if applicable, populate the form.
function populateSavedData() {
  chrome.storage.local.get('dateConfig', function(items) {
    var dateConfig = items.dateConfig;

    // If the extension is disabled, then make sure the
    // appropriate checkbox is checked.
    if (dateConfig.isDisabled) {
      document.getElementById('disable-extension').checked = dateConfig.isDisabled;

      // If the extension is not disabled and their is a
      // stored time span, find and update the state of
      // the appropriate radio button or text field.
    } else if (typeof dateConfig.timeSpan === 'string') {
      var timeSpan = dateConfig.timeSpan;
      var dateArray = timeSpan.match(DATE_MATCH);
      // If the time span is custom, then populate
      // text area, else find the appropriate radio button.
      if (dateArray && dateArray.length === 2) {
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
  var element = event.target;
  if (element.type === 'text') {
    var radioButton = document.querySelector('input[name="time-span"]:checked');
    if (radioButton) {
      radioButton.checked = false;
    }
  } else if (element.type === 'radio') {
    var customTimeSpan = document.querySelectorAll('input[type="text"]');
    customTimeSpan[0].value = '';
    customTimeSpan[1].value = '';
  }
}

/*----- RETRIEVE AND VALIDATE FORM DATA -----*/

// Call helper functions to validate form data,
// save it to Chrome's local storage, and reload
// the tab with the entered time span.
function onFormSubmit(event) {
  event.preventDefault();

  var isDisabled = document.getElementById('disable-extension').checked;

  if (!isDisabled) {
    var timeSpan = retrieveFormData();

    if (timeSpan !== -1) {
      setChromeStorage(timeSpan, false);
    }
  } else {
    displayErrorMessage(
      'The extension is disabled. Please Enable the extension to change the time span',
      'disable-extension');
  }
}

// Helper function called from onFormSubmit
// and disableExtension
function setChromeStorage(timeSpan, isDisabled) {
  chrome.storage.local.set({
    dateConfig: {
      timeSpan: timeSpan,
      isDisabled: isDisabled,
    }
  }, function() {
    displaySuccessMessage(
      'Your time span has been saved',
      'presets');
    loadUpdatedTab(timeSpan);
  });
}

// Helper function called from setChromeStorage
function loadUpdatedTab(timeSpan) {

  // Get the tabID of the open tab behind the popup.
  var query = {
    active: true,
    windowType: "normal",
    currentWindow: true
  };

  chrome.tabs.query(query, function(tabs) {
    var tab = tabs[0];
    if (tab.url.indexOf('search') >= 0) {
      // Remove any exsisting date span parameters
      var newURL = tab.url.replace(CLEAN_DATE_SPANS, '');
      var newURL = newURL + '&' + timeSpan;

      // Reload the page with the updated URL
      chrome.tabs.update(tab.id, {url: newURL});
    }
  });
}

// Helper function called from onFormSubmit
function retrieveFormData() {
  var timeSpan = document.querySelector('input[name="time-span"]:checked');
  var customTimeSpan = document.querySelectorAll('input[type="text"]');
  var startTime = customTimeSpan[0];
  var endTime = customTimeSpan[1];

  return basicValidation(timeSpan, startTime, endTime);
}

// Helper function called from retrieveFormData
// Returns the time span or -1, if there is an error
function basicValidation(timeSpan, startTime, endTime) {
  // Nothing was entered
  if (!timeSpan && !startTime.value && !endTime.value) {
    displayErrorMessage('Please choose either a preset or custom time span',
      'presets');

  // Custom time was entered
  } else if (!timeSpan && (startTime.value || endTime.value)) {
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

// Helper function called from basicValidation
// Returns custom time span or -1 if there is an error
function validateCustomTime(start, end) {
  if(DATE_VALIDATE.test(start) && DATE_VALIDATE.test(end)) {
    return 'tbs=cdr:1,cd_min:' + start + ',cd_max:' + end;
  } else {
    displayErrorMessage('Please Enter custom dates in mm/dd/yyyy format', 'start-date');
    return -1;
  }
}

/*----- ERROR AND SUCCESS MESSAGES -----*/

// Displays an alert message above the form if an
// error was detected in the form input.
// Takes the error message to display and id of
// the element closest to the error
function displayErrorMessage(message, toFocusOn) {
  var element = document.getElementById('msg');
  element.classList.add('alert', 'error');

  var msgText = document.getElementById('msg-txt');
  msgText.innerHTML = ''; // remove any previous messages
  var newSpan = document.createElement('span');
  newSpan.classList.add('bold');
  var spanContent = document.createTextNode('ERROR');
  newSpan.appendChild(spanContent);
  var content = document.createTextNode(' ' + message);
  msgText.appendChild(newSpan);
  msgText.appendChild(content);

  document.getElementById('msg-button').classList.remove('display-none');

  document.getElementById(toFocusOn).focus();
}

// Displays an alert message above the form when
// an action has been completed.
// Takes the success message to display and id of
// the element closest to the error
function displaySuccessMessage(message, toFocusOn) {
  var element = document.getElementById('msg');
  element.classList.add('alert', 'success');

  var msgText = document.getElementById('msg-txt');
  msgText.innerHTML = ''; // Remove any previous messages
  var newSpan = document.createElement('span');
  newSpan.classList.add('bold');
  var spanContent = document.createTextNode('SUCCESS');
  newSpan.appendChild(spanContent);
  var content = document.createTextNode(' ' + message);
  msgText.appendChild(newSpan);
  msgText.appendChild(content);

  document.getElementById('msg-button').classList.remove('display-none');

  document.getElementById(toFocusOn).focus();
}

// Closes a message dialog and resets it's
// contents when the "x" button is clicked
function closeMessage(event) {
  var element = document.getElementById('msg');
  element.className = '';

  var msgText = document.getElementById('msg-txt');
  msgText.innerHTML = '';

  document.getElementById('msg-button').classList.add('display-none');
}

/*----- DISABLE AND ENABLE EXTENSION -----*/
function disableExtension(event) {
  var checkbox = event.target;

  if(checkbox.checked) {
    setChromeStorage('', true);
    document.getElementById('form').reset();
    displaySuccessMessage(
      'You have disabled the extension. Time spans are not rembered after the extension has been disabled.',
      'disable-extension');
  } else {
    setChromeStorage('', false);
    displaySuccessMessage(
      'You have enabled the extension. Please either enter a preset or custom time span',
      'presets'
    );
  }
}

/*----- CONNECT SCRIPT AND PAGE -----*/

window.onload = onDOMLoaded();
