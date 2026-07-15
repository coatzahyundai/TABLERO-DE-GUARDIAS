import React, { useState } from 'react';
import { useStore } from '../store';
import { addDays, addMonths, subMonths, format, startOfWeek, isSameDay, startOfMonth, endOfMonth, getDay, isSameMonth, parseISO, isValid } from 'date-fns';

const safeParseISO = (dateStr: string | undefined | null) => {
  if (!dateStr) return new Date();
  const parsed = parseISO(dateStr);
  return isValid(parsed) ? parsed : new Date();
};
import { es } from 'date-fns/locale';
import { ShiftType } from '../types';
import { LeadModal } from './LeadModal';
import { ActionModal } from './ActionModal';
import { UpdateActivityModal } from './UpdateActivityModal';

const SHIFTS: ShiftType[] = ['Guardia 1', 'Guardia 2', 'Guardia 3', 'Guardia Servicio', 'Campo Editable 1', 'Campo Editable 2', 'Campo Editable 3'];
const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// Helper to generate a pastel color based on user id securely
const getPastelColor = (id: string, isCurrentUser: boolean) => {
  if (isCurrentUser) return 'bg-blue-200 text-blue-900 border-blue-300';
  const colors = ['bg-orange-100 text-orange-900', 'bg-green-100 text-green-900', 'bg-purple-100 text-purple-900', 'bg-pink-100 text-pink-900'];
  return colors[parseInt(id) % colors.length] + ' border-transparent';
};

