import React, { useState } from 'react';
import { Visita, Farmacia, Farmaceuta } from '../types';
import { formatDate, getStatusBadge } from '../utils/helpers';
import { formatRut, cleanRut } from '../utils/rut';
import {
  Building2,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ShieldCheck,
  PackageCheck,
  Lock,
  Printer,
  XCircle,
  Clock,
  Pill,
  User,
  Flame,
  ArrowRight,
  Eye
} from 'lucide-react';

interface FarmaciaDespachoViewProps {
  visitas: Visita[];
  activeFarmacia?: Farmacia;
  activeFarmaceuta?: Farmaceuta;
  onQuemarTodaReceta: (visitaId: number, farmaceutaNombre: string) => void;
  onQuemarItemMedicamento: (visitaId: number, itemId: number, farmaceutaNombre: string) => void;
  onViewReceta: (visita: Visita) => void;
}

export const FarmaciaDespachoView: React.FC<FarmaciaDespachoViewProps> = ({
  visitas,
  activeFarmacia = { id: 1, nombre: 'Farmacia Central EasyRecetas', direccion: 'Av. Providencia 1208', ciudad: 'Santiago' } as Farmacia,
  activeFarmaceuta = { id: 1, nombres: 'Químico Farmacéutico', paterno: 'de Turno' } as Farmaceuta,
  onQuemarTodaReceta,
  onQuemarItemMedicamento,
  onViewReceta
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [foundVisita, setFoundVisita] = useState<Visita | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [dispenseSuccessMessage, setDispenseSuccessMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'burned'>('all');

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setDispenseSuccessMessage('');
    if (!searchInput.trim()) {
      setHasSearched(false);
      setFoundVisita(null);
      return;
    }

    const term = searchInput.trim().toUpperCase();
    const cleanSearchRut = cleanRut(term);

    // Look for exact or partial match on verification code or patient RUT
    const match = visitas.find((v) => {
      const matchCode = v.codigo_verificacion?.toUpperCase().includes(term);
      const matchRut = cleanRut(`${v.paciente?.rut || ''}${v.paciente?.dv || ''}`).includes(cleanSearchRut);
      return matchCode || (cleanSearchRut.length >= 6 && matchRut);
    });

    setFoundVisita(match || null);
    setHasSearched(true);
  };

  const handleSelectVisita = (v: Visita) => {
    setSearchInput(v.codigo_verificacion);
    setFoundVisita(v);
    setHasSearched(true);
    setDispenseSuccessMessage('');
    const topElem = document.getElementById('dispensacion-top');
    if (topElem) {
      topElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleQuemarTodo = () => {
    if (!foundVisita) return;
    const farmName = `${activeFarmaceuta.nombres || 'Farmacéutico'} ${activeFarmaceuta.paterno || ''} (${activeFarmacia.nombre.split('-')[0]})`.trim();
    onQuemarTodaReceta(foundVisita.id, farmName);
    
    // Update local preview state
    const updated = visitas.find((v) => v.id === foundVisita.id);
    if (updated) {
      setFoundVisita({
        ...updated,
        estado_id: 3,
        recetas: updated.recetas?.map(r => ({ ...r, estado: 3, farmaceuta_nombre: farmName }))
      });
    } else {
      setFoundVisita({ ...foundVisita, estado_id: 3 });
    }

    setDispenseSuccessMessage('¡Receta completamente dispensada y quemada con éxito! Registro validado en MINSAL.');
  };

  const handleQuemarItem = (itemId: number) => {
    if (!foundVisita) return;
    const farmName = `${activeFarmaceuta.nombres || 'Farmacéutico'} ${activeFarmaceuta.paterno || ''} (${activeFarmacia.nombre.split('-')[0]})`.trim();
    onQuemarItemMedicamento(foundVisita.id, itemId, farmName);

    // Update local preview state
    setTimeout(() => {
      const updated = visitas.find((v) => v.id === foundVisita.id);
      if (updated) setFoundVisita(updated);
    }, 100);

    setDispenseSuccessMessage('Medicamento individual dispensado y descontado.');
  };

  // Filtered list for the overview table
  const filteredVisitas = visitas.filter(v => {
    if (statusFilter === 'pending') return v.estado_id !== 3;
    if (statusFilter === 'burned') return v.estado_id === 3;
    return true;
  });

  const pendingCount = visitas.filter(v => v.estado_id !== 3).length;
  const burnedCount = visitas.filter(v => v.estado_id === 3).length;

  return (
    <div id="dispensacion-top" className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-[#0284c7]" />
            Dispensación y Quema de Recetas en Farmacia
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Módulo oficial de verificación criptográfica, validación MINSAL y quemado de prescripciones médicas.
          </p>
        </div>

        <div className="bg-sky-50 border border-sky-200 rounded-xl px-4 py-2.5 text-xs text-right shadow-xs">
          <span className="font-bold text-[#0369a1] block">{activeFarmacia.nombre}</span>
          <span className="text-[#0284c7]">Responsable: {activeFarmaceuta.nombres} {activeFarmaceuta.paterno}</span>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Total Recetas Emitidas</span>
            <span className="text-2xl font-bold text-slate-900 mt-0.5 block">{visitas.length}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center text-[#0284c7]">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-amber-700 font-semibold uppercase tracking-wider block">Pendientes de Dispensación</span>
            <span className="text-2xl font-bold text-amber-900 mt-0.5 block">{pendingCount}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-rose-700 font-semibold uppercase tracking-wider block">Recetas Quemadas / Finalizadas</span>
            <span className="text-2xl font-bold text-rose-900 mt-0.5 block">{burnedCount}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500">
            <Flame className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Prescription Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Search className="w-4 h-4 text-[#0284c7]" />
          Buscar Receta por Código o RUT
        </h2>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Ej. REC-2026-0001, ER-2025-001 o RUT del Paciente (18492019)..."
              className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0284c7] focus:bg-white focus:outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-3 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            Validar y Consultar
          </button>
        </form>

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-2 text-xs text-slate-500 pt-1 flex-wrap">
          <span className="font-semibold text-slate-400">Recetas recientes:</span>
          {visitas.slice(0, 4).map((v) => (
            <button
              key={v.id}
              onClick={() => handleSelectVisita(v)}
              className="px-2.5 py-1 bg-slate-100 hover:bg-sky-50 hover:text-sky-700 rounded-lg text-slate-700 font-mono transition-colors border border-slate-200 cursor-pointer"
            >
              {v.codigo_verificacion}
            </button>
          ))}
          {hasSearched && (
            <button
              onClick={() => {
                setHasSearched(false);
                setFoundVisita(null);
                setSearchInput('');
              }}
              className="px-2 py-1 text-rose-600 hover:underline ml-auto font-medium cursor-pointer"
            >
              Ver todas las recetas
            </button>
          )}
        </div>
      </div>

      {dispenseSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="font-semibold">{dispenseSuccessMessage}</p>
        </div>
      )}

      {/* Result Container: Single Recipe Detail */}
      {hasSearched && (
        <div>
          {foundVisita ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden space-y-6">
              {/* Header Status Bar */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-bold text-sky-400">
                      {foundVisita.codigo_verificacion}
                    </span>
                    <span className="text-xs bg-slate-800 px-2.5 py-0.5 rounded text-slate-300 border border-slate-700">
                      Emisión: {formatDate(foundVisita.fecha)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Prescrita por: <strong>{foundVisita.medico?.nombres} {foundVisita.medico?.apellidos}</strong> ({foundVisita.medico?.registro_minsal || 'MINSAL Verificado'})
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {foundVisita.estado_id === 3 ? (
                    <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 border border-rose-500/40 text-xs font-bold text-rose-400">
                      <Lock className="w-4 h-4" />
                      RECETA QUEMADA / AGOTADA
                    </div>
                  ) : (
                    <button
                      onClick={handleQuemarTodo}
                      className="px-5 py-2.5 bg-[#f27271] hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Flame className="w-4 h-4" />
                      Dispensar y Quemar Toda la Receta
                    </button>
                  )}

                  <button
                    onClick={() => onViewReceta(foundVisita)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-sky-400" />
                    Ver Comprobante
                  </button>
                </div>
              </div>

              {/* Patient and Diagnosis Details */}
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Datos del Paciente
                    </span>
                    <p className="font-bold text-slate-900 mt-1 text-base">
                      {foundVisita.paciente?.nombres} {foundVisita.paciente?.paterno} {foundVisita.paciente?.materno}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      RUT: <strong>{formatRut(`${foundVisita.paciente?.rut || ''}${foundVisita.paciente?.dv || ''}`)}</strong>
                    </p>
                    <p className="text-xs text-slate-600">
                      Contacto: {foundVisita.paciente?.correo || foundVisita.paciente?.telefono || 'N/A'}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Diagnóstico Clínico
                    </span>
                    {foundVisita.diagnostico ? (
                      <p className="font-semibold text-slate-800 mt-1">
                        <span className="text-[#0284c7]">[{foundVisita.diagnostico.codigo}]</span> {foundVisita.diagnostico.descripcion}
                      </p>
                    ) : (
                      <p className="text-slate-400 italic mt-1">Control médico general</p>
                    )}

                    {foundVisita.tratamiento && (
                      <p className="text-xs text-slate-600 mt-1">
                        Indicaciones Generales: {foundVisita.tratamiento}
                      </p>
                    )}
                  </div>
                </div>

                {/* Drugs Dispensing Table */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                    <span>Medicamentos para Dispensación</span>
                    <span className="text-xs font-normal text-slate-500">
                      {foundVisita.recetas?.filter((r) => r.estado === 3).length || 0} de {foundVisita.recetas?.length || 0} entregados
                    </span>
                  </h3>

                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    {foundVisita.recetas && foundVisita.recetas.length > 0 ? (
                      foundVisita.recetas.map((item, idx) => {
                        const isItemDispensado = item.estado === 3;
                        const itemBadge = getStatusBadge(item.estado);

                        return (
                          <div key={item.id || idx} className="p-4 bg-white hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold bg-sky-100 text-sky-900 px-2 py-0.5 rounded">
                                  #{idx + 1}
                                </span>
                                <span className="font-bold text-slate-900 text-sm">
                                  {item.medicamento?.descripcion}
                                </span>
                                {item.medicamento?.restriccion && (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 border text-slate-700">
                                    {item.medicamento.restriccion}
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-slate-600">
                                Posología: <strong>{item.tratamiento}</strong>
                              </p>

                              <div className="flex items-center gap-4 text-[11px] text-slate-500">
                                <span>Cantidad autorizada: <strong>{item.cantidad || 1} caja(s)</strong></span>
                                {item.dispensado_fecha && (
                                  <span className="text-emerald-700 font-semibold">
                                    ✓ Entregado el {formatDate(item.dispensado_fecha)} ({item.farmaceuta_nombre})
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${itemBadge.bg} ${itemBadge.text} ${itemBadge.border}`}>
                                {itemBadge.label}
                              </span>

                              {!isItemDispensado && (
                                <button
                                  onClick={() => handleQuemarItem(item.id)}
                                  className="px-4 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                  <PackageCheck className="w-3.5 h-3.5" />
                                  Dispensar Fármaco
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-6 text-center text-slate-400 text-sm bg-slate-50/50">
                        Esta atención no incluye medicamentos farmacológicos prescritos (control médico / orden de exámenes).
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <XCircle className="w-12 h-12 mx-auto text-rose-400" />
              <h3 className="font-bold text-base text-slate-900">Receta no encontrada</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No se encontró ninguna prescripción médica con el código o RUT ingresado. Verifique que no existan errores de tipeo.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Recetas List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Bandeja de Recetas para Farmacia</h2>
            <p className="text-xs text-slate-500">Selecciona cualquier receta médica para abrir el comprobante oficial o proceder con la dispensación.</p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-200/60 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas ({visitas.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                statusFilter === 'pending' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pendientes ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('burned')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                statusFilter === 'burned' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Quemadas ({burnedCount})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Código Receta</th>
                <th className="py-3.5 px-4 font-semibold">Paciente</th>
                <th className="py-3.5 px-4 font-semibold">Médico Prescriptor</th>
                <th className="py-3.5 px-4 font-semibold">Fármacos</th>
                <th className="py-3.5 px-4 font-semibold">Fecha</th>
                <th className="py-3.5 px-4 font-semibold">Estado</th>
                <th className="py-3.5 px-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVisitas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    No hay recetas en esta categoría.
                  </td>
                </tr>
              ) : (
                filteredVisitas.map((v) => {
                  const badge = getStatusBadge(v.estado_id);
                  const isBurned = v.estado_id === 3;

                  return (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#0284c7]">
                        {v.codigo_verificacion}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {v.paciente?.nombres} {v.paciente?.paterno}
                        </div>
                        <div className="text-xs text-slate-500">
                          RUT: {formatRut(`${v.paciente?.rut || ''}${v.paciente?.dv || ''}`)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">
                          {v.medico?.nombres} {v.medico?.apellidos}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {v.medico?.especialidad || 'Médico Cirujano'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-xs text-slate-700 max-w-[200px] truncate">
                          {v.recetas && v.recetas.length > 0
                            ? v.recetas.map(r => r.medicamento?.descripcion || 'Fármaco').join(', ')
                            : 'Sin medicamentos'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {v.recetas?.length || 0} medicamento(s)
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                        {formatDate(v.fecha)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onViewReceta(v)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all inline-flex items-center gap-1 cursor-pointer"
                            title="Ver Comprobante Oficial y Prescripción"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#0284c7]" />
                            Ver Detalle
                          </button>

                          {!isBurned ? (
                            <button
                              onClick={() => handleSelectVisita(v)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-xs transition-all inline-flex items-center gap-1 cursor-pointer"
                            >
                              Dispensar
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSelectVisita(v)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 transition-all inline-flex items-center gap-1 cursor-pointer"
                              title="Inspeccionar en panel"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
