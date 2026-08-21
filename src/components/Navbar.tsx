import React from 'react';
import { ViewTab, Medico, Farmacia, Farmaceuta } from '../types';
import { User, LogOut, Stethoscope, Building2 } from 'lucide-react';
import { EasyLogo } from './EasyLogo';

interface NavbarProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  isAuthenticated: boolean;
  activeRole: 'medico' | 'farmacia' | 'paciente' | null;
  activeMedico?: Medico;
  activeFarmacia?: Farmacia;
  activeFarmaceuta?: Farmaceuta;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onSelectTab,
  isAuthenticated,
  activeRole,
  activeMedico,
  activeFarmacia,
  activeFarmaceuta,
  onLogout
}) => {
  const isFarmacia = activeRole === 'farmacia';

  const getDoctorRoleLabel = () => {
    if (!activeMedico) return 'Médico Prescriptor';
    const spec = (activeMedico.especialidad || activeMedico.profesion_nombre || '').toLowerCase();
    if (spec.includes('dentista') || spec.includes('odonto')) {
      return 'Cirujano Dentista';
    }
    return activeMedico.especialidad || 'Médico Cirujano';
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
      <div className="flex justify-between items-center h-16 px-6">
        
        {/* Logo Section */}
        <div 
          className="cursor-pointer shrink-0" 
          onClick={() => onSelectTab(isAuthenticated ? (activeRole === 'farmacia' ? 'farmacia-despacho' : 'dashboard') : 'verificador-publico')}
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
            <div className={`flex items-center rounded-full px-4 py-1.5 shadow-2xs border ${
              isFarmacia ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2.5 mr-4 border-r border-slate-200 pr-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                  isFarmacia ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-[#0284c7]'
                }`}>
                  {isFarmacia ? <Building2 className="w-4 h-4" /> : <Stethoscope className="w-4 h-4" />}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800 leading-none">
                    {activeRole === 'medico' && activeMedico
                      ? (() => {
                          const docName = (activeMedico.nombres || (activeMedico as any).nombre || '').trim();
                          const docLastName = (activeMedico.apellidos || (activeMedico as any).apellido || (activeMedico as any).paterno || '').trim();
                          const full = `${docName} ${docLastName}`.trim() || 'Médico Tratante';
                          if (full.startsWith('Dr.') || full.startsWith('Dra.')) {
                            return full;
                          }
                          return `Dr. ${full}`;
                        })()
                      : ''}
                    {activeRole === 'farmacia'
                      ? (() => {
                          if (activeFarmaceuta) {
                            const fName = (activeFarmaceuta.nombres || (activeFarmaceuta as any).nombre || '').trim();
                            const fLast = (activeFarmaceuta.paterno || (activeFarmaceuta as any).apellido || activeFarmaceuta.materno || '').trim();
                            const full = `${fName} ${fLast}`.trim();
                            if (full) return `QF. ${full}`;
                          }
                          return activeFarmacia?.nombre || 'Químico Farmacéutico Responsable';
                        })()
                      : ''}
                  </span>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider mt-0.5 ${
                    isFarmacia ? 'text-emerald-700 font-bold' : 'text-sky-700 font-semibold'
                  }`}>
                    {activeRole === 'medico' ? getDoctorRoleLabel() : 'Químico Farmacéutico (QF)'}
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