export const CalendarView: React.FC = () => {
  const { currentUser, guardias, users, assignGuardia, removeGuardia, leads, activities, shiftNames, dailyEvents, setDailyEvent } = useStore();
  const [viewType, setViewType] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modals state
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [leadModalDate, setLeadModalDate] = useState('');
  
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionModalDate, setActionModalDate] = useState('');
  
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState('');
  
  const handleCellInteraction = (e: React.MouseEvent, date: Date, shift: ShiftType, hasGuardia: boolean) => {
    // If clicking on a select dropdown, ignore
    if ((e.target as HTMLElement).tagName === 'SELECT' || (e.target as HTMLElement).tagName === 'BUTTON') return;

    if (hasGuardia) {
      setLeadModalDate(format(date, 'yyyy-MM-dd'));
      setIsLeadModalOpen(true);
    } else {
      handleSpaceClick(date);
    }
  };

  // Calculate start of week (Monday)
  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  
  const days = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  // Determine activities for current user/manager
  const visibleActivities = currentUser?.role === 'gerente' 
    ? activities
    : activities.filter(a => leads.find(l => l.id === a.leadId)?.userId === currentUser?.id);

  // For Month View
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const firstDayOfWeek = getDay(monthStart) === 0 ? 6 : getDay(monthStart) - 1; // 0 is Monday
  const startDay = addDays(monthStart, -firstDayOfWeek);
  const monthDays = Array.from({ length: 42 }).map((_, i) => addDays(startDay, i));

  const navigatePrev = () => setCurrentDate(viewType === 'week' ? addDays(currentDate, -7) : subMonths(currentDate, 1));
  const navigateNext = () => setCurrentDate(viewType === 'week' ? addDays(currentDate, 7) : addMonths(currentDate, 1));

  const handleAssign = (date: Date, shift: ShiftType, e: React.ChangeEvent<HTMLSelectElement>) => {
    const userId = e.target.value;
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // For non-editable shifts, remove existing first. For editable, just add.
    if (!shift.startsWith('Campo Editable')) {
      const existing = guardias.find(g => g.date === dateStr && g.shift === shift);
      if (existing) removeGuardia(existing.id);
    }

    if (userId) {
      assignGuardia({ date: dateStr, shift, userId });
      e.target.value = ''; // Reset select
    }
  };

  const handleSpaceClick = (date: Date) => {
    setActionModalDate(format(date, 'yyyy-MM-dd'));
    setIsActionModalOpen(true);
  };

  const handleActivityClick = (e: React.MouseEvent, activityId: string) => {
    e.stopPropagation();
    setSelectedActivityId(activityId);
    setIsUpdateModalOpen(true);
  };

  const handleDailyEventClick = (date: Date) => {
    if (currentUser?.role !== 'gerente') return;
    const dateStr = format(date, 'yyyy-MM-dd');
    const existing = dailyEvents.find(e => e.date === dateStr);
    const text = window.prompt('Ingrese aviso para este día:', existing?.text || '');
    if (text !== null) {
      setDailyEvent(dateStr, text);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Print Header - Only visible when printing */}
      <div className="hidden print:block text-center mb-8 border-b-2 border-[#002C5F] pb-4">
        <h1 className="text-3xl font-bold text-[#002C5F]">HYUNDAI COATZA</h1>
        <h2 className="text-xl font-semibold text-slate-800">Roll de Guardias y Prospección</h2>
        <p className="text-sm text-slate-500 mt-2">
          {viewType === 'week' 
            ? `Semana del ${format(startDate, 'dd/MM/yyyy')}`
            : format(currentDate, 'MMMM yyyy', { locale: es }).toUpperCase()
          }
        </p>
        <p className="text-xs text-slate-400 mt-1">Impreso el: {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
      </div>

      <div className="flex justify-between items-center print:hidden">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#002C5F] mb-1">Tablero de Guardias</h2>
          <p className="text-slate-500">
            {viewType === 'week' 
              ? `Semana del ${format(startDate, 'dd/MM/yyyy')}`
              : format(currentDate, 'MMMM yyyy', { locale: es }).toUpperCase()
            }
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={handlePrint}
            className="px-4 py-2 bg-[#E4EBF1]/60 text-[#002C5F] font-medium rounded-lg hover:bg-[#E4EBF1] transition shadow-sm border border-[#002C5F]/20 flex items-center space-x-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Imprimir PDF</span>
          </button>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setViewType('week')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${viewType === 'week' ? 'bg-white shadow text-[#002C5F]' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Semana
            </button>
            <button 
              onClick={() => setViewType('month')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${viewType === 'month' ? 'bg-white shadow text-[#002C5F]' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Mes
            </button>
          </div>
          <div className="flex space-x-2">
            <button onClick={navigatePrev} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">&larr;</button>
            <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 text-sm font-medium">Hoy</button>
            <button onClick={navigateNext} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">&rarr;</button>
          </div>
        </div>
      </div>

      {viewType === 'week' ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-none">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm text-left print:text-xs">
              <thead className="bg-[#002C5F] border-b border-[#001f44] text-white print:bg-slate-100 print:text-black">
                <tr>
                  <th className="p-4 font-medium w-40 rounded-tl-lg print:p-2 print:w-28">Turno</th>
                  {days.map((date, i) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const event = dailyEvents.find(e => e.date === dateStr);
                    return (
                      <th key={i} className="p-2 font-medium text-center border-l border-[#001f44]/30 print:border-slate-300 relative group align-top">
                        <div className="cursor-pointer" onClick={() => handleSpaceClick(date)}>
                          <div className="uppercase text-xs tracking-wider text-blue-200 print:text-slate-500 mb-1">{WEEKDAYS[i]}</div>
                          <div className={`text-lg print:text-sm transition-colors ${isSameDay(date, new Date()) ? 'text-blue-300 print:text-black font-bold' : 'text-white print:text-black'}`}>
                            {format(date, 'dd')}
                          </div>
                        </div>
                        {event?.text && (
                          <div 
                            onClick={() => handleDailyEventClick(date)}
                            className="mt-2 text-[10px] bg-yellow-100 text-yellow-800 p-1 rounded-sm leading-tight font-normal cursor-pointer hover:bg-yellow-200 print:border print:border-yellow-300"
                          >
                            {event.text}
                          </div>
                        )}
                        {!event?.text && currentUser?.role === 'gerente' && (
                          <div 
                            onClick={() => handleDailyEventClick(date)}
                            className="mt-2 text-[10px] text-blue-300 opacity-0 group-hover:opacity-100 cursor-pointer font-normal hover:underline print:hidden"
                          >
                            + Aviso
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {SHIFTS.map((shift, sIdx) => (
                  <tr key={shift} className="border-b last:border-0 border-slate-100 print:border-slate-300">
                    <td className="p-4 font-medium text-slate-700 bg-slate-50/50 print:bg-transparent print:p-2">{shiftNames[shift] || shift}</td>
                    {days.map((date, dIdx) => {
                      const dateStr = format(date, 'yyyy-MM-dd');
                      const dayGuardias = guardias.filter(g => g.date === dateStr && g.shift === shift);
                      const isEditable = shift.startsWith('Campo Editable');
                      const hasGuardia = dayGuardias.length > 0;

                      return (
                        <td key={dIdx} className="p-2 border-l border-slate-100 print:border-slate-300 relative group align-top hover:bg-slate-50 transition-colors" onClick={(e) => handleCellInteraction(e, date, shift, hasGuardia)}>
                          {currentUser?.role === 'gerente' ? (
                            <div className="space-y-1">
                              {dayGuardias.map(g => (
                                <div key={g.id} className={`flex items-center justify-between text-xs p-1.5 rounded ${getPastelColor(g.userId, g.userId === currentUser?.id)}`}>
                                  <span className="truncate">{users.find(u => u.id === g.userId)?.name?.split(' ')[0] || '...'}</span>
                                  <button onClick={(e) => { e.stopPropagation(); removeGuardia(g.id); }} className="text-black/40 hover:text-black/80 font-bold ml-1 print:hidden">×</button>
                                </div>
                              ))}
                              {(!hasGuardia || isEditable) && (
                                <select 
                                  className="w-full text-xs p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 focus:ring-2 focus:ring-blue-500 print:hidden text-slate-500"
                                  value=""
                                  onChange={(e) => handleAssign(date, shift, e)}
                                >
                                  <option value="">{isEditable ? '+ Agregar Asesor' : 'Sin asignar'}</option>
                                  {users.filter(u => u.role === 'asesor').map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {dayGuardias.length > 0 ? dayGuardias.map(g => (
                                <div key={g.id} className={`h-8 flex items-center justify-center rounded text-xs border ${getPastelColor(g.userId, g.userId === currentUser?.id)}`}>
                                  {users.find(u => u.id === g.userId)?.name?.split(' ')[0] || '...'}
                                </div>
                              )) : (
                                <div className="h-8 flex items-center justify-center text-xs text-slate-300">-</div>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                
                {/* Activities Row */}
                <tr className="border-t-[3px] border-[#002C5F]/10 bg-slate-50 print:hidden">
                  <td className="p-4 font-medium text-[#002C5F]">Actividades</td>
                  {days.map((date, dIdx) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const dayActivities = visibleActivities.filter(a => a.date === dateStr);
                    
                    return (
                      <td key={dIdx} className="p-2 border-l border-slate-200 align-top cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSpaceClick(date)}>
                        <div className="space-y-1 min-h-16">
                          {dayActivities.map(act => {
                            const lead = leads.find(l => l.id === act.leadId);
                            return (
                              <div key={act.id} onClick={(e) => handleActivityClick(e, act.id)} className="text-[10px] p-1.5 bg-white border border-slate-200 rounded shadow-sm leading-tight cursor-pointer hover:border-blue-400 hover:shadow-md transition-all">
                                <strong className={`block ${act.status === 'Completado' ? 'line-through text-slate-400' : 'text-[#002C5F]'}`}>{act.type}</strong>
                                <span className="text-slate-600 truncate block">{lead?.clientName}</span>
                              </div>
                            );
                          })}
                          {dayActivities.length === 0 && <span className="text-[10px] text-slate-400 p-1 block opacity-0 hover:opacity-100 text-center">+</span>}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-slate-300">
          <div className="grid grid-cols-7 border-b border-[#001f44] bg-[#002C5F] text-white print:bg-slate-100 print:text-black print:border-slate-300">
            {WEEKDAYS.map((day, i) => (
              <div key={i} className="p-3 text-center uppercase tracking-wider text-xs font-medium text-blue-200 print:text-slate-600">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 grid-rows-5 bg-slate-200 print:bg-slate-300 gap-[1px]">
            {monthDays.map((date, i) => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const dayActivities = visibleActivities.filter(a => a.date === dateStr);
              const dayGuardias = guardias.filter(g => g.date === dateStr).sort((a, b) => SHIFTS.indexOf(a.shift) - SHIFTS.indexOf(b.shift));
              const isCurrentMonth = isSameMonth(date, currentDate);
              const event = dailyEvents.find(e => e.date === dateStr);
              
              return (
                <div 
                  key={i} 
                  className={`min-h-[120px] bg-white p-2 cursor-pointer hover:bg-slate-50 transition-colors relative group ${!isCurrentMonth ? 'opacity-50 print:opacity-30' : ''}`}
                  onClick={() => handleSpaceClick(date)}
                >
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#002C5F]/20 rounded transition-colors pointer-events-none print:hidden"></div>
                  
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex-1">
                       {event?.text && (
                        <div 
                          onClick={(e) => { e.stopPropagation(); handleDailyEventClick(date); }}
                          className="text-[9px] bg-yellow-100 text-yellow-800 p-0.5 px-1 rounded-sm leading-tight font-medium print:border print:border-yellow-300 truncate"
                          title={event.text}
                        >
                          {event.text}
                        </div>
                      )}
                      {!event?.text && currentUser?.role === 'gerente' && (
                        <div 
                          onClick={(e) => { e.stopPropagation(); handleDailyEventClick(date); }}
                          className="text-[9px] text-blue-300 opacity-0 group-hover:opacity-100 print:hidden font-medium hover:underline"
                        >
                          + Aviso
                        </div>
                      )}
                    </div>
                    <div className={`text-right text-xs font-medium ml-1 flex-shrink-0 ${isSameDay(date, new Date()) ? 'text-blue-600 font-bold' : 'text-slate-400 print:text-slate-600'}`}>
                      {format(date, 'dd')}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    {/* Guardias summary */}
                    {dayGuardias.length > 0 && (
                      <div className="space-y-[2px] mb-1">
                        {dayGuardias.map((guardia, gIdx) => {
                          let bgColor = 'bg-slate-100 text-slate-600 border-slate-200';
                          if (currentUser?.role === 'gerente') {
                            const dateStrMatch = format(date, 'yyyy-MM-dd');
                            const hasLeads = leads.some(l => l.userId === guardia.userId && l.date?.split('T')[0] === dateStrMatch);
                            if (hasLeads) {
                              bgColor = 'bg-green-100 text-green-800 border-green-200';
                            } else {
                              bgColor = 'bg-red-100 text-red-800 border-red-200';
                            }
                          }
                          const u = users.find(user => user.id === guardia.userId);
                          const shiftName = shiftNames[guardia.shift] || guardia.shift;
                          // Use abbreviations for shift to fit better
                          const shiftAbbrev = shiftName.includes('Guardia') ? shiftName.replace('Guardia', 'G.') : shiftName.substring(0, 4) + '.';
                          return (
                            <div 
                              key={gIdx} 
                              onClick={(e) => { e.stopPropagation(); setLeadModalDate(format(date, 'yyyy-MM-dd')); setIsLeadModalOpen(true); }}
                              className={`text-[9px] px-1 py-[2px] rounded border ${bgColor} flex justify-between leading-tight shadow-sm cursor-pointer hover:ring-1 ring-[#002C5F]/20 print:shadow-none`}
                            >
                              <span className="truncate mr-1 font-medium">{u?.name?.split(' ')[0] || '...'}</span>
                              <span className="flex-shrink-0 opacity-70">{shiftAbbrev}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {/* Activities */}
                    <div className="print:hidden">
                      {dayActivities.map(act => {
                        const lead = leads.find(l => l.id === act.leadId);
                        return (
                          <div key={act.id} onClick={(e) => handleActivityClick(e, act.id)} className="text-[10px] p-1 mt-[2px] border border-blue-100 rounded leading-tight bg-blue-50/50 hover:bg-blue-100 cursor-pointer hover:border-blue-400 transition-colors">
                            <span className={`block truncate ${act.status === 'Completado' ? 'line-through text-slate-400' : 'text-[#002C5F]'}`}>
                              {act.type}: {lead?.clientName?.split(' ')[0] || '...'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-[#E4EBF1]/40 text-[#002C5F] p-4 rounded-xl text-sm border border-[#002C5F]/10 flex justify-between items-center print:hidden">
        <div>
          <span className="font-semibold block mb-1">Guía rápida:</span>
          {currentUser?.role === 'asesor' ? (
            <p><strong>Click</strong> sobre una guardia para registrar un Prospecto. <strong>Click</strong> en un día para programar actividad.</p>
          ) : (
            <p>Asigna a los asesores utilizando los menús. Click en un día para ver/programar actividades.</p>
          )}
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => { setLeadModalDate(format(new Date(), 'yyyy-MM-dd')); setIsLeadModalOpen(true); }}
            className="px-4 py-2 bg-white text-[#002C5F] border border-[#002C5F] rounded-lg font-medium hover:bg-slate-50 transition shadow-sm"
          >
            + Nuevo Cliente
          </button>
          <button 
            onClick={() => handleSpaceClick(new Date())}
            className="px-4 py-2 bg-[#002C5F] rounded-lg text-white font-medium hover:bg-[#001f44] transition shadow-sm"
          >
            + Nueva Actividad
          </button>
        </div>
      </div>

      {isLeadModalOpen && <LeadModal date={leadModalDate} onClose={() => setIsLeadModalOpen(false)} />}
      {isActionModalOpen && <ActionModal defaultDate={actionModalDate} onClose={() => setIsActionModalOpen(false)} />}
      {isUpdateModalOpen && <UpdateActivityModal activityId={selectedActivityId} onClose={() => setIsUpdateModalOpen(false)} />}
    </div>
  );
};

