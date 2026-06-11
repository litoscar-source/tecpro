import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import { Printer, X } from 'lucide-react';
import { ServiceOrder } from '../types';

interface PrintLabelModalProps {
  order: ServiceOrder;
  customerName: string;
  onClose: () => void;
}

export function PrintLabelModal({ order, customerName, onClose }: PrintLabelModalProps) {
  const [printType, setPrintType] = useState<'qr' | 'barcode'>('qr');
  const [quantity, setQuantity] = useState(1);

  const handlePrint = () => {
    window.print();
  };

  const getPublicQuoteUrl = () => {
    return `${window.location.origin}/quote/${order.id}`;
  };

  const currentOrderId = order.id.substring(0, 8).toUpperCase();

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 no-print print:hidden">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Emissão de Etiquetas</h2>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded text-slate-500">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-4 border-b border-slate-100 grid grid-cols-2 gap-4 bg-white">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Tipo de Código</label>
              <select
                value={printType}
                onChange={(e) => setPrintType(e.target.value as 'qr' | 'barcode')}
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
              >
                <option value="qr">QR Code (URL)</option>
                <option value="barcode">Código de Barras (OS)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Qtd. Etiquetas</label>
              <input
                type="number"
                min="1"
                max="20"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="p-8 flex justify-center bg-slate-50 overflow-y-auto max-h-64">
            <div className="bg-white p-4 border border-dashed border-slate-300 shadow-sm w-64 shrink-0">
              <div className="text-center mb-2">
                <h1 className="font-bold text-lg leading-tight uppercase">OS: {currentOrderId}</h1>
                <p className="text-xs text-slate-600 truncate" title={customerName}>{customerName}</p>
              </div>
              
              <div className="flex justify-center my-3 overflow-hidden">
                {printType === 'qr' ? (
                  <QRCodeSVG value={getPublicQuoteUrl()} size={120} level="M" />
                ) : (
                  <Barcode value={currentOrderId} width={2} height={50} displayValue={false} background="transparent" />
                )}
              </div>
              
              <div className="text-center text-xs space-y-1 mt-2 border-t pt-2 border-slate-100">
                <p className="font-semibold truncate" title={order.orderType === 'service' && !order.brand ? 'Prestação de Serviço' : `${order.brand} ${order.model}`}>
                  {order.orderType === 'service' && !order.brand ? 'Prestação de Serviço' : `${order.brand} ${order.model}`}
                </p>
                <p className="text-[10px] text-slate-500">{new Date(order.createdAt).toLocaleDateString('pt-PT')}</p>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-white">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              Cancelar
            </button>
            <button onClick={handlePrint} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 transition-colors shadow-sm">
              <Printer className="h-4 w-4" /> Imprimir ({quantity})
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-labels-wrapper, #print-labels-wrapper * {
            visibility: visible;
          }
          #print-labels-wrapper {
            position: absolute;
            left: 0;
            top: 0;
            display: flex;
            flex-direction: column;
            gap: 10mm;
          }
          @page {
            margin: 0;
            size: auto;
          }
        }
      `}</style>
      
      <div id="print-labels-wrapper" className="hidden print:flex">
        {Array.from({ length: quantity }).map((_, idx) => (
          <div key={idx} style={{ width: '50mm', padding: '2mm', boxSizing: 'border-box', fontFamily: 'sans-serif', breakInside: 'avoid' }}>
            <div style={{ textAlign: 'center', marginBottom: printType === 'barcode' ? '1mm' : '2mm' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold' }}>OS: {currentOrderId}</div>
              <div style={{ fontSize: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{customerName}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: printType === 'barcode' ? '1mm' : '2mm' }}>
              {printType === 'qr' ? (
                <QRCodeSVG value={getPublicQuoteUrl()} size={80} level="M" />
              ) : (
                <div style={{ transform: 'scale(0.8)', transformOrigin: 'top center' }}>
                  <Barcode value={currentOrderId} width={1.5} height={40} displayValue={false} margin={0} background="transparent" />
                </div>
              )}
            </div>
            <div style={{ textAlign: 'center', fontSize: '10px', borderTop: '1px solid #ccc', paddingTop: '1mm' }}>
              <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {order.orderType === 'service' && !order.brand ? 'Serviço' : `${order.brand} ${order.model}`}
              </div>
              <div style={{ fontSize: '9px', marginTop: '1mm' }}>{new Date(order.createdAt).toLocaleDateString('pt-PT')}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
