import React, { useState } from 'react';
import { Visita } from '../types';
import { formatDate, getStatusBadge } from '../utils/helpers';
import { formatRut } from '../utils/rut';
import { EasyLogo } from './EasyLogo';
import {
  Printer,
  Mail,
  CheckCircle2,
  ShieldCheck,
  QrCode,
  FileText,
  X,
  Send,
  AlertCircle,
  Edit3
} from 'lucide-react';

interface RecetaModalProps {
  visita: Visita | null;
  onClose: () => void;
  onSendEmail?: (visita: Visita) => void;
}

export const RecetaModal: React.FC<RecetaModalProps> = ({ visita, onClose, onSendEmail }) => {
  const [emailSent, setEmailSent] = useState(false);
  const [sentToAddress, setSentToAddress] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [targetEmail, setTargetEmail] = useState(visita?.paciente?.correo || '');

  React.useEffect(() => {
    if (visita?.paciente?.correo) {
      setTargetEmail(visita.paciente.correo);
    }
  }, [visita]);

  if (!visita) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async (overrideEmail?: string) => {
    const emailToUse = (overrideEmail || targetEmail || visita.paciente?.correo || '').trim();
    if (!emailToUse) {
      setShowEmailPrompt(true);
      return;
    }

    setIsSending(true);
    setErrorMessage('');
    setEmailSent(false);

    try {
      const res = await fetch(`/api/visitas/${visita.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetEmail: emailToUse,
          visitaPayload: visita
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setEmailSent(true);
        setSentToAddress(emailToUse);
        setShowEmailPrompt(false);
        if (onSendEmail) onSendEmail(visita);
        setTimeout(() => setEmailSent(false), 8000);
      } else {
        setErrorMessage(data.error || 'Error al enviar el correo. Por favor intente nuevamente.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Error de conexión con el servidor de correo.');
    } finally {
      setIsSending(false);
    }
  };

  const status = getStatusBadge(visita.estado_id);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200">
        {/* Modal Controls (No Print) */}
        <div className="no-print bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-400" />
            <span className="font-semibold text-base">Comprobante de Receta Médica Electrónica</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (visita.paciente?.correo && !showEmailPrompt) {
                  handleSendEmail(visita.paciente.correo);
                } else {
                  setShowEmailPrompt(!showEmailPrompt);
                }
              }}
              disabled={isSending}
              className="px-3.5 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              title="Enviar por correo electrónico real al paciente"
            >
              <Mail className="w-4 h-4" />
              {isSending ? 'Enviando correo...' : 'Enviar al Paciente'}
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Imprimir / PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Email Prompt Panel if opened */}
        {showEmailPrompt && (
          <div className="no-print bg-sky-50 border-b border-sky-200 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0284c7] uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                Destinatario de la Receta Médica
              </span>
              <button
                onClick={() => setShowEmailPrompt(false)}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
              >
                Cancelar
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="email"
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                placeholder="Ingresa el correo del paciente (ej: paciente@correo.com)"
                className="flex-1 px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              <button
                onClick={() => handleSendEmail()}
                disabled={isSending || !targetEmail.trim()}
                className="px-4 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                {isSending ? 'Enviando...' : 'Despachar Ahora'}
              </button>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {emailSent && (
          <div className="no-print bg-emerald-50 border-b border-emerald-200 px-6 py-3 flex items-center gap-2.5 text-emerald-800 text-sm animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              ¡Receta médica electrónica despachada con éxito a <strong>{sentToAddress}</strong>!
            </span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="no-print bg-rose-50 border-b border-rose-200 px-6 py-3 flex items-center gap-2.5 text-rose-800 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Printable Prescription Document */}
        <div className="p-8 space-y-6 text-slate-800 bg-white" id="receta-documento">
          {/* Header */}
          <div className="border-b-2 border-[#0284c7] pb-4 flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <EasyLogo size="md" />
                <h2 className="text-xl font-bold text-sky-950 tracking-tight">EasyReceta Digital</h2>
              </div>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                Sistema Nacional de Prescripción Médica Electrónica
              </p>
            </div>

            <div className="text-right">
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold uppercase tracking-wider"
                style={{ borderColor: status.border, backgroundColor: status.bg, color: status.text }}
              >
                <span className="w-2 h-2 rounded-full bg-current"></span>
                {status.label}
              </div>
              <p className="text-xs font-mono text-slate-500 mt-1">
                Cód: <span className="font-semibold text-slate-800">{visita.codigo_verificacion}</span>
              </p>
              <p className="text-xs text-slate-500">Fecha: {formatDate(visita.fecha)}</p>
            </div>
          </div>

          {/* Doctor and Patient Grid */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm">
            {/* Medico */}
            <div className="space-y-1 border-r border-slate-200 pr-4">
              <h4 className="text-xs font-bold text-sky-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0284c7]" />
                Médico Prescriptor
              </h4>
              <p className="font-semibold text-slate-900">{visita.medico?.nombres} {visita.medico?.apellidos}</p>
              <p className="text-xs text-slate-600">
                Especialidad: <span className="font-medium text-slate-800">{visita.medico?.especialidad || visita.medico?.profesion_nombre || 'Medicina General'}</span>
              </p>
              <p className="text-xs text-slate-600">
                RUT: <span className="font-medium text-slate-800">{formatRut(`${visita.medico?.rut || ''}${visita.medico?.dv || ''}`)}</span>
              </p>
              <p className="text-xs text-slate-600">
                Reg. MINSAL: <span className="font-medium text-slate-800">{visita.medico?.registro_minsal || 'RNM-715820'}</span>
              </p>
            </div>

            {/* Paciente */}
            <div className="space-y-1 pl-2">
              <h4 className="text-xs font-bold text-sky-900 uppercase tracking-wider">
                Datos del Paciente
              </h4>
              <p className="font-semibold text-slate-900">
                {visita.paciente?.nombres} {visita.paciente?.paterno} {visita.paciente?.materno}
              </p>
              <p className="text-xs text-slate-600">
                RUT: <span className="font-medium text-slate-800">{formatRut(`${visita.paciente?.rut || ''}${visita.paciente?.dv || ''}`)}</span>
              </p>
              <p className="text-xs text-slate-600">
                Fecha Nac.: <span className="font-medium text-slate-800">{visita.paciente?.fecha_nacimiento || 'No registrada'}</span>
              </p>
              <div className="flex items-center gap-1 text-xs text-slate-600">
                <span>Contacto:</span>
                <span className="font-medium text-slate-800">{visita.paciente?.correo || visita.paciente?.telefono || 'Sin correo registrado'}</span>
                <button
                  onClick={() => setShowEmailPrompt(true)}
                  className="no-print text-[#0284c7] hover:text-[#0369a1] ml-1 p-0.5 cursor-pointer"
                  title="Cambiar correo de envío"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Diagnóstico */}
          {visita.diagnostico && (
            <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 text-sm">
              <span className="text-xs font-bold text-sky-900 uppercase tracking-wider block mb-0.5">
                Diagnóstico Principal (CIE-10):
              </span>
              <p className="text-slate-800 font-medium">
                <span className="font-bold text-[#0284c7]">[{visita.diagnostico.codigo}]</span> {visita.diagnostico.descripcion}
              </p>
            </div>
          )}

          {/* Epicrisis */}
          {visita.epicrisis && visita.epicrisis.length > 0 && (
            <div className="space-y-2 mb-6">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b pb-1">
                Evolución Clínica (Epicrisis)
              </h4>
              {visita.epicrisis.map((epi, idx) => (
                <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm">
                  <p className="whitespace-pre-wrap text-slate-700">{epi.contenido}</p>
                </div>
              ))}
            </div>
          )}

          {/* Orden de Exámenes */}
          {visita.examenes && visita.examenes.length > 0 && (
            <div className="space-y-3 mb-6">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between border-b pb-1">
                <span>Orden de Exámenes</span>
                <span className="text-xs font-normal text-slate-500">Cantidad: {visita.examenes.length}</span>
              </h4>
              <div className="divide-y divide-slate-200 border rounded-xl overflow-hidden">
                {visita.examenes.map((orden, idx) => (
                  <div key={idx} className="p-4 bg-white flex items-start gap-4">
                    <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md mt-0.5">
                      #{idx + 1}
                    </span>
                    <div className="space-y-1">
                      <p className="font-bold text-slate-900 text-base">
                        [{orden.examen?.codigo}] {orden.examen?.nombre}
                      </p>
                      {orden.indicaciones && (
                        <p className="text-sm text-slate-700">
                          <strong className="text-slate-500">Indicaciones:</strong> {orden.indicaciones}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Medicamentos Prescritos */}
          <div className="space-y-3 mb-6">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between border-b pb-1">
              <span>Medicamentos Prescritos (Rp.)</span>
              <span className="text-xs font-normal text-slate-500">Cantidad de fármacos: {visita.recetas?.length || 0}</span>
            </h4>

            <div className="divide-y divide-slate-200 border rounded-xl overflow-hidden">
              {visita.recetas && visita.recetas.length > 0 ? (
                visita.recetas.map((item, idx) => {
                  const itemStatus = getStatusBadge(item.estado);
                  return (
                    <div key={item.id || idx} className="p-4 bg-white hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold bg-sky-100 text-sky-900 px-2 py-0.5 rounded-md">
                              #{idx + 1}
                            </span>
                            <span className="font-bold text-slate-900 text-base">
                              {item.medicamento?.descripcion || 'Medicamento prescrito'}
                            </span>
                            {item.medicamento?.restriccion && (
                              <span className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded border">
                                {item.medicamento.restriccion}
                              </span>
                            )}
                          </div>

                          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-sm">
                            <span className="text-xs font-semibold text-slate-500 uppercase block">Posología / Instrucciones:</span>
                            <p className="text-slate-800 font-medium mt-0.5">{item.tratamiento}</p>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            {item.medicamento?.laboratorio && (
                              <span>Lab: <strong className="text-slate-700">{item.medicamento.laboratorio}</strong></span>
                            )}
                            {item.duracion && (
                              <span>Duración: <strong className="text-slate-700">{item.duracion}</strong></span>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`text-[11px] font-semibold px-2 py-1 rounded-full border ${itemStatus.bg} ${itemStatus.text} ${itemStatus.border}`}>
                            {itemStatus.label}
                          </span>
                          {item.dispensado_fecha && (
                            <p className="text-[10px] text-slate-400 mt-1">
                              Dispensado: {formatDate(item.dispensado_fecha)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-slate-400 text-sm">Sin medicamentos prescritos</div>
              )}
            </div>
          </div>

          {/* Indicaciones Generales */}
          {visita.tratamiento && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-sm space-y-1">
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Indicaciones Médicas Generales & Cuidados
              </h5>
              <p className="text-slate-700 leading-relaxed">{visita.tratamiento}</p>
            </div>
          )}

          {/* Footer with Digital Signature and QR */}
          <div className="pt-4 border-t-2 border-slate-200 grid grid-cols-3 gap-4 items-center">
            {/* QR / Barcode */}
            <div className="flex items-center gap-3 col-span-2">
              <div className="w-16 h-16 bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-center p-1">
                <QrCode className="w-12 h-12 text-slate-800" />
              </div>
              <div className="space-y-0.5 text-xs text-slate-500">
                <p className="font-semibold text-slate-800">Verificación Oficial en Línea</p>
                <p>Escanee el código o ingrese a <strong>easyrecetas.cl/verificar</strong></p>
                <p className="font-mono text-[11px] text-[#0284c7] font-bold">{visita.codigo_verificacion}</p>
              </div>
            </div>

            {/* Doctor Signature Box */}
            <div className="text-center border-t border-slate-400 pt-2">
              <div className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold mb-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Firma Electrónica Avanzada
              </div>
              <p className="text-xs font-bold text-slate-900">{visita.medico?.nombres} {visita.medico?.apellidos}</p>
              <p className="text-[10px] text-slate-500">R.U.T. {formatRut(`${visita.medico?.rut || ''}${visita.medico?.dv || ''}`)}</p>
              <p className="text-[10px] text-slate-500">Reg. MINSAL {visita.medico?.registro_minsal || 'RNM-715820'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
