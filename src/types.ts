export type Role = 'gerente' | 'asesor';

export interface User {
  id: string; // The email of the user
  name: string;
  email: string;
  role: Role;
}

export type ShiftType = 'Guardia 1' | 'Guardia 2' | 'Guardia 3' | 'Guardia Servicio' | 'Campo Editable 1' | 'Campo Editable 2' | 'Campo Editable 3';

export interface Guardia {
  id: string;
  date: string; // YYYY-MM-DD
  shift: ShiftType;
  userId: string;
}

export type LeadStatus = 'Nuevo' | 'Negociacion' | 'Credito' | 'Venta' | 'Finalizado';

export interface Lead {
  id: string;
  date: string; // YYYY-MM-DD
  userId: string;
  clientName: string;
  phone: string;
  email: string;
  carType: string;
  status: LeadStatus;
}

export type ActivityType = 'Llamada' | 'Cita' | 'Visita' | 'Demo' | 'FollowUp';

export interface Activity {
  id: string;
  leadId: string;
  date: string; // YYYY-MM-DD
  type: ActivityType | string;
  comment: string;
  status: 'Pendiente' | 'Completado';
}

