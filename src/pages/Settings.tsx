import React, { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Settings as SettingsIcon, Save, Building, Phone, Mail, MapPin, Image as ImageIcon, Users, List, X, Plus, Palette, Moon, Sun } from 'lucide-react';
import { Technician } from '../types';

export function Settings() {
  const { theme, setTheme, settings, updateSettings, technicians, addTechnician, deleteTechnician } = useStore();
  const [formData, setFormData] = useState({
    companyName: settings?.companyName || '',
    legalName: settings?.legalName || '',
    nif: settings?.nif || '',
    phone: settings?.phone || '',
    email: settings?.email || '',
    address: settings?.address || '',
    city: settings?.city || '',
    postalCode: settings?.postalCode || '',
    logo: settings?.logo || '',
    orderSeries: settings?.orderSeries || new Date().getFullYear().toString(),
    brands: settings?.brands || [],
    deviceTypes: settings?.deviceTypes || [],
    repairTerms: settings?.repairTerms || '',
    includeTermsInPdf: settings?.includeTermsInPdf || false,
  });

  const [newBrand, setNewBrand] = useState('');
  const [newDeviceType, setNewDeviceType] = useState('');
  const [newTechName, setNewTechName] = useState('');
  const [newTechPin, setNewTechPin] = useState('');

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

  const handleAddBrand = () => {
    if (newBrand.trim() && !formData.brands.includes(newBrand.trim())) {
      setFormData({ ...formData, brands: [...formData.brands, newBrand.trim()] });
      setNewBrand('');
    }
  };

  const handleAddDeviceType = () => {
    if (newDeviceType.trim() && !formData.deviceTypes.includes(newDeviceType.trim())) {
      setFormData({ ...formData, deviceTypes: [...formData.deviceTypes, newDeviceType.trim()] });
      setNewDeviceType('');
    }
  };

  const handleAddTechnician = async () => {
    if (newTechName.trim() && newTechPin.trim().length === 6) {
      await addTechnician({
        id: Date.now().toString(),
        name: newTechName.trim(),
        pin: newTechPin.trim(),
        createdAt: new Date().toISOString()
      });
      setNewTechName('');
      setNewTechPin('');
    } else {
      alert("PIN deve conter 6 dígitos e o nome é obrigatório.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(formData);
    alert('Configurações guardadas com sucesso!');
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
        <p className="text-sm text-slate-500">Gerencie as informações da sua empresa.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden mt-6">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center gap-2">
          <Palette className="h-5 w-5 text-slate-500" />
          <h2 className="text-lg font-medium text-slate-900">Aparência</h2>
        </div>
        <div className="p-6">
          <label className="mb-2 block text-sm font-medium text-slate-700">Tema do Sistema</label>
          <div className="flex gap-4">
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${theme === 'light' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              <Sun className="h-4 w-4" /> Claro
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${theme === 'dark' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              <Moon className="h-4 w-4" /> Escuro
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">A escolha do tema é guardada nas suas preferências locais.</p>
        </div>
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

          <div className="border-t border-slate-200 pt-6">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">Configurações de Impressão</h3>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="flex items-center gap-2 mb-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.includeTermsInPdf}
                    onChange={(e) => setFormData({ ...formData, includeTermsInPdf: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Incluir Condições Gerais no rodapé dos documentos PDF
                </label>
              </div>
              {formData.includeTermsInPdf && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Condições Gerais / Termos de Reparação</label>
                  <textarea
                    value={formData.repairTerms}
                    onChange={(e) => setFormData({ ...formData, repairTerms: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    rows={6}
                    placeholder="Introduza aqui os termos e condições gerais para constarem no rodapé dos orçamentos e comprovativos."
                  />
                </div>
              )}
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

      {/* Configurações de Listas */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden mt-6">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center gap-2">
          <List className="h-5 w-5 text-slate-500" />
          <h2 className="text-lg font-medium text-slate-900">Listas da Loja</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Marcas */}
          <div>
            <h3 className="text-sm font-medium text-slate-900 mb-3">Marcas Registadas</h3>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Ex: Apple, Samsung"
                value={newBrand}
                onChange={e => setNewBrand(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddBrand()}
                className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddBrand}
                className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.brands.map(brand => (
                <span key={brand} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                  {brand}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, brands: prev.brands.filter(b => b !== brand) }));
                    }}
                    className="text-slate-500 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {formData.brands.length === 0 && <span className="text-xs text-slate-500 italic">Nenhuma marca configurada.</span>}
            </div>
            <p className="mt-2 text-xs text-slate-500">Nota: Não se esqueça de clicar em "Guardar Alterações" lá em cima.</p>
          </div>

          {/* Tipos de Equipamento */}
          <div>
            <h3 className="text-sm font-medium text-slate-900 mb-3">Tipos de Equipamento</h3>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Ex: Smartphone, Portátil"
                value={newDeviceType}
                onChange={e => setNewDeviceType(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddDeviceType()}
                className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddDeviceType}
                className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.deviceTypes.map(type => (
                <span key={type} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                  {type}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, deviceTypes: prev.deviceTypes.filter(t => t !== type) }));
                    }}
                    className="text-slate-500 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {formData.deviceTypes.length === 0 && <span className="text-xs text-slate-500 italic">Nenhum tipo configurado.</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Técnicos */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden mt-6">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-slate-500" />
          <h2 className="text-lg font-medium text-slate-900">Equipa / Técnicos</h2>
        </div>
        <div className="p-6">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="mb-1 block text-sm font-medium text-slate-700">Nome do Técnico</label>
              <input
                type="text"
                placeholder="Ex: João Silva"
                value={newTechName}
                onChange={e => setNewTechName(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="w-full sm:w-32">
              <label className="mb-1 block text-sm font-medium text-slate-700">PIN (6 dígitos)</label>
              <input
                type="text"
                maxLength={6}
                placeholder="123456"
                value={newTechPin}
                onChange={e => setNewTechPin(e.target.value.replace(/\D/g, ''))}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={handleAddTechnician}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </button>
          </div>

          {technicians.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded-lg border border-slate-100">Nenhum técnico registado.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {technicians.map(tech => (
                <div key={tech.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:border-slate-300 bg-white">
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{tech.name}</p>
                    <p className="text-xs text-slate-500 font-mono tracking-widest mt-0.5">******</p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (window.confirm(`Remover técnico ${tech.name}?`)) {
                        await deleteTechnician(tech.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    title="Remover"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden mt-6">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center gap-2">
          <Save className="h-5 w-5 text-slate-500" />
          <h2 className="text-lg font-medium text-slate-900">Backup / Restauro de Dados</h2>
        </div>
        <div className="p-6 space-y-6">
          <p className="text-sm text-slate-600">
            Pode exportar toda a base de dados (clientes, peças, ordens, configurações) em segurança e voltar a importar noutra máquina ou mais tarde.
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await fetch('/api/backup-db');
                  const data = await res.json();
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `backup_techassist_${new Date().toISOString().split('T')[0]}.json`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                } catch (e) {
                  alert('Erro ao gerar backup.');
                }
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              Exportar Backup (JSON)
            </button>

            <div className="relative">
              <input
                type="file"
                accept="application/json"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="Importar Backup"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (!window.confirm('Aviso: Isto irá APAGAR todos os dados atuais e substituir pelos dados do ficheiro. Tem a certeza?')) {
                    return;
                  }
                  
                  const reader = new FileReader();
                  reader.onloadend = async () => {
                    try {
                      const data = JSON.parse(reader.result as string);
                      const res = await fetch('/api/restore-db', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                      });
                      
                      if (res.ok) {
                        alert('Base de dados restaurada com sucesso! A página será atualizada.');
                        window.location.reload();
                      } else {
                        const err = await res.json();
                        alert('Erro ao restaurar: ' + err.error);
                      }
                    } catch (err) {
                      alert('Erro ao ler ficheiro de backup.');
                    }
                  };
                  reader.readAsText(file);
                }}
              />
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700"
              >
                Importar Backup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
