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
// Added 2026-10-27 at the end of the Quotes tab so earlier columns don't move.
var EXTRA_FIELDS = ['Delivery Location'];
// Personal mailbox domains: such leads are kept, just flagged "Free Email: Yes" in the sheet and email.
var FREE_EMAIL_RE = /@(gmail\.com|googlemail\.com|yahoo\.(com|ca|co\.uk|com\.\w+)|ymail\.com|hotmail\.(com|ca|co\.uk|fr|de)|outlook\.(com|ca|co\.uk)|live\.(com|ca|co\.uk)|msn\.com|aol\.com|icloud\.com|me\.com|mac\.com|proton\.me|protonmail\.com|gmx\.(com|net|de)|mail\.com|yandex\.(com|ru)|zoho\.com|qq\.com|163\.com|126\.com)$/i;
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Cloudflare Turnstile secret key. Kept out of the code (this file is in the repo): set it in
// Apps Script -> Project Settings -> Script Properties as TURNSTILE_SECRET. Empty = check skipped.
var TURNSTILE_SECRET = PropertiesService.getScriptProperties().getProperty('TURNSTILE_SECRET') || '';
// Server-side Turnstile check needs the "external requests" permission. Until it has been granted
// (run authorize() once), keep this false: the check still runs in the visitor's browser.
var VERIFY_TURNSTILE_ON_SERVER = false;
// Drive folder for requirements spreadsheets attached to quote requests (created on first use).
var ATTACH_FOLDER = 'vocom.ai quote attachments';
var ATTACH_TYPES = /\.(xlsx|xls|csv|pdf)$/i;
var ATTACH_MAX_BYTES = 10 * 1024 * 1024;

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var p = (e && e.parameter) || {};
    // Spam traps (bots get a normal-looking success, nothing is saved or sent):
    // the hidden "website", "Website" and "Fax" fields are never visible to people,
    // and a real person takes more than 3 seconds to fill in a form.
    // Only a real save replies saved: true, which triggers the Google Ads conversion on the website.
    if (p.website || p['Website'] || p['Fax']) return json({ result: 'success' });
    if (p.elapsed && Number(p.elapsed) < 3000) return json({ result: 'success' });
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
  // Turnstile: a token that fails is rejected. With no token at all (the widget could not load for
  // that visitor) the request is kept but flagged, so a real lead is never lost.
  var unverified = false;
  if (TURNSTILE_SECRET) {
    var token = p['cf-turnstile-response'];
    var check = !token ? null : VERIFY_TURNSTILE_ON_SERVER ? turnstileOk(token) : true; // true, false, or null if unchecked
    if (check === false) return json({ result: 'error', error: 'verification failed' });
    unverified = check !== true;
  }

  // Requirements file: always attached to the email; also saved to Drive when Drive access is granted.
  var blob = attachmentBlob(p, name, company);
  var file = null;
  if (blob) { try { file = saveToDrive(blob); } catch (err) { console.error('Drive save failed: ' + err); } }

  var sheet = tab('Quotes', ['Timestamp'].concat(QUOTE_FIELDS).concat(['Page']).concat(FIBER_FIELDS).concat(['Attachment']).concat(EXTRA_FIELDS).concat(['Free Email']));
  var row = [new Date()];
  QUOTE_FIELDS.forEach(function (f) { row.push(p[f] || ''); });
  row.push(p.page || '');
  FIBER_FIELDS.forEach(function (f) { row.push(p[f] || ''); });
  row.push(file ? file.getUrl() : blob ? 'Emailed: ' + blob.getName() : '');
  EXTRA_FIELDS.forEach(function (f) { row.push(p[f] || ''); });
  var free = FREE_EMAIL_RE.test(email);
  row.push(free ? 'Yes' : '');
  sheet.appendRow(row);
  var fiber = FIBER_FIELDS.concat(EXTRA_FIELDS).filter(function (f) { return p[f]; });

  var mail = {
    to: NOTIFY_EMAIL,
    subject: (unverified ? '[Unverified] ' : '') + 'New quote request: ' + name + ' (' + company + ')',
    body: QUOTE_FIELDS.concat(fiber).map(function (f) { return f + ': ' + (p[f] || ''); }).join('\n') +
      (free ? '\nFree Email: Yes (personal mailbox, not a company domain)' : '') +
      (blob ? '\nRequirements file: ' + blob.getName() + ' (attached' + (file ? ', Drive: ' + file.getUrl() : '') + ')' : '') +
      '\n\nPage: https://www.vocom.ai' + (p.page || ''),
    replyTo: email,
    name: 'vocom.ai Website',
  };
  if (blob) mail.attachments = [blob];
  MailApp.sendEmail(mail);
  return json({ result: 'success', saved: true });
}

// Checks the Turnstile token with Cloudflare: true (human), false (rejected), or null when
// Cloudflare can't be reached or the script lacks permission, so the lead is kept as unverified.
function turnstileOk(token) {
  try {
    var res = UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'post',
      payload: { secret: TURNSTILE_SECRET, response: token },
      muteHttpExceptions: true,
    });
    if (res.getResponseCode() !== 200) return null;
    return JSON.parse(res.getContentText()).success === true;
  } catch (err) {
    console.error('Turnstile check failed: ' + err);
    return null;
  }
}

// Run this once from the editor (select "authorize", then Run) to grant every permission the
// script needs: Sheets, Gmail, Drive (attachments) and external requests (Turnstile).
function authorize() {
  ScriptApp.requireAllScopes(ScriptApp.AuthMode.FULL);
  console.log('All permissions granted.');
}

// Turns an uploaded requirements file (sent as base64) into a named blob. Returns null if none or invalid.
function attachmentBlob(p, name, company) {
  if (!p.fileData || !p.fileName || !ATTACH_TYPES.test(p.fileName)) return null;
  var bytes = Utilities.base64Decode(p.fileData);
  if (bytes.length > ATTACH_MAX_BYTES) return null;
  var stamp = Utilities.formatDate(new Date(), 'UTC', 'yyyy-MM-dd');
  var clean = (stamp + ' ' + company + ' ' + name + ' - ' + p.fileName).replace(/[\\/:*?"<>|]/g, '-');
  return Utilities.newBlob(bytes, p.fileType || 'application/octet-stream', clean);
}

// Saves the blob to the Drive folder (needs Drive access; see authorize()).
function saveToDrive(blob) {
  var folders = DriveApp.getFoldersByName(ATTACH_FOLDER);
  var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(ATTACH_FOLDER);
  return folder.createFile(blob);
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
