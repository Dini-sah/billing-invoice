import { AppSettings, CustomerRecord, DefaultItem, Invoice } from "../types/invoice";
import { PRODUCT_TYPE_OPTIONS } from "./invoiceConstants";
import {
  deleteCustomerFromGoogleSheets,
  deleteDefaultItemFromGoogleSheets,
  fetchCustomers,
  fetchDefaultItems,
  saveCustomerToGoogleSheets,
  saveDefaultItemToGoogleSheets,
} from "./googleSheets";
import { storage, CACHE_KEYS } from "./storage";

const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const defaultItems: DefaultItem[] = [
  {
    id: "default-tempered-glass",
    category: "sale",
    productType: "Tempered glass",
    description: "Tempered glass",
    price: 150,
    taxable: false,
  },
  {
    id: "default-phone-case",
    category: "sale",
    productType: "Phone cases",
    description: "Phone case",
    price: 250,
    taxable: false,
  },
  {
    id: "default-combo-replacement",
    category: "service",
    productType: "Combo replacement",
    description: "Display combo replacement",
    price: 1800,
    taxable: false,
  },
  {
    id: "default-battery",
    category: "service",
    productType: "Battery replacement",
    description: "Battery replacement",
    price: 900,
    taxable: false,
  },
  {
    id: "default-charging-connector",
    category: "service",
    productType: "CC (Charging connector)",
    description: "Charging connector replacement",
    price: 650,
    taxable: false,
  },
];

export const defaultSettings: AppSettings = {
  businessName: "Hari Electronics Billing",
  businessSubtitle: "Mobile repair & services",
  ownerName: "Hari Electronics",
  defaultTaxable: false,
};

export const getStoredCustomers = (): CustomerRecord[] =>
  normalizeCustomers(storage.get(CACHE_KEYS.CUSTOMERS));

export const saveCustomers = (customers: CustomerRecord[]) => {
  storage.set(CACHE_KEYS.CUSTOMERS, normalizeCustomers(customers));
};

export const syncCustomersFromGoogleSheets = async (): Promise<CustomerRecord[]> => {
  const result = await fetchCustomers();
  if (!result.success) {
    throw new Error(result.error || "Failed to load customers");
  }

  const customers = normalizeCustomers(result.data);
  saveCustomers(customers);
  return customers;
};

export const saveCustomer = async (customer: CustomerRecord) => {
  const result = await saveCustomerToGoogleSheets(customer);
  if (!result.success) {
    throw new Error(result.error || "Failed to save customer");
  }
};

export const deleteCustomer = async (id: string) => {
  const result = await deleteCustomerFromGoogleSheets(id);
  if (!result.success) {
    throw new Error(result.error || "Failed to delete customer");
  }
};

export const getDefaultItems = (): DefaultItem[] => {
  const stored = normalizeItems(storage.get(CACHE_KEYS.DEFAULT_ITEMS));
  return stored.length > 0 ? stored : defaultItems;
};

export const saveDefaultItems = (items: DefaultItem[]) => {
  storage.set(CACHE_KEYS.DEFAULT_ITEMS, normalizeItems(items));
};

export const syncDefaultItemsFromGoogleSheets = async (): Promise<DefaultItem[]> => {
  const result = await fetchDefaultItems();
  if (!result.success) {
    throw new Error(result.error || "Failed to load default items");
  }

  const items = normalizeItems(result.data);
  if (items.length > 0) {
    saveDefaultItems(items);
    return items;
  }

  saveDefaultItems(defaultItems);
  await Promise.all(defaultItems.map((item) => saveDefaultItem(item)));
  return defaultItems;
};

export const saveDefaultItem = async (item: DefaultItem) => {
  const result = await saveDefaultItemToGoogleSheets(item);
  if (!result.success) {
    throw new Error(result.error || "Failed to save item");
  }
};

export const deleteDefaultItem = async (id: string) => {
  const result = await deleteDefaultItemFromGoogleSheets(id);
  if (!result.success) {
    throw new Error(result.error || "Failed to delete item");
  }
};

export const getSettings = (): AppSettings => ({
  ...defaultSettings,
  ...(storage.get(CACHE_KEYS.APP_SETTINGS) || {}),
});

export const saveSettings = (settings: AppSettings) => {
  storage.set(CACHE_KEYS.APP_SETTINGS, { ...defaultSettings, ...settings });
};

export const createCustomer = (
  name: string,
  phoneNumber: string
): CustomerRecord => ({
  id: createId("cust"),
  name: name.trim(),
  phoneNumber: phoneNumber.trim(),
  invoiceCount: 0,
  totalSpend: 0,
});

export const createDefaultItem = (
  item: Omit<DefaultItem, "id">
): DefaultItem => ({
  ...item,
  id: createId("item"),
});

