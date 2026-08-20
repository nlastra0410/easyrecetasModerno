export interface Paciente {
  id: number;
  rut: string;
  dv: string;
  nombres: string;
  paterno: string;
  materno: string;
  fecha_nacimiento: string;
  correo: string;
  direccion?: string;
  telefono?: string;
  activo: string; // 'X' for active, '' for inactive
  created_at: string;
}

export interface Medicamento {
  id: number;
  codigo: string;
  descripcion: string;
  laboratorio: string;
  departamento: string;
  restriccion?: string;
  forma_farmaceutica?: string;
  presentacion?: string;
  activo: string;
}

export interface Diagnostico {
  id: number;
  codigo: string;
  descripcion: string;
  categoria?: string;
}

export interface Profesion {
  id: number;
  nombre: string;
}

export interface Medico {
  id: number;
  user_id: number;
  nombres: string;
  apellidos: string;
  rut: string;
  dv: string;
  registro_minsal: string;
  profesiones_id: number;
  profesion_nombre?: string;
  especialidad?: string;
  correo: string;
  telefono: string;
  firma_digital?: string;
}

export interface Examen {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria?: 'General' | 'Odontologico' | string;
  activo: string;
}

export interface Epicrisis {
  id: number;
  visita_id: number;
  paciente_id: number;
  medico_id: number;
  contenido: string; // HTML or Rich Text content
  created_at: string;
}

export interface OrdenExamen {
  id: number;
  visita_id: number;
  examen_id: number;
  examen?: Examen;
  indicaciones: string;
  estado: number; // 1: Solicitado, 2: Realizado
}

export interface RecetaItem {
  id: number;
  visita_id: number;
  medicamento_id: number;
  medicamento?: Medicamento;
  tratamiento: string;
  cantidad?: number;
  duracion?: string;
  estado: number; // 1: Emitida/Pendiente, 2: Parcialmente Despachada, 3: Dispensada/Quemada
  farmaceuta_id?: number;
  farmaceuta_nombre?: string;
  dispensado_fecha?: string;
  activo: string;
}

export interface Visita {
  id: number;
  medico_id: number;
  medico?: Medico;
  paciente_id: number;
  paciente?: Paciente;
  diagnostico_id?: number | null;
  diagnostico?: Diagnostico;
  tratamiento?: string;
  fecha: string;
  estado_id: number; // 1: Activa/Emitida, 2: Parcialmente Dispensada, 3: Dispensada Totalmente
  codigo_verificacion: string;
  activo: string;
  recetas: RecetaItem[];
  examenes?: OrdenExamen[];
  epicrisis?: Epicrisis[];
}

export interface Farmacia {
  id: number;
  nombre: string;
  direccion: string;
  comuna: string;
  ciudad: string;
  telefono: string;
  rut: string;
}

export interface Farmaceuta {
  id: number;
  user_id: number;
  nombres: string;
  paterno: string;
  materno: string;
  rut: string;
  dv: string;
  farmacia_id: number;
  farmacia_nombre?: string;
  correo: string;
  activo: string;
}

export type ViewTab = 
  | 'login'
  | 'dashboard'
  | 'nueva-receta'
  | 'visitas'
  | 'pacientes'
  | 'medicamentos'
  | 'examenes'
  | 'farmacia-despacho'
  | 'medicos'
  | 'verificador-publico';
