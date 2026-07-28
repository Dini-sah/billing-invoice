// Google Apps Script for Hari Electronics invoice backend.
// Sheet columns:
// A InvoiceID, B Customer, C Phone, D Date, E Type, F Items,
// G Subtotal, H Tax, I Total, J Status, K CreatedAt, L Payment Method,
// M DiscountType, N DiscountValue, O DiscountAmount, P TaxableBase

const SHEET_ID = '1uIGqqdHJ3eZabPCFYfwwZIVaGnq1NHlI2B8LbciWtxY';
const SHEET_NAME = 'Invoices';
const CASHBOOK_SHEET_NAME = 'Cashbook';
const CUSTOMERS_SHEET_NAME = 'Customers';
const DEFAULT_ITEMS_SHEET_NAME = 'DefaultItems';

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
  paymentMethod: 12,
  discountType: 13,
  discountValue: 14,
  discountAmount: 15,
  taxableBase: 16,
  notes: 17
};

const CASHBOOK_COL = {
  id: 1,
  type: 2,
  date: 3,
  title: 4,
  category: 5,
  amount: 6,
  paymentMethod: 7,
  note: 8,
  createdAt: 9
};

const CUSTOMER_COL = {
  id: 1,
  name: 2,
  phoneNumber: 3,
  lastInvoiceDate: 4,
  invoiceCount: 5,
  totalSpend: 6,
  updatedAt: 7
};

const DEFAULT_ITEM_COL = {
  id: 1,
  category: 2,
  productType: 3,
  description: 4,
  price: 5,
  taxable: 6,
  updatedAt: 7
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

function getCashbookSheet_() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(CASHBOOK_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CASHBOOK_SHEET_NAME);
  }
  ensureCashbookHeaders_(sheet);
  return sheet;
}

function getCustomersSheet_() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(CUSTOMERS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CUSTOMERS_SHEET_NAME);
  }
  ensureCustomersHeaders_(sheet);
  return sheet;
}

function getDefaultItemsSheet_() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(DEFAULT_ITEMS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(DEFAULT_ITEMS_SHEET_NAME);
  }
  ensureDefaultItemsHeaders_(sheet);
  return sheet;
}

