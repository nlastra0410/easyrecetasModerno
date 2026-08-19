import React from 'react';
import { ViewTab, Medico, Farmacia } from '../types';
import { User, LogOut } from 'lucide-react';
import { EasyLogo } from './EasyLogo';

interface NavbarProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  isAuthenticated: boolean;
  activeRole: 'medico' | 'farmacia' | 'paciente' | null;
  activeMedico?: Medico;
  activeFarmacia?: Farmacia;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onSelectTab,
  isAuthenticated,
  activeRole,
  activeMedico,
  activeFarmacia,
  onLogout
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
      <div className="flex justify-between items-center h-16 px-6">
        
        {/* Logo Section */}
        <div 
          className="cursor-pointer shrink-0" 
          onClick={() => onSelectTab(isAuthenticated ? 'dashboard' : 'verificador-publico')}
        >
          <EasyLogo size="md" titleSecondPart="RECETAS" withSlogan={true} />
        </div>

        {/* Actions: Account */}
        <div className="flex items-center">
          {!isAuthenticated ? (
            <button 
              onClick={() => onSelectTab('login')}
              className="bg-[#0284c7] hover:bg-[#0369a1] text-white px-5 py-2.5 rounded-xl transition-all font-bold text-sm tracking-wide shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <User className="w-4 h-4" />
              Acceso Profesionales
            </button>
          ) : (
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-full px-4 py-1.5 shadow-2xs">
              <div className="flex items-center gap-2 mr-4 border-r border-slate-200 pr-4">
                <div className="w-7 h-7 bg-sky-100 rounded-full flex items-center justify-center text-[#0284c7]">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800 leading-none">
                    {activeRole === 'medico' && activeMedico
                      ? (activeMedico.nombres?.startsWith('Dr.') || activeMedico.nombres?.startsWith('Dra.')
                          ? `${activeMedico.nombres} ${activeMedico.apellidos || ''}`.trim()
                          : `Dr. ${activeMedico.nombres} ${activeMedico.apellidos || ''}`.trim())
                      : ''}
                    {activeRole === 'farmacia' && activeFarmacia ? activeFarmacia.nombre : ''}
                  </span>
                  <span className="text-[10px] text-sky-600 font-semibold uppercase tracking-wider mt-0.5">
                    {activeRole === 'medico' ? 'Médico Tratante' : 'Farmacia'}
                  </span>
                </div>
              </div>
              <button 
                onClick={onLogout}
                className="text-slate-400 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
