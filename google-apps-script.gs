// Google Apps Script for Hari Electronics invoice backend.
// Sheet columns:
// A InvoiceID, B Customer, C Phone, D Date, E Type, F Items,
// G Subtotal, H Tax, I Total, J Status, K CreatedAt, L Payment Method

const SHEET_ID = '1uIGqqdHJ3eZabPCFYfwwZIVaGnq1NHlI2B8LbciWtxY';
const SHEET_NAME = 'Invoices';

const COL = {
  invoiceId: 1,
  customer: 2,
  phone: 3,
  date: 4,
  type: 5,
  items: 6,
  subtotal: 7,
  tax: 8,
  total: 9,
  status: 10,
  createdAt: 11,
  paymentMethod: 12
};

function getSheet_() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    throw new Error('Sheet "' + SHEET_NAME + '" not found in spreadsheet ID ' + SHEET_ID);
  }
  ensurePaymentMethodHeader_(sheet);
  return sheet;
}

function ensurePaymentMethodHeader_(sheet) {
  var header = String(sheet.getRange(1, COL.paymentMethod).getValue() || '').trim();
  if (!header) {
    sheet.getRange(1, COL.paymentMethod).setValue('Payment Method');
  }
}

function doPost(e) {
  try {
    var payload = JSON.parse((e.postData && e.postData.contents) || '{}');

    if (payload.action === 'save') {
      var invoice = payload.data || {};
      var sheet = getSheet_();

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
        new Date(),
        ''
      ]);

      return jsonResponse_({ success: true });
    }

    if (payload.action === 'updateStatus') {
      var data = payload.data || {};
      var invoiceId = data.invoiceId || '';
      var status = data.status || '';
      var paymentMethod = data.paymentMethod || '';

      if (!invoiceId || !status) {
        return jsonResponse_({ success: false, error: 'Missing invoiceId or status' });
      }

      var sheet = getSheet_();
      var values = sheet.getDataRange().getValues();
      if (values.length <= 1) {
        return jsonResponse_({ success: false, error: 'No data in sheet' });
      }

      for (var i = 1; i < values.length; i++) {
        if (String(values[i][COL.invoiceId - 1]) === String(invoiceId)) {
          var rowNumber = i + 1;
          sheet.getRange(rowNumber, COL.status).setValue(status);
          sheet.getRange(rowNumber, COL.paymentMethod).setValue(paymentMethod);
          return jsonResponse_({
            success: true,
            invoiceId: invoiceId,
            status: status,
            paymentMethod: paymentMethod,
            updatedRow: rowNumber
          });
        }
      }

      return jsonResponse_({ success: false, error: 'Invoice not found: ' + invoiceId });
    }

    return jsonResponse_({ success: false, error: 'Unknown action' });
  } catch (err) {
    return jsonResponse_({ success: false, error: String(err && err.stack ? err.stack : err) });
  }
}

function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) || '';

    if (action === 'getRecent') {
      var sheet = getSheet_();
      var values = sheet.getDataRange().getValues();

      if (values.length <= 1) {
        return jsonResponse_({ success: true, data: [], total: 0, page: 1, limit: 20 });
      }

      var page = Math.max(1, Number(e.parameter.page || 1));
      var limit = Math.min(100, Math.max(1, Number(e.parameter.limit || 20)));
      var search = String(e.parameter.search || '').trim().toLowerCase();

      var rows = values.slice(1).map(function(row) {
        var createdAt = '';
        if (row[COL.createdAt - 1]) {
          var parsedDate = new Date(row[COL.createdAt - 1]);
          if (!Number.isNaN(parsedDate.getTime())) {
            createdAt = Utilities.formatDate(
              parsedDate,
              Session.getScriptTimeZone(),
              "yyyy-MM-dd'T'HH:mm:ss"
            );
          }
        }

        return {
          id: row[COL.invoiceId - 1],
          customerName: row[COL.customer - 1],
          phoneNumber: row[COL.phone - 1],
          date: row[COL.date - 1],
          createdAt: createdAt,
          type: row[COL.type - 1],
          items: JSON.parse(row[COL.items - 1] || '[]'),
          subtotal: Number(row[COL.subtotal - 1] || 0),
          taxTotal: Number(row[COL.tax - 1] || 0),
          total: Number(row[COL.total - 1] || 0),
          status: row[COL.status - 1] || '',
          paymentMethod: row[COL.paymentMethod - 1] || ''
        };
      });

      var ordered = rows.reverse();
      var sourceRows = search ? ordered : ordered.slice(0, 100);
      var filtered = search
        ? sourceRows.filter(function(row) {
            var itemsText = (row.items || [])
              .map(function(item) {
                return (item.description || '') + ' ' + (item.productType || '');
              })
              .join(' ');
            var haystack = [
              row.id,
              row.customerName,
              row.phoneNumber,
              row.date,
              row.createdAt,
              row.type,
              row.status,
              row.paymentMethod,
              itemsText
            ]
              .join(' ')
              .toLowerCase();
            return haystack.indexOf(search) !== -1;
          })
        : sourceRows;

      var total = filtered.length;
      var startIndex = (page - 1) * limit;
      var data = filtered.slice(startIndex, startIndex + limit);

      return jsonResponse_({ success: true, data: data, total: total, page: page, limit: limit });
    }

    return jsonResponse_({ success: false, error: 'Unknown action' });
  } catch (err) {
    return jsonResponse_({ success: false, error: String(err && err.stack ? err.stack : err) });
  }
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