function ensureCashbookHeaders_(sheet) {
  var headers = [
    'ID',
    'Type',
    'Date',
    'Title',
    'Category',
    'Amount',
    'Payment Method',
    'Note',
    'CreatedAt'
  ];
  var existing = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  var needsHeaders = existing.every(function(value) {
    return !String(value || '').trim();
  });
  if (needsHeaders) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

function ensureCustomersHeaders_(sheet) {
  var headers = [
    'ID',
    'Name',
    'Phone Number',
    'Last Invoice Date',
    'Invoice Count',
    'Total Spend',
    'UpdatedAt'
  ];
  ensureHeaders_(sheet, headers);
}

function ensureDefaultItemsHeaders_(sheet) {
  var headers = [
    'ID',
    'Category',
    'Product Type',
    'Description',
    'Price',
    'Taxable',
    'UpdatedAt'
  ];
  ensureHeaders_(sheet, headers);
}

function ensureHeaders_(sheet, headers) {
  var existing = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  var needsHeaders = existing.every(function(value) {
    return !String(value || '').trim();
  });
  if (needsHeaders) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

function ensurePaymentMethodHeader_(sheet) {
  var header = String(sheet.getRange(1, COL.paymentMethod).getValue() || '').trim();
  if (!header) {
    sheet.getRange(1, COL.paymentMethod).setValue('Payment Method');
  }
}

function findRowByValue_(sheet, columnNumber, value) {
  if (!value) {
    return null;
  }

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return null;
  }

  var finder = sheet
    .getRange(2, columnNumber, lastRow - 1, 1)
    .createTextFinder(String(value))
    .matchEntireCell(true);
  var cell = finder.findNext();
  return cell ? cell.getRow() : null;
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
        '',
        invoice.discountType || 'flat',
        Number(invoice.discountValue || 0),
        Number(invoice.discountAmount || 0),
        Number(invoice.taxableBase || invoice.subtotal || 0),
        invoice.notes || ''
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
      var rowNumber = findRowByValue_(sheet, COL.invoiceId, invoiceId);
      if (rowNumber) {
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

      return jsonResponse_({ success: false, error: 'Invoice not found: ' + invoiceId });
    }

    if (payload.action === 'updateInvoice') {
      var updatedInvoice = payload.data || {};
      var updatedInvoiceId = updatedInvoice.id || '';

      if (!updatedInvoiceId) {
        return jsonResponse_({ success: false, error: 'Missing invoice id' });
      }

      var updateSheet = getSheet_();
      var updateRowNumber = findRowByValue_(updateSheet, COL.invoiceId, updatedInvoiceId);
      if (!updateRowNumber) {
        return jsonResponse_({ success: false, error: 'Invoice not found: ' + updatedInvoiceId });
      }

      updateSheet.getRange(updateRowNumber, 1, 1, COL.notes).setValues([[
        updatedInvoice.id || '',
        updatedInvoice.customerName || '',
        updatedInvoice.phoneNumber || '',
        updatedInvoice.date || '',
        updatedInvoice.type || '',
        JSON.stringify(updatedInvoice.items || []),
        Number(updatedInvoice.subtotal || 0),
        Number(updatedInvoice.taxTotal || 0),
        Number(updatedInvoice.total || 0),
        updatedInvoice.status || 'pending',
        updatedInvoice.createdAt || new Date(),
        updatedInvoice.paymentMethod || '',
        updatedInvoice.discountType || 'flat',
        Number(updatedInvoice.discountValue || 0),
        Number(updatedInvoice.discountAmount || 0),
        Number(updatedInvoice.taxableBase || updatedInvoice.subtotal || 0),
        updatedInvoice.notes || ''
      ]]);

      return jsonResponse_({
        success: true,
        invoiceId: updatedInvoiceId,
        updatedRow: updateRowNumber
      });
    }

    if (payload.action === 'saveCashbookEntry') {
      var entry = payload.data || {};
      if (!entry.id || !entry.type || !entry.date || !entry.title || !entry.amount) {
        return jsonResponse_({ success: false, error: 'Missing required cashbook entry fields' });
      }

      var cashbookSheet = getCashbookSheet_();
      var existingEntryRow = findRowByValue_(cashbookSheet, CASHBOOK_COL.id, entry.id);
      if (existingEntryRow) {
        return jsonResponse_({
          success: true,
          data: entry,
          duplicate: true,
          existingRow: existingEntryRow
        });
      }

      cashbookSheet.appendRow([
        entry.id || '',
        entry.type || '',
        entry.date || '',
        entry.title || '',
        entry.category || '',
        Number(entry.amount || 0),
        entry.paymentMethod || '',
        entry.note || '',
        entry.createdAt || new Date()
      ]);

      return jsonResponse_({ success: true, data: entry });
    }

    if (payload.action === 'deleteCashbookEntry') {
      var deleteData = payload.data || {};
      var entryId = deleteData.entryId || '';
      if (!entryId) {
        return jsonResponse_({ success: false, error: 'Missing entryId' });
      }

      var deleteSheet = getCashbookSheet_();
      var deleteRowNumber = findRowByValue_(deleteSheet, CASHBOOK_COL.id, entryId);
      if (deleteRowNumber) {
        deleteSheet.deleteRow(deleteRowNumber);
        return jsonResponse_({ success: true, entryId: entryId });
      }

      return jsonResponse_({ success: false, error: 'Cashbook entry not found: ' + entryId });
    }

    if (payload.action === 'saveCustomer') {
      var customer = payload.data || {};
      if (!customer.id || !customer.name || !customer.phoneNumber) {
        return jsonResponse_({ success: false, error: 'Missing required customer fields' });
      }

      var customersSheet = getCustomersSheet_();
      var customerRowNumber = findRowByValue_(customersSheet, CUSTOMER_COL.id, customer.id);
      var customerValues = [[
        customer.id || '',
        customer.name || '',
        customer.phoneNumber || '',
        customer.lastInvoiceDate || '',
        Number(customer.invoiceCount || 0),
        Number(customer.totalSpend || 0),
        new Date()
      ]];

      if (customerRowNumber) {
        customersSheet.getRange(customerRowNumber, 1, 1, CUSTOMER_COL.updatedAt).setValues(customerValues);
      } else {
        customersSheet.appendRow(customerValues[0]);
      }

      return jsonResponse_({ success: true, data: customer });
    }

    if (payload.action === 'deleteCustomer') {
      var deleteCustomerId = (payload.data || {}).id || '';
      if (!deleteCustomerId) {
        return jsonResponse_({ success: false, error: 'Missing customer id' });
      }

      var deleteCustomersSheet = getCustomersSheet_();
      var deleteCustomerRowNumber = findRowByValue_(deleteCustomersSheet, CUSTOMER_COL.id, deleteCustomerId);
      if (deleteCustomerRowNumber) {
        deleteCustomersSheet.deleteRow(deleteCustomerRowNumber);
      }

      return jsonResponse_({ success: true, id: deleteCustomerId });
    }

    if (payload.action === 'saveDefaultItem') {
      var defaultItem = payload.data || {};
      if (!defaultItem.id || !defaultItem.description) {
        return jsonResponse_({ success: false, error: 'Missing required item fields' });
      }

      var defaultItemsSheet = getDefaultItemsSheet_();
      var defaultItemRowNumber = findRowByValue_(defaultItemsSheet, DEFAULT_ITEM_COL.id, defaultItem.id);
      var defaultItemValues = [[
        defaultItem.id || '',
        defaultItem.category || 'sale',
        defaultItem.productType || '',
        defaultItem.description || '',
        Number(defaultItem.price || 0),
        Boolean(defaultItem.taxable),
        new Date()
      ]];

      if (defaultItemRowNumber) {
        defaultItemsSheet.getRange(defaultItemRowNumber, 1, 1, DEFAULT_ITEM_COL.updatedAt).setValues(defaultItemValues);
      } else {
        defaultItemsSheet.appendRow(defaultItemValues[0]);
      }

      return jsonResponse_({ success: true, data: defaultItem });
    }

    if (payload.action === 'deleteDefaultItem') {
      var deleteDefaultItemId = (payload.data || {}).id || '';
      if (!deleteDefaultItemId) {
        return jsonResponse_({ success: false, error: 'Missing item id' });
      }

      var deleteDefaultItemsSheet = getDefaultItemsSheet_();
      var deleteDefaultItemRowNumber = findRowByValue_(deleteDefaultItemsSheet, DEFAULT_ITEM_COL.id, deleteDefaultItemId);
      if (deleteDefaultItemRowNumber) {
        deleteDefaultItemsSheet.deleteRow(deleteDefaultItemRowNumber);
      }

      return jsonResponse_({ success: true, id: deleteDefaultItemId });
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
          id: String(row[COL.invoiceId - 1] || ''),
          customerName: String(row[COL.customer - 1] || ''),
          phoneNumber: String(row[COL.phone - 1] || ''),
          date: normalizeDateCell_(row[COL.date - 1]),
          createdAt: createdAt,
          type: String(row[COL.type - 1] || ''),
          items: JSON.parse(row[COL.items - 1] || '[]'),
          subtotal: Number(row[COL.subtotal - 1] || 0),
          taxTotal: Number(row[COL.tax - 1] || 0),
          total: Number(row[COL.total - 1] || 0),
          status: String(row[COL.status - 1] || ''),
          paymentMethod: String(row[COL.paymentMethod - 1] || ''),
          discountType: String(row[COL.discountType - 1] || 'flat'),
          discountValue: Number(row[COL.discountValue - 1] || 0),
          discountAmount: Number(row[COL.discountAmount - 1] || 0),
          taxableBase: Number(row[COL.taxableBase - 1] || row[COL.subtotal - 1] || 0),
          notes: String(row[COL.notes - 1] || '')
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

    if (action === 'getCashbookEntries') {
      var cashbookSheet = getCashbookSheet_();
      var cashbookValues = cashbookSheet.getDataRange().getValues();
      if (cashbookValues.length <= 1) {
        return jsonResponse_({ success: true, data: [] });
      }
      var cashbookStartDate = String(e.parameter.startDate || '');
      var cashbookEndDate = String(e.parameter.endDate || '');

      var cashbookRows = cashbookValues.slice(1).map(function(row) {
        return {
          id: row[CASHBOOK_COL.id - 1] || '',
          type: row[CASHBOOK_COL.type - 1] || '',
          date: normalizeDateCell_(row[CASHBOOK_COL.date - 1]),
          title: row[CASHBOOK_COL.title - 1] || '',
          category: row[CASHBOOK_COL.category - 1] || '',
          amount: Number(row[CASHBOOK_COL.amount - 1] || 0),
          paymentMethod: row[CASHBOOK_COL.paymentMethod - 1] || '',
          note: row[CASHBOOK_COL.note - 1] || '',
          createdAt: normalizeDateTimeCell_(row[CASHBOOK_COL.createdAt - 1])
        };
      }).filter(function(entry) {
        return entry.id && rowMatchesCashbookDateFilters_(entry, cashbookStartDate, cashbookEndDate);
      }).reverse();

      return jsonResponse_({ success: true, data: cashbookRows });
    }

    if (action === 'getCustomers') {
      var customersSheet = getCustomersSheet_();
      var customerValues = customersSheet.getDataRange().getValues();
      if (customerValues.length <= 1) {
        return jsonResponse_({ success: true, data: [] });
      }

      var customerRows = customerValues.slice(1).map(function(row) {
        return {
          id: String(row[CUSTOMER_COL.id - 1] || ''),
          name: String(row[CUSTOMER_COL.name - 1] || ''),
          phoneNumber: String(row[CUSTOMER_COL.phoneNumber - 1] || ''),
          lastInvoiceDate: normalizeDateCell_(row[CUSTOMER_COL.lastInvoiceDate - 1]),
          invoiceCount: Number(row[CUSTOMER_COL.invoiceCount - 1] || 0),
          totalSpend: Number(row[CUSTOMER_COL.totalSpend - 1] || 0)
        };
      }).filter(function(customer) {
        return customer.id && customer.name && customer.phoneNumber;
      }).reverse();

      return jsonResponse_({ success: true, data: customerRows });
    }

    if (action === 'getDefaultItems') {
      var defaultItemsSheet = getDefaultItemsSheet_();
      var defaultItemValues = defaultItemsSheet.getDataRange().getValues();
      if (defaultItemValues.length <= 1) {
        return jsonResponse_({ success: true, data: [] });
      }

      var defaultItemRows = defaultItemValues.slice(1).map(function(row) {
        return {
          id: String(row[DEFAULT_ITEM_COL.id - 1] || ''),
          category: String(row[DEFAULT_ITEM_COL.category - 1] || 'sale'),
          productType: String(row[DEFAULT_ITEM_COL.productType - 1] || ''),
          description: String(row[DEFAULT_ITEM_COL.description - 1] || ''),
          price: Number(row[DEFAULT_ITEM_COL.price - 1] || 0),
          taxable: row[DEFAULT_ITEM_COL.taxable - 1] === true ||
            String(row[DEFAULT_ITEM_COL.taxable - 1] || '').toLowerCase() === 'true'
        };
      }).filter(function(item) {
        return item.id && item.description;
      }).reverse();

      return jsonResponse_({ success: true, data: defaultItemRows });
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

function normalizeDateCell_(value) {
  if (!value) {
    return '';
  }
  var parsedDate = new Date(value);
  if (!Number.isNaN(parsedDate.getTime())) {
    return Utilities.formatDate(parsedDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(value);
}

function normalizeDateTimeCell_(value) {
  if (!value) {
    return '';
  }
  var parsedDate = new Date(value);
  if (!Number.isNaN(parsedDate.getTime())) {
    return Utilities.formatDate(
      parsedDate,
      Session.getScriptTimeZone(),
      "yyyy-MM-dd'T'HH:mm:ss"
    );
  }
  return String(value);
}

function rowMatchesCashbookDateFilters_(entry, startDate, endDate) {
  var entryDate = String(entry.date || '');
  if (!entryDate) {
    return false;
  }

  if (startDate && entryDate < startDate) {
    return false;
  }

  if (endDate && entryDate > endDate) {
    return false;
  }

  return true;
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
