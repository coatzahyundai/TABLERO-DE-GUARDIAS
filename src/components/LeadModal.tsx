import React, { useState } from 'react';
import { useStore } from '../store';
import { Lead } from '../types';

import { format } from 'date-fns';

export const LeadModal: React.FC<{ date?: string; onClose: () => void }> = ({ date, onClose }) => {
  const { currentUser, addLead } = useStore();
  const actualDate = date || format(new Date(), 'yyyy-MM-dd');
  const [formData, setFormData] = useState<Omit<Lead, 'id' | 'userId' | 'date'>>({
    clientName: '',
    phone: '',
    email: '',
    carType: '',
    status: 'Nuevo'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    addLead({
      date: actualDate,
      userId: currentUser.id,
      clientName: formData.clientName,
      phone: formData.phone,
      email: formData.email,
      carType: formData.carType,
      status: formData.status
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-800">Registrar Prospecto</h3>
          <p className="text-sm text-slate-500 mt-1">Fecha: {actualDate} · Asesor: {currentUser?.name}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Cliente *</label>
            <input required type="text" value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono *</label>
            <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico (Opcional)</label>
            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Auto de Interés *</label>
            <input required type="text" value={formData.carType} onChange={e => setFormData({...formData, carType: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej: Sedan, SUV..." />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Estatus Inicial *</label>
            <select required value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#002C5F] outline-none">
              <option value="Nuevo">Nuevo</option>
              <option value="Negociacion">Negociación</option>
              <option value="Credito">Crédito</option>
              <option value="Venta">Venta</option>
              <option value="Finalizado">Finalizado</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-[#002C5F] text-white rounded-lg hover:bg-[#001f44] shadow-sm transition-colors">Guardar Prospecto</button>
          </div>
        </form>
      </div>
    </div>
  );
};
