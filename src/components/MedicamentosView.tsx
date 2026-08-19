import React, { useState } from 'react';
import { Medicamento } from '../types';
import { Pill, Search, PlusCircle, Filter, Edit2, CheckCircle2, AlertCircle } from 'lucide-react';

interface MedicamentosViewProps {
  medicamentos: Medicamento[];
  onAddNewMedicamento: (med: Medicamento) => void;
  onUpdateMedicamento: (med: Medicamento) => void;
}

export const MedicamentosView: React.FC<MedicamentosViewProps> = ({
  medicamentos,
  onAddNewMedicamento,
  onUpdateMedicamento
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [restrictionFilter, setRestrictionFilter] = useState('all');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medicamento | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [laboratorio, setLaboratorio] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [restriccion, setRestriccion] = useState('Venta Directa');
  const [forma, setForma] = useState('Comprimido');
  const [presentacion, setPresentacion] = useState('');

  const filteredMedicamentos = medicamentos.filter((m) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      m.descripcion.toLowerCase().includes(term) ||
      m.codigo.toLowerCase().includes(term) ||
      m.laboratorio.toLowerCase().includes(term) ||
      m.departamento.toLowerCase().includes(term);

    const matchesRestriction = restrictionFilter === 'all' || m.restriccion === restrictionFilter;

    return matchesSearch && matchesRestriction;
  });

  const openNewModal = () => {
    setEditingMed(null);
    setDescripcion('');
    setLaboratorio('');
    setDepartamento('Medicina General');
    setRestriccion('Venta Directa');
    setForma('Comprimido');
    setPresentacion('');
    setIsModalOpen(true);
  };

  const openEditModal = (med: Medicamento) => {
    setEditingMed(med);
    setDescripcion(med.descripcion);
    setLaboratorio(med.laboratorio);
    setDepartamento(med.departamento);
    setRestriccion(med.restriccion || 'Venta Directa');
    setForma(med.forma_farmaceutica || 'Comprimido');
    setPresentacion(med.presentacion || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcion.trim()) return;

    if (editingMed) {
      const updated: Medicamento = {
        ...editingMed,
        descripcion: descripcion.trim(),
        laboratorio: laboratorio.trim(),
        departamento: departamento.trim(),
        restriccion: restriccion,
        forma_farmaceutica: forma,
        presentacion: presentacion.trim()
      };
      onUpdateMedicamento(updated);
    } else {
      const nextId = Date.now();
      const newMed: Medicamento = {
        id: nextId,
        codigo: `MED-${1000 + medicamentos.length + 1}`,
        descripcion: descripcion.trim(),
        laboratorio: laboratorio.trim() || 'Laboratorio Nacional',
        departamento: departamento.trim() || 'General',
        restriccion: restriccion,
        forma_farmaceutica: forma,
        presentacion: presentacion.trim() || 'Caja unitaria',
        activo: 'X'
      };
      onAddNewMedicamento(newMed);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Pill className="w-5 h-5 text-[#0284c7]" />
            Vademécum & Catálogo Farmacéutico
          </h1>
          <p className="text-xs text-slate-500">
            Registro de medicamentos autorizados, laboratorios fabricantes y condiciones de venta/retención.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="px-4 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          Registrar Medicamento
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por Nombre comercial, Principio activo, Código o Laboratorio..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={restrictionFilter}
            onChange={(e) => setRestrictionFilter(e.target.value)}
            className="py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none w-full md:w-56"
          >
            <option value="all">Todas las condiciones de venta</option>
            <option value="Venta Directa">Venta Directa (Libre)</option>
            <option value="Receta Médica Simple">Receta Médica Simple</option>
            <option value="Receta Médica Retenida">Receta Retenida</option>
          </select>
        </div>
      </div>

      {/* Grid of Medications */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMedicamentos.map((med) => {
          const isRetenida = med.restriccion?.includes('Retenida');
          const isSimple = med.restriccion?.includes('Simple');

          return (
            <div
              key={med.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-sky-300 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                      {med.codigo}
                    </span>
                    <h3 className="font-bold text-base text-slate-900 mt-1 leading-snug">
                      {med.descripcion}
                    </h3>
                  </div>

                  <button
                    onClick={() => openEditModal(med)}
                    className="p-1.5 text-slate-400 hover:text-[#0284c7] hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1 text-xs text-slate-600 pt-1">
                  <p>
                    <span className="text-slate-400">Laboratorio:</span>{' '}
                    <strong className="text-slate-800">{med.laboratorio || 'N/A'}</strong>
                  </p>
                  <p>
                    <span className="text-slate-400">Departamento:</span>{' '}
                    <span>{med.departamento || 'General'}</span>
                  </p>
                  {med.presentacion && (
                    <p>
                      <span className="text-slate-400">Presentación:</span>{' '}
                      <span>{med.presentacion}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                    isRetenida
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : isSimple
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {med.restriccion || 'Venta Directa'}
                </span>

                <span className="text-[11px] text-slate-400">Activo</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingMed ? 'Editar Medicamento' : 'Registrar Nuevo Medicamento'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descripción y Dosis (Principio Activo):
                </label>
                <input
                  type="text"
                  required
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: Amoxicilina 500 mg Cápsulas"
                  className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Laboratorio:</label>
                  <input
                    type="text"
                    value={laboratorio}
                    onChange={(e) => setLaboratorio(e.target.value)}
                    placeholder="Laboratorio Chile, Saval..."
                    className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Departamento / Área:</label>
                  <input
                    type="text"
                    value={departamento}
                    onChange={(e) => setDepartamento(e.target.value)}
                    placeholder="Analgésicos, Cardiología..."
                    className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Condición de Venta:</label>
                  <select
                    value={restriccion}
                    onChange={(e) => setRestriccion(e.target.value)}
                    className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="Venta Directa">Venta Directa</option>
                    <option value="Receta Médica Simple">Receta Médica Simple</option>
                    <option value="Receta Médica Retenida">Receta Médica Retenida</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Presentación:</label>
                  <input
                    type="text"
                    value={presentacion}
                    onChange={(e) => setPresentacion(e.target.value)}
                    placeholder="Caja x 30 comprimidos"
                    className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  {editingMed ? 'Guardar Cambios' : 'Registrar Fármaco'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
