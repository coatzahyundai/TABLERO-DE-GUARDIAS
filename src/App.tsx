/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from './store';
import { Login } from './components/Login';
import { CalendarView } from './components/CalendarView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';

export default function App() {
  const { currentUser, logout } = useStore();
  const [currentView, setCurrentView] = useState<'calendar' | 'reports' | 'settings'>('calendar');

  if (!currentUser) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="bg-[#002C5F] border-b border-[#001f44] sticky top-0 z-10 text-white">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                H
              </div>
              <span className="font-semibold text-lg hidden sm:block tracking-wide">Hyundai Coatza</span>
            </div>
            
            <nav className="flex space-x-1">
              <button 
                onClick={() => setCurrentView('calendar')}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${currentView === 'calendar' ? 'bg-white/10 text-white' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
              >
                Tablero
              </button>
              <button 
                onClick={() => setCurrentView('reports')}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${currentView === 'reports' ? 'bg-white/10 text-white' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
              >
                {currentUser.role === 'gerente' ? 'Reportes' : 'Clientes'}
              </button>
              {currentUser.role === 'gerente' && (
                <button 
                  onClick={() => setCurrentView('settings')}
                  className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${currentView === 'settings' ? 'bg-white/10 text-white' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
                >
                  Configuración
                </button>
              )}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-white">{currentUser.name}</div>
              <div className="text-xs text-blue-200 uppercase tracking-wider">{currentUser.role}</div>
            </div>
            <button 
              onClick={logout}
              className="text-sm px-3 py-1.5 border border-white/20 rounded-lg hover:bg-white/10 text-white transition-colors"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentView === 'calendar' && <CalendarView />}
        {currentView === 'reports' && <ReportsView />}
        {currentView === 'settings' && <SettingsView />}
      </main>
    </div>
  );
}
