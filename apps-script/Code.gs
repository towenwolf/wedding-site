// Setup:
// 1. Google Sheet with two tabs (already created):
//    - "GuestList": the master guest list, columns HouseholdID, FirstName, LastName,
//      AltFirstName, AltLastName (last two optional, for a maiden/alternate name).
//      This sheet IS the source of truth — edit rows directly in Sheets to add,
//      remove, or fix guests. No code changes or redeploys needed; doGet/doPost
//      read it live on every request.
//    - "Responses": columns Timestamp, HouseholdID, GuestName, Attending, DietaryNotes,
//      WelcomeParty, WelcomePartyKids, Note. (Header row only — this script appends to it.)
// 2. Extensions > Apps Script, paste this file in as Code.gs.
// 3. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone.
// 4. Copy the /exec URL into rsvp.html's RSVP_ENDPOINT constant.
//
// rsvp.html calls doGet to look up a name and doPost to submit an RSVP.
// POST bodies are sent as text/plain (not application/json) on purpose —
// that avoids a CORS preflight, which Apps Script Web Apps can't answer.

const GUEST_LIST_SHEET = 'GuestList';
const RESPONSES_SHEET = 'Responses';
const NOTIFY_EMAIL = 'dntwedding2027@gmail.com';

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
      guest.dietary || '',
      body.welcomeParty || '',
      body.welcomePartyKids || '',
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
  const guestLines = body.guests
    .map((g) => `${g.name}: ${g.attending}${g.dietary ? ' (' + g.dietary + ')' : ''}`)
    .join('\n');

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: `New RSVP: household ${body.householdId}`,
    body:
      `${guestLines}\n\n` +
      `Email: ${body.email || '(none given)'}\n` +
      `Welcome Party: ${body.welcomeParty || '(none given)'}\n` +
      `Welcome Party (bringing kids): ${body.welcomePartyKids || '(none given)'}\n` +
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
