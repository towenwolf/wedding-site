// Setup:
// 1. Create a Google Sheet with two tabs:
//    - "GuestList": columns HouseholdID, FirstName, LastName, AltFirstName, AltLastName
//      (the last two are optional, for guests who might search under a maiden/alternate
//      name).
//    - "Responses": columns Timestamp, HouseholdID, GuestName, Attending, MealChoice, DietaryNotes, Note.
//      (Header row only — this script appends to it.)
// 2. Extensions > Apps Script, paste this file in as Code.gs.
// 3. Run > select `seedGuestList` once to populate the GuestList tab from GUEST_LIST
//    below (grant permissions when asked). Delete this run afterward — it's a one-time
//    seed, not something that needs to fire again.
// 4. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone.
// 5. Copy the /exec URL into rsvp.html's RSVP_ENDPOINT constant.
//
// rsvp.html calls doGet to look up a name and doPost to submit an RSVP.
// POST bodies are sent as text/plain (not application/json) on purpose —
// that avoids a CORS preflight, which Apps Script Web Apps can't answer.

const GUEST_LIST_SHEET = 'GuestList';
const RESPONSES_SHEET = 'Responses';
const NOTIFY_EMAIL = 'dntwedding2027@gmail.com';

// [householdId, first, last, altFirst, altLast]
const GUEST_LIST = [
  [1, 'Margaret', 'Wolf', '', ''],
  [2, 'Steve', 'Wolf', '', ''],
  [2, 'Kristin', 'Wolf', '', ''],
  [3, 'Jeff', 'Wolf', '', ''],
  [3, 'Julie', 'Wolf', '', ''],
  [4, 'Davis', 'Wolf', '', ''],
  [4, 'Celia', 'Wolf', '', ''],
  [5, 'Conrad', 'Wolf', '', ''],
  [6, 'Rob', 'Wolf', '', ''],
  [6, 'Amy', 'Wolf', '', ''],
  [6, 'Natalie', 'Wolf', '', ''],
  [6, 'Nick', 'Wolf', '', ''],
  [7, 'Lauren', 'Winchester', '', ''],
  [7, 'Ryan', 'Winchester', '', ''],
  [8, 'Tyler', 'West', '', ''],
  [8, 'Leanne', 'West', 'Leanne', 'Bergeron'],
  [9, 'Michael', 'Vuto', '', ''],
  [9, 'Leslie', 'Vuto', '', ''],
  [9, 'Levi', 'Vuto', '', ''],
  [10, 'Paul', 'Vuto', '', ''],
  [10, 'Kathy', 'Vuto', '', ''],
  [11, 'Jordan', 'Stevenson', '', ''],
  [11, 'Beth', 'Barnowski', '', ''],
  [12, 'Alice', 'Steele', '', ''],
  [13, 'Glen', 'Steele', '', ''],
  [14, 'Holden', 'Smith', '', ''],
  [15, 'Alex', 'Smith', '', ''],
  [16, 'Eric', 'Rymer', '', ''],
  [16, 'Sian', 'Rymer', '', ''],
  [17, 'Justin', 'Rodriguez', '', ''],
  [18, 'Diamond', 'Podmore', '', ''],
  [18, 'Travis', 'Wolf', '', ''],
  [19, 'MacArthur', 'Peterson', '', ''],
  [19, 'Courtney', 'Peterson', '', ''],
  [20, 'Rob', 'Peterson', '', ''],
  [20, 'Gina', 'Peterson', '', ''],
  [21, 'Lucas', 'Mulkey', '', ''],
  [21, 'Miaja', 'Turks', '', ''],
  [22, 'Hunter', 'Mowery', '', ''],
  [22, 'Michelle', 'Mowery', '', ''],
  [23, 'Robert', 'McGowen', '', ''],
  [23, 'Michelle', 'McGowen', '', ''],
  [24, 'Paul', 'McCartney', '', ''],
  [24, 'Patti', 'McCartney', '', ''],
  [25, 'Stratton', 'Mann', '', ''],
  [26, 'Matthew', 'Levine', '', ''],
  [26, 'Catherine', 'Levine', '', ''],
  [27, 'Michelle', 'Isbandi', '', ''],
  [28, 'Great', 'Ibe', '', ''],
  [29, 'Hayden', 'Housson', '', ''],
  [30, 'Halston', 'Harris', '', ''],
  [30, 'Eugénie', 'Harris', '', ''],
  [31, 'Connor', 'Hanson', '', ''],
  [31, 'Maddy', 'Roe', '', ''],
  [32, 'Cole', 'Crump', '', ''],
  [32, 'Hailey', 'Crump', '', ''],
  [33, 'Josh', 'Chiasson', '', ''],
  [33, 'Claire', 'Chiasson', '', ''],
  [34, 'Heather', 'Bussing', '', ''],
  [34, 'John', 'Sumser', '', ''],
  [35, 'Andy', 'Bewick', '', ''],
  [35, 'Allie', 'Bewick', '', ''],
  [36, 'Lorraine', 'Bergeron', '', ''],
  [37, 'Sean', 'Arca', '', ''],
  [37, 'Tayler', 'Arca', '', ''],
  [38, 'Tim', 'Adamsen', '', ''],
  [38, 'Angie', 'Barney', '', ''],
];

