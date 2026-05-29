// Google Apps Script for "Mobile Shop Billing" Google Sheets backend.
// 1) Update SHEET_ID and SHEET_NAME.
// 2) In Apps Script: Deploy -> New deployment -> Web app -> Anyone.
// 3) Use the Web app URL in src/utils/googleSheets.ts.

const SHEET_ID = '1uIGqqdHJ3eZabPCFYfwwZIVaGnq1NHlI2B8LbciWtxY';
const SHEET_NAME = 'Invoices';

function getSpreadsheetID() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(); // Gets the currently active spreadsheet
  var spreadSheetID = ss.getId(); // Retrieves the ID
  console.log(spreadSheetID); // Logs the ID to the Apps Script console
}

function getSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    throw new Error(`Sheet "${SHEET_NAME}" not found in spreadsheet ID ${SHEET_ID}`);
  }
  return sheet;
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData?.contents || '{}');

    if (payload.action === 'save') {
      const invoice = payload.data || {};
      const sheet = getSheet_();

      sheet.appendRow([
        invoice.id || '',
        invoice.customerName || '',
        invoice.phoneNumber || '',
        invoice.date || '',
        invoice.type || '',
        JSON.stringify(invoice.items || []),
        invoice.subtotal || 0,
        invoice.taxTotal || 0,
        invoice.total || 0,
        invoice.status || '',
        new Date()
      ]);

      return jsonResponse_({ success: true });
    }
    if (payload.action === 'updateStatus') {
      const data = payload.data || {};
      const invoiceId = data.invoiceId || '';
      const status = data.status || '';
      if (!invoiceId || !status) {
        return jsonResponse_({ success: false, error: 'Missing invoiceId or status' });
      }
      const sheet = getSheet_();
      const values = sheet.getDataRange().getValues();
      if (values.length <= 1) {
        return jsonResponse_({ success: false, error: 'No data in sheet' });
      }
      const idColumnIndex = 0;
      const statusColumnIndex = 9;
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][idColumnIndex]) === String(invoiceId)) {
          sheet.getRange(i + 1, statusColumnIndex + 1).setValue(status);
          return jsonResponse_({ success: true });
        }
      }
      return jsonResponse_({ success: false, error: 'Invoice not found' });
    }
    return jsonResponse_({ success: false, error: 'Unknown action' });
  } catch (err) {
    return jsonResponse_({ success: false, error: String(err) });
  }
}

function doGet(e) {
  try {
    const action = e?.parameter?.action || '';

    if (action === 'getRecent') {
      const sheet = getSheet_();
      const values = sheet.getDataRange().getValues();

      if (values.length <= 1) {
        return jsonResponse_({ success: true, data: [], total: 0, page: 1, limit: 20 });
      }

      const page = Math.max(1, Number(e.parameter.page || 1));
      const limit = Math.min(100, Math.max(1, Number(e.parameter.limit || 20)));
      const search = String(e.parameter.search || '').trim().toLowerCase();

      const rows = values.slice(1).map((row) => {
        let createdAt = '';
        if (row[10]) {
          const parsedDate = new Date(row[10]);
          if (!Number.isNaN(parsedDate.getTime())) {
            createdAt = Utilities.formatDate(
              parsedDate,
              Session.getScriptTimeZone(),
              "yyyy-MM-dd'T'HH:mm:ss"
            );
          }
        }

        return {
          id: row[0],
          customerName: row[1],
          phoneNumber: row[2],
          date: row[3],
          createdAt,
          type: row[4],
          items: JSON.parse(row[5] || '[]'),
          subtotal: Number(row[6] || 0),
          taxTotal: Number(row[7] || 0),
          total: Number(row[8] || 0),
          status: row[9] || ''
        };
      });

      const ordered = rows.reverse();
      const sourceRows = search ? ordered : ordered.slice(0, 100);
      const filtered = search
        ? sourceRows.filter((row) => {
            const itemsText = (row.items || [])
              .map((item) => `${item.description || ''} ${item.productType || ''}`)
              .join(' ');
            const haystack = [
              row.id,
              row.customerName,
              row.phoneNumber,
              row.date,
              row.createdAt,
              row.type,
              row.status,
              itemsText
            ]
              .join(' ')
              .toLowerCase();
            return haystack.includes(search);
          })
        : sourceRows;
      const total = filtered.length;
      const startIndex = (page - 1) * limit;
      const data = filtered.slice(startIndex, startIndex + limit);

      return jsonResponse_({ success: true, data, total, page, limit });
    }

    return jsonResponse_({ success: false, error: 'Unknown action' });
  } catch (err) {
    return jsonResponse_({ success: false, error: String(err) });
  }
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
