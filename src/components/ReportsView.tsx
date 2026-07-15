import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Lead, Activity, LeadStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, LabelList } from 'recharts';
import { format, parseISO, startOfMonth, getMonth, getYear, isValid } from 'date-fns';

const safeParseISO = (dateStr: string | undefined | null) => {
  if (!dateStr) return new Date();
  const parsed = parseISO(dateStr);
  return isValid(parsed) ? parsed : new Date();
};
import { es } from 'date-fns/locale';
import { Trash2, MessageCircle, Edit } from 'lucide-react';
import { LeadModal } from './LeadModal';

const normalizeCarType = (car: string) => {
  const c = car.toLowerCase();
  if (c.includes('creta grand') || c.includes('grand creta')) return 'Creta Grand';
  if (c.includes('creta')) return 'Creta';
  if (c.includes('i10') || c.includes('i 10')) return 'i10';
  if (c.includes('tucson')) return 'Tucson';
  if (c.includes('elantra')) return 'Elantra';
  if (c.includes('hb20') || c.includes('hb 20')) return 'HB20';
  if (c.includes('santa fe')) return 'Santa Fe';
  if (c.includes('palisade')) return 'Palisade';
  return 'Otros';
};

const STATUS_COLORS: Record<LeadStatus, string> = {
  Nuevo: '#3b82f6', // blue
  Negociacion: '#f97316', // orange
  Credito: '#a855f7', // purple
  Venta: '#22c55e', // green
  Finalizado: '#slate-400'
};

