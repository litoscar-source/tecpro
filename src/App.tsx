/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { Inventory } from './pages/Inventory';
import { Orders } from './pages/Orders';
import { Settings } from './pages/Settings';
import { Agenda } from './pages/Agenda';
import { PinScreen } from './components/PinScreen';
import { useStore } from './store/useStore';

export default function App() {
  const { fetchData, isLoading } = useStore();
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('isAuthenticated') === 'true';
  });

  if (!isAuthenticated) {
    return (
      <PinScreen 
        onSuccess={() => {
          sessionStorage.setItem('isAuthenticated', 'true');
          setIsAuthenticated(true);
        }} 
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="customers" element={<Customers />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
