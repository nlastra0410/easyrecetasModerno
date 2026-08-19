import React, { useState } from 'react';
import { Visita } from '../types';
import { formatDate, getStatusBadge } from '../utils/helpers';
import { formatRut, cleanRut } from '../utils/rut';
import {
  MapPin,
  Clock,
  Mail,
  MessageCircle,
  FileText,
  AlertCircle,
  Pill,
  CheckCircle2,
  Stethoscope,
  User,
  ShieldCheck,
  Search,
  Building2,
  QrCode,
  Lock,
  PhoneCall,
  Activity,
  Award
} from 'lucide-react';
import { EasyLogo } from './EasyLogo';

interface VerificadorPublicoViewProps {
  visitas: Visita[];
  onViewReceta: (visita: Visita) => void;
  initialCode?: string;
}

export const VerificadorPublicoView: React.FC<VerificadorPublicoViewProps> = ({
  visitas,
  onViewReceta,
  initialCode = ''
}) => {
  const [code, setCode] = useState(initialCode);
  const [result, setResult] = useState<Visita | null>(() => {
    if (initialCode) {
      const term = initialCode.trim().toLowerCase();
      const cleanTermRut = cleanRut(term);
      return visitas.find((v) => {
        const matchCode = v.codigo_verificacion.toLowerCase().includes(term);
        const matchRut = cleanRut(`${v.paciente?.rut || ''}${v.paciente?.dv || ''}`).includes(cleanTermRut);
        return matchCode || (cleanTermRut.length >= 6 && matchRut);
      }) || null;
    }
    return null;
  });
  const [searched, setSearched] = useState(Boolean(initialCode));

  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!code.trim()) {
      setSearched(false);
      setResult(null);
      return;
    }

    const term = code.trim().toLowerCase();
    const cleanSearchRut = cleanRut(term);

    const found = visitas.find((v) => {
      const matchCode = v.codigo_verificacion.toLowerCase().includes(term);
      const matchRut = cleanRut(`${v.paciente?.rut || ''}${v.paciente?.dv || ''}`).includes(cleanSearchRut);
      return matchCode || (cleanSearchRut.length >= 6 && matchRut);
    });

    setResult(found || null);
    setSearched(true);
  };

  const handleSelectSample = (sampleCode: string) => {
    setCode(sampleCode);
    const found = visitas.find((v) => v.codigo_verificacion.toLowerCase() === sampleCode.toLowerCase());
    setResult(found || null);
    setSearched(true);
    const searchCard = document.getElementById('search-box-section');
    if (searchCard) {
      searchCard.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const status = result ? getStatusBadge(result.estado_id) : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col space-y-12 pb-16">
      
      {/* Hero Banner Section (Sky Blue / Celeste Theme) */}
      <section className="bg-gradient-to-br from-[#0369a1] via-[#0284c7] to-[#1e40af] text-white py-14 px-6 relative overflow-hidden shadow-sm">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute left-1/3 bottom-0 w-80 h-80 bg-sky-300/20 rounded-full blur-2xl pointer-events-none"></div>

        <div className="max-w-5xl mx-auto space-y-6 relative z-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-xs border border-white/20 text-sky-100 text-xs font-semibold tracking-wide shadow-xs">
            <ShieldCheck className="w-4 h-4 text-sky-300" />
            Portal Oficial de Verificación Sanitaria en Línea
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
              Verificador de <br className="hidden sm:block" />
              <span className="text-sky-200">Recetas Médicas Electrónicas</span>
            </h1>
            <p className="text-sm sm:text-base text-sky-100 max-w-2xl leading-relaxed">
              Consulta en tiempo real la autenticidad, firma electrónica médica avanzada, vigencia de prescripción y estado de dispensación en farmacias de todo Chile.
            </p>
          </div>

          {/* Standards Badges */}
          <div className="pt-2 flex flex-wrap gap-4 text-xs text-sky-100 justify-center sm:justify-start">
            <div className="flex items-center gap-1.5 bg-black/15 px-3 py-1 rounded-lg border border-white/15">
              <Award className="w-3.5 h-3.5 text-sky-300" />
              <span>Normativa MINSAL D.S. N° 466</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/15 px-3 py-1 rounded-lg border border-white/15">
              <Lock className="w-3.5 h-3.5 text-sky-300" />
              <span>Ley N° 19.799 Firma Electrónica Avanzada</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/15 px-3 py-1 rounded-lg border border-white/15">
              <QrCode className="w-3.5 h-3.5 text-sky-300" />
              <span>Trazabilidad Criptográfica QR</span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 space-y-12 -mt-10 relative z-20 w-full">
        
        {/* Search Card Section */}
        <div id="search-box-section" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-[#0284c7]">
                <Search className="w-4 h-4" />
              </div>
              <h2 className="font-bold text-slate-900 text-base">
                Consultar Código de Receta o RUT
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Documento digital con validez nacional
            </span>
          </div>

          <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ej. ER-20260819-17871586133796HUUN o RUT (18492019-2)..."
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0284c7] focus:border-[#0284c7] focus:outline-none text-slate-800 font-mono text-sm placeholder:font-sans transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-7 py-3.5 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              Verificar Receta
            </button>
          </form>

          {/* Quick Demo Chips */}
          <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 flex-wrap">
            <span className="font-semibold text-slate-400">Códigos de prueba:</span>
            {visitas.slice(0, 3).map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => handleSelectSample(v.codigo_verificacion)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-sky-50 hover:text-sky-700 rounded-lg text-slate-600 font-mono transition-colors border border-slate-200 cursor-pointer"
              >
                {v.codigo_verificacion}
              </button>
            ))}
          </div>
        </div>

        {/* Search Result (If searched) */}
        {searched && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
            {result && status ? (
              <div className="bg-white rounded-2xl border border-sky-200 shadow-xl overflow-hidden space-y-6">
                {/* Header Result */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-sky-400" />
                      <span className="font-bold text-lg">Receta Médica Electrónica Oficial</span>
                    </div>
                    <p className="text-xs text-slate-300 font-mono">
                      Código de Verificación: <strong className="text-sky-300">{result.codigo_verificacion}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${status.bg} ${status.text} ${status.border}`}>
                      {status.label}
                    </span>

                    <button
                      onClick={() => onViewReceta(result)}
                      className="px-4 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Ver Comprobante Oficial
                    </button>
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-6 sm:p-8 space-y-6">
                  {/* Doctor & Patient Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-xl border border-slate-200 text-sm">
                    <div className="space-y-1.5 border-b md:border-b-0 md:border-r border-slate-200 pb-3 md:pb-0 md:pr-4">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Stethoscope className="w-4 h-4 text-[#0284c7]" />
                        Médico Tratante (Firma Electrónica)
                      </span>
                      <p className="font-bold text-slate-900 text-base">
                        {result.medico?.nombres} {result.medico?.apellidos}
                      </p>
                      <p className="text-xs text-slate-600">
                        Especialidad: <strong>{result.medico?.especialidad || 'Médico Cirujano'}</strong>
                      </p>
                      <p className="text-xs text-slate-500 font-mono">
                        Registro MINSAL: {result.medico?.registro_minsal || 'Verificado'} • RUT: {formatRut(`${result.medico?.rut || ''}${result.medico?.dv || ''}`)}
                      </p>
                    </div>

                    <div className="space-y-1.5 md:pl-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-4 h-4 text-[#0284c7]" />
                        Paciente Identificado
                      </span>
                      <p className="font-bold text-slate-900 text-base">
                        {result.paciente?.nombres} {result.paciente?.paterno} {result.paciente?.materno}
                      </p>
                      <p className="text-xs text-slate-600">
                        RUT: <strong>{formatRut(`${result.paciente?.rut || ''}${result.paciente?.dv || ''}`)}</strong>
                      </p>
                      <p className="text-xs text-slate-500">
                        Fecha de Prescripción: <strong>{formatDate(result.fecha)}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Diagnosis */}
                  {result.diagnostico && (
                    <div className="p-4 bg-sky-50/70 border border-sky-200/80 rounded-xl text-sm space-y-1">
                      <span className="text-xs font-bold text-sky-900 uppercase tracking-wider flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5 text-[#0284c7]" />
                        Diagnóstico Clínico Registrado (CIE-10)
                      </span>
                      <p className="font-semibold text-slate-800">
                        [{result.diagnostico.codigo}] {result.diagnostico.descripcion}
                      </p>
                      {result.tratamiento && (
                        <p className="text-xs text-slate-600 mt-1">
                          Indicaciones médicas: {result.tratamiento}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Medications List */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Pill className="w-4 h-4 text-[#0284c7]" />
                        Fármacos Prescritos ({result.recetas?.length || 0})
                      </span>
                      <span className="text-xs text-slate-500 font-normal">
                        {result.estado_id === 3 ? 'Receta 100% Dispensada' : 'Pendiente de Dispensación'}
                      </span>
                    </h3>

                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                      {result.recetas && result.recetas.length > 0 ? (
                        result.recetas.map((item, idx) => {
                          const itemBadge = getStatusBadge(item.estado);
                          return (
                            <div key={item.id || idx} className="p-4 bg-white hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded">
                                    #{idx + 1}
                                  </span>
                                  <span className="font-bold text-slate-900">
                                    {item.medicamento?.descripcion}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600">
                                  Posología: <strong>{item.tratamiento}</strong>
                                </p>
                                <p className="text-xs text-slate-500">
                                  Cantidad autorizada: {item.cantidad || 1} caja(s)
                                </p>
                              </div>

                              <div className="text-right shrink-0">
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${itemBadge.bg} ${itemBadge.text} ${itemBadge.border}`}>
                                  {itemBadge.label}
                                </span>
                                {item.dispensado_fecha && (
                                  <p className="text-[11px] text-emerald-700 font-medium mt-1">
                                    Dispensado el {formatDate(item.dispensado_fecha)}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-6 text-center text-slate-400 text-xs bg-slate-50/50">
                          Atención de control médico general u orden de exámenes sin fármacos asociados.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-rose-200 p-12 text-center space-y-3 shadow-sm">
                <AlertCircle className="w-12 h-12 mx-auto text-rose-500" />
                <h3 className="font-bold text-lg text-slate-900">Receta Médica No Encontrada</h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                  No se encontró ningún documento médico con el código o RUT ingresado. Verifique que el código no tenga espacios adicionales o errores de tipeo.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 3 Medical Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-[#0284c7]">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Firma Electrónica Avanzada</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Prescripciones emitidas bajo estrictos estándares criptográficos y validez legal ante el Ministerio de Salud (MINSAL) y el ISP.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-[#0284c7]">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Red Nacional de Farmacias</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Presenta tu receta electrónica o código en cualquier farmacia autorizada del país para su validación y dispensación inmediata.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-[#0284c7]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Quema Segura y Antifraude</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              El sistema bloquea automáticamente recetas ya dispensadas, evitando adulteraciones, sobremedicación o duplicidad de retiros.
            </p>
          </div>
        </div>

        {/* Medical Workflow: ¿Cómo funciona? */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h2 className="text-xl font-bold text-slate-900">
              ¿Cómo funciona la Receta Médica Electrónica?
            </h2>
            <p className="text-xs text-slate-500">
              Flujo médico normado para pacientes y profesionales de la salud.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-center">
              <span className="w-7 h-7 rounded-full bg-[#0284c7] text-white font-bold text-xs inline-flex items-center justify-center shadow-xs">
                1
              </span>
              <h4 className="font-bold text-slate-800 text-sm">Prescripción Médica</h4>
              <p className="text-xs text-slate-600">
                El médico tratante genera la receta con diagnóstico CIE-10, fármacos y firma digital registrada.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-center">
              <span className="w-7 h-7 rounded-full bg-[#0284c7] text-white font-bold text-xs inline-flex items-center justify-center shadow-xs">
                2
              </span>
              <h4 className="font-bold text-slate-800 text-sm">Verificación Digital</h4>
              <p className="text-xs text-slate-600">
                El paciente recibe su código único por correo y puede verificar su validez en este portal o código QR.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-center">
              <span className="w-7 h-7 rounded-full bg-[#0284c7] text-white font-bold text-xs inline-flex items-center justify-center shadow-xs">
                3
              </span>
              <h4 className="font-bold text-slate-800 text-sm">Dispensación y Quema</h4>
              <p className="text-xs text-slate-600">
                La farmacia entrega los medicamentos y registra la quema en la red nacional de salud.
              </p>
            </div>
          </div>
        </div>

        {/* Footer & Legal Information Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 border-t border-slate-200">
          
          {/* Column 1: Contacto y Soporte */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#0284c7]" />
              Información de Contacto y Farmacia
            </h3>

            <div className="space-y-3.5 text-xs text-slate-600">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center shrink-0 text-[#0284c7]">
                  <MapPin size={15} />
                </div>
                <div>
                  <p className="font-bold text-slate-800">Dirección Central</p>
                  <p className="text-slate-500">Av. Manuel Montt 536, Providencia, Región Metropolitana</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center shrink-0 text-[#0284c7]">
                  <Clock size={15} />
                </div>
                <div>
                  <p className="font-bold text-slate-800">Horarios de Atención</p>
                  <p className="text-slate-500">Lunes a viernes: 08:00 a 21:00 hrs.<br/>Sábado: 11:00 a 15:00 hrs.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center shrink-0 text-[#0284c7]">
                  <Mail size={15} />
                </div>
                <div>
                  <p className="font-bold text-slate-800">Mesa de Ayuda</p>
                  <p className="text-slate-500">contacto@easyrecetas.cl</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center shrink-0 text-[#0284c7]">
                  <MessageCircle size={15} />
                </div>
                <div>
                  <p className="font-bold text-slate-800">Atención WhatsApp</p>
                  <p className="text-slate-500">+56 9 3445 6811</p>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Marco Legal & Normativa */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#0284c7]" />
              Información Legal y Sanitaria
            </h3>

            <div className="space-y-2 text-xs">
              {[
                'Términos y Condiciones del Servicio',
                'Derechos y Deberes del Paciente',
                'Reglamento de Farmacias D.S. 466/1984',
                'Reglamento de Productos Farmacéuticos D.S. 3/2010',
                'Ley N° 19.799 sobre Documentos Electrónicos'
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-2.5 py-1.5 text-slate-600 hover:text-[#0284c7] cursor-pointer transition-colors border-b border-slate-100 last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#0284c7]"></div>
                  <span>{text}</span>
                </div>
              ))}

              {/* Toxicological hotline CITUC */}
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl mt-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center shrink-0 text-rose-600">
                  <PhoneCall size={16} />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-xs">En caso de intoxicación (CITUC)</p>
                  <p className="font-bold text-rose-700 text-sm">+56 2 2635 3800</p>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Uso Racional y Alianzas */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-[#0284c7]" />
              Uso Racional de Medicamentos
            </h3>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3 text-center">
              <div className="flex justify-center items-center gap-2">
                <div className="w-6 h-4 bg-blue-700 rounded-xs"></div>
                <div className="w-6 h-4 bg-white border border-slate-300 rounded-xs"></div>
                <div className="w-6 h-4 bg-red-600 rounded-xs"></div>
                <span className="text-[11px] font-bold text-slate-700 ml-1">MINSAL CHILE</span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Consulte a su médico o farmacéutico antes de suspender o modificar su tratamiento prescrito.
              </p>

              <div className="grid grid-cols-4 gap-1 pt-1 text-[10px] font-bold text-white">
                <div className="bg-[#0284c7] py-1.5 rounded">1. Receta</div>
                <div className="bg-sky-600 py-1.5 rounded">2. Valida</div>
                <div className="bg-blue-600 py-1.5 rounded">3. Retira</div>
                <div className="bg-indigo-600 py-1.5 rounded">4. Cumple</div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
