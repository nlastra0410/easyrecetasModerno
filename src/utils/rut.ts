/**
 * Utility functions for Chilean RUT validation, formatting, and calculation
 */

export function cleanRut(rut: string): string {
  return typeof rut === 'string'
    ? rut.replace(/[^0-9kK]+/g, '').toUpperCase()
    : '';
}

export function formatRut(rutInput: string): string {
  const cleaned = cleanRut(rutInput);
  if (cleaned.length < 2) return cleaned;
  
  const cuerpo = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  
  // Format with dots
  let formatted = '';
  let j = 0;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    formatted = cuerpo.charAt(i) + formatted;
    j++;
    if (j % 3 === 0 && i !== 0) {
      formatted = '.' + formatted;
    }
  }
  
  return `${formatted}-${dv}`;
}

export function calculateDv(cuerpo: string): string {
  let suma = 0;
  let multiplo = 2;
  
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo.charAt(i), 10) * multiplo;
    multiplo = multiplo < 7 ? multiplo + 1 : 2;
  }
  
  const dvr = 11 - (suma % 11);
  if (dvr === 11) return '0';
  if (dvr === 10) return 'K';
  return dvr.toString();
}

export function validateRut(rutCompleto: string): boolean {
  const cleaned = cleanRut(rutCompleto);
  if (cleaned.length < 8 || cleaned.length > 9) return false;
  
  const cuerpo = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  
  return calculateDv(cuerpo) === dv;
}
