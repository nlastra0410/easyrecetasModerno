export function generateVerificationCode(visitaId: number, pacienteId: number): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ER-${dateStr}-${visitaId}${pacienteId}${randomSuffix}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
}

export function getStatusBadge(estadoId: number): { label: string; bg: string; text: string; border: string } {
  switch (estadoId) {
    case 1:
      return {
        label: 'Emitida / Pendiente',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200'
      };
    case 2:
      return {
        label: 'Dispensación Parcial',
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200'
      };
    case 3:
      return {
        label: 'Dispensada / Quemada',
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-300'
      };
    default:
      return {
        label: 'Desconocido',
        bg: 'bg-slate-50',
        text: 'text-slate-600',
        border: 'border-slate-200'
      };
  }
}
