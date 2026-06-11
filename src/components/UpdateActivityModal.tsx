import React, { useState } from 'react';
import { useStore } from '../store';
import { Activity, LeadStatus } from '../types';

const SYSTEM_PROMPTS = [
  '¿Quieres que actualicemos el estatus de tu lead?',
  'Este es un buen momento para actualizar tu lead'
];

export const UpdateActivityModal: React.FC<{ activityId: string; onClose: () => void }> = ({ activityId, onClose }) => {
  const { activities, leads, updateActivity, updateLeadStatus } = useStore();
  const activity = activities.find(a => a.id === activityId);
  const lead = leads.find(l => l.id === activity?.leadId);
  
  const isAutoComment = SYSTEM_PROMPTS.includes(activity?.comment || '');
  
  const [status, setStatus] = useState<LeadStatus | ''>('');
  const [comment, setComment] = useState(isAutoComment ? '' : (activity?.comment || ''));
  const [actStatus, setActStatus] = useState(activity?.status || 'Pendiente');

  if (!activity || !lead) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateActivity(activity.id, { comment, status: actStatus as any });
    if (status) {
      updateLeadStatus(lead.id, status);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 bg-[#002C5F] text-white">
          <h3 className="text-xl font-bold">{lead.clientName}</h3>
          <p className="text-sm text-blue-200 mt-1 whitespace-pre-wrap">Auto: {lead.carType}  |  Contacto: {lead.phone}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {isAutoComment && (
            <div className="bg-blue-50 text-blue-900 p-3 rounded-lg text-sm mb-4 border border-blue-100">
              <p className="font-semibold text-blue-700 mb-1">Recordatorio del Sistema:</p>
              <p>{activity.comment}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Estado de la Actividad ({activity.type})</label>
            <select value={actStatus} onChange={e => setActStatus(e.target.value as any)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#002C5F] outline-none bg-white font-medium">
              <option value="Pendiente">⏳ Pendiente</option>
              <option value="Completado">✅ Completado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Actualizar Estatus del Prospecto</label>
            <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#002C5F] outline-none bg-white">
              <option value="">No Cambiar (Actual: {lead.status})</option>
              <option value="Nuevo">Nuevo</option>
              <option value="Negociacion">Negociación</option>
              <option value="Credito">Crédito</option>
              <option value="Venta">Venta</option>
              <option value="Finalizado">Finalizado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Resultados / Notas de la Actividad</label>
            <textarea value={comment} onChange={e => setComment(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#002C5F] outline-none h-24 resize-none" placeholder="Ej. El cliente contestó la llamada y mencionó que..." />
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-[#002C5F] text-white rounded-lg hover:bg-[#001f44] shadow-sm transition-colors">Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  );
};
