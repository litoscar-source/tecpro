import { create } from 'zustand';
import { Customer, InventoryItem, ServiceOrder, CompanySettings, Appointment, Technician } from '../types';

interface AppState {
  customers: Customer[];
  inventory: InventoryItem[];
  orders: ServiceOrder[];
  appointments: Appointment[];
  settings: CompanySettings | null;
  technicians: Technician[];
  theme: 'light' | 'dark';
  isLoading: boolean;
  fetchData: () => Promise<void>;
  setTheme: (theme: 'light' | 'dark') => void;
  addCustomer: (customer: Customer) => Promise<void>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addInventoryItem: (item: InventoryItem) => Promise<void>;
  updateInventoryItem: (id: string, item: Partial<InventoryItem>) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  addOrder: (order: ServiceOrder) => Promise<void>;
  updateOrder: (id: string, order: Partial<ServiceOrder>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  addAppointment: (appointment: Appointment) => Promise<void>;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  updateSettings: (settings: Partial<CompanySettings>) => Promise<void>;
  addTechnician: (tech: Technician) => Promise<void>;
  deleteTechnician: (id: string) => Promise<void>;
}

export const useStore = create<AppState>()((set, get) => ({
  customers: [],
  inventory: [],
  orders: [],
  appointments: [],
  settings: null,
  technicians: [],
  theme: (localStorage.getItem('app-theme') as 'light' | 'dark') || 'light',
  isLoading: true,

  setTheme: (theme) => {
    localStorage.setItem('app-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme });
  },

  fetchData: async () => {
    try {
      const [customersRes, inventoryRes, ordersRes, appointmentsRes, settingsRes, techsRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/inventory'),
        fetch('/api/orders'),
        fetch('/api/appointments'),
        fetch('/api/settings'),
        fetch('/api/technicians')
      ]);
      
      const customersData = customersRes.ok ? await customersRes.json() : [];
      const inventoryData = inventoryRes.ok ? await inventoryRes.json() : [];
      const ordersData = ordersRes.ok ? await ordersRes.json() : [];
      const appointmentsData = appointmentsRes.ok ? await appointmentsRes.json() : [];
      const settingsData = settingsRes.ok ? await settingsRes.json() : null;
      const techsData = techsRes.ok ? await techsRes.json() : [];

      set({ 
        customers: Array.isArray(customersData) ? customersData : [], 
        inventory: Array.isArray(inventoryData) ? inventoryData : [], 
        orders: Array.isArray(ordersData) ? ordersData : [], 
        appointments: Array.isArray(appointmentsData) ? appointmentsData : [], 
        settings: settingsData?.error ? null : settingsData, 
        technicians: Array.isArray(techsData) ? techsData : [],
        isLoading: false 
      });
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
    const currentState = get();
    const existing = currentState.customers.find(c => c.id === id);
    if (!existing) return;
    const full = { ...existing, ...updatedCustomer };
    
    await fetch(`/api/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(full)
    });
    set((state) => ({
      customers: state.customers.map((c) => (c.id === id ? full : c)),
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
    const currentState = get();
    const existing = currentState.inventory.find(i => i.id === id);
    if (!existing) return;
    const full = { ...existing, ...updatedItem };
    
    await fetch(`/api/inventory/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(full)
    });
    set((state) => ({
      inventory: state.inventory.map((i) => (i.id === id ? full : i)),
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
    const currentState = get();
    const existingOrder = currentState.orders.find(o => o.id === id);
    if (!existingOrder) return;
    const fullUpdatedOrder = { ...existingOrder, ...updatedOrder, updatedAt: new Date().toISOString() };
    
    await fetch(`/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullUpdatedOrder)
    });
    set((state) => ({
      orders: state.orders.map((o) => (o.id === id ? fullUpdatedOrder : o)),
    }));
  },

  deleteOrder: async (id) => {
    await fetch(`/api/orders/${id}`, { method: 'DELETE' });
    set((state) => ({ orders: state.orders.filter((o) => o.id !== id) }));
  },
  
  addAppointment: async (appointment) => {
    await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appointment)
    });
    set((state) => ({ appointments: [...state.appointments, appointment] }));
  },

  updateAppointment: async (id, updatedAppointment) => {
    const currentState = get();
    const existing = currentState.appointments.find(a => a.id === id);
    if (!existing) return;
    const full = { ...existing, ...updatedAppointment };
    
    await fetch(`/api/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(full)
    });
    set((state) => ({
      appointments: state.appointments.map((a) => (a.id === id ? full : a)),
    }));
  },

  deleteAppointment: async (id) => {
    await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
    set((state) => ({ appointments: state.appointments.filter((a) => a.id !== id) }));
  },

  updateSettings: async (updatedSettings) => {
    const currentState = get();
    const full = currentState.settings ? { ...currentState.settings, ...updatedSettings } : updatedSettings as CompanySettings;
    
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(full)
    });
    set((state) => ({
      settings: full
    }));
  },

  addTechnician: async (tech) => {
    await fetch('/api/technicians', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tech)
    });
    set((state) => ({ technicians: [...state.technicians, tech] }));
  },

  deleteTechnician: async (id) => {
    await fetch(`/api/technicians/${id}`, { method: 'DELETE' });
    set((state) => ({ technicians: state.technicians.filter((t) => t.id !== id) }));
  },
}));
