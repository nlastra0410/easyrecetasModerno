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

  return (
    <aside className="no-print w-64 shrink-0 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
          {activeRole === 'farmacia' ? 'Menú Químico Farmacéutico (QF)' : 'Menú Clínico (Médico / Dentista)'}
        </div>

        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={`${item.id}-${item.roles.join('-')}`}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-sky-50 text-[#0284c7] font-bold border border-sky-200 shadow-xs'
                  : 'text-slate-600 hover:text-[#0284c7] hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#0284c7]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-[#0284c7] border border-sky-200">
                  {item.badge}
                </span>
              )}

              {item.count !== undefined && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info Box */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
        <div className="flex items-center gap-1.5 text-sky-900 font-semibold">
          <ShieldCheck className="w-4 h-4 text-[#0284c7]" />
          {activeRole === 'farmacia' ? 'Farmacia Habilitada MINSAL' : 'Registro Nacional de Prestadores'}
        </div>
        <p className="text-slate-500 text-[11px] leading-relaxed">
          {activeRole === 'farmacia'
            ? 'Validación en línea y quema digital de recetas según Decreto Supremo Nº 466.'
            : 'Firma electrónica y prescripción médica regulada según Código Sanitario DFL 725.'}
        </p>
      </div>
    </aside>
  );
};
