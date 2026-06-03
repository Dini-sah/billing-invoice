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
      var startDate = String(e.parameter.startDate || '');
      var endDate = String(e.parameter.endDate || '');
      var typeFilter = String(e.parameter.type || 'all').toLowerCase();
      var statusFilter = String(e.parameter.status || 'all').toLowerCase();
      var paymentMethodFilter = String(e.parameter.paymentMethod || 'all').toLowerCase();
      var timezone = Session.getScriptTimeZone();
      var todayKey = Utilities.formatDate(new Date(), timezone, 'yyyy-MM-dd');

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
      var searched = search
        ? ordered.filter(function(row) {
          return rowMatchesSearch_(row, search);
        })
        : ordered;

      var todayRows = searched.filter(function(row) {
        return getInvoiceDateKey_(row, timezone) === todayKey &&
          rowMatchesOptionFilters_(row, typeFilter, statusFilter, paymentMethodFilter);
      });

      var filtered = searched.filter(function(row) {
        return rowMatchesDateFilters_(row, timezone, startDate, endDate) &&
          rowMatchesOptionFilters_(row, typeFilter, statusFilter, paymentMethodFilter);
      });

      var summary = buildSummary_(filtered, todayRows);

      var total = filtered.length;
      var startIndex = (page - 1) * limit;
      var data = filtered.slice(startIndex, startIndex + limit);

      return jsonResponse_({
        success: true,
        data: data,
        total: total,
        page: page,
        limit: limit,
        summary: summary
      });
    }

    return jsonResponse_({ success: false, error: 'Unknown action' });
  } catch (err) {
    return jsonResponse_({ success: false, error: String(err && err.stack ? err.stack : err) });
  }
}

function rowMatchesSearch_(row, search) {
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
}

function rowMatchesOptionFilters_(row, typeFilter, statusFilter, paymentMethodFilter) {
  if (typeFilter !== 'all' && String(row.type || '').toLowerCase() !== typeFilter) {
    return false;
  }

  if (statusFilter !== 'all' && String(row.status || '').toLowerCase() !== statusFilter) {
    return false;
  }

  if (
    paymentMethodFilter !== 'all' &&
    String(row.paymentMethod || '').toLowerCase() !== paymentMethodFilter
  ) {
    return false;
  }

  return true;
}

function rowMatchesDateFilters_(row, timezone, startDate, endDate) {
  if (!startDate && !endDate) {
    return true;
  }

  var invoiceDateKey = getInvoiceDateKey_(row, timezone);
  if (!invoiceDateKey) {
    return false;
  }

  if (startDate && invoiceDateKey < startDate) {
    return false;
  }

  if (endDate && invoiceDateKey > endDate) {
    return false;
  }

  return true;
}

function getInvoiceDateKey_(row, timezone) {
  var dateValue = row.createdAt || row.date || '';
  if (!dateValue) {
    return '';
  }

  var parsedDate = new Date(dateValue);
  if (!Number.isNaN(parsedDate.getTime())) {
    return Utilities.formatDate(parsedDate, timezone, 'yyyy-MM-dd');
  }

  var dateText = String(dateValue);
  var dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateText);
  return dateOnlyMatch ? dateOnlyMatch[1] + '-' + dateOnlyMatch[2] + '-' + dateOnlyMatch[3] : '';
}

function buildSummary_(filteredRows, todayRows) {
  var filteredTotal = sumInvoiceTotals_(filteredRows);
  var todayTotal = sumInvoiceTotals_(todayRows);
  var paymentTotals = buildPaymentTotals_(filteredRows);

  return {
    filteredCount: filteredRows.length,
    filteredTotal: filteredTotal,
    todayCount: todayRows.length,
    todayTotal: todayTotal,
    cashTotal: paymentTotals.cash,
    gpayTotal: paymentTotals.gpay,
    cardTotal: paymentTotals.card,
    bankTransferTotal: paymentTotals.bankTransfer,
    otherPaymentTotal: paymentTotals.other
  };
}

function buildPaymentTotals_(rows) {
  return rows.reduce(function(totals, row) {
    var paymentMethod = String(row.paymentMethod || '').toLowerCase();
    var amount = Number(row.total || 0);

    if (paymentMethod === 'cash') {
      totals.cash += amount;
    } else if (paymentMethod === 'gpay') {
      totals.gpay += amount;
    } else if (paymentMethod === 'card') {
      totals.card += amount;
    } else if (paymentMethod === 'bank transfer') {
      totals.bankTransfer += amount;
    } else if (paymentMethod === 'other') {
      totals.other += amount;
    }

    return totals;
  }, {
    cash: 0,
    gpay: 0,
    card: 0,
    bankTransfer: 0,
    other: 0
  });
}

function sumInvoiceTotals_(rows) {
  return rows.reduce(function(total, row) {
    return total + Number(row.total || 0);
  }, 0);
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
