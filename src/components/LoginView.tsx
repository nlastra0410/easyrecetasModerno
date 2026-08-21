import React, { useState } from 'react';
import { Phone, Mail, KeyRound, ArrowRight, ShieldCheck, User, Stethoscope, Building2 } from 'lucide-react';
import { EasyLogo } from './EasyLogo';

interface LoginViewProps {
  onLogin: (role: 'medico' | 'farmacia' | 'paciente', user: any) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [rut, setRut] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [tokenInput, setTokenInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [phoneMask, setPhoneMask] = useState('xxxx');
  const [emailMask, setEmailMask] = useState<string>('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [twilioActive, setTwilioActive] = useState<boolean>(false);
  const [emailSent, setEmailSent] = useState<boolean>(false);
  
  // Auto-detected role & identity metadata
  const [detectedRole, setDetectedRole] = useState<'medico' | 'farmacia' | null>(null);
  const [detectedRoleLabel, setDetectedRoleLabel] = useState<string>('');
  const [detectedUserName, setDetectedUserName] = useState<string>('');
  const [detectedSpecialty, setDetectedSpecialty] = useState<string>('');

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setDevCode(null);

    try {
      const res = await fetch('/api/auth/request-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rut: rut.trim() })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Error al solicitar código');
        return;
      }

      setDetectedRole(data.role || (data.user?.especialidad ? 'medico' : 'farmacia'));
      setDetectedRoleLabel(data.roleLabel || (data.role === 'farmacia' ? 'Químico Farmacéutico' : 'Médico Prescriptor'));
      setDetectedUserName(data.userName || '');
      setDetectedSpecialty(data.userSpecialty || '');
      setPhoneMask(data.phoneLastDigits || 'xxxx');
      setEmailMask(data.emailMask || '');
      setTwilioActive(Boolean(data.twilioConfigured));
      setEmailSent(Boolean(data.emailSent));
      if (data.devCode) {
        setDevCode(data.devCode);
      }
      setTokenInput('');
      setStep(2);
    } catch (err) {
      setError('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rut: rut.trim(), token: tokenInput })
      });
      
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Código incorrecto o expirado');
        return;
      }

      onLogin(data.role, data.user);
    } catch (err) {
      setError('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Header with Brand Gradient */}
        <div className="bg-gradient-to-br from-sky-600 via-sky-700 to-blue-800 p-8 text-center text-white">
          <div className="flex justify-center mb-3">
            <EasyLogo size="lg" whiteText={true} titleSecondPart="RECETAS" withSlogan={false} />
          </div>
          <p className="text-sky-200 text-xs font-semibold tracking-widest uppercase mt-1">Portal Oficial Profesionales de la Salud</p>
        </div>

        <div className="p-6 sm:p-8">
          {step === 1 ? (
            <form onSubmit={handleRequestToken} className="space-y-5">
              <div className="space-y-1 text-center mb-4">
                <h3 className="font-bold text-slate-900 text-lg">Ingreso Único de Profesionales</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Ingresa tu RUT. El sistema identificará automáticamente si eres <strong>Médico</strong>, <strong>Cirujano Dentista</strong> o <strong>Químico Farmacéutico</strong> y abrirá tu interfaz especializada.
                </p>
              </div>

              {/* Single RUT Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">RUT Profesional</label>
                  <span className="text-[10px] text-slate-400 font-mono">Ej: 12345678-9</span>
                </div>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={rut}
                    onChange={(e) => setRut(e.target.value)}
                    placeholder="12345678-9"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-[#0284c7] focus:ring-2 focus:ring-sky-200 focus:bg-white transition-all text-sm font-mono text-slate-900 font-semibold"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !rut.trim()}
                className="w-full py-3.5 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                {loading ? 'Identificando y enviando código...' : 'Solicitar Código de Acceso'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyToken} className="space-y-6 animate-fade-in">
              <div className="space-y-3 text-center mb-6">
                <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-2 text-[#0284c7]">
                  <KeyRound className="w-6 h-6" />
                </div>
                
                <h3 className="font-bold text-slate-900 text-lg">Verificar Identidad</h3>

                {/* Auto-detected identity confirmation card */}
                <div className={`p-3.5 rounded-xl border text-left flex items-start gap-3 shadow-2xs ${
                  detectedRole === 'farmacia'
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                    : 'bg-sky-50/80 border-sky-200 text-sky-950'
                }`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    detectedRole === 'farmacia' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'
                  }`}>
                    {detectedRole === 'farmacia' ? <Building2 className="w-4 h-4" /> : <Stethoscope className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block bg-white border shadow-2xs">
                        {detectedRoleLabel || (detectedRole === 'farmacia' ? 'Químico Farmacéutico' : 'Médico Prescriptor')}
                      </span>
                    </div>
                    {detectedUserName && (
                      <p className="font-bold text-sm text-slate-900 mt-1 truncate">
                        {detectedRole === 'medico' && !detectedUserName.startsWith('Dr') ? `Dr. ${detectedUserName}` : detectedUserName}
                      </p>
                    )}
                    {detectedSpecialty && (
                      <p className="text-[11px] text-slate-600 truncate">{detectedSpecialty}</p>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-600 leading-relaxed space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200 text-left">
                  {emailMask && (
                    <div className="flex items-center gap-1.5 text-xs text-sky-800 font-semibold">
                      <Mail className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
                      <span className="truncate">Código enviado a: <strong>{emailMask}</strong></span>
                    </div>
                  )}
                  {phoneMask && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Phone className="w-3 h-3 shrink-0" />
                      <span>SMS al móvil: ****{phoneMask}</span>
                    </div>
                  )}
                </div>
              </div>

              {devCode && (
                <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl text-center space-y-1.5 shadow-2xs">
                  <div className="text-xs text-sky-900 font-semibold flex items-center justify-center gap-1">
                    <span>Código de Acceso Inmediato:</span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-[#0284c7] tracking-widest bg-white py-1 px-4 rounded-lg border border-sky-200 inline-block shadow-inner">
                    {devCode}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    (Auto-rellenado para tu acceso rápido. También se despachó a tu correo registrado).
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider text-center block">Ingresa el Código de 6 dígitos</label>
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full text-center text-3xl tracking-widest px-4 py-3.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-[#0284c7] focus:ring-2 focus:ring-sky-200 focus:bg-white transition-all font-mono font-bold"
                  required
                  autoFocus
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || tokenInput.length < 6}
                className={`w-full py-3.5 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm cursor-pointer ${
                  detectedRole === 'farmacia'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-[#0284c7] hover:bg-[#0369a1]'
                }`}
              >
                {loading ? 'Verificando...' : `Validar e Ingresar como ${detectedRole === 'farmacia' ? 'Farmacéutico (QF)' : 'Médico/Dentista'}`}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setTokenInput('');
                  setError('');
                }}
                className="w-full py-2 text-xs text-slate-500 hover:text-slate-800 font-semibold transition-colors cursor-pointer"
              >
                ← Cambiar RUT
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
