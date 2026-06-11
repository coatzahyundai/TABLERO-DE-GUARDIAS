import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { Activity, LeadStatus } from '../types';

export const ActionModal: React.FC<{ defaultDate: string; onClose: () => void }> = ({ defaultDate, onClose }) => {
  const { currentUser, leads, addActivity, updateLeadStatus } = useStore();
  const [formData, setFormData] = useState<Omit<Activity, 'id'>>({
    leadId: '',
    userId: currentUser?.id || '',
    date: defaultDate,
    type: 'Llamada',
    comment: '',
    status: 'Pendiente'
  });
  
  const [leadSearch, setLeadSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [newStatus, setNewStatus] = useState<LeadStatus | ''>('');
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.leadId) return;

    addActivity({
      leadId: formData.leadId,
      userId: formData.userId || currentUser?.id || '',
      date: formData.date,
      type: formData.type,
      comment: formData.comment,
      status: formData.status
    });
    
    if (newStatus) {
      updateLeadStatus(formData.leadId, newStatus);
    }
    
    onClose();
  };

  const myLeads = leads.filter(l => l.userId === currentUser?.id);
  const filteredLeads = myLeads.filter(l => 
    l.clientName.toLowerCase().includes(leadSearch.toLowerCase()) || 
    l.phone.includes(leadSearch) ||
    l.carType.toLowerCase().includes(leadSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-800">Programar Actividad</h3>
          <p className="text-sm text-slate-500 mt-1">Completa los datos para el seguimiento</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de la Actividad *</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#002C5F] outline-none bg-white"
            />
          </div>
          <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-slate-700 mb-1">Buscar Cliente / Prospecto *</label>
            <input
              type="text"
              placeholder="Escribe nombre, auto o teléfono..."
              value={leadSearch}
              onChange={(e) => {
                setLeadSearch(e.target.value);
                setShowDropdown(true);
                setFormData({ ...formData, leadId: '' });
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#002C5F] outline-none"
            />
            {showDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredLeads.length > 0 ? (
                  filteredLeads.map(lead => (
                    <div 
                      key={lead.id}
                      onClick={() => {
                        setFormData({ ...formData, leadId: lead.id });
                        setLeadSearch(lead.clientName);
                        setShowDropdown(false);
                      }}
                      className="px-4 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                    >
                      <div className="font-medium text-slate-800">{lead.clientName}</div>
                      <div className="text-xs text-slate-500">{lead.carType} - {lead.phone}</div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-slate-500">No se encontraron prospectos</div>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Actividad *</label>
            <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#002C5F] outline-none bg-white">
              <option value="Llamada">Llamada</option>
              <option value="Cita">Cita</option>
              <option value="Visita">Visita</option>
              <option value="Demo">Demo</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Estado de esta Actividad *</label>
            <select required value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#002C5F] outline-none bg-white font-medium">
              <option value="Pendiente">⏳ Programada para futuro (Pendiente)</option>
              <option value="Completado">✅ Ya realizada (Completado)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Actualizar Estatus del Prospecto (Opcional)</label>
            <select value={newStatus} onChange={e => setNewStatus(e.target.value as any)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#002C5F] outline-none bg-white">
              <option value="">No Cambiar</option>
              <option value="Nuevo">Nuevo</option>
              <option value="Negociacion">Negociación</option>
              <option value="Credito">Crédito</option>
              <option value="Venta">Venta</option>
              <option value="Finalizado">Finalizado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Motivo / Notas</label>
            <textarea value={formData.comment} onChange={e => setFormData({...formData, comment: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#002C5F] outline-none h-24 resize-none" placeholder="Opcional..." />
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-[#002C5F] text-white rounded-lg hover:bg-[#001f44] shadow-sm transition-colors disabled:opacity-50" disabled={!formData.leadId}>Guardar Actividad</button>
          </div>
        </form>
      </div>
    </div>
  );
};
