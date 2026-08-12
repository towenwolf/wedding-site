// Setup:
// 1. Open the Google Sheet that collects RSVP form responses.
// 2. Extensions > Apps Script.
// 3. Paste this file's contents in, replacing Code.gs.
// 4. Update EMAIL_QUESTION_TITLE below to match your form's email question text exactly.
// 5. Run > select `createTrigger` once to install the onFormSubmit trigger (grant permissions when asked).
// 6. Delete the temporary `createTrigger` run — the trigger itself now fires on every future submission.

const EMAIL_QUESTION_TITLE = 'Email'; // must match the form question title exactly

function createTrigger() {
  ScriptApp.newTrigger('onFormSubmit')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onFormSubmit()
    .create();
}

function onFormSubmit(e) {
  const email = e.namedValues[EMAIL_QUESTION_TITLE] && e.namedValues[EMAIL_QUESTION_TITLE][0];
  if (!email) return;

  const ics = buildIcs();

  MailApp.sendEmail({
    to: email,
    subject: "You're invited — add Diamond & Travis's wedding to your calendar",
    body:
      'Thanks for RSVPing! Attached is a calendar invite for the wedding.\n\n' +
      'Ceremony: Saturday, May 15, 2027, 4:00 PM\n' +
      'Reception: 6:00 PM – 11:00 PM\n' +
      'Location: Powell Butte, Oregon\n\n' +
      'More details: https://howlwewed.com',
    attachments: [ics],
    name: 'Diamond & Travis',
  });
}

function buildIcs() {
  const content = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Diamond & Travis Wedding//howlwewed.com//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    'UID:diamond-travis-wedding-2027@howlwewed.com',
    'DTSTAMP:' + Utilities.formatDate(new Date(), 'UTC', "yyyyMMdd'T'HHmmss'Z'"),
    'DTSTART:20270515T230000Z',
    'DTEND:20270516T060000Z',
    "SUMMARY:Diamond & Travis's Wedding",
    'DESCRIPTION:Ceremony at 4:00 PM\\, reception to follow 6:00 PM – 11:00 PM. Details at https://howlwewed.com',
    'LOCATION:Powell Butte\\, Oregon',
    'URL:https://howlwewed.com',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return Utilities.newBlob(content, 'text/calendar', 'wedding.ics');
}
