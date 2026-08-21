import { Profesion } from '../types';

/**
 * ============================================================================
 * DATOS MAESTROS NORMATIVOS Y REGULATORIOS (MINSAL / GOBIERNO DE CHILE)
 * ============================================================================
 * Estos datos corresponden a clasificaciones normativas, códigos sanitarios
 * y catálogos estandarizados por el Ministerio de Salud (MINSAL) y la
 * regulación farmacéutica chilena.
 * 
 * La data clínica (Pacientes, Médicos, Diagnósticos CIE-10, Medicamentos,
 * Farmacias, Farmacéuticos, Visitas y Recetas) se almacena y consulta
 * 100% de manera dinámica desde la Base de Datos (PostgreSQL Neon).
 */

// Catálogo Nacional de Profesiones Habilitadas para Prescripción (Código Sanitario DFL 725)
export const initialProfesiones: Profesion[] = [
  { id: 1, nombre: 'Médico Cirujano' },
  { id: 2, nombre: 'Médico General' },
  { id: 3, nombre: 'Cirujano Dentista / Odontólogo' },
  { id: 4, nombre: 'Pediatra' },
  { id: 5, nombre: 'Cardiólogo' },
  { id: 6, nombre: 'Dermatólogo' },
  { id: 7, nombre: 'Psiquiatra' },
  { id: 8, nombre: 'Traumatólogo' },
  { id: 9, nombre: 'Matrón / Matrona' },
];

// Previsiones de Salud Oficiales en Chile
export interface PrevisionSalud {
  id: string;
  nombre: string;
  tipo: 'Publico' | 'Privado' | 'FuerzasArmadas';
}

export const initialPrevisiones: PrevisionSalud[] = [
  { id: 'FONASA_A', nombre: 'FONASA Tramo A (Gratuidad Total)', tipo: 'Publico' },
  { id: 'FONASA_B', nombre: 'FONASA Tramo B (Gratuidad Total)', tipo: 'Publico' },
  { id: 'FONASA_C', nombre: 'FONASA Tramo C (Copago 10%)', tipo: 'Publico' },
  { id: 'FONASA_D', nombre: 'FONASA Tramo D (Copago 20%)', tipo: 'Publico' },
  { id: 'ISAPRE_BANMEDICA', nombre: 'ISAPRE Banmédica', tipo: 'Privado' },
  { id: 'ISAPRE_CONSALUD', nombre: 'ISAPRE Consalud', tipo: 'Privado' },
  { id: 'ISAPRE_COLMENA', nombre: 'ISAPRE Colmena Golden Cross', tipo: 'Privado' },
  { id: 'ISAPRE_CRUZBLANCA', nombre: 'ISAPRE CruzBlanca', tipo: 'Privado' },
  { id: 'ISAPRE_NUEVAMASVIDA', nombre: 'ISAPRE Nueva Masvida', tipo: 'Privado' },
  { id: 'ISAPRE_VIDATRES', nombre: 'ISAPRE Vida Tres', tipo: 'Privado' },
  { id: 'ISAPRE_ESENCIAL', nombre: 'ISAPRE Esencial', tipo: 'Privado' },
  { id: 'CAPREDENA', nombre: 'CAPREDENA (Fuerzas Armadas)', tipo: 'FuerzasArmadas' },
  { id: 'DIPRECA', nombre: 'DIPRECA (Carabineros / PDI / Gendarmería)', tipo: 'FuerzasArmadas' },
  { id: 'PARTICULAR', nombre: 'Particular / Sin Previsión', tipo: 'Privado' },
];

// Tipos de Receta Médica según Decreto Supremo Nº 466 de Farmacias
export interface TipoRecetaNormativa {
  codigo: string;
  nombre: string;
  descripcion: string;
  vigenciaDias: number;
}

export const initialTiposReceta: TipoRecetaNormativa[] = [
  {
    codigo: 'RECETA_SIMPLE',
    nombre: 'Receta Médica Simple',
    descripcion: 'Válida para fármacos ambulatorios estándar. Permite dispensación en cualquier farmacia.',
    vigenciaDias: 30
  },
  {
    codigo: 'RECETA_RETENIDA',
    nombre: 'Receta Médica Retenida (Control de Stock)',
    descripcion: 'Requiere registro de entrega y retención o control digital en farmacia (ej. antibióticos, psicotrópicos).',
    vigenciaDias: 30
  },
  {
    codigo: 'RECETA_CHEQUE',
    nombre: 'Receta Cheque (Estupefacientes y Psicotrópicos Lista I)',
    descripcion: 'Formulario oficial de talonario para medicamentos con estricto control sanitario.',
    vigenciaDias: 30
  },
  {
    codigo: 'VENTA_DIRECTA',
    nombre: 'Venta Directa / OTC',
    descripcion: 'Medicamentos que no requieren prescripción médica obligatoria.',
    vigenciaDias: 90
  }
];

// Estados Oficiales de la Receta Electrónica en el Ciclo de Vida
export interface EstadoReceta {
  id: number;
  nombre: string;
  descripcion: string;
  color: string;
}

export const initialEstadosReceta: EstadoReceta[] = [
  {
    id: 1,
    nombre: 'Emitida / Activa',
    descripcion: 'Receta firmada por el profesional de salud, lista para ser dispensada en farmacia.',
    color: 'emerald'
  },
  {
    id: 2,
    nombre: 'Parcialmente Dispensada',
    descripcion: 'Se han entregado parte de los medicamentos prescritos. Quedan ítems pendientes.',
    color: 'amber'
  },
  {
    id: 3,
    nombre: 'Totalmente Dispensada / Quemada',
    descripcion: 'Todos los fármacos han sido entregados. El folio queda invalidado para nuevos retiros.',
    color: 'slate'
  },
  {
    id: 4,
    nombre: 'Anulada / Vencida',
    descripcion: 'La receta superó el plazo legal de vigencia o fue anulada por el médico emisor.',
    color: 'rose'
  }
];
