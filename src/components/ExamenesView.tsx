import React, { useState } from 'react';
import { Examen } from '../types';
import { Activity, Search, PlusCircle, Edit2, AlertCircle } from 'lucide-react';

interface ExamenesViewProps {
  examenes: Examen[];
  onAddNewExamen: (examen: Examen) => void;
  onUpdateExamen: (examen: Examen) => void;
}

export const ExamenesView: React.FC<ExamenesViewProps> = ({
  examenes,
  onAddNewExamen,
  onUpdateExamen
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExamen, setEditingExamen] = useState<Examen | null>(null);
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');

  const filteredExamenes = examenes.filter((ex) => {
    const term = searchTerm.toLowerCase();
    return ex.nombre.toLowerCase().includes(term) || ex.codigo.toLowerCase().includes(term);
  });

  const openNewModal = () => {
    setEditingExamen(null);
    setNombre('');
    setCodigo(`EX-${String(examenes.length + 1).padStart(3, '0')}`);
    setIsModalOpen(true);
  };

  const openEditModal = (ex: Examen) => {
    setEditingExamen(ex);
    setNombre(ex.nombre);
    setCodigo(ex.codigo);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !codigo.trim()) return;

    if (editingExamen) {
      onUpdateExamen({
        ...editingExamen,
        nombre: nombre.trim(),
        codigo: codigo.trim()
      });
    } else {
      onAddNewExamen({
        id: Date.now(),
        nombre: nombre.trim(),
        codigo: codigo.trim(),
        activo: 'X'
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-700" />
            Catálogo de Exámenes Médicos
          </h1>
          <p className="text-xs text-slate-500">
            Registro de exámenes de laboratorio, imagenología y procedimientos para solicitud clínica.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Registrar Examen
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por Nombre del examen o Código (Ej: Hemograma, EX-001)..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Grid of Exams */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredExamenes.map((ex) => (
          <div
            key={ex.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-mono text-[10px] font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {ex.codigo}
                </span>
                <h3 className="font-bold text-sm text-slate-900 mt-2 leading-snug">
                  {ex.nombre}
                </h3>
              </div>

              <button
                onClick={() => openEditModal(ex)}
                className="p-1.5 text-slate-400 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Editar Examen"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {filteredExamenes.length === 0 && (
          <div className="col-span-full py-8 text-center text-slate-400 text-sm">
            No se encontraron exámenes con los criterios de búsqueda.
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingExamen ? 'Editar Examen' : 'Registrar Nuevo Examen'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Código del Examen:
                </label>
                <input
                  type="text"
                  required
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre del Examen / Procedimiento:
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Hemograma Completo"
                  className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
                >
                  {editingExamen ? 'Guardar Cambios' : 'Registrar Examen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
