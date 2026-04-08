import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Customer, InventoryItem, ServiceOrder, CompanySettings } from '../types';

interface AppState {
  customers: Customer[];
  inventory: InventoryItem[];
  orders: ServiceOrder[];
  settings: CompanySettings;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  addInventoryItem: (item: InventoryItem) => void;
  updateInventoryItem: (id: string, item: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  addOrder: (order: ServiceOrder) => void;
  updateOrder: (id: string, order: Partial<ServiceOrder>) => void;
  deleteOrder: (id: string) => void;
  updateSettings: (settings: Partial<CompanySettings>) => void;
}

const initialCustomers: Customer[] = [
  { id: 'c1', name: 'João Silva', email: 'joao@example.com', phone: '912 345 678', nif: '123456789', address: 'Rua das Flores, 123', postalCode: '1000-001', city: 'Lisboa', createdAt: new Date().toISOString() },
  { id: 'c2', name: 'Maria Oliveira', email: 'maria@example.com', phone: '961 234 567', nif: '987654321', address: 'Avenida da Liberdade, 1000', postalCode: '4000-002', city: 'Porto', createdAt: new Date().toISOString() },
];

const initialInventory: InventoryItem[] = [
  { id: 'i1', name: 'Ecrã iPhone 13', description: 'Display OLED original', quantity: 5, price: 150, cost: 80, createdAt: new Date().toISOString() },
  { id: 'i2', name: 'Bateria Samsung S22', description: 'Bateria original 3700mAh', quantity: 10, price: 60, cost: 25, createdAt: new Date().toISOString() },
];

const initialOrders: ServiceOrder[] = [
  {
    id: '2000001',
    customerId: 'c1',
    deviceType: 'Telemóvel',
    brand: 'Apple',
    model: 'iPhone 13',
    serialNumber: 'ABC123XYZ',
    deviceCondition: 'Marcas de uso normais',
    accessories: 'Capa transparente',
    isWarranty: false,
    issueDescription: 'Ecrã partido após queda.',
    technicianNotes: 'Necessário substituir o display completo.',
    status: 'in_progress',
    partsUsed: [{ partId: 'i1', quantity: 1 }],
    laborCost: 40,
    totalCost: 190,
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2000002',
    customerId: 'c2',
    deviceType: 'Telemóvel',
    brand: 'Samsung',
    model: 'Galaxy S22',
    serialNumber: 'DEF456UVW',
    deviceCondition: 'Ecrã intacto, riscos na traseira',
    accessories: 'Nenhum',
    isWarranty: true,
    issueDescription: 'Bateria descarrega rapidamente.',
    technicianNotes: '',
    status: 'pending',
    partsUsed: [],
    laborCost: 0,
    totalCost: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const initialSettings: CompanySettings = {
  companyName: 'TechAssist Pro',
  legalName: 'TechAssist Soluções em TI Lda',
  nif: '123456789',
  phone: '210 000 000',
  email: 'geral@techassist.pt',
  address: 'Avenida da República, 1500',
  city: 'Lisboa',
  postalCode: '1050-191',
  orderSeries: new Date().getFullYear().toString()
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      customers: initialCustomers,
      inventory: initialInventory,
      orders: initialOrders,
      settings: initialSettings,
      addCustomer: (customer) => set((state) => ({ customers: [...state.customers, customer] })),
      updateCustomer: (id, updatedCustomer) => set((state) => ({
        customers: state.customers.map((c) => (c.id === id ? { ...c, ...updatedCustomer } : c)),
      })),
      deleteCustomer: (id) => set((state) => ({ customers: state.customers.filter((c) => c.id !== id) })),
      
      addInventoryItem: (item) => set((state) => ({ inventory: [...state.inventory, item] })),
      updateInventoryItem: (id, updatedItem) => set((state) => ({
        inventory: state.inventory.map((i) => (i.id === id ? { ...i, ...updatedItem } : i)),
      })),
      deleteInventoryItem: (id) => set((state) => ({ inventory: state.inventory.filter((i) => i.id !== id) })),
      
      addOrder: (order) => set((state) => ({ orders: [...state.orders, order] })),
      updateOrder: (id, updatedOrder) => set((state) => ({
        orders: state.orders.map((o) => (o.id === id ? { ...o, ...updatedOrder, updatedAt: new Date().toISOString() } : o)),
      })),
      deleteOrder: (id) => set((state) => ({ orders: state.orders.filter((o) => o.id !== id) })),
      
      updateSettings: (updatedSettings) => set((state) => ({
        settings: { ...state.settings, ...updatedSettings }
      })),
    }),
    {
      name: 'tech-assist-storage',
    }
  )
);