function seedGuestList() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(GUEST_LIST_SHEET);
  if (!sheet) sheet = ss.insertSheet(GUEST_LIST_SHEET);
  sheet.clearContents();
  sheet.appendRow(['HouseholdID', 'FirstName', 'LastName', 'AltFirstName', 'AltLastName']);
  sheet.getRange(2, 1, GUEST_LIST.length, 5).setValues(GUEST_LIST);

  if (!ss.getSheetByName(RESPONSES_SHEET)) {
    const responses = ss.insertSheet(RESPONSES_SHEET);
    responses.appendRow(['Timestamp', 'HouseholdID', 'GuestName', 'Attending', 'MealChoice', 'DietaryNotes', 'Note']);
  }
}

function doGet(e) {
  const query = normalizeName_(e.parameter.name || '');
  if (!query) {
    return jsonOutput_({ found: false });
  }

  const guests = readGuestList_();
  const matched = guests.find((g) => {
    if (normalizeName_(g.first + ' ' + g.last) === query) return true;
    if (g.altFirst && g.altLast && normalizeName_(g.altFirst + ' ' + g.altLast) === query) return true;
    return false;
  });

  if (!matched) {
    return jsonOutput_({ found: false });
  }

  const household = guests.filter((g) => g.householdId === matched.householdId);
  return jsonOutput_({
    found: true,
    householdId: matched.householdId,
    guests: household.map((g) => ({ first: g.first, last: g.last })),
  });
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(RESPONSES_SHEET);
  const timestamp = new Date();

  body.guests.forEach((guest) => {
    sheet.appendRow([
      timestamp,
      body.householdId,
      guest.name,
      guest.attending,
      guest.meal || '',
      body.dietary || '',
      body.note || '',
    ]);
  });

  if (body.email) {
    sendConfirmationEmail_(body.email);
  }

  notifyCouple_(body);

  return jsonOutput_({ ok: true });
}

function notifyCouple_(body) {
  const guestLines = body.guests.map((g) => `${g.name}: ${g.attending}${g.meal ? ' (' + g.meal + ')' : ''}`).join('\n');

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: `New RSVP: household ${body.householdId}`,
    body:
      `${guestLines}\n\n` +
      `Email: ${body.email || '(none given)'}\n` +
      `Dietary notes: ${body.dietary || '(none)'}\n` +
      `Note to couple: ${body.note || '(none)'}`,
  });
}

function readGuestList_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(GUEST_LIST_SHEET);
  const rows = sheet.getDataRange().getValues();
  const [header, ...data] = rows;
  return data
    .filter((row) => row[0] !== '')
    .map((row) => ({
      householdId: String(row[0]),
      first: String(row[1]),
      last: String(row[2]),
      altFirst: String(row[3] || ''),
      altLast: String(row[4] || ''),
    }));
}

function normalizeName_(name) {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

function jsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function sendConfirmationEmail_(email) {
  MailApp.sendEmail({
    to: email,
    subject: "You're invited — add Diamond & Travis's wedding to your calendar",
    body:
      'Thanks for RSVPing! Attached is a calendar invite for the wedding.\n\n' +
      'Ceremony: Saturday, May 15, 2027, 4:00 PM\n' +
      'Reception: 6:00 PM – 11:00 PM\n' +
      'Location: Powell Butte, Oregon\n\n' +
      'More details: https://howlwewed.com',
    attachments: [buildIcs_()],
    name: 'Diamond & Travis',
  });
}

function buildIcs_() {
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
