import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, X } from 'lucide-react';
import { ServiceOrder } from '../types';

interface PrintLabelModalProps {
  order: ServiceOrder;
  customerName: string;
  onClose: () => void;
}

export function PrintLabelModal({ order, customerName, onClose }: PrintLabelModalProps) {
  const handlePrint = () => {
    window.print();
  };

  const getPublicQuoteUrl = () => {
    return `${window.location.origin}/quote/${order.id}`;
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 no-print print:hidden">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Etiqueta de Identificação</h2>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded text-slate-500">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-8 flex justify-center bg-slate-50">
            <div className="bg-white p-4 border border-dashed border-slate-300 shadow-sm w-64">
              <div className="text-center mb-2">
                <h1 className="font-bold text-lg leading-tight uppercase">OS: {order.id.substring(0, 8)}</h1>
                <p className="text-xs text-slate-600 truncate" title={customerName}>{customerName}</p>
              </div>
              
              <div className="flex justify-center my-3">
                <QRCodeSVG value={getPublicQuoteUrl()} size={120} level="M" />
              </div>
              
              <div className="text-center text-xs space-y-1 mt-2 border-t pt-2 border-slate-100">
                <p className="font-semibold truncate" title={order.orderType === 'service' && !order.brand ? 'Prestação de Serviço' : `${order.brand} ${order.model}`}>
                  {order.orderType === 'service' && !order.brand ? 'Prestação de Serviço' : `${order.brand} ${order.model}`}
                </p>
                <p className="text-[10px] text-slate-500">{new Date(order.createdAt).toLocaleDateString('pt-PT')}</p>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              Cancelar
            </button>
            <button onClick={handlePrint} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 transition-colors shadow-sm">
              <Printer className="h-4 w-4" /> Imprimir
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-label-container, #printable-label-container * {
            visibility: visible;
          }
          #printable-label-container {
            position: absolute;
            left: 0;
            top: 0;
          }
          @page {
            margin: 0;
            size: auto;
          }
        }
      `}</style>
      
      <div id="printable-label-container" className="hidden print:block">
        <div style={{ width: '50mm', padding: '2mm', boxSizing: 'border-box', fontFamily: 'sans-serif' }}>
          <div style={{ textAlign: 'center', marginBottom: '2mm' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>OS: {order.id.substring(0, 8).toUpperCase()}</div>
            <div style={{ fontSize: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{customerName}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2mm' }}>
            <QRCodeSVG value={getPublicQuoteUrl()} size={80} level="M" />
          </div>
          <div style={{ textAlign: 'center', fontSize: '10px', borderTop: '1px solid #ccc', paddingTop: '1mm' }}>
            <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {order.orderType === 'service' && !order.brand ? 'Serviço' : `${order.brand} ${order.model}`}
            </div>
            <div style={{ fontSize: '9px', marginTop: '1mm' }}>{new Date(order.createdAt).toLocaleDateString('pt-PT')}</div>
          </div>
        </div>
      </div>
    </>
  );
}
