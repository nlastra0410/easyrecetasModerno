import React, { useState } from 'react';
import { Paciente, Medicamento, Diagnostico, Medico, Visita, RecetaItem, Examen, OrdenExamen, Epicrisis } from '../types';
import { cleanRut, formatRut, validateRut } from '../utils/rut';
import { generateVerificationCode } from '../utils/helpers';
import {
  User,
  Plus,
  Trash2,
  Stethoscope,
  Search,
  CheckCircle,
  FileCheck,
  AlertCircle,
  Pill,
  Save,
  UserPlus,
  Activity,
  FileText
} from 'lucide-react';

interface NuevaRecetaViewProps {
  pacientes: Paciente[];
  medicamentos: Medicamento[];
  diagnosticos: Diagnostico[];
  examenes: Examen[];
  activeMedico: Medico;
  onSaveVisita: (newVisita: Visita) => void;
  onAddNewPaciente: (paciente: Paciente) => Paciente;
}

export const NuevaRecetaView: React.FC<NuevaRecetaViewProps> = ({
  pacientes,
  medicamentos,
  diagnosticos,
  examenes,
  activeMedico,
  onSaveVisita,
  onAddNewPaciente
}) => {
  const [selectedPacienteId, setSelectedPacienteId] = useState<number | ''>('');
  const [pacienteSearch, setPacienteSearch] = useState('');
  const [showNewPacienteModal, setShowNewPacienteModal] = useState(false);

  // New patient rapid form
  const [newRut, setNewRut] = useState('');
  const [newNombres, setNewNombres] = useState('');
  const [newPaterno, setNewPaterno] = useState('');
  const [newMaterno, setNewMaterno] = useState('');
  const [newFechaNac, setNewFechaNac] = useState('');
  const [newCorreo, setNewCorreo] = useState('');
  const [newDireccion, setNewDireccion] = useState('');
  const [newTelefono, setNewTelefono] = useState('');
  const [patientFormError, setPatientFormError] = useState('');

  // Diagnosis state
  const [selectedDiagnosticoId, setSelectedDiagnosticoId] = useState<number | ''>('');
  const [diagnosticoSearch, setDiagnosticoSearch] = useState('');

  // Epicrisis state
  const [epicrisisContent, setEpicrisisContent] = useState('');

  // Prescription items state
  const [items, setItems] = useState<Array<{
    medicamento_id: number;
    tratamiento: string;
    duracion: string;
    cantidad: number;
  }>>([]);

  // Exams items state
  const [examItems, setExamItems] = useState<Array<{
    examen_id: number;
    indicaciones: string;
  }>>([]);

  // General notes
  const [indicacionesGenerales, setIndicacionesGenerales] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // Filters
  const filteredPacientes = pacientes.filter((p) => {
    const term = pacienteSearch.toLowerCase();
    const full = `${p.nombres} ${p.paterno} ${p.materno} ${p.rut}-${p.dv}`.toLowerCase();
    return full.includes(term);
  });

  const selectedPaciente = pacientes.find((p) => p.id === Number(selectedPacienteId));

  const filteredDiagnosticos = diagnosticos.filter((d) => {
    const term = diagnosticoSearch.toLowerCase();
    return d.codigo.toLowerCase().includes(term) || d.descripcion.toLowerCase().includes(term);
  });

  // Handlers
  const handleAddItem = () => {
    setItems([
      ...items,
      { medicamento_id: medicamentos[0]?.id || 1, tratamiento: '', duracion: '', cantidad: 1 }
    ]);
  };
  const handleRemoveItem = (index: number) => setItems(items.filter((_, idx) => idx !== index));
  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleAddExam = () => {
    setExamItems([...examItems, { examen_id: examenes[0]?.id || 1, indicaciones: '' }]);
  };
  const handleRemoveExam = (index: number) => setExamItems(examItems.filter((_, idx) => idx !== index));
  const handleExamChange = (index: number, field: string, value: any) => {
    const updated = [...examItems];
    updated[index] = { ...updated[index], [field]: value };
    setExamItems(updated);
  };

  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    setPatientFormError('');

    const cleaned = cleanRut(newRut);
    if (!validateRut(cleaned)) {
      setPatientFormError('RUT inválido. Ingrese un RUT chileno válido (ej: 18492019-4).');
      return;
    }

    const cuerpo = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);
    const exists = pacientes.some((p) => cleanRut(`${p.rut}${p.dv}`) === cleaned);
    
    if (exists) {
      setPatientFormError('Ya existe un paciente registrado con este RUT.');
      return;
    }

    const newPac: Paciente = {
      id: Date.now(),
      rut: cuerpo,
      dv: dv,
      nombres: newNombres.trim(),
      paterno: newPaterno.trim(),
      materno: newMaterno.trim(),
      fecha_nacimiento: newFechaNac,
      correo: newCorreo.trim(),
      direccion: newDireccion.trim(),
      telefono: newTelefono.trim(),
      activo: 'X',
      created_at: new Date().toISOString()
    };

    const saved = onAddNewPaciente(newPac);
    setSelectedPacienteId(saved.id);
    setShowNewPacienteModal(false);

    // Reset inputs
    setNewRut('');
    setNewNombres('');
    setNewPaterno('');
    setNewMaterno('');
    setNewFechaNac('');
    setNewCorreo('');
    setNewDireccion('');
    setNewTelefono('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPacienteId) {
      alert('Por favor seleccione un paciente antes de emitir la receta.');
      return;
    }

    const selectedDiag = diagnosticos.find((d) => d.id === Number(selectedDiagnosticoId));
    const newVisitaId = Date.now();
    const verificationCode = generateVerificationCode(newVisitaId, Number(selectedPacienteId));

    const recetaItems: RecetaItem[] = items.map((it, idx) => {
      const med = medicamentos.find((m) => m.id === Number(it.medicamento_id));
      return {
        id: newVisitaId + idx + 1,
        visita_id: newVisitaId,
        medicamento_id: Number(it.medicamento_id),
        medicamento: med,
        tratamiento: it.tratamiento,
        duracion: it.duracion,
        cantidad: Number(it.cantidad) || 1,
        estado: 1,
        activo: 'X'
      };
    });

    const ordenesExamenes: OrdenExamen[] = examItems.map((ex, idx) => {
      const examenObj = examenes.find((e) => e.id === Number(ex.examen_id));
      return {
        id: newVisitaId + 1000 + idx,
        visita_id: newVisitaId,
        examen_id: Number(ex.examen_id),
        examen: examenObj,
        indicaciones: ex.indicaciones,
        estado: 1
      };
    });

    const epicrisisList: Epicrisis[] = epicrisisContent.trim() ? [{
      id: newVisitaId + 2000,
      visita_id: newVisitaId,
      paciente_id: Number(selectedPacienteId),
      medico_id: activeMedico.id,
      contenido: epicrisisContent,
      created_at: new Date().toISOString()
    }] : [];

    const newVisita: Visita = {
      id: newVisitaId,
      medico_id: activeMedico.id,
      medico: activeMedico,
      paciente_id: Number(selectedPacienteId),
      paciente: selectedPaciente,
      diagnostico_id: selectedDiagnosticoId ? Number(selectedDiagnosticoId) : null,
      diagnostico: selectedDiag,
      tratamiento: indicacionesGenerales,
      fecha: new Date().toISOString(),
      estado_id: 1,
      codigo_verificacion: verificationCode,
      activo: 'X',
      recetas: recetaItems,
      examenes: ordenesExamenes,
      epicrisis: epicrisisList
    };

    onSaveVisita(newVisita);
    setFormSuccess(true);
    
    // Optional reset logic here
    setTimeout(() => {
      setFormSuccess(false);
    }, 4000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-[#0284c7]" />
            Nueva Consulta Médica Integrada
          </h1>
          <p className="text-xs text-slate-500">
            Ficha clínica, epicrisis, emisión de recetas y órdenes de exámenes.
          </p>
        </div>

        <div className="text-right text-xs">
          <span className="text-slate-500">Médico:</span>{' '}
          <strong className="text-slate-800">{activeMedico.nombres} {activeMedico.apellidos}</strong>
          <span className="block text-[#0284c7] font-mono font-semibold">{activeMedico.registro_minsal}</span>
        </div>
      </div>

      {formSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm animate-fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold">¡Atención Médica Registrada Exitosamente!</p>
            <p className="text-xs text-emerald-700">
              La ficha, receta y órdenes de exámenes han sido procesadas con firma digital.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Paciente */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-[#0284c7]" />
              1. Selección o Registro del Paciente
            </h2>
            <button
              type="button"
              onClick={() => setShowNewPacienteModal(true)}
              className="text-xs font-semibold text-[#0284c7] hover:text-[#0369a1] hover:bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Nuevo Paciente
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Buscar por Nombre o RUT:
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={pacienteSearch}
                  onChange={(e) => setPacienteSearch(e.target.value)}
                  placeholder="Ej: Rojas o 18492019..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Seleccionar de la lista ({filteredPacientes.length} coincidencias):
              </label>
              <select
                value={selectedPacienteId}
                onChange={(e) => setSelectedPacienteId(e.target.value ? Number(e.target.value) : '')}
                required
                className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
              >
                <option value="">-- Seleccione un paciente --</option>
                {filteredPacientes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombres} {p.paterno} {p.materno} - RUT: {formatRut(`${p.rut}${p.dv}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedPaciente && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block">RUT:</span>
                <span className="font-semibold text-slate-800">{formatRut(`${selectedPaciente.rut}${selectedPaciente.dv}`)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Fecha Nacimiento:</span>
                <span className="font-semibold text-slate-800">{selectedPaciente.fecha_nacimiento || 'No registrada'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Correo Electrónico:</span>
                <span className="font-semibold text-slate-800">{selectedPaciente.correo || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Teléfono:</span>
                <span className="font-semibold text-slate-800">{selectedPaciente.telefono || 'N/A'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Evolución Médica / Epicrisis */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#0284c7]" />
              2. Epicrisis / Notas de Evolución
            </h2>
          </div>
          <div>
            <textarea
              rows={4}
              value={epicrisisContent}
              onChange={(e) => setEpicrisisContent(e.target.value)}
              placeholder="Registro clínico, motivo de consulta, hallazgos en examen físico, evolución..."
              className="w-full p-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Step 3: Diagnóstico (CIE-10) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#0284c7]" />
              3. Diagnóstico Médico (CIE-10)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Filtrar Diagnóstico:
              </label>
              <input
                type="text"
                value={diagnosticoSearch}
                onChange={(e) => setDiagnosticoSearch(e.target.value)}
                placeholder="Ej: J00, Hipertensión, Dolor..."
                className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Diagnóstico Principal:
              </label>
              <select
                value={selectedDiagnosticoId}
                onChange={(e) => setSelectedDiagnosticoId(e.target.value ? Number(e.target.value) : '')}
                className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
              >
                <option value="">-- Sin diagnóstico específico o control preventivo --</option>
                {filteredDiagnosticos.map((d) => (
                  <option key={d.id} value={d.id}>
                    [{d.codigo}] {d.descripcion}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Step 4: Solicitud de Exámenes */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#0284c7]" />
              4. Orden de Exámenes
            </h2>
            <button
              type="button"
              onClick={handleAddExam}
              className="text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg border border-blue-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Solicitar Examen
            </button>
          </div>

          <div className="space-y-4">
            {examItems.length === 0 && (
              <p className="text-xs text-slate-500 italic py-2">Sin exámenes solicitados para esta consulta.</p>
            )}
            {examItems.map((item, idx) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold bg-blue-800 text-white px-2 py-0.5 rounded">
                    Examen #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveExam(idx)}
                    className="text-rose-600 hover:text-rose-800 p-1 hover:bg-rose-50 rounded transition-colors text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Eliminar
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Seleccionar Examen:
                    </label>
                    <select
                      value={item.examen_id}
                      onChange={(e) => handleExamChange(idx, 'examen_id', Number(e.target.value))}
                      className="w-full py-2 px-3 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    >
                      {examenes.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          [{ex.codigo}] {ex.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Indicaciones / Sospecha Clínica:
                    </label>
                    <input
                      type="text"
                      value={item.indicaciones}
                      onChange={(e) => handleExamChange(idx, 'indicaciones', e.target.value)}
                      placeholder="Ej: Sospecha de ITU, Ayuno 8hrs..."
                      className="w-full py-2 px-3 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step 5: Medicamentos Prescritos */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Pill className="w-4 h-4 text-[#0284c7]" />
              5. Prescripción Farmacológica (Rp.)
            </h2>
            <button
              type="button"
              onClick={handleAddItem}
              className="text-xs font-semibold bg-sky-50 hover:bg-sky-100 text-sky-800 px-3 py-1.5 rounded-lg border border-sky-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar Fármaco
            </button>
          </div>

          <div className="space-y-4">
            {items.length === 0 && (
              <p className="text-xs text-slate-500 italic py-2">Sin fármacos prescritos para esta consulta.</p>
            )}
            {items.map((item, idx) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold bg-sky-800 text-white px-2 py-0.5 rounded">
                    Medicamento #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="text-rose-600 hover:text-rose-800 p-1 hover:bg-rose-50 rounded transition-colors text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Eliminar
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Fármaco / Presentación:
                    </label>
                    <select
                      value={item.medicamento_id}
                      onChange={(e) => handleItemChange(idx, 'medicamento_id', Number(e.target.value))}
                      className="w-full py-2 px-3 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    >
                      {medicamentos.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.descripcion} ({m.laboratorio || 'Lab Genérico'}) - [{m.restriccion || 'Venta Libre'}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Cantidad (Cajas/Frascos):
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.cantidad}
                      onChange={(e) => handleItemChange(idx, 'cantidad', e.target.value)}
                      className="w-full py-2 px-3 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Posología e Instrucciones de Toma:
                    </label>
                    <input
                      type="text"
                      value={item.tratamiento}
                      onChange={(e) => handleItemChange(idx, 'tratamiento', e.target.value)}
                      placeholder="Ej: 1 comprimido cada 8 horas después de las comidas..."
                      required
                      className="w-full py-2 px-3 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Duración Estimada:
                    </label>
                    <input
                      type="text"
                      value={item.duracion}
                      onChange={(e) => handleItemChange(idx, 'duracion', e.target.value)}
                      placeholder="Ej: 7 días / 30 días"
                      className="w-full py-2 px-3 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-3 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold rounded-xl text-sm flex items-center gap-2 transition-all shadow-md hover:shadow-sky-500/20 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Registrar Consulta y Emitir Documentos
          </button>
        </div>
      </form>

      {/* Modal for Rapid Patient Creation */}
      {showNewPacienteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#0284c7]" />
                Registrar Nuevo Paciente
              </h3>
              <button
                onClick={() => setShowNewPacienteModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {patientFormError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                {patientFormError}
              </div>
            )}

            <form onSubmit={handleCreatePatient} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  RUT Chileno (con dígito verificador):
                </label>
                <input
                  type="text"
                  required
                  value={newRut}
                  onChange={(e) => setNewRut(e.target.value)}
                  placeholder="Ej: 18492019-4 o 184920194"
                  className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nombres:</label>
                  <input
                    type="text"
                    required
                    value={newNombres}
                    onChange={(e) => setNewNombres(e.target.value)}
                    placeholder="Camila Andrea"
                    className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ap. Paterno:</label>
                  <input
                    type="text"
                    required
                    value={newPaterno}
                    onChange={(e) => setNewPaterno(e.target.value)}
                    placeholder="Rojas"
                    className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ap. Materno:</label>
                  <input
                    type="text"
                    value={newMaterno}
                    onChange={(e) => setNewMaterno(e.target.value)}
                    placeholder="González"
                    className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha Nacimiento:</label>
                  <input
                    type="date"
                    value={newFechaNac}
                    onChange={(e) => setNewFechaNac(e.target.value)}
                    className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico:</label>
                  <input
                    type="email"
                    value={newCorreo}
                    onChange={(e) => setNewCorreo(e.target.value)}
                    placeholder="paciente@correo.cl"
                    className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewPacienteModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Guardar y Seleccionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
