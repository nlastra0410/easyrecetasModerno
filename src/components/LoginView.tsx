import React, { useState } from 'react';
import { Medico, Farmaceuta, Farmacia } from '../types';
import { Phone, Mail, KeyRound, ArrowRight, ShieldCheck, User } from 'lucide-react';
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

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setDevCode(null);

    try {
      const res = await fetch('/api/auth/request-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rut })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Error al solicitar código');
        return;
      }

      setPhoneMask(data.phoneLastDigits);
      setEmailMask(data.emailMask || '');
      setTwilioActive(Boolean(data.twilioConfigured));
      setEmailSent(Boolean(data.emailSent));
      if (data.devCode) {
        setDevCode(data.devCode);
        setTokenInput(data.devCode); // Pre-fill for quick access
      }
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
        body: JSON.stringify({ rut, token: tokenInput })
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
        
        {/* Header with White/Celeste Theme */}
        <div className="bg-gradient-to-br from-sky-600 via-sky-700 to-blue-800 p-8 text-center text-white">
          <div className="flex justify-center mb-3">
            <EasyLogo size="lg" whiteText={true} titleSecondPart="RECETAS" withSlogan={false} />
          </div>
          <p className="text-sky-200 text-xs font-semibold tracking-widest uppercase mt-1">Portal Oficial Profesionales</p>
        </div>

        <div className="p-8">
          {step === 1 ? (
            <form onSubmit={handleRequestToken} className="space-y-6">
              <div className="space-y-2 text-center mb-6">
                <h3 className="font-bold text-slate-900 text-lg">Acceso Seguro</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Ingresa tu RUT para recibir tu código de verificación seguro a tu correo electrónico registrado y/o celular.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">RUT (con dígito verificador)</label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={rut}
                    onChange={(e) => setRut(e.target.value)}
                    placeholder="Ej. 12345678-9"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-[#0284c7] focus:ring-2 focus:ring-sky-200 focus:bg-white transition-all text-sm"
                    required
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
                disabled={loading}
                className="w-full py-3.5 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                {loading ? 'Generando código...' : 'Solicitar Código de Acceso (Gratuito)'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyToken} className="space-y-6 animate-fade-in">
              <div className="space-y-2 text-center mb-6">
                <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-3 text-[#0284c7]">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Verificar Identidad</h3>
                <div className="text-xs text-slate-600 leading-relaxed space-y-1 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  {emailMask && (
                    <div className="flex items-center justify-center gap-1.5 text-xs text-sky-800 font-semibold">
                      <Mail className="w-3.5 h-3.5 text-[#0284c7]" />
                      <span>Enviado a: <strong>{emailMask}</strong></span>
                    </div>
                  )}
                  {phoneMask && (
                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                      <Phone className="w-3 h-3" />
                      <span>SMS asignado al móvil: ****{phoneMask}</span>
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
                disabled={loading}
                className="w-full py-3.5 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm cursor-pointer"
              >
                {loading ? 'Verificando...' : 'Validar e Ingresar'}
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
                Volver
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

