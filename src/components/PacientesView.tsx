import React, { useState } from 'react';
import { Paciente, Visita } from '../types';
import { cleanRut, formatRut, validateRut } from '../utils/rut';
import { formatDate, getStatusBadge } from '../utils/helpers';
import {
  Users,
  Search,
  UserPlus,
  Edit2,
  Calendar,
  FileText,
  AlertCircle,
  Eye,
  CheckCircle2,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';

interface PacientesViewProps {
  pacientes: Paciente[];
  visitas: Visita[];
  onAddNewPaciente: (paciente: Paciente) => Paciente;
  onUpdatePaciente: (paciente: Paciente) => void;
  onViewReceta: (visita: Visita) => void;
}

export const PacientesView: React.FC<PacientesViewProps> = ({
  pacientes,
  visitas,
  onAddNewPaciente,
  onUpdatePaciente,
  onViewReceta
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPacienteForHistory, setSelectedPacienteForHistory] = useState<Paciente | null>(null);

  // Form Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPaciente, setEditingPaciente] = useState<Paciente | null>(null);
  const [formRut, setFormRut] = useState('');
  const [formNombres, setFormNombres] = useState('');
  const [formPaterno, setFormPaterno] = useState('');
  const [formMaterno, setFormMaterno] = useState('');
  const [formFechaNac, setFormFechaNac] = useState('');
  const [formCorreo, setFormCorreo] = useState('');
  const [formDireccion, setFormDireccion] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formError, setFormError] = useState('');

  const filteredPacientes = pacientes.filter((p) => {
    const term = searchTerm.toLowerCase();
    const full = `${p.nombres} ${p.paterno} ${p.materno} ${p.rut}-${p.dv}`.toLowerCase();
    return full.includes(term);
  });

  const openNewModal = () => {
    setEditingPaciente(null);
    setFormRut('');
    setFormNombres('');
    setFormPaterno('');
    setFormMaterno('');
    setFormFechaNac('');
    setFormCorreo('');
    setFormDireccion('');
    setFormTelefono('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (paciente: Paciente) => {
    setEditingPaciente(paciente);
    setFormRut(`${paciente.rut}-${paciente.dv}`);
    setFormNombres(paciente.nombres);
    setFormPaterno(paciente.paterno);
    setFormMaterno(paciente.materno || '');
    setFormFechaNac(paciente.fecha_nacimiento || '');
    setFormCorreo(paciente.correo || '');
    setFormDireccion(paciente.direccion || '');
    setFormTelefono(paciente.telefono || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSavePaciente = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleaned = cleanRut(formRut);
    if (!validateRut(cleaned)) {
      setFormError('RUT inválido. Ingrese un RUT chileno válido (ej: 18492019-4).');
      return;
    }

    const cuerpo = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);

    if (editingPaciente) {
      const updated: Paciente = {
        ...editingPaciente,
        rut: cuerpo,
        dv: dv,
        nombres: formNombres.toUpperCase(),
        paterno: formPaterno.toUpperCase(),
        materno: formMaterno.toUpperCase(),
        fecha_nacimiento: formFechaNac,
        correo: formCorreo,
        direccion: formDireccion,
        telefono: formTelefono
      };
      onUpdatePaciente(updated);
    } else {
      // Check duplicate
      const exists = pacientes.some((p) => cleanRut(`${p.rut}${p.dv}`) === cleaned);
      if (exists) {
        setFormError('Ya existe un paciente registrado con este RUT.');
        return;
      }

      const newPac: Paciente = {
        id: Date.now(),
        rut: cuerpo,
        dv: dv,
        nombres: formNombres.toUpperCase(),
        paterno: formPaterno.toUpperCase(),
        materno: formMaterno.toUpperCase(),
        fecha_nacimiento: formFechaNac,
        correo: formCorreo,
        direccion: formDireccion,
        telefono: formTelefono,
        activo: 'X',
        created_at: new Date().toISOString()
      };
      onAddNewPaciente(newPac);
    }

    setIsModalOpen(false);
  };

  // Visitas for the selected patient
  const patientVisitas = selectedPacienteForHistory
    ? visitas.filter((v) => v.paciente_id === selectedPacienteForHistory.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0284c7]" />
            Fichas y Directorio de Pacientes
          </h1>
          <p className="text-xs text-slate-500">
            Registro de pacientes, datos de contacto y antecedentes de prescripciones previas.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="px-4 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Registrar Paciente
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por Nombre, Apellidos o RUT del Paciente..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Patient Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPacientes.map((p) => {
          const countVisitas = visitas.filter((v) => v.paciente_id === p.id).length;
          return (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-sky-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 leading-tight">
                      {p.nombres} {p.paterno} {p.materno}
                    </h3>
                    <span className="inline-block font-mono text-xs font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded mt-1 border border-sky-200">
                      RUT: {formatRut(`${p.rut}${p.dv}`)}
                    </span>
                  </div>

                  <button
                    onClick={() => openEditModal(p)}
                    className="p-1.5 text-slate-400 hover:text-[#0284c7] hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                    title="Editar Ficha"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  {p.fecha_nacimiento && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Nacimiento: <strong>{p.fecha_nacimiento}</strong></span>
                    </div>
                  )}
                  {p.correo && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{p.correo}</span>
                    </div>
                  )}
                  {p.telefono && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{p.telefono}</span>
                    </div>
                  )}
                  {p.direccion && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{p.direccion}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  {countVisitas} {countVisitas === 1 ? 'receta emitida' : 'recetas emitidas'}
                </span>

                <button
                  onClick={() => setSelectedPacienteForHistory(p)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-sky-50 text-sky-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Ver Historial
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* History Modal for a specific patient */}
      {selectedPacienteForHistory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-4 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Historial Clínico: {selectedPacienteForHistory.nombres} {selectedPacienteForHistory.paterno}
                </h3>
                <p className="text-xs text-slate-500">
                  RUT: {formatRut(`${selectedPacienteForHistory.rut}${selectedPacienteForHistory.dv}`)} • {patientVisitas.length} consultas registradas
                </p>
              </div>
              <button
                onClick={() => setSelectedPacienteForHistory(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {patientVisitas.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  Este paciente aún no tiene recetas ni consultas registradas.
                </div>
              ) : (
                patientVisitas.map((v) => {
                  const status = getStatusBadge(v.estado_id);
                  return (
                    <div key={v.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded">
                            {v.codigo_verificacion}
                          </span>
                          <span className="text-xs text-slate-500">{formatDate(v.fecha)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${status.bg} ${status.text} ${status.border}`}>
                            {status.label}
                          </span>
                          <button
                            onClick={() => onViewReceta(v)}
                            className="p-1 text-slate-500 hover:text-[#0284c7] hover:bg-sky-100 rounded cursor-pointer"
                            title="Ver Comprobante"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {v.diagnostico && (
                        <p className="text-xs text-slate-700 font-medium">
                          Diagnóstico: <span className="text-slate-900">[{v.diagnostico.codigo}] {v.diagnostico.descripcion}</span>
                        </p>
                      )}

                      <div className="text-xs text-slate-600">
                        <span className="font-semibold block mb-0.5">Medicamentos prescritos:</span>
                        <ul className="list-disc pl-4 space-y-0.5">
                          {v.recetas?.map((r) => (
                            <li key={r.id}>
                              <strong>{r.medicamento?.descripcion}</strong> — {r.tratamiento}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Patient Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingPaciente ? 'Editar Ficha de Paciente' : 'Registrar Nuevo Paciente'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                {formError}
              </div>
            )}

            <form onSubmit={handleSavePaciente} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  RUT Chileno (con dígito verificador):
                </label>
                <input
                  type="text"
                  required
                  value={formRut}
                  onChange={(e) => setFormRut(e.target.value)}
                  placeholder="Ej: 18492019-4"
                  className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nombres:</label>
                  <input
                    type="text"
                    required
                    value={formNombres}
                    onChange={(e) => setFormNombres(e.target.value)}
                    className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ap. Paterno:</label>
                  <input
                    type="text"
                    required
                    value={formPaterno}
                    onChange={(e) => setFormPaterno(e.target.value)}
                    className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ap. Materno:</label>
                  <input
                    type="text"
                    value={formMaterno}
                    onChange={(e) => setFormMaterno(e.target.value)}
                    className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha Nacimiento:</label>
                  <input
                    type="date"
                    value={formFechaNac}
                    onChange={(e) => setFormFechaNac(e.target.value)}
                    className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono:</label>
                  <input
                    type="tel"
                    value={formTelefono}
                    onChange={(e) => setFormTelefono(e.target.value)}
                    placeholder="+56 9 ..."
                    className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico:</label>
                <input
                  type="email"
                  value={formCorreo}
                  onChange={(e) => setFormCorreo(e.target.value)}
                  placeholder="paciente@correo.cl"
                  className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dirección:</label>
                <input
                  type="text"
                  value={formDireccion}
                  onChange={(e) => setFormDireccion(e.target.value)}
                  placeholder="Calle, Número, Comuna, Ciudad"
                  className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
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
                  {editingPaciente ? 'Guardar Cambios' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
