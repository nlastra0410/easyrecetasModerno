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
  FileText,
  Sparkles,
  Send,
  Mail,
  HelpCircle,
  Building,
  Check
} from 'lucide-react';

interface NuevaRecetaViewProps {
  pacientes: Paciente[];
  medicamentos: Medicamento[];
  diagnosticos: Diagnostico[];
  examenes: Examen[];
  activeMedico: Medico;
  onSaveVisita: (newVisita: Visita) => void;
  onAddNewPaciente: (paciente: Paciente) => Paciente;
  onAddNewMedicamento?: (medicamento: Medicamento) => void;
}

export const NuevaRecetaView: React.FC<NuevaRecetaViewProps> = ({
  pacientes,
  medicamentos,
  diagnosticos,
  examenes,
  activeMedico,
  onSaveVisita,
  onAddNewPaciente,
  onAddNewMedicamento
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
    searchTerm?: string;
    showSuggestions?: boolean;
  }>>([]);

  // Manual Exception modal state (US-09)
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [targetItemIndexForException, setTargetItemIndexForException] = useState<number | null>(null);
  const [customMedName, setCustomMedName] = useState('');
  const [customMedPresentacion, setCustomMedPresentacion] = useState('');
  const [customMedLab, setCustomMedLab] = useState('');
  const [customMedRestriccion, setCustomMedRestriccion] = useState('Receta Médica Simple');

  // Exams items state
  const [examCategoryFilter, setExamCategoryFilter] = useState<'all' | 'General' | 'Odontologico'>('all');
  const [examItems, setExamItems] = useState<Array<{
    examen_id: number;
    indicaciones: string;
  }>>([]);

  // General notes
  const [indicacionesGenerales, setIndicacionesGenerales] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);
  const [lastEmittedEmail, setLastEmittedEmail] = useState('');

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

  const filteredExamenesCatalog = examenes.filter((ex) => {
    if (examCategoryFilter === 'all') return true;
    return ex.categoria === examCategoryFilter;
  });

  // Handlers for prescription items
  const handleAddItem = () => {
    setItems([
      ...items,
      {
        medicamento_id: medicamentos[0]?.id || 1,
        tratamiento: '',
        duracion: '',
        cantidad: 1,
        searchTerm: '',
        showSuggestions: false
      }
    ]);
  };

  const handleRemoveItem = (index: number) => setItems(items.filter((_, idx) => idx !== index));

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  // Open Exception Modal (US-09)
  const handleOpenExceptionModal = (itemIdx?: number) => {
    setTargetItemIndexForException(itemIdx !== undefined ? itemIdx : items.length);
    setCustomMedName('');
    setCustomMedPresentacion('Caja x 30');
    setCustomMedLab('Laboratorio Clínico');
    setCustomMedRestriccion('Receta Médica Simple');
    setShowExceptionModal(true);
  };

  const handleSaveExceptionMedicamento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMedName.trim()) return;

    const newMed: Medicamento = {
      id: Date.now(),
      codigo: `MED-EXP-${Math.floor(1000 + Math.random() * 9000)}`,
      descripcion: `${customMedName.trim()}${customMedPresentacion ? ` (${customMedPresentacion.trim()})` : ''}`,
      laboratorio: customMedLab.trim() || 'Laboratorio Particular',
      departamento: 'Excepciones y Farmacología Especial',
      restriccion: customMedRestriccion,
      forma_farmaceutica: 'Comprimido / Solución',
      presentacion: customMedPresentacion.trim() || 'Unidad',
      activo: 'X'
    };

    if (onAddNewMedicamento) {
      onAddNewMedicamento(newMed);
    }

    if (targetItemIndexForException !== null && targetItemIndexForException < items.length) {
      // Assign to existing item
      const updated = [...items];
      updated[targetItemIndexForException] = {
        ...updated[targetItemIndexForException],
        medicamento_id: newMed.id,
        searchTerm: newMed.descripcion,
        showSuggestions: false
      };
      setItems(updated);
    } else {
      // Add as new item
      setItems([
        ...items,
        {
          medicamento_id: newMed.id,
          tratamiento: '',
          duracion: '',
          cantidad: 1,
          searchTerm: newMed.descripcion,
          showSuggestions: false
        }
      ]);
    }

    setShowExceptionModal(false);
  };

  // Exam handlers
  const handleAddExam = () => {
    const defaultEx = filteredExamenesCatalog[0] || examenes[0];
    setExamItems([...examItems, { examen_id: defaultEx?.id || 1, indicaciones: '' }]);
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
        tratamiento: it.tratamiento?.trim() || 'Según indicación médica',
        duracion: it.duracion?.trim() || 'Según evolución',
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
    setLastEmittedEmail(selectedPaciente?.correo || '');
    setFormSuccess(true);

    // Scroll to top to see confirmation
    window.scrollTo({ top: 0, behavior: 'smooth' });

    setTimeout(() => {
      setFormSuccess(false);
    }, 6000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header with Professional / Dental Identification */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-[#0284c7]" />
            Nueva Consulta Médica y Recetario Oficial
          </h1>
          <p className="text-xs text-slate-500">
            Ficha clínica, epicrisis, prescripción predictiva con excepciones y órdenes de exámenes.
          </p>
        </div>

        <div className="text-right text-xs bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-200">
          <span className="text-slate-500">Profesional Emisor:</span>{' '}
          <strong className="text-slate-800">{activeMedico.nombres} {activeMedico.apellidos}</strong>
          <span className="block text-[#0284c7] font-mono font-semibold">
            {activeMedico.especialidad || activeMedico.profesion_nombre || 'Medicina'} • {activeMedico.registro_minsal}
          </span>
        </div>
      </div>

      {/* Success Notification (US-10) */}
      {formSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-sm shadow-sm space-y-1 animate-fade-in">
          <div className="flex items-center gap-2 font-bold text-emerald-800">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            ¡Atención clínica y receta oficial emitida con éxito!
          </div>
          <p className="text-xs text-emerald-700">
            {lastEmittedEmail ? (
              <span className="flex items-center gap-1 mt-1">
                <Mail className="w-3.5 h-3.5 text-emerald-600" />
                Despachado automáticamente al correo del paciente: <strong>{lastEmittedEmail}</strong> (US-10).
              </span>
            ) : (
              'Copia archivada en el historial clínico del paciente y disponible para validación QR en farmacia.'
            )}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Paciente */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-[#0284c7]" />
              1. Selección e Identificación del Paciente
            </h2>
            <button
              type="button"
              onClick={() => setShowNewPacienteModal(true)}
              className="text-xs font-semibold bg-sky-50 hover:bg-sky-100 text-sky-800 px-3 py-1.5 rounded-lg border border-sky-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              + Nuevo Paciente
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
                  placeholder="Ej: Nelson, Lastra, 16778715-0..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Paciente Seleccionado:
              </label>
              <select
                value={selectedPacienteId}
                onChange={(e) => setSelectedPacienteId(e.target.value ? Number(e.target.value) : '')}
                required
                className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
              >
                <option value="">-- Seleccione un paciente ({filteredPacientes.length} encontrados) --</option>
                {filteredPacientes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombres} {p.paterno} {p.materno} - RUT: {formatRut(p.rut, p.dv)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedPaciente && (
            <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-slate-500 font-medium">Nombre:</span>{' '}
                <strong className="text-slate-800">{selectedPaciente.nombres} {selectedPaciente.paterno} {selectedPaciente.materno}</strong>
                <span className="mx-2 text-slate-300">|</span>
                <span className="text-slate-500 font-medium">RUT:</span>{' '}
                <strong className="text-[#0284c7] font-mono">{formatRut(selectedPaciente.rut, selectedPaciente.dv)}</strong>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-500">Correo:</span>{' '}
                <strong className="text-slate-800">{selectedPaciente.correo || 'Sin correo'}</strong>
                {selectedPaciente.fecha_nacimiento && (
                  <>
                    <span className="mx-1 text-slate-300">|</span>
                    <span className="text-slate-500">Nacimiento:</span>{' '}
                    <strong className="text-slate-800">{selectedPaciente.fecha_nacimiento}</strong>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Evolución Médica / Epicrisis (US-06) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#0284c7]" />
              2. Epicrisis / Notas de Evolución Clínica (US-06)
            </h2>
          </div>
          <div>
            <textarea
              rows={3}
              value={epicrisisContent}
              onChange={(e) => setEpicrisisContent(e.target.value)}
              placeholder="Registro clínico, motivo de consulta, examen físico, evolución y notas estructuradas..."
              className="w-full p-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Step 3: Diagnóstico (CIE-10) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#0284c7]" />
              3. Diagnóstico Clínico (CIE-10)
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
                placeholder="Ej: J00, Bronquitis, Caries, Dolor..."
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

        {/* Step 4: Solicitud de Exámenes (US-07: Generales vs Odontología) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#0284c7]" />
                4. Orden de Exámenes Clínicos y Dentales (US-07)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Exámenes generales (sangre, orina, ECG) y específicos para Odontología (radiografías, bitewing, Cone Beam).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setExamCategoryFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    examCategoryFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
                  }`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setExamCategoryFilter('General')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    examCategoryFilter === 'General' ? 'bg-[#0284c7] text-white shadow-xs font-bold' : 'text-slate-600'
                  }`}
                >
                  Generales
                </button>
                <button
                  type="button"
                  onClick={() => setExamCategoryFilter('Odontologico')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    examCategoryFilter === 'Odontologico' ? 'bg-teal-600 text-white shadow-xs font-bold' : 'text-slate-600'
                  }`}
                >
                  Odontología
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddExam}
                className="text-xs font-semibold bg-sky-50 hover:bg-sky-100 text-sky-800 px-3 py-1.5 rounded-lg border border-sky-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Solicitar Examen
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {examItems.length === 0 && (
              <p className="text-xs text-slate-500 italic py-2">Sin exámenes solicitados para esta consulta.</p>
            )}
            {examItems.map((item, idx) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold bg-sky-800 text-white px-2 py-0.5 rounded">
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
                      Seleccionar Examen ({examCategoryFilter === 'all' ? 'Catálogo Completo' : examCategoryFilter}):
                    </label>
                    <select
                      value={item.examen_id}
                      onChange={(e) => handleExamChange(idx, 'examen_id', Number(e.target.value))}
                      className="w-full py-2 px-3 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    >
                      {filteredExamenesCatalog.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          [{ex.codigo}] {ex.nombre} {ex.categoria ? `• (${ex.categoria})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Indicaciones / Sospecha Clínica / Pieza Dental:
                    </label>
                    <input
                      type="text"
                      value={item.indicaciones}
                      onChange={(e) => handleExamChange(idx, 'indicaciones', e.target.value)}
                      placeholder="Ej: Pieza 1.8 y 4.8 / Ayuno 8 horas..."
                      className="w-full py-2 px-3 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step 5: Prescripción Farmacológica (US-08: Predictivo + US-09: Excepciones) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Pill className="w-4 h-4 text-[#0284c7]" />
                5. Prescripción Farmacológica (Rp.)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Búsqueda predictiva sobre catálogo oficial o ingreso manual de excepción (US-08 / US-09).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenExceptionModal()}
                className="text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Ingresar un fármaco que no figure en el catálogo para agregarlo y seleccionarlo"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                + Excepción Manual
              </button>

              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-semibold bg-sky-50 hover:bg-sky-100 text-sky-800 px-3 py-1.5 rounded-lg border border-sky-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar Fármaco
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {items.length === 0 && (
              <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <Pill className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">Sin medicamentos prescritos para esta consulta.</p>
                <p className="text-xs text-slate-400 mt-0.5">Haz clic en "+ Agregar Fármaco" o "+ Excepción Manual" para prescribir.</p>
              </div>
            )}

            {items.map((item, idx) => {
              const selectedMed = medicamentos.find((m) => m.id === item.medicamento_id);
              const predictiveMatches = medicamentos.filter((m) => {
                if (!item.searchTerm) return false;
                const term = item.searchTerm.toLowerCase();
                return m.descripcion.toLowerCase().includes(term) || m.laboratorio.toLowerCase().includes(term);
              }).slice(0, 8);

              return (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold bg-[#0284c7] text-white px-2 py-0.5 rounded">
                        Rp. #{idx + 1}
                      </span>
                      {selectedMed && (
                        <span className="text-xs font-medium text-slate-600">
                          {selectedMed.descripcion}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-rose-600 hover:text-rose-800 p-1 hover:bg-rose-50 rounded transition-colors text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Eliminar
                    </button>
                  </div>

                  {/* Predictive Search Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2 relative">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Buscador Predictivo de Fármaco (US-08):
                      </label>
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={item.searchTerm !== undefined ? item.searchTerm : (selectedMed?.descripcion || '')}
                          onChange={(e) => {
                            handleItemChange(idx, 'searchTerm', e.target.value);
                            handleItemChange(idx, 'showSuggestions', true);
                          }}
                          onFocus={() => handleItemChange(idx, 'showSuggestions', true)}
                          placeholder="Escribe para buscar en 2000+ medicamentos (ej. Amoxi, Parac, Levo...)"
                          className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        />
                      </div>

                      {/* Dropdown suggestions */}
                      {item.showSuggestions && item.searchTerm && item.searchTerm.length >= 2 && (
                        <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                          {predictiveMatches.length > 0 ? (
                            predictiveMatches.map((m) => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => {
                                  handleItemChange(idx, 'medicamento_id', m.id);
                                  handleItemChange(idx, 'searchTerm', m.descripcion);
                                  handleItemChange(idx, 'showSuggestions', false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-sky-50 border-b border-slate-100 flex items-center justify-between text-xs cursor-pointer transition-colors"
                              >
                                <div>
                                  <span className="font-bold text-slate-800 block">{m.descripcion}</span>
                                  <span className="text-slate-400 text-[11px]">{m.laboratorio} • [{m.restriccion || 'Venta Directa'}]</span>
                                </div>
                                <Check className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
                              </button>
                            ))
                          ) : (
                            <div className="p-3 text-xs text-center space-y-2">
                              <p className="text-slate-500">No se encontraron fármacos con "{item.searchTerm}".</p>
                              <button
                                type="button"
                                onClick={() => {
                                  handleItemChange(idx, 'showSuggestions', false);
                                  handleOpenExceptionModal(idx);
                                }}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs inline-flex items-center gap-1 shadow-xs cursor-pointer"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                + Ingresar "{item.searchTerm}" como Excepción Manual
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Cantidad (Cajas / Frascos):
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

                  {/* Dosage & Duration */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Posología e Indicaciones de Toma:
                      </label>
                      <input
                        type="text"
                        value={item.tratamiento}
                        onChange={(e) => handleItemChange(idx, 'tratamiento', e.target.value)}
                        placeholder="Ej: 1 comprimido cada 8 horas por 7 días después de comidas..."
                        required
                        className="w-full py-2 px-3 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Duración del Tratamiento:
                      </label>
                      <input
                        type="text"
                        value={item.duracion}
                        onChange={(e) => handleItemChange(idx, 'duracion', e.target.value)}
                        placeholder="Ej: 7 días / 1 mes"
                        className="w-full py-2 px-3 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 6: General Indications */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            6. Indicaciones Médicas Generales y Medidas No Farmacológicas
          </label>
          <textarea
            rows={2}
            value={indicacionesGenerales}
            onChange={(e) => setIndicacionesGenerales(e.target.value)}
            placeholder="Reposo, régimen alimentario, ingesta de líquidos, fecha de próximo control..."
            className="w-full p-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Submit Actions (US-10) */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-3.5 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold rounded-xl text-sm flex items-center gap-2 transition-all shadow-md hover:shadow-sky-500/20 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            Emitir Receta Oficial y Despachar Correo (US-10)
          </button>
        </div>
      </form>

      {/* Modal for Manual Exception Drug (US-09) */}
      {showExceptionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                Ingreso Manual de Excepción (US-09)
              </h3>
              <button
                onClick={() => setShowExceptionModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Ingresa los datos del medicamento o fórmula magistral no encontrada en el catálogo. Se registrará en la base de datos para su prescripción y futuras sugerencias.
            </p>

            <form onSubmit={handleSaveExceptionMedicamento} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre del Fármaco / Principio Activo:
                </label>
                <input
                  type="text"
                  required
                  value={customMedName}
                  onChange={(e) => setCustomMedName(e.target.value)}
                  placeholder="Ej: Ciprofloxacino 500mg, Enjuague Clorhexidina 0.12%..."
                  className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Presentación:</label>
                  <input
                    type="text"
                    value={customMedPresentacion}
                    onChange={(e) => setCustomMedPresentacion(e.target.value)}
                    placeholder="Ej: Frasco 200ml / Caja x 20"
                    className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Laboratorio:</label>
                  <input
                    type="text"
                    value={customMedLab}
                    onChange={(e) => setCustomMedLab(e.target.value)}
                    placeholder="Ej: Recetario Magistral"
                    className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Receta / Restricción:</label>
                <select
                  value={customMedRestriccion}
                  onChange={(e) => setCustomMedRestriccion(e.target.value)}
                  className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
                >
                  <option value="Venta Directa">Venta Directa / Libre</option>
                  <option value="Receta Médica Simple">Receta Médica Simple</option>
                  <option value="Receta Médica Retenida">Receta Médica Retenida</option>
                  <option value="Receta Cheque">Receta Cheque (Estupefacientes)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowExceptionModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Guardar y Agregar a Prescripción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Rapid Patient Creation */}
      {showNewPacienteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#0284c7]" />
                Registrar Nuevo Paciente (US-02)
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
