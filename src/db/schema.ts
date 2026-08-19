import { pgTable, serial, varchar, text, date, integer, timestamp, char } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// TABLAS MAESTRAS
export const pacientes = pgTable('pacientes', {
  id: serial('id').primaryKey(),
  rut: varchar('rut', { length: 20 }).notNull(),
  dv: char('dv', { length: 1 }).notNull(),
  nombres: varchar('nombres', { length: 255 }).notNull(),
  paterno: varchar('paterno', { length: 255 }).notNull(),
  materno: varchar('materno', { length: 255 }),
  fecha_nacimiento: date('fecha_nacimiento'),
  correo: varchar('correo', { length: 255 }),
  telefono: varchar('telefono', { length: 50 }),
  direccion: text('direccion'),
  activo: char('activo', { length: 1 }).default('X'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const medicos = pgTable('medicos', {
  id: serial('id').primaryKey(),
  nombres: varchar('nombres', { length: 255 }).notNull(),
  apellidos: varchar('apellidos', { length: 255 }).notNull(),
  rut: varchar('rut', { length: 20 }),
  dv: char('dv', { length: 1 }),
  telefono: varchar('telefono', { length: 50 }),
  correo: varchar('correo', { length: 255 }),
  registro_minsal: varchar('registro_minsal', { length: 100 }),
  especialidad: varchar('especialidad', { length: 255 }),
  activo: char('activo', { length: 1 }).default('X'),
});

export const diagnostico = pgTable('diagnostico', {
  id: serial('id').primaryKey(),
  codigo: varchar('codigo', { length: 50 }).notNull(),
  descripcion: text('descripcion').notNull(),
  activo: char('activo', { length: 1 }).default('X'),
});

export const medicamentos = pgTable('medicamentos', {
  id: serial('id').primaryKey(),
  codigo: varchar('codigo', { length: 100 }),
  descripcion: text('descripcion').notNull(),
  laboratorio: varchar('laboratorio', { length: 255 }),
  departamento: varchar('departamento', { length: 255 }),
  restriccion: varchar('restriccion', { length: 100 }),
  forma_farmaceutica: varchar('forma_farmaceutica', { length: 100 }),
  presentacion: text('presentacion'),
  activo: char('activo', { length: 1 }).default('X'),
});

export const examenes = pgTable('examenes', {
  id: serial('id').primaryKey(),
  codigo: varchar('codigo', { length: 100 }),
  nombre: text('nombre').notNull(),
  descripcion: text('descripcion'),
  activo: char('activo', { length: 1 }).default('X'),
});

export const farmacias = pgTable('farmacias', {
  id: serial('id').primaryKey(),
  nombre: varchar('nombre', { length: 255 }).notNull(),
  direccion: text('direccion'),
  comuna: varchar('comuna', { length: 100 }),
  ciudad: varchar('ciudad', { length: 100 }),
  telefono: varchar('telefono', { length: 50 }),
  rut: varchar('rut', { length: 20 }),
});

export const farmaceutas = pgTable('farmaceutas', {
  id: serial('id').primaryKey(),
  nombres: varchar('nombres', { length: 255 }).notNull(),
  paterno: varchar('paterno', { length: 255 }).notNull(),
  materno: varchar('materno', { length: 255 }),
  rut: varchar('rut', { length: 20 }),
  dv: char('dv', { length: 1 }),
  farmacia_id: integer('farmacia_id').references(() => farmacias.id),
  correo: varchar('correo', { length: 255 }),
  activo: char('activo', { length: 1 }).default('X'),
});

// TABLAS TRANSACCIONALES
export const visitas = pgTable('visitas', {
  id: serial('id').primaryKey(),
  medico_id: integer('medico_id').references(() => medicos.id).notNull(),
  paciente_id: integer('paciente_id').references(() => pacientes.id).notNull(),
  diagnostico_id: integer('diagnostico_id').references(() => diagnostico.id),
  tratamiento: text('tratamiento'), // Indicaciones generales
  fecha: timestamp('fecha').defaultNow(),
  estado_id: integer('estado_id').default(1), // 1: Emitida, 2: Parcial, 3: Total
  codigo_verificacion: varchar('codigo_verificacion', { length: 100 }),
  activo: char('activo', { length: 1 }).default('X'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const recetas = pgTable('recetas', {
  id: serial('id').primaryKey(),
  visita_id: integer('visita_id').references(() => visitas.id).notNull(),
  medicamento_id: integer('medicamento_id').references(() => medicamentos.id).notNull(),
  tratamiento: text('tratamiento').notNull(), // Posología
  cantidad: integer('cantidad').default(1),
  duracion: varchar('duracion', { length: 100 }),
  estado: integer('estado').default(1), // 1: Emitida, 2: Parcial, 3: Dispensada
  farmaceuta_id: integer('farmaceuta_id').references(() => farmaceutas.id),
  dispensado_fecha: timestamp('dispensado_fecha'),
  activo: char('activo', { length: 1 }).default('X'),
});

export const orden_examenes = pgTable('orden_examenes', {
  id: serial('id').primaryKey(),
  visita_id: integer('visita_id').references(() => visitas.id).notNull(),
  examen_id: integer('examen_id').references(() => examenes.id).notNull(),
  indicaciones: text('indicaciones'),
  estado: integer('estado').default(1), // 1: Solicitado, 2: Realizado
});

export const epicrisis = pgTable('epicrisis', {
  id: serial('id').primaryKey(),
  visita_id: integer('visita_id').references(() => visitas.id).notNull(),
  paciente_id: integer('paciente_id').references(() => pacientes.id).notNull(),
  medico_id: integer('medico_id').references(() => medicos.id).notNull(),
  contenido: text('contenido').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// RELACIONES
export const visitasRelations = relations(visitas, ({ one, many }) => ({
  medico: one(medicos, { fields: [visitas.medico_id], references: [medicos.id] }),
  paciente: one(pacientes, { fields: [visitas.paciente_id], references: [pacientes.id] }),
  diagnostico: one(diagnostico, { fields: [visitas.diagnostico_id], references: [diagnostico.id] }),
  recetas: many(recetas),
  examenes: many(orden_examenes),
  epicrisis: many(epicrisis),
}));

export const recetasRelations = relations(recetas, ({ one }) => ({
  visita: one(visitas, { fields: [recetas.visita_id], references: [visitas.id] }),
  medicamento: one(medicamentos, { fields: [recetas.medicamento_id], references: [medicamentos.id] }),
  farmaceuta: one(farmaceutas, { fields: [recetas.farmaceuta_id], references: [farmaceutas.id] }),
}));

export const ordenExamenesRelations = relations(orden_examenes, ({ one }) => ({
  visita: one(visitas, { fields: [orden_examenes.visita_id], references: [visitas.id] }),
  examen: one(examenes, { fields: [orden_examenes.examen_id], references: [examenes.id] }),
}));

export const epicrisisRelations = relations(epicrisis, ({ one }) => ({
  visita: one(visitas, { fields: [epicrisis.visita_id], references: [visitas.id] }),
  paciente: one(pacientes, { fields: [epicrisis.paciente_id], references: [pacientes.id] }),
  medico: one(medicos, { fields: [epicrisis.medico_id], references: [medicos.id] }),
}));
