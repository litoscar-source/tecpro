import React, { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Settings as SettingsIcon, Save, Building, Phone, Mail, MapPin, Image as ImageIcon } from 'lucide-react';

export function Settings() {
  const { settings, updateSettings } = useStore();
  const [formData, setFormData] = useState({
    companyName: settings.companyName,
    legalName: settings.legalName,
    nif: settings.nif,
    phone: settings.phone,
    email: settings.email,
    address: settings.address,
    city: settings.city,
    postalCode: settings.postalCode,
    logo: settings.logo || '',
    orderSeries: settings.orderSeries || new Date().getFullYear().toString(),
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    alert('Configurações guardadas com sucesso!');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
        <p className="text-sm text-slate-500">Gerencie as informações da sua empresa.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-slate-500" />
          <h2 className="text-lg font-medium text-slate-900">Logótipo da Empresa</h2>
        </div>
        
        <div className="p-6 border-b border-slate-200 flex items-center gap-6">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-slate-300 bg-slate-50">
            {formData.logo ? (
              <img src={formData.logo} alt="Logótipo" className="h-full w-full object-contain" />
            ) : (
              <ImageIcon className="h-8 w-8 text-slate-400" />
            )}
          </div>
          <div className="flex-1">
            <p className="mb-2 text-sm text-slate-600">
              Faça upload do logótipo da sua empresa para ser exibido nos documentos impressos (PDF).
            </p>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleLogoUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Escolher Imagem
            </button>
            {formData.logo && (
              <button
                type="button"
                onClick={() => setFormData({ ...formData, logo: '' })}
                className="ml-2 rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Remover
              </button>
            )}
          </div>
        </div>

        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center gap-2">
          <Building className="h-5 w-5 text-slate-500" />
          <h2 className="text-lg font-medium text-slate-900">Dados da Empresa</h2>
        </div>
        
        <form className="p-6 space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nome Fantasia</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Razão Social</label>
              <input
                type="text"
                value={formData.legalName}
                onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">NIF</label>
              <input
                type="text"
                value={formData.nif}
                onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" title="Prefixo para as novas reparações">Série de Faturação/OS</label>
              <input
                type="text"
                placeholder="Ex: 2026"
                value={formData.orderSeries}
                onChange={(e) => setFormData({ ...formData, orderSeries: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 flex items-center gap-1">
                <Phone className="h-4 w-4 text-slate-400" /> Telefone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 flex items-center gap-1">
                <Mail className="h-4 w-4 text-slate-400" /> Email de Contato
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-md font-medium text-slate-900 mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-slate-500" /> Morada
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-3">
                <label className="mb-1 block text-sm font-medium text-slate-700">Morada Completa</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Código Postal</label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">Localidade</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <Save className="h-4 w-4" />
              Guardar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
