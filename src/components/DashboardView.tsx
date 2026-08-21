import React from 'react';
import { Visita, Paciente, Medicamento, ViewTab } from '../types';
import { formatDate, getStatusBadge } from '../utils/helpers';
import { formatRut } from '../utils/rut';
import {
  FileText,
  Users,
  Pill,
  Building2,
  PlusCircle,
  Clock,
  Eye,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface DashboardViewProps {
  visitas: Visita[];
  pacientes: Paciente[];
  medicamentos: Medicamento[];
  activeRole?: 'medico' | 'farmacia' | 'paciente' | null;
  onSelectTab: (tab: ViewTab) => void;
  onViewReceta: (visita: Visita) => void;
  onOpenQuemar: (visita: Visita) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  visitas,
  pacientes,
  medicamentos,
  activeRole = 'medico',
  onSelectTab,
  onViewReceta,
  onOpenQuemar
}) => {
  const isFarmacia = activeRole === 'farmacia';
  const totalVisitas = visitas.length;
  const emitidasPendientes = visitas.filter((v) => v.estado_id === 1).length;
  const parciales = visitas.filter((v) => v.estado_id === 2).length;
  const dispensadas = visitas.filter((v) => v.estado_id === 3).length;

  const totalPacientes = pacientes.length;
  const totalMedicamentos = medicamentos.length;

  const recentVisitas = [...visitas].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Banner (Clinical) */}
      <div className="bg-gradient-to-r from-sky-700 via-sky-800 to-blue-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-sky-200 text-xs font-semibold border border-white/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-300" />
            Sistema Clínico de Prescripción Médica y Odontológica
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Panel Médico - Prescripción Electrónica
          </h1>
          <p className="text-sky-100/90 text-sm leading-relaxed">
            Emisión de recetas médicas electrónicas con firma digital avanzada, órdenes de exámenes clínicos y gestión de fichas de pacientes con validación MINSAL.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onSelectTab('nueva-receta')}
            className="px-5 py-3 bg-white hover:bg-sky-50 text-[#0284c7] font-bold rounded-xl text-sm flex items-center gap-2 transition-all shadow-md cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-[#0284c7]" />
            Emitir Nueva Receta
          </button>
          <button
            onClick={() => onSelectTab('pacientes')}
            className="px-5 py-3 bg-sky-900/60 hover:bg-sky-900 text-white font-bold rounded-xl text-sm flex items-center gap-2 transition-all cursor-pointer border border-sky-400/30 shadow-md"
          >
            <Users className="w-4 h-4" />
            Fichas de Pacientes
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Recetas Emitidas */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Recetas Emitidas</p>
            <p className="text-2xl font-bold text-slate-900">{totalVisitas}</p>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" /> Total histórico
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-[#0284c7] flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Pendientes de Retiro */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pendientes en Farmacia</p>
            <p className="text-2xl font-bold text-amber-600">{emitidasPendientes + parciales}</p>
            <p className="text-xs text-slate-500">
              {emitidasPendientes} emitidas, {parciales} parciales
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Recetas Dispensadas / Quemadas */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Recetas Quemadas</p>
            <p className="text-2xl font-bold text-emerald-600">{dispensadas}</p>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Dispensadas 100%
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Pacientes Registrados */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pacientes Activos</p>
            <p className="text-2xl font-bold text-slate-900">{totalPacientes}</p>
            <p className="text-xs text-slate-500">{totalMedicamentos} medicamentos en vademécum</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Prescriptions & Quick Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Prescriptions */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base text-slate-900">Últimas Recetas Emitidas</h2>
              <p className="text-xs text-slate-500">Prescripciones médicas registradas recientemente</p>
            </div>
            <button
              onClick={() => onSelectTab('visitas')}
              className="text-xs font-semibold text-[#0284c7] hover:text-[#0369a1] flex items-center gap-1 cursor-pointer"
            >
              Ver todas ({totalVisitas})
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentVisitas.map((visita) => {
              const status = getStatusBadge(visita.estado_id);
              return (
                <div key={visita.id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">
                        {visita.paciente?.nombres} {visita.paciente?.paterno}
                      </span>
                      <span className="text-xs text-slate-400">
                        ({formatRut(`${visita.paciente?.rut}${visita.paciente?.dv}`)})
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className="font-mono text-sky-800 font-semibold">{visita.codigo_verificacion}</span>
                      <span>•</span>
                      <span>{formatDate(visita.fecha)}</span>
                      <span>•</span>
                      <span>{visita.recetas?.length || 0} medicamentos</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${status.bg} ${status.text} ${status.border}`}>
                      {status.label}
                    </span>
                    <button
                      onClick={() => onViewReceta(visita)}
                      className="p-1.5 text-slate-500 hover:text-[#0284c7] hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                      title="Ver Comprobante"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Quick Access & Status Overview */}
        <div className="space-y-6">
          {/* Quick Access Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
              Acciones Rápidas
            </h3>

            <div className="space-y-2">
              {isFarmacia ? (
                <>
                  <button
                    onClick={() => onSelectTab('farmacia-despacho')}
                    className="w-full text-left p-3 rounded-xl border border-sky-200 bg-sky-50/40 hover:border-sky-400 hover:bg-sky-50 transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#0284c7] text-white flex items-center justify-center shadow-xs">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Dispensar y Quemar</p>
                        <p className="text-xs text-slate-500">Validar y dispensar receta por RUT/QR</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => onSelectTab('visitas')}
                    className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Historial de Recetas</p>
                        <p className="text-xs text-slate-500">Auditar estados y prescripciones</p>
                      </div>
                    </div>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onSelectTab('nueva-receta')}
                    className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-100 text-[#0284c7] flex items-center justify-center group-hover:bg-[#0284c7] group-hover:text-white transition-colors">
                        <PlusCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Nueva Prescripción</p>
                        <p className="text-xs text-slate-500">Crear receta con código digital</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => onSelectTab('pacientes')}
                    className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Buscar Pacientes</p>
                        <p className="text-xs text-slate-500">Ver historiales clínicos y RUTs</p>
                      </div>
                    </div>
                  </button>
                </>
              )}

              <button
                onClick={() => onSelectTab('medicamentos')}
                className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors">
                    <Pill className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Vademécum Farmacéutico</p>
                    <p className="text-xs text-slate-500">Explorar catálogo de fármacos</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => onSelectTab('verificador-publico')}
                className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center group-hover:bg-[#0284c7] group-hover:text-white transition-colors">
                    <Search className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Verificador Público</p>
                    <p className="text-xs text-slate-500">Validar receta por código o QR</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
