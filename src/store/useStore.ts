import { create } from 'zustand';
import { Customer, InventoryItem, ServiceOrder, CompanySettings } from '../types';

interface AppState {
  customers: Customer[];
  inventory: InventoryItem[];
  orders: ServiceOrder[];
  settings: CompanySettings | null;
  isLoading: boolean;
  fetchData: () => Promise<void>;
  addCustomer: (customer: Customer) => Promise<void>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addInventoryItem: (item: InventoryItem) => Promise<void>;
  updateInventoryItem: (id: string, item: Partial<InventoryItem>) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  addOrder: (order: ServiceOrder) => Promise<void>;
  updateOrder: (id: string, order: Partial<ServiceOrder>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  updateSettings: (settings: Partial<CompanySettings>) => Promise<void>;
}

export const useStore = create<AppState>()((set, get) => ({
  customers: [],
  inventory: [],
  orders: [],
  settings: null,
  isLoading: true,

  fetchData: async () => {
    try {
      const [customersRes, inventoryRes, ordersRes, settingsRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/inventory'),
        fetch('/api/orders'),
        fetch('/api/settings')
      ]);
      
      const customers = await customersRes.json();
      const inventory = await inventoryRes.json();
      const orders = await ordersRes.json();
      const settings = await settingsRes.json();

      set({ customers, inventory, orders, settings, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch data', error);
      set({ isLoading: false });
    }
  },

  addCustomer: async (customer) => {
    await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customer)
    });
    set((state) => ({ customers: [...state.customers, customer] }));
  },

  updateCustomer: async (id, updatedCustomer) => {
    await fetch(`/api/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedCustomer)
    });
    set((state) => ({
      customers: state.customers.map((c) => (c.id === id ? { ...c, ...updatedCustomer } : c)),
    }));
  },

  deleteCustomer: async (id) => {
    await fetch(`/api/customers/${id}`, { method: 'DELETE' });
    set((state) => ({ customers: state.customers.filter((c) => c.id !== id) }));
  },
  
  addInventoryItem: async (item) => {
    await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    set((state) => ({ inventory: [...state.inventory, item] }));
  },

  updateInventoryItem: async (id, updatedItem) => {
    await fetch(`/api/inventory/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedItem)
    });
    set((state) => ({
      inventory: state.inventory.map((i) => (i.id === id ? { ...i, ...updatedItem } : i)),
    }));
  },

  deleteInventoryItem: async (id) => {
    await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
    set((state) => ({ inventory: state.inventory.filter((i) => i.id !== id) }));
  },
  
  addOrder: async (order) => {
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    set((state) => ({ orders: [...state.orders, order] }));
  },

  updateOrder: async (id, updatedOrder) => {
    await fetch(`/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedOrder)
    });
    set((state) => ({
      orders: state.orders.map((o) => (o.id === id ? { ...o, ...updatedOrder, updatedAt: new Date().toISOString() } : o)),
    }));
  },

  deleteOrder: async (id) => {
    await fetch(`/api/orders/${id}`, { method: 'DELETE' });
    set((state) => ({ orders: state.orders.filter((o) => o.id !== id) }));
  },
  
  updateSettings: async (updatedSettings) => {
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedSettings)
    });
    set((state) => ({
      settings: state.settings ? { ...state.settings, ...updatedSettings } : updatedSettings as CompanySettings
    }));
  },
}));
