/**
 * vocom.ai quote form backend (Google Apps Script web app).
 * Receives POSTs from /contact-vocomai, appends a row to the "Quotes" sheet and emails
 * a notification. Deploy: Deploy -> New deployment -> Web app, Execute as: Me,
 * Who has access: Anyone. Paste the /exec URL into src/config.ts (QUOTE_FORM_URL).
 * When you change this file later, redeploy via Manage deployments -> edit the existing
 * deployment -> Version: New version, so the URL stays the same.
 */
var SHEET_ID = 'PASTE_SPREADSHEET_ID';
var SHEET_NAME = 'Quotes';
var NOTIFY_EMAIL = 'PASTE_NOTIFICATION_EMAIL';
var ALLOWED_PAGES = ['/contact-vocomai'];

var FIELDS = ['Name', 'Email', 'Company', 'Company Size', 'Use Case', 'I Am A', 'Message'];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var p = (e && e.parameter) || {};
    if (p.website) return json({ result: 'success' }); // honeypot
    var name = (p['Name'] || '').trim();
    var email = (p['Email'] || '').trim();
    var company = (p['Company'] || '').trim();
    if (!name || !company || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ result: 'error', error: 'missing or invalid fields' });
    }
    if (ALLOWED_PAGES.indexOf(p.page) === -1) return json({ result: 'error', error: 'bad origin' });

    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(['Timestamp'].concat(FIELDS).concat(['Page']));
      sheet.getRange(1, 1, 1, FIELDS.length + 2).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
    var row = [new Date()];
    FIELDS.forEach(function (f) { row.push(p[f] || ''); });
    row.push(p.page || '');
    sheet.appendRow(row);

    var body = FIELDS.map(function (f) { return f + ': ' + (p[f] || ''); }).join('\n');
    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: 'New quote request: ' + name + ' (' + company + ')',
      body: body + '\n\nPage: https://www.vocom.ai' + (p.page || ''),
      replyTo: email,
      name: 'vocom.ai Website',
    });
    return json({ result: 'success' });
  } catch (err) {
    return json({ result: 'error', error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return json({ ok: true, service: 'vocom.ai quote form' });
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
