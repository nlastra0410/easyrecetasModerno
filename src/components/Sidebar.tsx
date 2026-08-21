import React from 'react';
import { ViewTab } from '../types';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  Users,
  Pill,
  Building2,
  Stethoscope,
  ShieldCheck,
  Activity,
  QrCode
} from 'lucide-react';

interface SidebarProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  activeRole: 'medico' | 'farmacia' | 'paciente';
  pendingVisitasCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  activeRole,
  pendingVisitasCount
}) => {
  // Navigation strictly structured by Role (HU1 / Diagrama de Flujo)
  const navItems = [
    // -------------------------------------------------------------
    // ROL MÉDICO / CIRUJANO DENTISTA (Menú Clínico Completo)
    // -------------------------------------------------------------
    {
      id: 'dashboard' as ViewTab,
      label: 'Panel Principal',
      icon: LayoutDashboard,
      roles: ['medico']
    },
    {
      id: 'nueva-receta' as ViewTab,
      label: 'Crear Receta Médica',
      icon: PlusCircle,
      badge: 'Médico',
      roles: ['medico']
    },
    {
      id: 'pacientes' as ViewTab,
      label: 'Ficha Clínica e Historial',
      icon: Users,
      roles: ['medico']
    },
    {
      id: 'examenes' as ViewTab,
      label: 'Solicitud de Exámenes',
      icon: Activity,
      roles: ['medico']
    },
    {
      id: 'visitas' as ViewTab,
      label: 'Historial de Recetas',
      icon: FileText,
      roles: ['medico']
    },
    {
      id: 'medicamentos' as ViewTab,
      label: 'Catálogo de Fármacos',
      icon: Pill,
      roles: ['medico']
    },
    {
      id: 'medicos' as ViewTab,
      label: 'Cuerpo Médico',
      icon: Stethoscope,
      roles: ['medico']
    },

    // -------------------------------------------------------------
    // ROL QUÍMICO FARMACÉUTICO (Menú QF - Dispensación y Quema)
    // -------------------------------------------------------------
    {
      id: 'farmacia-despacho' as ViewTab,
      label: 'Dispensación y Quema',
      icon: Building2,
      badge: 'QF',
      roles: ['farmacia']
    },
    {
      id: 'visitas' as ViewTab,
      label: 'Bandeja de Recetas',
      icon: FileText,
      count: pendingVisitasCount > 0 ? pendingVisitasCount : undefined,
      roles: ['farmacia']
    },
    {
      id: 'medicamentos' as ViewTab,
      label: 'Vademécum Farmacéutico',
      icon: Pill,
      roles: ['farmacia']
    },

    // -------------------------------------------------------------
    // PORTAL DE VALIDACIÓN PÚBLICA (Ambos Roles)
    // -------------------------------------------------------------
    {
      id: 'verificador-publico' as ViewTab,
      label: 'Validación Pública QR',
      icon: ShieldCheck,
      roles: ['medico', 'farmacia']
    }
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(activeRole));

  const isFarmacia = activeRole === 'farmacia';

  return (
    <aside className={`no-print w-64 shrink-0 bg-white border-r ${isFarmacia ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200'} min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between`}>
      <div className="space-y-2">
        {/* Role Header Banner */}
        <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
          isFarmacia 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-sky-50 border-sky-200 text-sky-900'
        }`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            isFarmacia ? 'bg-emerald-600 text-white shadow-xs' : 'bg-[#0284c7] text-white shadow-xs'
          }`}>
            {isFarmacia ? <Building2 className="w-4 h-4" /> : <Stethoscope className="w-4 h-4" />}
          </div>
          <div>
            <div className={`text-[10px] font-extrabold uppercase tracking-wider ${
              isFarmacia ? 'text-emerald-700' : 'text-sky-700'
            }`}>
              {isFarmacia ? 'Portal Farmacia' : 'Portal Clínico'}
            </div>
            <div className="text-xs font-bold text-slate-800 leading-tight">
              {isFarmacia ? 'Químico Farmacéutico' : 'Médico / Odontólogo'}
            </div>
          </div>
        </div>

        <div className="pt-2 space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={`${item.id}-${item.roles.join('-')}`}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? isFarmacia
                      ? 'bg-emerald-600 text-white font-bold shadow-sm'
                      : 'bg-[#0284c7] text-white font-bold shadow-sm'
                    : isFarmacia
                      ? 'text-slate-700 hover:text-emerald-800 hover:bg-emerald-100/60'
                      : 'text-slate-700 hover:text-sky-800 hover:bg-sky-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : isFarmacia ? 'text-emerald-600' : 'text-sky-600'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : isFarmacia
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-sky-100 text-sky-800 border border-sky-200'
                  }`}>
                    {item.badge}
                  </span>
                )}

                {item.count !== undefined && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white text-emerald-700'
                      : 'bg-rose-100 text-rose-700 border border-rose-200'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Info Box */}
      <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
        isFarmacia 
          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' 
          : 'bg-slate-50 border-slate-200 text-slate-800'
      }`}>
        <div className="flex items-center gap-1.5 font-bold">
          <ShieldCheck className={`w-4 h-4 ${isFarmacia ? 'text-emerald-600' : 'text-[#0284c7]'}`} />
          {isFarmacia ? 'Farmacia Habilitada MINSAL' : 'Registro Nacional de Prestadores'}
        </div>
        <p className="text-slate-500 text-[11px] leading-relaxed">
          {isFarmacia
            ? 'Validación en línea y quema digital de recetas según Decreto Supremo Nº 466.'
            : 'Firma electrónica y prescripción médica regulada según Código Sanitario DFL 725.'}
        </p>
      </div>
    </aside>
  );
};