export const upsertCustomerFromInvoice = (invoice: Invoice) => {
  const customers = getStoredCustomers();
  const key = getCustomerKey(invoice.customerName, invoice.phoneNumber);
  const existingIndex = customers.findIndex(
    (customer) => getCustomerKey(customer.name, customer.phoneNumber) === key
  );
  const nextCustomer: CustomerRecord = {
    id: customers[existingIndex]?.id || createId("cust"),
    name: invoice.customerName,
    phoneNumber: invoice.phoneNumber,
    lastInvoiceDate: invoice.date,
    invoiceCount: Math.max(1, customers[existingIndex]?.invoiceCount || 0),
    totalSpend: Math.max(invoice.total, customers[existingIndex]?.totalSpend || 0),
  };

  if (existingIndex >= 0) {
    customers[existingIndex] = { ...customers[existingIndex], ...nextCustomer };
  } else {
    customers.unshift(nextCustomer);
  }

  saveCustomers(customers);
  saveCustomer(customers[existingIndex >= 0 ? existingIndex : 0]).catch(() => {
    // Keep the local cache even if the spreadsheet sync is temporarily unavailable.
  });
};

export const mergeCustomersWithInvoices = (
  storedCustomers: CustomerRecord[],
  invoices: Invoice[]
): CustomerRecord[] => {
  const byKey = new Map<string, CustomerRecord>();

  storedCustomers.forEach((customer) => {
    byKey.set(getCustomerKey(customer.name, customer.phoneNumber), { ...customer });
  });

  const invoiceStats = new Map<
    string,
    Pick<CustomerRecord, "lastInvoiceDate" | "invoiceCount" | "totalSpend">
  >();

  invoices.forEach((invoice) => {
    const key = getCustomerKey(invoice.customerName, invoice.phoneNumber);
    const existingStats = invoiceStats.get(key);
    invoiceStats.set(key, {
      lastInvoiceDate: maxDate(existingStats?.lastInvoiceDate, invoice.date),
      invoiceCount: (existingStats?.invoiceCount || 0) + 1,
      totalSpend: (existingStats?.totalSpend || 0) + invoice.total,
    });
  });

  invoiceStats.forEach((stats, key) => {
    const existing = byKey.get(key);
    if (!existing) {
      return;
    }

    byKey.set(key, {
      id: existing.id,
      name: existing.name,
      phoneNumber: existing.phoneNumber,
      lastInvoiceDate: stats.lastInvoiceDate || existing.lastInvoiceDate,
      invoiceCount: stats.invoiceCount,
      totalSpend: stats.totalSpend,
    });
  });

  return Array.from(byKey.values()).sort((a, b) =>
    String(b.lastInvoiceDate || "").localeCompare(String(a.lastInvoiceDate || ""))
  );
};

export const mergeItemsWithInvoices = (
  storedItems: DefaultItem[],
  invoices: Invoice[]
): DefaultItem[] => {
  const byKey = new Map<string, DefaultItem>();

  storedItems.forEach((item) => {
    byKey.set(getItemKey(item), item);
  });

  invoices.flatMap((invoice) => invoice.items).forEach((item) => {
    if (!item.description.trim()) return;
    const productType =
      item.productType || PRODUCT_TYPE_OPTIONS[item.category][0] || "Other";
    const nextItem: DefaultItem = {
      id: createId("item"),
      category: item.category,
      productType,
      description: item.description,
      price: item.price,
      taxable: item.taxable,
    };
    byKey.set(getItemKey(nextItem), {
      ...nextItem,
      id: byKey.get(getItemKey(nextItem))?.id || nextItem.id,
    });
  });

  return Array.from(byKey.values()).sort((a, b) =>
    a.description.localeCompare(b.description)
  );
};

const normalizeCustomers = (value: unknown): CustomerRecord[] =>
  Array.isArray(value)
    ? value
        .map((customer) => ({
          id: String(customer?.id || createId("cust")),
          name: String(customer?.name || "").trim(),
          phoneNumber: String(customer?.phoneNumber || "").trim(),
          lastInvoiceDate: customer?.lastInvoiceDate
            ? String(customer.lastInvoiceDate)
            : undefined,
          invoiceCount: Number(customer?.invoiceCount || 0),
          totalSpend: Number(customer?.totalSpend || 0),
        }))
        .filter((customer) => customer.name && customer.phoneNumber)
    : [];

const normalizeItems = (value: unknown): DefaultItem[] =>
  Array.isArray(value)
    ? value
        .map((item) => ({
          id: String(item?.id || createId("item")),
          category: (item?.category === "service" ? "service" : "sale") as DefaultItem["category"],
          productType: String(item?.productType || ""),
          description: String(item?.description || "").trim(),
          price: Number(item?.price || 0),
          taxable: Boolean(item?.taxable),
        }))
        .filter((item) => item.description)
    : [];

const getCustomerKey = (name: string, phoneNumber: string) =>
  `${phoneNumber.trim()}::${name.trim().toLowerCase()}`;

const getItemKey = (item: Pick<DefaultItem, "category" | "description">) =>
  `${item.category}::${item.description.trim().toLowerCase()}`;

const maxDate = (current: string | undefined, next: string) =>
  !current || next > current ? next : current;
