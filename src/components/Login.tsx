import React from 'react';
import { useStore } from '../store';
import { CarFront } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, logout, isLoadingAuth, currentUser, firebaseUser } = useStore();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8 bg-[#002C5F] text-white text-center">
          <div className="mx-auto w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4">
            <CarFront size={32} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Hyundai Coatza</h1>
          <p className="text-blue-200 mt-2 text-sm">Registro de Guardias y Prospectos</p>
        </div>
        
        <div className="p-8 text-center space-y-6">
          {isLoadingAuth ? (
             <div className="text-slate-500 font-medium">Verificando sesión...</div>
          ) : (
            <>
              {!firebaseUser ? (
                <div>
                  <p className="text-slate-600 mb-6 text-sm">
                    Inicia sesión con tu cuenta de Google. Tu gerente debe darte de alta usando tu correo electrónico.
                  </p>
                  <button
                    onClick={login}
                    className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition duration-200 shadow-md"
                  >
                    Iniciar Sesión con Google
                  </button>
                </div>
              ) : currentUser === null ? (
                <div>
                   <p className="text-red-500 mb-4 font-medium">Permiso denegado</p>
                   <p className="text-slate-600 mb-6 text-sm">
                     Tu cuenta <strong>{firebaseUser.email}</strong> no está registrada en el sistema. Solicita a tu gerente que te agregue.
                   </p>
                   <button
                    onClick={logout}
                    className="w-full bg-slate-200 text-slate-800 font-medium py-3 rounded-lg hover:bg-slate-300 transition duration-200 shadow-sm"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
