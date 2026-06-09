export type OrderStatus = 'entrada' | 'diagnostico' | 'orcamento' | 'aguarda_peca' | 'pronto' | 'cancelado';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  nif: string;
  address: string;
  postalCode: string;
  city: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  color?: string;
  quantity: number;
  price: number;
  cost: number;
  createdAt: string;
}

export interface ServiceOrder {
  id: string;
  customerId: string;
  deviceType: string;
  brand: string;
  model: string;
  serialNumber: string;
  deviceCondition: string;
  accessories: string;
  isWarranty: boolean;
  issueDescription: string;
  technicianNotes: string;
  status: OrderStatus;
  partsUsed: { partId: string; quantity: number }[];
  partsDiscount?: number;
  laborCost: number;
  totalCost: number;
  paymentStatus?: 'pendente' | 'pago' | 'cancelado' | string;
  paymentMethod?: 'multibanco' | 'mbway' | 'dinheiro' | 'transferencia' | 'cartao' | string;
  paymentDate?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface CompanySettings {
  companyName: string;
  legalName: string;
  nif: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  logo?: string;
  orderSeries: string;
}

export interface Appointment {
  id: string;
  customerId: string;
  title: string;
  date: string;
  time: string;
  notes: string;
  status: 'scheduled' | 'completed' | 'canceled';
  createdAt: string;
}

