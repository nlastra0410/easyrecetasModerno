import React, { useState } from 'react';
import { Visita } from '../types';
import { formatDate, getStatusBadge } from '../utils/helpers';
import { formatRut } from '../utils/rut';
import {
  FileText,
  Search,
  Eye,
  Building2,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';

interface VisitasViewProps {
  visitas: Visita[];
  activeRole?: 'medico' | 'farmacia' | 'paciente' | null;
  onViewReceta: (visita: Visita) => void;
  onOpenQuemar: (visita: Visita) => void;
}

export const VisitasView: React.FC<VisitasViewProps> = ({
  visitas,
  activeRole = 'medico',
  onViewReceta,
  onOpenQuemar
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<number | 'all'>('all');

  const filteredVisitas = visitas.filter((v) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      v.codigo_verificacion.toLowerCase().includes(term) ||
      (v.paciente && `${v.paciente.nombres} ${v.paciente.paterno} ${v.paciente.rut}`.toLowerCase().includes(term)) ||
      (v.medico && `${v.medico.nombres} ${v.medico.apellidos}`.toLowerCase().includes(term)) ||
      (v.diagnostico && v.diagnostico.descripcion.toLowerCase().includes(term));

    const matchesStatus = statusFilter === 'all' || v.estado_id === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#0284c7]" />
            {activeRole === 'farmacia' ? 'Bandeja General de Recetas Médicas' : 'Historial de Consultas y Recetas Médicas'}
          </h1>
          <p className="text-xs text-slate-500">
            {activeRole === 'farmacia' 
              ? 'Consulta de recetas emitidas para validación en mesón, quema parcial o despacho total de medicamentos.' 
              : 'Registro de prescripciones electrónicas, medicamentos indicados y trazabilidad de retiro en farmacia.'}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 bg-slate-100 rounded-full font-medium text-slate-600">
            Total: <strong>{visitas.length}</strong> recetas
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por RUT, Nombre de Paciente, Código de Receta o Diagnóstico..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none w-full md:w-48"
          >
            <option value="all">Todos los Estados</option>
            <option value={1}>1. Emitida / Pendiente</option>
            <option value={2}>2. Dispensación Parcial</option>
            <option value={3}>3. Dispensada / Quemada</option>
          </select>
        </div>
      </div>

      {/* Visitas List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredVisitas.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <FileText className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-medium">No se encontraron recetas con los filtros seleccionados.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredVisitas.map((visita) => {
              const status = getStatusBadge(visita.estado_id);
              return (
                <div key={visita.id} className="p-5 hover:bg-slate-50/70 transition-colors space-y-3">
                  {/* Top Line */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200 px-2.5 py-1 rounded-lg">
                        {visita.codigo_verificacion}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatDate(visita.fecha)}
                      </span>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${status.bg} ${status.text} ${status.border}`}>
                        {status.label}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onViewReceta(visita)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-sky-50 hover:text-sky-800 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver Comprobante
                      </button>

                      {visita.estado_id !== 3 && (
                        <button
                          onClick={() => onOpenQuemar(visita)}
                          className="px-3 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                          title="Dispensar en Farmacia"
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          Dispensar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Patient & Doctor details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs bg-slate-50/70 p-3 rounded-xl border border-slate-200/80">
                    <div>
                      <span className="text-slate-400 font-medium block uppercase text-[10px]">Paciente</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {visita.paciente?.nombres} {visita.paciente?.paterno} {visita.paciente?.materno}
                      </span>
                      <p className="text-slate-500 mt-0.5">
                        RUT: <strong>{formatRut(`${visita.paciente?.rut}${visita.paciente?.dv}`)}</strong>
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium block uppercase text-[10px]">Médico Prescriptor</span>
                      <span className="font-semibold text-slate-800">
                        {visita.medico?.nombres} {visita.medico?.apellidos}
                      </span>
                      <p className="text-slate-500 mt-0.5">
                        {visita.medico?.especialidad} • Reg. {visita.medico?.registro_minsal}
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium block uppercase text-[10px]">Diagnóstico</span>
                      {visita.diagnostico ? (
                        <span className="font-medium text-slate-800">
                          <strong className="text-[#0284c7]">[{visita.diagnostico.codigo}]</strong> {visita.diagnostico.descripcion}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Control General / Sin diagnóstico codificado</span>
                      )}
                    </div>
                  </div>

                  {/* Prescribed Medications Summary */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                      Medicamentos Prescritos ({visita.recetas?.length || 0}):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {visita.recetas?.map((item) => {
                        const itemBadge = getStatusBadge(item.estado);
                        return (
                          <div
                            key={item.id}
                            className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs flex items-start justify-between gap-2 shadow-2xs"
                          >
                            <div className="space-y-0.5">
                              <p className="font-bold text-slate-900">{item.medicamento?.descripcion}</p>
                              <p className="text-slate-600 text-[11px]">{item.tratamiento}</p>
                            </div>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border shrink-0 ${itemBadge.bg} ${itemBadge.text} ${itemBadge.border}`}>
                              {item.estado === 3 ? 'Dispensado' : 'Pendiente'}
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
        )}
      </div>
    </div>
  );
};
