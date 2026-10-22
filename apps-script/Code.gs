/**
 * vocom.ai forms backend (Google Apps Script web app).
 *
 * One script handles both website forms, each writing to its own tab of one Google Sheet:
 *   - Quote form (/contact-vocomai)  -> "Quotes" tab + notification email
 *   - Newsletter popup (every page)  -> "Newsletter" tab (duplicates ignored), optional email
 *
 * Deploy: Deploy -> New deployment -> Web app, Execute as: Me, Who has access: Anyone.
 * Paste the /exec URL into src/config.ts (FORMS_URL).
 * After editing this file, redeploy via Manage deployments -> edit the existing
 * deployment -> Version: New version, so the URL stays the same.
 */
var SHEET_ID = '1olKIsOA0bS68Kl6CgIIn-fnKz25YPPmac1u_R1ursQ4';
var NOTIFY_EMAIL = 'kevin@getvocom.com';
var NOTIFY_ON_NEWSLETTER = false; // set true to get an email for every newsletter sign-up

var QUOTE_FIELDS = ['Name', 'Email', 'Company', 'Company Size', 'Use Case', 'I Am A', 'Message'];
// Only asked when Use Case is "Fiber Optic". Stored after the Page column so existing columns don't move.
var FIBER_FIELDS = ['Fiber Count', 'Fiber Type', 'Rating', 'Footage', 'Needed By'];
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var p = (e && e.parameter) || {};
    if (p.website) return json({ result: 'success' }); // honeypot: bots fill it, people never see it
    if (p.form === 'newsletter') return newsletter(p);
    return quote(p);
  } catch (err) {
    return json({ result: 'error', error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function quote(p) {
  var name = (p['Name'] || '').trim();
  var email = (p['Email'] || '').trim();
  var company = (p['Company'] || '').trim();
  if (!name || !company || !EMAIL_RE.test(email)) return json({ result: 'error', error: 'missing or invalid fields' });
  if (p.page !== '/contact-vocomai') return json({ result: 'error', error: 'bad origin' });

  var sheet = tab('Quotes', ['Timestamp'].concat(QUOTE_FIELDS).concat(['Page']).concat(FIBER_FIELDS));
  var row = [new Date()];
  QUOTE_FIELDS.forEach(function (f) { row.push(p[f] || ''); });
  row.push(p.page || '');
  FIBER_FIELDS.forEach(function (f) { row.push(p[f] || ''); });
  sheet.appendRow(row);
  var fiber = FIBER_FIELDS.filter(function (f) { return p[f]; });

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: 'New quote request: ' + name + ' (' + company + ')',
    body: QUOTE_FIELDS.concat(fiber).map(function (f) { return f + ': ' + (p[f] || ''); }).join('\n') + '\n\nPage: https://www.vocom.ai' + (p.page || ''),
    replyTo: email,
    name: 'vocom.ai Website',
  });
  return json({ result: 'success' });
}

function newsletter(p) {
  var email = (p['Email'] || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return json({ result: 'error', error: 'invalid email' });
  if (p.consent !== 'yes') return json({ result: 'error', error: 'no consent' });

  var sheet = tab('Newsletter', ['Timestamp', 'Email', 'Page', 'Consent', 'Status']);
  // ignore repeat sign-ups (column B holds emails)
  var last = sheet.getLastRow();
  if (last > 1) {
    var existing = sheet.getRange(2, 2, last - 1, 1).getValues();
    for (var i = 0; i < existing.length; i++) if (String(existing[i][0]).toLowerCase() === email) return json({ result: 'success', duplicate: true });
  }
  sheet.appendRow([new Date(), email, p.page || '', 'Yes: ' + (p.consentText || ''), 'Subscribed']);

  if (NOTIFY_ON_NEWSLETTER) {
    MailApp.sendEmail({ to: NOTIFY_EMAIL, subject: 'New newsletter sign-up: ' + email, body: 'Page: https://www.vocom.ai' + (p.page || ''), name: 'vocom.ai Website' });
  }
  return json({ result: 'success' });
}

// Returns the named tab, creating it with bold frozen headers on first use, and adding any
// new header columns to an existing tab (e.g. the fiber fields added later).
function tab(name, headers) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  } else if (sheet.getLastColumn() < headers.length) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  return sheet;
}

function doGet() {
  return json({ ok: true, service: 'vocom.ai forms' });
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