export const ReportsView: React.FC = () => {
  const { currentUser, leads, activities, users, updateLeadStatus, removeLead } = useStore();
  
  // Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAsesor, setSelectedAsesor] = useState('all');
  const [selectedMonthYear, setSelectedMonthYear] = useState('all'); // format: YYYY-MM
  
  // Modals
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);

  const isManager = currentUser?.role === 'gerente';

  // Available Months for Manager Filter
  const availableMonths = useMemo(() => {
    if (!leads.length) return [];
    const months = new Set<string>();
    leads.forEach(l => {
      const d = safeParseISO(l.date);
      months.add(format(d, 'yyyy-MM'));
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [leads]);

  // Sort old to new (based on date)
  let filteredLeads = leads.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (!isManager) {
    filteredLeads = filteredLeads.filter(l => l.userId === currentUser?.id);
  } else {
    if (selectedAsesor !== 'all') {
      filteredLeads = filteredLeads.filter(l => l.userId === selectedAsesor);
    }
    if (selectedMonthYear !== 'all') {
      filteredLeads = filteredLeads.filter(l => {
        const d = safeParseISO(l.date);
        return format(d, 'yyyy-MM') === selectedMonthYear;
      });
    }
  }

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filteredLeads = filteredLeads.filter(l => 
      (l.clientName && l.clientName.toLowerCase().includes(term)) || 
      (l.phone && l.phone.toLowerCase().includes(term)) || 
      (l.status && l.status.toLowerCase().includes(term)) ||
      (l.carType && l.carType.toLowerCase().includes(term)) ||
      (l.email && l.email.toLowerCase().includes(term))
    );
  }

  // Basic stats for Manager
  const totalLeads = filteredLeads.length;
  
  // Leads by Asesor
  const leadCountsByAsesor = users.filter(u => u.role === 'asesor').map(u => ({
    name: u.name?.split(' ')[0] || '...', // short name
    leads: filteredLeads.filter(l => l.userId === u.id).length
  })).filter(a => a.leads > 0);

  // Leads by Car Type
  const carTypesMap = new Map<string, number>();
  filteredLeads.forEach(l => {
    const norm = normalizeCarType(l.carType);
    carTypesMap.set(norm, (carTypesMap.get(norm) || 0) + 1);
  });
  const leadCountsByCar = Array.from(carTypesMap.entries()).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);

  // Leads by Status
  const statusCounts = Object.keys(STATUS_COLORS).map(status => ({
    name: status,
    count: filteredLeads.filter(l => l.status === status as LeadStatus).length,
    color: STATUS_COLORS[status as LeadStatus]
  })).filter(s => s.count > 0);

  // Leads per Month Trend
  const monthlyMap = new Map<string, number>();
  const trendLeads = (!isManager || selectedAsesor !== 'all') ? filteredLeads : leads; // If filtered by month, trend might look weird, so use all leads for that user if possible. Actually, let's keep it strictly tied to filters except month if month is selected? Let's just tie it to filteredLeads if 'all' month is selected, else if month is selected it will just show 1 point. Better to show all months for the selected Asesor.
  
  const leadsForTrend = isManager && selectedMonthYear !== 'all' 
    ? leads.filter(l => selectedAsesor === 'all' || l.userId === selectedAsesor)
    : filteredLeads;

  leadsForTrend.forEach(l => {
    const m = format(safeParseISO(l.date), 'MMM yy', { locale: es });
    monthlyMap.set(m, (monthlyMap.get(m) || 0) + 1);
  });
  // Sort theoretically by date:
  const monthlyTrend = Array.from(monthlyMap.entries()).map(([name, count]) => ({ name, count }));
  // This basic approach just relies on string appearance order which is reversed earlier, but we want chronological:
  monthlyTrend.reverse(); 

  const handlePrint = () => {
    window.print();
  };

  const handleEditLead = (lead: Lead) => {
    setLeadToEdit(lead);
    setIsLeadModalOpen(true);
  };

  const closeLeadModal = () => {
    setIsLeadModalOpen(false);
    setLeadToEdit(null);
  };

  return (
    <div className="space-y-6 bg-slate-50 min-h-screen pb-12 print:bg-white print:p-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 no-print">
        <h2 className="text-2xl font-bold tracking-tight text-[#002C5F] print:text-black">
          {isManager ? 'Reportes de Sucursal' : 'Mis Clientes y Prospectos'}
        </h2>
        
        <div className="flex flex-wrap gap-2 items-center">
          <button 
            onClick={() => { setLeadToEdit(null); setIsLeadModalOpen(true); }}
            className="px-4 py-2 bg-[#002C5F] text-white rounded-lg font-medium text-sm shadow-sm hover:bg-[#001f44] transition no-print"
          >
            + Nuevo Cliente
          </button>
          {isManager && (
            <>
              <select 
                value={selectedMonthYear} 
                onChange={e => setSelectedMonthYear(e.target.value)}
                className="px-3 py-2 bg-white text-sm border border-slate-200 rounded-lg outline-none text-slate-700 shadow-sm"
              >
                <option value="all">Todos los Meses</option>
                {availableMonths.map(m => (
                  <option key={m} value={m}>{format(safeParseISO(m + '-01'), 'MMMM yyyy', { locale: es })}</option>
                ))}
              </select>
              <select 
                value={selectedAsesor} 
                onChange={e => setSelectedAsesor(e.target.value)}
                className="px-3 py-2 bg-white text-sm border border-slate-200 rounded-lg outline-none text-slate-700 shadow-sm"
              >
                <option value="all">Todos los Asesores</option>
                {users.filter(u => u.role === 'asesor').map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </>
          )}
          <div className="flex flex-col items-end relative group">
            <button 
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg font-medium text-sm shadow-sm hover:bg-slate-700 transition"
            >
              Exportar a PDF
            </button>
            <div className="absolute top-full right-0 mt-2 bg-slate-800 text-white text-xs p-2 rounded shadow-lg w-64 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Nota: Si el botón no imprime en esta vista, abre la app en una nueva pestaña (ícono superior derecho) y vuelve a intentarlo.
            </div>
          </div>
        </div>
      </div>

      {isManager && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-2 print:gap-2">
          {/* Chart 1: Leads by Asesor */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-64 print-break-inside-avoid print:shadow-none print:border-slate-300">
            <h3 className="text-sm font-semibold text-slate-500 mb-4 text-center">Leads por Asesor</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadCountsByAsesor}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" fontSize={11} stroke="#64748b" interval={0} tick={{width: 60}} />
                <YAxis fontSize={11} stroke="#64748b" allowDecimals={false} />
                <Tooltip cursor={{fill: '#f1f5f9'}} />
                <Bar dataKey="leads" fill="#3b82f6" radius={[4,4,0,0]} barSize={32}>
                  <LabelList dataKey="leads" position="top" fill="#64748b" fontSize={10} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2: Leads by Car Type */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-64 print-break-inside-avoid print:shadow-none print:border-slate-300">
            <h3 className="text-sm font-semibold text-slate-500 mb-4 text-center">Leads por Unidad</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadCountsByCar}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" fontSize={10} stroke="#64748b" interval={0} angle={-45} textAnchor="end" height={50} />
                <YAxis fontSize={11} stroke="#64748b" allowDecimals={false} />
                <Tooltip cursor={{fill: '#f1f5f9'}} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4,4,0,0]} barSize={24}>
                  <LabelList dataKey="count" position="top" fill="#64748b" fontSize={10} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 3: Leads by Status */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-64 print-break-inside-avoid print:shadow-none print:border-slate-300">
            <h3 className="text-sm font-semibold text-slate-500 mb-4 text-center">Leads por Estatus</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusCounts} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="count" label={({value}) => value} labelLine={false}>
                  {statusCounts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-2 mt-[-10px]">
              {statusCounts.map(s => (
                <div key={s.name} className="flex items-center text-[10px] text-slate-600">
                  <span className="w-2 h-2 rounded-full mr-1" style={{backgroundColor: s.color}}></span>
                  {s.name}
                </div>
              ))}
            </div>
          </div>

          {/* Chart 4: Trend */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-64 print-break-inside-avoid print:shadow-none print:border-slate-300">
            <h3 className="text-sm font-semibold text-slate-500 mb-4 text-center">Tendencia por Mes</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" fontSize={11} stroke="#64748b" />
                <YAxis fontSize={11} stroke="#64748b" allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} dot={{r: 4}}>
                  <LabelList dataKey="count" position="top" fill="#64748b" fontSize={10} />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-slate-300 print-break-inside-avoid">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center no-print">
          <input
            type="text"
            placeholder="Buscador (Nombre, Teléfono, Email, Status...)"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#002C5F] outline-none text-sm transition-shadow shadow-sm"
          />
          <div className="px-4 py-1.5 bg-blue-50 text-blue-800 rounded-lg font-medium text-sm">
            Total: {totalLeads}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#002C5F] border-b border-[#001f44] text-white print:bg-slate-800 print:text-white print:break-inside-avoid">
              <tr>
                <th className="p-3 font-medium uppercase tracking-wider text-xs rounded-tl-lg print:rounded-none">Fecha</th>
                {isManager && <th className="p-3 font-medium uppercase tracking-wider text-xs">Asesor</th>}
                <th className="p-3 font-medium uppercase tracking-wider text-xs">Cliente</th>
                <th className="p-3 font-medium uppercase tracking-wider text-xs">Teléfono</th>
                <th className="p-3 font-medium uppercase tracking-wider text-xs">Email</th>
                <th className="p-3 font-medium uppercase tracking-wider text-xs">Auto</th>
                <th className="p-3 font-medium uppercase tracking-wider text-xs">Status</th>
                <th className="p-3 font-medium uppercase tracking-wider text-xs rounded-tr-lg no-print">Acción</th>
              </tr>
            </thead>
            <tbody className="print:text-xs">
              {filteredLeads.map(lead => (
                <tr key={lead.id} className="border-b last:border-0 border-slate-100 hover:bg-slate-50 transition-colors print:border-b print:border-slate-200 print:break-inside-avoid">
                  <td className="p-3 text-slate-600 tabular-nums">{format(safeParseISO(lead.date), 'dd/MM/yyyy')}</td>
                  {isManager && <td className="p-3 text-slate-700">{users.find(u => u.id === lead.userId)?.name?.split(' ')[0] || '...'}</td>}
                  <td className="p-3 font-medium text-slate-900">{lead.clientName}</td>
                  <td className="p-3 text-slate-600 font-mono text-xs">{lead.phone}</td>
                  <td className="p-3 text-slate-500 text-xs">{lead.email || '-'}</td>
                  <td className="p-3 text-slate-700">{normalizeCarType(lead.carType)}</td>
                  <td className="p-3">
                    <select 
                      value={lead.status}
                      onChange={(e) => updateLeadStatus(lead.id, e.target.value as LeadStatus)}
                      className={`text-xs px-2 py-1 rounded-full font-medium cursor-pointer border outline-none appearance-none print:appearance-none print:border-none print:p-0
                        ${lead.status === 'Nuevo' ? 'bg-blue-50 text-blue-700 border-blue-200 print:text-blue-700 print:bg-transparent' : ''}
                        ${lead.status === 'Negociacion' ? 'bg-orange-50 text-orange-700 border-orange-200 print:text-orange-700 print:bg-transparent' : ''}
                        ${lead.status === 'Credito' ? 'bg-purple-50 text-purple-700 border-purple-200 print:text-purple-700 print:bg-transparent' : ''}
                        ${lead.status === 'Venta' ? 'bg-green-50 text-green-700 border-green-200 print:text-green-700 print:bg-transparent' : ''}
                        ${lead.status === 'Finalizado' ? 'bg-slate-100 text-slate-600 border-slate-200 print:text-slate-600 print:bg-transparent' : ''}
                      `}
                    >
                      <option value="Nuevo">Nuevo</option>
                      <option value="Negociacion">Negociación</option>
                      <option value="Credito">Crédito</option>
                      <option value="Venta">Venta</option>
                      <option value="Finalizado">Finalizado</option>
                    </select>
                  </td>
                  <td className="p-3 no-print">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => setSelectedLead(lead)}
                        className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap"
                        title="Ver Historial"
                      >
                        Historial
                      </button>
                      
                      {isManager && (
                        <button 
                          onClick={() => handleEditLead(lead)}
                          className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 p-1.5 rounded-lg font-medium transition flex items-center justify-center"
                          title="Editar Prospecto"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}

                      <a 
                        href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-green-50 hover:bg-green-100 text-green-600 p-1.5 rounded-lg font-medium transition flex items-center justify-center"
                        title="Enviar WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>

                      {isManager && (
                        <button 
                          onClick={() => removeLead(lead.id)}
                          className="text-xs bg-red-50 hover:bg-red-100 text-red-500 p-1.5 rounded-lg font-medium transition flex items-center justify-center"
                          title="Eliminar Prospecto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No se encontraron prospectos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLead && (
        <LeadHistoryModal 
          lead={selectedLead} 
          activities={activities.filter(a => a.leadId === selectedLead.id).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())} 
          onClose={() => setSelectedLead(null)} 
        />
      )}
      {isLeadModalOpen && <LeadModal lead={leadToEdit || undefined} onClose={closeLeadModal} />}
    </div>
  );
};

const LeadHistoryModal: React.FC<{ lead: Lead; activities: Activity[]; onClose: () => void; }> = ({ lead, activities, onClose }) => {
  const { updateActivity } = useStore();

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 no-print">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-[#001f44] bg-[#002C5F] text-white flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold">{lead.clientName}</h3>
            <p className="text-sm text-blue-200 mt-1 whitespace-pre-wrap">Auto: {lead.carType}  |  Tel: {lead.phone} {lead.email ? ` | Email: ${lead.email}` : ''}</p>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 text-blue-200 hover:text-white rounded-lg transition">
            ✕
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <h4 className="font-semibold text-sm text-slate-500 uppercase tracking-wider mb-4">Cronología de Actividades</h4>
          
          <div className="space-y-4 border-l-2 border-slate-100 ml-4 pb-4">
            {activities.length === 0 && (
              <div className="pl-6 text-sm text-slate-400 italic">No hay actividades registradas.</div>
            )}
            
            {activities.map(act => (
              <div key={act.id} className="relative pl-6">
                <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white 
                  ${act.status === 'Completado' ? 'bg-green-500' : 'bg-slate-300'}`} 
                />
                <div className={`bg-white border text-sm rounded-xl p-4 shadow-sm transition-colors ${act.status === 'Completado' ? 'border-green-100 bg-green-50/30' : 'border-slate-200'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-bold text-slate-800 mr-2">{act.type}</span>
                      <span className="text-xs text-slate-400">{format(safeParseISO(act.date), 'dd/MM/yyyy')}</span>
                    </div>
                    <select
                      value={act.status}
                      onChange={(e) => updateActivity(act.id, { status: e.target.value as 'Pendiente' | 'Completado' })}
                      className={`text-xs px-2 py-1 rounded font-medium cursor-pointer border-0 outline-none
                        ${act.status === 'Completado' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-700'}
                      `}
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="Completado">Completado</option>
                    </select>
                  </div>
                  {act.comment && <p className="text-slate-600 mt-2">{act.comment}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
