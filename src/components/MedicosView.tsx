import React, { useState } from 'react';
import { Medico, Profesion } from '../types';
import { formatRut } from '../utils/rut';
import { Stethoscope, ShieldCheck, Mail, Phone, Award, UserPlus, CheckCircle2 } from 'lucide-react';

interface MedicosViewProps {
  medicos: Medico[];
  profesiones: Profesion[];
  onAddNewMedico: (medico: Medico) => void;
}

export const MedicosView: React.FC<MedicosViewProps> = ({
  medicos,
  profesiones,
  onAddNewMedico
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [rut, setRut] = useState('');
  const [registroMinsal, setRegistroMinsal] = useState('');
  const [profesionId, setProfesionId] = useState<number>(profesiones[0]?.id || 1);
  const [especialidad, setEspecialidad] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = rut.replace(/[^0-9kK]+/g, '');
    const cuerpo = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1).toUpperCase();

    const selectedProf = profesiones.find((p) => p.id === Number(profesionId));

    const newMed: Medico = {
      id: Date.now(),
      user_id: Date.now(),
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      rut: cuerpo,
      dv: dv,
      registro_minsal: registroMinsal.trim() || `RNM-${Math.floor(100000 + Math.random() * 900000)}`,
      profesiones_id: Number(profesionId),
      profesion_nombre: selectedProf?.nombre || 'Médico General',
      especialidad: especialidad.trim() || selectedProf?.nombre,
      correo: correo.trim(),
      telefono: telefono.trim(),
      firma_digital: `DIGITAL_SIG_CERT_${Math.floor(100000 + Math.random() * 900000)}`
    };

    onAddNewMedico(newMed);
    setIsModalOpen(false);
    setNombres('');
    setApellidos('');
    setRut('');
    setRegistroMinsal('');
    setEspecialidad('');
    setCorreo('');
    setTelefono('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-[#0284c7]" />
            Cuerpo Médico y Especialidades
          </h1>
          <p className="text-xs text-slate-500">
            Directorio de profesionales facultados con firma electrónica avanzada y registro MINSAL.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Registrar Médico
        </button>
      </div>

      {/* Grid of Doctors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {medicos.map((med) => (
          <div
            key={med.id}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-sky-300 transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-sky-50 text-[#0284c7] flex items-center justify-center font-bold text-lg">
                  <Stethoscope className="w-6 h-6" />
                </div>

                <div className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" /> Firma Certificada
                </div>
              </div>

              <div>
                <h3 className="font-bold text-base text-slate-900 leading-snug">
                  {med.nombres} {med.apellidos}
                </h3>
                <p className="text-xs font-semibold text-sky-800 mt-0.5">
                  {med.especialidad || med.profesion_nombre}
                </p>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <p>
                  <span className="text-slate-400">RUT:</span>{' '}
                  <strong className="text-slate-800">{formatRut(`${med.rut}${med.dv}`)}</strong>
                </p>
                <p>
                  <span className="text-slate-400">Reg. MINSAL:</span>{' '}
                  <strong className="text-slate-800 font-mono">{med.registro_minsal}</strong>
                </p>
                {med.correo && (
                  <p className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{med.correo}</span>
                  </p>
                )}
                {med.telefono && (
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{med.telefono}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Habilitado para prescribir</span>
              <CheckCircle2 className="w-4 h-4 text-[#0284c7]" />
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Registrar Nuevo Médico</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nombres:</label>
                  <input
                    type="text"
                    required
                    value={nombres}
                    onChange={(e) => setNombres(e.target.value)}
                    placeholder="Dr. Roberto"
                    className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Apellidos:</label>
                  <input
                    type="text"
                    required
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                    placeholder="Vargas Silva"
                    className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">RUT:</label>
                  <input
                    type="text"
                    required
                    value={rut}
                    onChange={(e) => setRut(e.target.value)}
                    placeholder="14285719-3"
                    className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Registro MINSAL:</label>
                  <input
                    type="text"
                    value={registroMinsal}
                    onChange={(e) => setRegistroMinsal(e.target.value)}
                    placeholder="RNM-482910"
                    className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Profesión Principal:</label>
                  <select
                    value={profesionId}
                    onChange={(e) => setProfesionId(Number(e.target.value))}
                    className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    {profesiones.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Especialidad Clínica:</label>
                  <input
                    type="text"
                    value={especialidad}
                    onChange={(e) => setEspecialidad(e.target.value)}
                    placeholder="Medicina Interna, Cardiología..."
                    className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico:</label>
                  <input
                    type="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder="dr.nombre@easyrecetas.cl"
                    className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono:</label>
                  <input
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="+56 9 ..."
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
                  Registrar Médico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
