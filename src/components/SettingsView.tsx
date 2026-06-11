import React, { useState } from 'react';
import { useStore } from '../store';
import { User } from '../types';

export const SettingsView: React.FC = () => {
  const { users, currentUser, addUser, updateUser, removeUser, shiftNames, updateShiftName } = useStore();
  
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [newUser, setNewUser] = useState<Omit<User, 'id'>>({
    name: '',
    email: '',
    role: 'asesor'
  });

  if (currentUser?.role !== 'gerente') {
    return (
      <div className="p-8 text-center text-slate-500">
        No tienes permisos para ver esta sección.
      </div>
    );
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setNewUser({ name: user.name || '', email: user.email || '', role: user.role || 'asesor' });
    setIsAddingUser(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await updateUser(editingUser.id, newUser);
      } else {
        await addUser(newUser);
      }
      setIsAddingUser(false);
      setEditingUser(null);
      setNewUser({ name: '', email: '', role: 'asesor' });
    } catch (err: any) {
      console.error(err);
      alert("Error al guardar usuario: " + err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Shift Names Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#002C5F] text-white">
          <h2 className="text-xl font-bold">Nombres de Turnos Editables</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {['Campo Editable 1', 'Campo Editable 2', 'Campo Editable 3'].map((key) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{key}</label>
              <input
                type="text"
                value={shiftNames[key] || key}
                onChange={e => updateShiftName(key, e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#002C5F] outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Users Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <h2 className="text-xl font-bold text-[#002C5F]">Gestión de Personal</h2>
          <button 
            onClick={() => {
              setEditingUser(null);
              setNewUser({ name: '', email: '', role: 'asesor' });
              setIsAddingUser(true);
            }}
            className="px-4 py-2 bg-[#002C5F] text-white rounded-lg hover:bg-[#001f44] transition-colors text-sm font-medium"
          >
            + Agregar Personal
          </button>
        </div>

        {isAddingUser && (
          <form onSubmit={handleSaveUser} className="p-6 bg-slate-50 border-b border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
              <input required type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#002C5F] outline-none" placeholder="Ej. Juan Pérez" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Correo de Gmail</label>
              <input required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#002C5F] outline-none" placeholder="juan@gmail.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
              <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as any})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#002C5F] outline-none bg-white">
                <option value="asesor">Asesor</option>
                <option value="gerente">Gerente</option>
              </select>
            </div>
            <div className="flex space-x-2">
              <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">Guardar</button>
              <button type="button" onClick={() => setIsAddingUser(false)} className="px-4 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors font-medium">Cancelar</button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-xs uppercase bg-slate-100 text-slate-500 font-semibold">
              <tr>
                <th className="px-6 py-4">Nombre</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4">Correo</th>
                <th className="px-6 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-[#002C5F]">{u.name}</td>
                  <td className="px-6 py-4 capitalize">{u.role}</td>
                  <td className="px-6 py-4">{u.email}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleEditUser(u)} className="text-blue-600 hover:text-blue-800 font-medium mr-4">Editar</button>
                    {u.id !== currentUser.id && (
                      <button onClick={() => removeUser(u.id)} className="text-red-500 hover:text-red-700 font-medium">Eliminar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
