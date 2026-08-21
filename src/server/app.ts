import 'dotenv/config';
import express from 'express';
import { db } from '../db/index.js';
import {
  pacientes,
  medicos,
  diagnostico,
  medicamentos,
  examenes,
  farmacias,
  farmaceutas,
  visitas,
  recetas,
  orden_examenes,
  epicrisis,
  authTokensTable
} from '../db/schema.js';
import { eq, or, sql, desc } from 'drizzle-orm';
import twilio from 'twilio';
import nodemailer from 'nodemailer';

// In-memory token store for 2FA OTP codes
const authTokens = new Map<string, { token: string; user: any; role: string; expires: number }>();

function maskEmail(email?: string): string {
  if (!email || !email.includes('@')) return 'correo registrado';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user[0]}*@${domain}`;
  return `${user[0]}${'*'.repeat(Math.min(user.length - 2, 5))}${user[user.length - 1]}@${domain}`;
}

async function sendAuthEmail(toEmail: string, token: string, userName: string): Promise<boolean> {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const user = process.env.SMTP_USER || 'nelsonlastra4@gmail.com';
  const pass = process.env.SMTP_PASS || 'gzgejylqjadxsyrg';
  const from = process.env.SMTP_FROM || `"EasyRecetas Seguridad" <${user}>`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #0369a1; margin: 0; font-size: 24px; letter-spacing: 1px;">Easy<span style="font-weight: 800; color: #0284c7;">Recetas</span></h2>
        <p style="color: #0ea5e9; font-size: 11px; font-weight: 600; margin-top: 2px;">Tu Salud nos Mueve</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 4px; text-transform: uppercase;">Portal Oficial Profesionales de la Salud</p>
      </div>
      <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
        <p style="color: #0369a1; font-size: 14px; margin-bottom: 12px;">Estimado(a) <strong>${userName}</strong>, tu código de acceso seguro es:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0284c7; font-family: monospace; padding: 8px 16px; background-color: #ffffff; border-radius: 6px; display: inline-block; border: 2px dashed #38bdf8;">
          ${token}
        </div>
      </div>
      <p style="color: #475569; font-size: 13px; line-height: 1.5; margin-bottom: 8px;">
        Este código es confidencial y caducará automáticamente en <strong>5 minutos</strong>.
      </p>
      <p style="color: #94a3b8; font-size: 11px; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 12px; text-align: center;">
        Si tú no solicitaste este acceso, por favor desestima este correo o contacta a soporte de EasyRecetas.
      </p>
    </div>
  `;

  if (user && pass) {
    try {
      const isGmail = host.includes('gmail') || user.endsWith('@gmail.com');
      const transporterConfig: any = isGmail
        ? {
            service: 'gmail',
            auth: { user, pass }
          }
        : {
            host,
            port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
            secure: process.env.SMTP_PORT === '465',
            auth: { user, pass }
          };

      const transporter = nodemailer.createTransport(transporterConfig);

      await transporter.sendMail({
        from,
        to: toEmail,
        subject: `🔑 Código de Acceso EasyRecetas: ${token}`,
        text: `Tu código de seguridad EasyRecetas es: ${token}. Válido por 5 minutos.`,
        html: htmlContent
      });
      console.log(`[REAL EMAIL SENT] Correo con código ${token} enviado exitosamente a ${toEmail}`);
      return true;
    } catch (err: any) {
      console.error("[SMTP ERROR al enviar correo]:", err?.message || err);
      return false;
    }
  } else {
    console.warn(`[EMAIL DISPATCH] Para: ${toEmail} (${userName}) | Código: ${token}`);
    return false;
  }
}

async function sendPrescriptionEmail(toEmail: string, visita: any): Promise<boolean> {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const user = process.env.SMTP_USER || 'nelsonlastra4@gmail.com';
  const pass = process.env.SMTP_PASS || 'gzgejylqjadxsyrg';
  const from = process.env.SMTP_FROM || `"EasyReceta Digital" <${user}>`;

  const patientName = `${visita.paciente?.nombres || ''} ${visita.paciente?.paterno || ''} ${visita.paciente?.materno || ''}`.trim() || 'Paciente';
  const doctorName = `${visita.medico?.nombres || ''} ${visita.medico?.apellidos || ''}`.trim() || 'Médico Tratante';
  const doctorMinsal = visita.medico?.registro_minsal || 'RNM-715820';
  const codigo = visita.codigo_verificacion || 'REC-XXXX';
  const fecha = visita.fecha ? new Date(visita.fecha).toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('es-CL');
  const diagnosticoDesc = visita.diagnostico ? `[${visita.diagnostico.codigo}] ${visita.diagnostico.descripcion}` : 'Control Médico General';
  const epicrisisText = visita.epicrisis && visita.epicrisis.length > 0 ? visita.epicrisis.map((e: any) => e.contenido).join('\n') : '';

  const medicamentosHtml = (visita.recetas && visita.recetas.length > 0)
    ? visita.recetas.map((r: any, idx: number) => `
        <div style="background-color: #f8fafc; border-left: 4px solid #13b0a5; padding: 12px 14px; margin-bottom: 10px; border-radius: 6px; border: 1px solid #e2e8f0; border-left-width: 4px; border-left-color: #13b0a5;">
          <p style="margin: 0 0 4px 0; font-size: 15px; font-weight: bold; color: #0f172a;">${idx + 1}. ${r.medicamento?.descripcion || 'Medicamento Prescrito'} ${r.medicamento?.restriccion ? `<span style="font-size: 11px; color: #f27271; font-weight: 600;">(${r.medicamento.restriccion})</span>` : ''}</p>
          <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.4;"><strong>Posología / Instrucciones:</strong> ${r.tratamiento || 'Según indicación médica'}</p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">Cantidad autorizada: <strong>${r.cantidad || 1} caja(s)</strong> ${r.duracion ? `| Duración: ${r.duracion}` : ''}</p>
        </div>
      `).join('')
    : '<p style="color: #64748b; font-style: italic; padding: 8px;">Sin medicamentos prescritos.</p>';

  const examenesHtml = (visita.examenes && visita.examenes.length > 0)
    ? visita.examenes.map((ex: any, idx: number) => `
        <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 10px 14px; margin-bottom: 8px; border-radius: 6px; border: 1px solid #dcfce7; border-left-width: 4px; border-left-color: #10b981;">
          <p style="margin: 0; font-size: 14px; font-weight: bold; color: #065f46;">${idx + 1}. [${ex.examen?.codigo || 'EXAM'}] ${ex.examen?.nombre || 'Examen'}</p>
          ${ex.indicaciones ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #15803d;">Indicaciones: ${ex.indicaciones}</p>` : ''}
        </div>
      `).join('')
    : '';

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
      <div style="text-align: center; padding-bottom: 16px; border-bottom: 2px solid #13b0a5; margin-bottom: 20px;">
        <h1 style="color: #0c706a; margin: 0; font-size: 26px; letter-spacing: 0.5px; font-weight: 300;">Easy<span style="color: #13b0a5; font-weight: 800;">Receta Digital</span></h1>
        <p style="color: #64748b; font-size: 11px; margin-top: 4px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Sistema Nacional de Prescripción Médica Electrónica</p>
      </div>

      <div style="background-color: #e7f7f6; border: 1px solid #99f6e4; padding: 16px; border-radius: 12px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 15px; color: #0c706a; font-weight: 600;">
          Estimado(a) ${patientName}:
        </p>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #0f766e; line-height: 1.5;">
          El <strong>Dr. ${doctorName}</strong> ha emitido tu receta médica electrónica a través de EasyReceta. Puedes presentar este comprobante o tu código de verificación en cualquier farmacia del país para la dispensación de tus medicamentos.
        </p>
      </div>

      <div style="background-color: #0f172a; color: #ffffff; padding: 16px 20px; border-radius: 12px; text-align: center; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; display: block; margin-bottom: 6px; font-weight: 600;">Código Oficial de Verificación</span>
        <span style="font-family: monospace; font-size: 22px; font-weight: bold; color: #2dd4bf; letter-spacing: 2px;">${codigo}</span>
        <span style="display: block; font-size: 11px; color: #94a3b8; margin-top: 6px;">Fecha de Emisión: ${fecha}</span>
      </div>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 12px; border-right: 1px solid #e2e8f0;">
              <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #0c706a; display: block; margin-bottom: 4px;">Médico Prescriptor</span>
              <p style="margin: 0; font-size: 14px; font-weight: bold; color: #0f172a;">Dr. ${doctorName}</p>
              <p style="margin: 2px 0 0 0; font-size: 12px; color: #475569;">Reg. MINSAL: <strong>${doctorMinsal}</strong></p>
              <p style="margin: 2px 0 0 0; font-size: 12px; color: #475569;">Especialidad: ${visita.medico?.especialidad || 'Medicina General'}</p>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 12px;">
              <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #0c706a; display: block; margin-bottom: 4px;">Datos del Paciente</span>
              <p style="margin: 0; font-size: 14px; font-weight: bold; color: #0f172a;">${patientName}</p>
              <p style="margin: 2px 0 0 0; font-size: 12px; color: #475569;">RUT: <strong>${visita.paciente?.rut || ''}-${visita.paciente?.dv || ''}</strong></p>
              <p style="margin: 2px 0 0 0; font-size: 12px; color: #475569;">Diagnóstico: <strong>${diagnosticoDesc}</strong></p>
            </td>
          </tr>
        </table>
      </div>

      ${epicrisisText ? `
        <div style="margin-bottom: 20px; padding: 14px; background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px;">
          <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #92400e; display: block; margin-bottom: 6px;">Evolución Clínica / Indicaciones del Tratamiento:</span>
          <p style="margin: 0; font-size: 13px; color: #78350f; white-space: pre-wrap; line-height: 1.5;">${epicrisisText}</p>
        </div>
      ` : ''}

      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 13px; font-weight: 800; text-transform: uppercase; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px; letter-spacing: 0.5px;">
          Medicamentos Prescritos (Rp.)
        </h3>
        ${medicamentosHtml}
      </div>

      ${examenesHtml ? `
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 13px; font-weight: 800; text-transform: uppercase; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px; letter-spacing: 0.5px;">
            Órdenes de Exámenes Solicitados
          </h3>
          ${examenesHtml}
        </div>
      ` : ''}

      ${visita.tratamiento ? `
        <div style="margin-bottom: 20px; padding: 12px 14px; background-color: #f1f5f9; border-radius: 10px; font-size: 12px; color: #334155;">
          <strong>Indicaciones Adicionales:</strong> ${visita.tratamiento}
        </div>
      ` : ''}

      <div style="border-top: 2px solid #e2e8f0; padding-top: 16px; margin-top: 24px; text-align: center;">
        <p style="font-size: 12px; color: #059669; font-weight: bold; margin: 0 0 4px 0;">
          ✓ Documento emitido con Firma Electrónica Avanzada (Ley N° 19.799)
        </p>
        <p style="font-size: 11px; color: #94a3b8; margin: 0;">
          Para validar este documento en línea o verificar su vigencia, ingrese a EasyReceta con el código <strong>${codigo}</strong>.
        </p>
      </div>
    </div>
  `;

  if (user && pass) {
    try {
      const isGmail = host.includes('gmail') || user.endsWith('@gmail.com');
      const transporterConfig: any = isGmail
        ? { service: 'gmail', auth: { user, pass } }
        : { host, port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587, auth: { user, pass } };

      const transporter = nodemailer.createTransport(transporterConfig);

      await transporter.sendMail({
        from,
        to: toEmail,
        subject: `📋 Receta Médica Electrónica: ${codigo} - Dr. ${doctorName}`,
        text: `Hola ${patientName}, se ha emitido tu receta médica electrónica ${codigo}. Dr. ${doctorName}.`,
        html: htmlContent
      });
      console.log(`[PRESCRIPTION EMAIL SENT] Receta ${codigo} enviada exitosamente a ${toEmail}`);
      return true;
    } catch (err: any) {
      console.error("[SMTP ERROR al enviar receta]:", err?.message || err);
      return false;
    }
  }
  return false;
}

const DEFAULT_MEDICOS = [
  {
    id: 1,
    nombres: 'Dr. Roberto Carlos',
    apellidos: 'Vargas Silva',
    rut: '14285719',
    dv: '3',
    telefono: '+56 9 8451 2293',
    correo: 'dr.vargas@easyreceta.cl',
    registro_minsal: 'RNM-482910',
    especialidad: 'Medicina Interna',
    activo: 'X'
  },
  {
    id: 2,
    nombres: 'Dra. Marcela Andrea',
    apellidos: 'Pavez Muñoz',
    rut: '16738920',
    dv: 'K',
    telefono: '+56 9 7122 4589',
    correo: 'dra.pavez@easyreceta.cl',
    registro_minsal: 'RNM-592811',
    especialidad: 'Pediatría y Salud Infantil',
    activo: 'X'
  },
  {
    id: 3,
    nombres: 'Dr. Esteban Javier',
    apellidos: 'Morales Alarcón',
    rut: '12490182',
    dv: '5',
    telefono: '+56 9 9234 1102',
    correo: 'dr.morales@easyreceta.cl',
    registro_minsal: 'RNM-301928',
    especialidad: 'Cardiología Clínica',
    activo: 'X'
  },
  {
    id: 4,
    nombres: 'Dr. Nelson',
    apellidos: 'Lastra Delgado',
    rut: '16778715',
    dv: '0',
    telefono: '+56934456811',
    correo: 'nelsonlastra4@gmail.com',
    registro_minsal: 'RNM-715820',
    especialidad: 'Medicina General y Familiar',
    activo: 'X'
  },
  {
    id: 5,
    nombres: 'Dr. Hans',
    apellidos: 'Lembach Palma',
    rut: '12792034',
    dv: '6',
    telefono: '+56912345678',
    correo: 'qflembach@gmail.com',
    registro_minsal: 'RNM-639102',
    especialidad: 'Medicina General',
    activo: 'X'
  },
  {
    id: 6,
    nombres: 'Dr. Roberto',
    apellidos: 'González Pinto',
    rut: '14567890',
    dv: '1',
    telefono: '+56976543210',
    correo: 'rgonzalez.dental@gmail.com',
    registro_minsal: 'RNM-329871',
    especialidad: 'Cirujano Dentista / Odontología',
    activo: 'X'
  },
  {
    id: 7,
    nombres: 'Nelson',
    apellidos: 'Lastra',
    rut: '12345678',
    dv: '5',
    telefono: '+56934456811',
    correo: 'nelsonlastra4@gmail.com',
    registro_minsal: 'RNM-849201',
    especialidad: 'Médico Cirujano (Medicina General)',
    activo: 'X'
  }
];

const DEFAULT_FARMACIAS = [
  {
    id: 1,
    nombre: 'Farmacia Cruz Verde Centro',
    direccion: 'Av. Providencia 1208',
    comuna: 'Providencia',
    ciudad: 'Santiago',
    telefono: '+56223456789',
    rut: '76543210-K'
  },
  {
    id: 2,
    nombre: 'Farmacia Salcobrand Los Leones',
    direccion: 'Av. Las Condes 9400',
    comuna: 'Las Condes',
    ciudad: 'Santiago',
    telefono: '+56229876543',
    rut: '77123456-7'
  }
];

const DEFAULT_FARMACEUTAS = [
  {
    id: 1,
    nombres: 'Esteban Andrés',
    paterno: 'López',
    materno: 'Vega',
    rut: '16892103',
    dv: '9',
    farmacia_id: 1,
    correo: 'esteban.lopez@cruzverde.cl',
    telefono: '+56934456811',
    activo: 'X'
  },
  {
    id: 2,
    nombres: 'Carolina Paz',
    paterno: 'Figueroa',
    materno: 'Sanhueza',
    rut: '17892011',
    dv: '2',
    farmacia_id: 2,
    correo: 'carolina.figueroa@salcobrand.cl',
    telefono: '+56987654321',
    activo: 'X'
  },
  {
    id: 3,
    nombres: 'Hans',
    paterno: 'Lembach',
    materno: 'Palma',
    rut: '12792034',
    dv: '6',
    farmacia_id: 1,
    correo: 'hplembac@uc.cl',
    telefono: '+56912345678',
    activo: 'X'
  },
  {
    id: 4,
    nombres: 'Vicente Andres',
    paterno: 'Saavedra',
    materno: 'Rojas',
    rut: '18731753',
    dv: '3',
    farmacia_id: 2,
    correo: 'nelsonlastra4@gmail.com',
    telefono: '+56934456811',
    activo: 'X'
  },
  {
    id: 5,
    nombres: 'Andrés',
    paterno: 'Silva',
    materno: 'Oyarzún',
    rut: '18715853',
    dv: '3',
    farmacia_id: 1,
    correo: 'nelsonlastra4@gmail.com',
    telefono: '+56934456811',
    activo: 'X'
  }
];

// Universal RUT matcher that handles all Chilean format variations:
// e.g. 18.731.753-3, 18731753-3, 187317533, 18731753, with or without leading zeros
function isRutMatching(recordRut: any, recordDv: any, inputRut: string): boolean {
  if (!inputRut) return false;
  const cleanInput = String(inputRut).replace(/[^0-9Kk]/g, '').toUpperCase();
  const cleanRecordRut = String(recordRut || '').replace(/[^0-9Kk]/g, '').toUpperCase();
  const cleanRecordDv = String(recordDv || '').replace(/[^0-9Kk]/g, '').toUpperCase();
  
  if (!cleanInput || !cleanRecordRut) return false;

  const fullRecord = `${cleanRecordRut}${cleanRecordDv}`;

  // 1. Direct match with full combined RUT+DV (e.g. "187317533" === "187317533")
  if (cleanInput === fullRecord) return true;

  // 2. Direct match with body only (e.g. "18731753" === "18731753")
  if (cleanInput === cleanRecordRut) return true;

  // 3. User typed body + DV together without punctuation (e.g. "187317533" -> body "18731753", DV "3")
  if (cleanInput.length > 1) {
    const inputBody = cleanInput.slice(0, -1);
    const inputDv = cleanInput.slice(-1);
    if (inputBody === cleanRecordRut) {
      if (!cleanRecordDv || inputDv === cleanRecordDv) {
        return true;
      }
    }
  }

  // 4. User typed with dash (e.g. "18731753-3")
  if (String(inputRut).includes('-')) {
    const parts = String(inputRut).split('-');
    const bBefore = parts[0].replace(/[^0-9Kk]/g, '').toUpperCase();
    const bAfter = (parts[1] || '').replace(/[^0-9Kk]/g, '').toUpperCase();
    if (bBefore === cleanRecordRut) {
      if (!bAfter || !cleanRecordDv || bAfter === cleanRecordDv) {
        return true;
      }
    }
  }

  // 5. Zero-padded comparisons
  const normInput = cleanInput.replace(/^0+/, '');
  const normRecord = cleanRecordRut.replace(/^0+/, '');
  if (normInput === normRecord || normInput === `${normRecord}${cleanRecordDv}`) {
    return true;
  }

  return false;
}

let dbSyncDone = false;
async function ensureDbSynced() {
  if (dbSyncDone) return;
  try {
    if (!process.env.DATABASE_URL) {
      console.warn('[DB SYNC] DATABASE_URL is not set.');
      return;
    }

    // 1. Create tables in Neon if they don't exist yet
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS pacientes (
        id SERIAL PRIMARY KEY,
        rut VARCHAR(20) NOT NULL,
        dv CHAR(1) NOT NULL,
        nombres VARCHAR(255) NOT NULL,
        paterno VARCHAR(255) NOT NULL,
        materno VARCHAR(255),
        fecha_nacimiento DATE,
        correo VARCHAR(255),
        telefono VARCHAR(50),
        direccion TEXT,
        activo CHAR(1) DEFAULT 'X',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS medicos (
        id SERIAL PRIMARY KEY,
        nombres VARCHAR(255) NOT NULL,
        apellidos VARCHAR(255) NOT NULL,
        rut VARCHAR(20),
        dv CHAR(1),
        telefono VARCHAR(50),
        correo VARCHAR(255),
        registro_minsal VARCHAR(100),
        especialidad VARCHAR(255),
        activo CHAR(1) DEFAULT 'X'
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS diagnostico (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(50) NOT NULL,
        descripcion TEXT NOT NULL,
        activo CHAR(1) DEFAULT 'X'
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS medicamentos (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(100),
        descripcion TEXT NOT NULL,
        laboratorio VARCHAR(255),
        departamento VARCHAR(255),
        restriccion VARCHAR(100),
        forma_farmaceutica VARCHAR(100),
        presentacion TEXT,
        activo CHAR(1) DEFAULT 'X'
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS examenes (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(100),
        nombre TEXT NOT NULL,
        descripcion TEXT,
        activo CHAR(1) DEFAULT 'X'
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS farmacias (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        direccion TEXT,
        comuna VARCHAR(100),
        ciudad VARCHAR(100),
        telefono VARCHAR(50),
        rut VARCHAR(20)
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS farmaceutas (
        id SERIAL PRIMARY KEY,
        nombres VARCHAR(255) NOT NULL,
        paterno VARCHAR(255) NOT NULL,
        materno VARCHAR(255),
        rut VARCHAR(20),
        dv CHAR(1),
        farmacia_id INTEGER REFERENCES farmacias(id),
        correo VARCHAR(255),
        activo CHAR(1) DEFAULT 'X'
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS visitas (
        id SERIAL PRIMARY KEY,
        medico_id INTEGER REFERENCES medicos(id) NOT NULL,
        paciente_id INTEGER REFERENCES pacientes(id) NOT NULL,
        diagnostico_id INTEGER REFERENCES diagnostico(id),
        tratamiento TEXT,
        fecha TIMESTAMP DEFAULT NOW(),
        estado_id INTEGER DEFAULT 1,
        codigo_verificacion VARCHAR(100),
        activo CHAR(1) DEFAULT 'X',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS recetas (
        id SERIAL PRIMARY KEY,
        visita_id INTEGER REFERENCES visitas(id) NOT NULL,
        medicamento_id INTEGER REFERENCES medicamentos(id) NOT NULL,
        tratamiento TEXT NOT NULL,
        cantidad INTEGER DEFAULT 1,
        duracion VARCHAR(100),
        estado INTEGER DEFAULT 1,
        farmaceuta_id INTEGER REFERENCES farmaceutas(id),
        dispensado_fecha TIMESTAMP,
        activo CHAR(1) DEFAULT 'X'
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS orden_examenes (
        id SERIAL PRIMARY KEY,
        visita_id INTEGER REFERENCES visitas(id) NOT NULL,
        examen_id INTEGER REFERENCES examenes(id) NOT NULL,
        indicaciones TEXT,
        estado INTEGER DEFAULT 1
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS epicrisis (
        id SERIAL PRIMARY KEY,
        visita_id INTEGER REFERENCES visitas(id) NOT NULL,
        paciente_id INTEGER REFERENCES pacientes(id) NOT NULL,
        medico_id INTEGER REFERENCES medicos(id) NOT NULL,
        contenido TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS auth_tokens (
        id SERIAL PRIMARY KEY,
        rut VARCHAR(50) NOT NULL,
        token VARCHAR(20) NOT NULL,
        user_data TEXT,
        role VARCHAR(50) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Ensure all required columns exist in Neon database
    await db.execute(sql`ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS correo varchar(255);`);
    await db.execute(sql`ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS telefono varchar(50);`);
    await db.execute(sql`ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS direccion text;`);
    await db.execute(sql`ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS activo char(1) DEFAULT 'X';`);
    await db.execute(sql`ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT NOW();`);
    await db.execute(sql`ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT NOW();`);

    await db.execute(sql`ALTER TABLE medicos ADD COLUMN IF NOT EXISTS dv char(1);`);
    await db.execute(sql`ALTER TABLE medicos ADD COLUMN IF NOT EXISTS telefono varchar(50);`);
    await db.execute(sql`ALTER TABLE medicos ADD COLUMN IF NOT EXISTS correo varchar(255);`);
    await db.execute(sql`ALTER TABLE medicos ADD COLUMN IF NOT EXISTS registro_minsal varchar(100);`);
    await db.execute(sql`ALTER TABLE medicos ADD COLUMN IF NOT EXISTS especialidad varchar(255);`);
    await db.execute(sql`ALTER TABLE medicos ADD COLUMN IF NOT EXISTS activo char(1) DEFAULT 'X';`);

    await db.execute(sql`ALTER TABLE farmaceutas ADD COLUMN IF NOT EXISTS dv char(1);`);
    await db.execute(sql`ALTER TABLE farmaceutas ADD COLUMN IF NOT EXISTS correo varchar(255);`);
    await db.execute(sql`ALTER TABLE farmaceutas ADD COLUMN IF NOT EXISTS activo char(1) DEFAULT 'X';`);

    await db.execute(sql`ALTER TABLE visitas ADD COLUMN IF NOT EXISTS activo char(1) DEFAULT 'X';`);
    await db.execute(sql`ALTER TABLE visitas ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT NOW();`);
    await db.execute(sql`ALTER TABLE recetas ADD COLUMN IF NOT EXISTS activo char(1) DEFAULT 'X';`);

    // Seed default doctors if medicos table is empty
    try {
      const medCountRes: any = await db.execute(sql`SELECT count(*)::int as count FROM medicos;`);
      const count = Number(medCountRes?.rows?.[0]?.count || medCountRes?.[0]?.count || 0);
      if (count === 0) {
        for (const m of DEFAULT_MEDICOS) {
          await db.execute(sql`
            INSERT INTO medicos (nombres, apellidos, rut, dv, telefono, correo, registro_minsal, especialidad, activo)
            VALUES (${m.nombres}, ${m.apellidos}, ${m.rut}, ${m.dv}, ${m.telefono}, ${m.correo}, ${m.registro_minsal}, ${m.especialidad}, 'X');
          `);
        }
      }
    } catch (seedMedErr) {
      console.warn('[SEED MEDICOS WARN]', seedMedErr);
    }

    // Seed default pharmacies if farmacias table is empty
    try {
      const farmCountRes: any = await db.execute(sql`SELECT count(*)::int as count FROM farmacias;`);
      const count = Number(farmCountRes?.rows?.[0]?.count || farmCountRes?.[0]?.count || 0);
      if (count === 0) {
        for (const f of DEFAULT_FARMACIAS) {
          await db.execute(sql`
            INSERT INTO farmacias (nombre, direccion, comuna, ciudad, telefono, rut)
            VALUES (${f.nombre}, ${f.direccion}, ${f.comuna}, ${f.ciudad}, ${f.telefono}, ${f.rut});
          `);
        }
      }
    } catch (seedFarmErr) {
      console.warn('[SEED FARMACIAS WARN]', seedFarmErr);
    }

    // Seed default pharmacists if farmaceutas table is empty
    try {
      const phCountRes: any = await db.execute(sql`SELECT count(*)::int as count FROM farmaceutas;`);
      const count = Number(phCountRes?.rows?.[0]?.count || phCountRes?.[0]?.count || 0);
      if (count === 0) {
        for (const ph of DEFAULT_FARMACEUTAS) {
          await db.execute(sql`
            INSERT INTO farmaceutas (nombres, paterno, materno, rut, dv, farmacia_id, correo, activo)
            VALUES (${ph.nombres}, ${ph.paterno}, ${ph.materno}, ${ph.rut}, ${ph.dv}, ${ph.farmacia_id}, ${ph.correo}, 'X');
          `);
        }
      }
    } catch (seedPhErr) {
      console.warn('[SEED FARMACEUTAS WARN]', seedPhErr);
    }

    // Ensure all tables and columns are ready in the PostgreSQL database
    dbSyncDone = true;
  } catch (dbSyncErr) {
    console.warn("[DB SYNC NOTICE]", (dbSyncErr as any)?.message || dbSyncErr);
  }
}

export function createExpressApp() {
  const app = express();
  app.use(express.json());

  // CORS Headers for API requests
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  const apiRouter = express.Router();

  // AUTH: REQUEST TOKEN
  apiRouter.post('/auth/request-token', async (req, res) => {
    try {
      const { rut } = req.body;
      if (!rut) {
        return res.status(400).json({ error: 'RUT es requerido.' });
      }

      await ensureDbSynced();

      const inputRutStr = String(rut).trim();
      const cleanRut = inputRutStr.replace(/[^0-9Kk]/g, '').toUpperCase();
      const rutNum = cleanRut.length > 1 ? cleanRut.slice(0, -1) : cleanRut;
      const formattedRutWithDash = cleanRut.length > 1 ? `${cleanRut.slice(0, -1)}-${cleanRut.slice(-1)}` : cleanRut;

      let medico: any = null;
      let farmaceuta: any = null;

      // 1. Fetch live doctors from Postgres DB
      let dbMedicosList: any[] = [];
      try {
        const medRes: any = await db.execute(sql`SELECT * FROM medicos;`);
        dbMedicosList = medRes?.rows || (Array.isArray(medRes) ? medRes : []);
      } catch (dbErr) {
        console.warn("[DB QUERY MEDICOS WARNING]:", (dbErr as any)?.message || dbErr);
      }

      // Combine with default medicos list to ensure 100% availability
      const allMedicos = [...dbMedicosList, ...DEFAULT_MEDICOS];
      medico = allMedicos.find(m => isRutMatching(m.rut, m.dv, inputRutStr));

      // 2. Fetch live pharmacists from Postgres DB
      let dbFarmaceutasList: any[] = [];
      try {
        const phRes: any = await db.execute(sql`SELECT * FROM farmaceutas;`);
        dbFarmaceutasList = phRes?.rows || (Array.isArray(phRes) ? phRes : []);
      } catch (dbErr) {
        console.warn("[DB QUERY FARMACEUTAS WARNING]:", (dbErr as any)?.message || dbErr);
      }

      // Combine with default farmaceutas list
      const allFarmaceutas = [...dbFarmaceutasList, ...DEFAULT_FARMACEUTAS];
      farmaceuta = allFarmaceutas.find(ph => isRutMatching(ph.rut, ph.dv, inputRutStr));

      if (!medico && !farmaceuta) {
        return res.status(404).json({ 
          error: `RUT ${rut} no encontrado en los registros de Médicos, Dentistas ni Químicos Farmacéuticos de la base de datos. Verifica el número ingresado.` 
        });
      }

      const user = medico || farmaceuta;
      const role: 'medico' | 'farmacia' = medico ? 'medico' : 'farmacia';
      
      const isDentist = medico && (
        medico.especialidad?.toLowerCase().includes('dentista') || 
        medico.especialidad?.toLowerCase().includes('odonto') ||
        medico.profesion_nombre?.toLowerCase().includes('dentista')
      );

      const roleLabel = medico 
        ? (isDentist ? 'Cirujano Dentista' : 'Médico Cirujano / Prescriptor')
        : 'Químico Farmacéutico (Farmacia)';

      // Generate 6-digit OTP token
      const token = Math.floor(100000 + Math.random() * 900000).toString();

      // Store in memory (fast cache) under multiple variations
      authTokens.set(cleanRut, { token, user, role, expires: Date.now() + 10 * 60 * 1000 });
      authTokens.set(rutNum, { token, user, role, expires: Date.now() + 10 * 60 * 1000 });
      authTokens.set(inputRutStr, { token, user, role, expires: Date.now() + 10 * 60 * 1000 });
      authTokens.set(formattedRutWithDash, { token, user, role, expires: Date.now() + 10 * 60 * 1000 });

      // Persist in Neon PostgreSQL database for stateless/serverless environments
      try {
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await db.execute(sql`
          INSERT INTO auth_tokens (rut, token, user_data, role, expires_at)
          VALUES (${cleanRut}, ${token}, ${JSON.stringify(user)}, ${role}, ${expiresAt.toISOString()});
        `);
      } catch (tokDbErr) {
        console.warn("[DB AUTH_TOKENS INSERT WARNING]:", (tokDbErr as any)?.message || tokDbErr);
      }

      // 1. Send SMS if Twilio is configured
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
      let twilioConfigured = false;

      let userPhone = user.telefono || '+56934456811';
      const formattedPhone = userPhone.replace(/\s+/g, '').replace(/^(\+?56)?/, '+56');

      if (accountSid && authToken && twilioNumber) {
        try {
          const client = twilio(accountSid, authToken);
          await client.messages.create({
            body: `EasyRecetas: Tu código de seguridad es ${token}. No lo compartas con nadie.`,
            from: twilioNumber,
            to: formattedPhone
          });
          twilioConfigured = true;
          console.log(`[REAL SMS SENT] SMS con código ${token} enviado a ${formattedPhone}`);
        } catch (twilioErr) {
          console.error("[TWILIO ERROR]", twilioErr);
        }
      }

      // 2. Send Real Email
      const userEmail = user.correo || 'nelsonlastra4@gmail.com';
      const userName = `${user.nombres} ${user.apellidos || user.paterno || ''}`.trim();
      const emailSent = await sendAuthEmail(userEmail, token, userName);
      const smtpConfigured = Boolean(process.env.SMTP_USER || process.env.SMTP_PASS);

      const phoneLastDigits = userPhone.replace(/\D/g, '').slice(-4) || '6811';
      const emailMask = maskEmail(userEmail);

      res.json({
        message: 'Código de seguridad generado',
        role,
        roleLabel,
        userName,
        userSpecialty: medico?.especialidad || (farmaceuta ? 'Química y Farmacia' : ''),
        phoneLastDigits,
        emailMask,
        userEmail,
        twilioConfigured,
        emailSent,
        smtpConfigured,
        devCode: (!twilioConfigured && !emailSent) ? token : undefined
      });
    } catch (e) {
      console.error("[REQUEST-TOKEN ERROR]", e);
      res.status(500).json({ error: String((e as any)?.message || e) });
    }
  });

  // AUTH: VERIFY TOKEN
  apiRouter.post('/auth/verify-token', async (req, res) => {
    try {
      const { rut, token } = req.body;
      if (!rut || !token) {
        return res.status(400).json({ error: 'RUT y código de seguridad son obligatorios.' });
      }

      const inputRutStr = String(rut).trim();
      const cleanRut = inputRutStr.replace(/[^0-9Kk]/g, '').toUpperCase();
      const rutNum = cleanRut.length > 1 ? cleanRut.slice(0, -1) : cleanRut;
      const formattedRutWithDash = cleanRut.length > 1 ? `${cleanRut.slice(0, -1)}-${cleanRut.slice(-1)}` : cleanRut;
      const tokenInput = String(token).trim();

      // 1. Check in-memory fast cache
      let authData = authTokens.get(cleanRut) || authTokens.get(rutNum) || authTokens.get(inputRutStr) || authTokens.get(formattedRutWithDash);

      // 2. If not found in memory (e.g. Vercel serverless / multi-instance), check PostgreSQL database
      if (!authData) {
        try {
          const dbTokens: any = await db.execute(sql`
            SELECT * FROM auth_tokens
            WHERE (rut = ${cleanRut} OR rut = ${rutNum} OR rut = ${formattedRutWithDash} OR rut = ${inputRutStr})
            ORDER BY id DESC
            LIMIT 1;
          `);

          const row = dbTokens?.rows?.[0] || dbTokens?.[0];
          if (row) {
            let parsedUser = null;
            try {
              parsedUser = typeof row.user_data === 'string' ? JSON.parse(row.user_data) : row.user_data;
            } catch (e) {
              parsedUser = row.user_data;
            }

            authData = {
              token: String(row.token).trim(),
              user: parsedUser,
              role: row.role,
              expires: new Date(row.expires_at).getTime()
            };
          }
        } catch (dbErr) {
          console.warn("[DB AUTH_TOKENS QUERY WARNING]:", (dbErr as any)?.message || dbErr);
        }
      }

      if (!authData) {
        return res.status(400).json({ error: 'No hay un token activo para este RUT o ya expiró.' });
      }

      if (Date.now() > authData.expires) {
        authTokens.delete(cleanRut);
        authTokens.delete(rutNum);
        authTokens.delete(inputRutStr);
        try {
          await db.execute(sql`DELETE FROM auth_tokens WHERE (rut = ${cleanRut} OR rut = ${rutNum});`);
        } catch (e) {}
        return res.status(400).json({ error: 'El token ha expirado. Solicite uno nuevo.' });
      }

      if (authData.token !== tokenInput) {
        return res.status(400).json({ error: 'Código de seguridad incorrecto.' });
      }

      // Success: clean token and respond
      authTokens.delete(cleanRut);
      authTokens.delete(rutNum);
      authTokens.delete(inputRutStr);
      try {
        await db.execute(sql`DELETE FROM auth_tokens WHERE (rut = ${cleanRut} OR rut = ${rutNum});`);
      } catch (e) {}

      res.json({ user: authData.user, role: authData.role });
    } catch (e) {
      console.error("[VERIFY TOKEN ERROR]:", e);
      res.status(500).json({ error: String((e as any)?.message || e) });
    }
  });

  // SEED ENDPOINT
  apiRouter.post('/seed', async (req, res) => {
    try {
      await ensureDbSynced();
      res.json({ message: 'Seed OK' });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: String(e) });
    }
  });

  // GET INITIAL DATA
  apiRouter.get('/init', async (req, res) => {
    try {
      await ensureDbSynced();

      let p: any[] = [];
      let m: any[] = [];
      let d: any[] = [];
      let meds: any[] = [];
      let ex: any[] = [];
      let f: any[] = [];
      let ph: any[] = [];

      try { p = await db.select().from(pacientes); } catch (err) { console.error('Error fetching pacientes from DB:', err); }
      try { m = await db.select().from(medicos); } catch (err) { console.error('Error fetching medicos from DB:', err); }
      try { d = await db.select().from(diagnostico); } catch {}
      try { meds = await db.select().from(medicamentos); } catch {}
      try { ex = await db.select().from(examenes); } catch {}
      try { f = await db.select().from(farmacias); } catch {}
      try { ph = await db.select().from(farmaceutas); } catch {}

      let v: any[] = [];
      try {
        v = await db.query.visitas.findMany({
          with: {
            paciente: true,
            medico: true,
            diagnostico: true,
            recetas: {
              with: { medicamento: true, farmaceuta: true }
            },
            examenes: {
              with: { examen: true }
            },
            epicrisis: true
          },
          orderBy: (visitasTable: any, { desc }: { desc: any }) => [desc(visitasTable.fecha)]
        });
      } catch (visitasErr) {
        console.warn('Could not query visitas from DB:', (visitasErr as any)?.message || visitasErr);
      }

      res.json({
        pacientes: p,
        medicos: m.length > 0 ? m : DEFAULT_MEDICOS,
        diagnosticos: d,
        medicamentos: meds,
        examenes: ex,
        farmacias: f.length > 0 ? f : DEFAULT_FARMACIAS,
        farmaceutas: ph.length > 0 ? ph : DEFAULT_FARMACEUTAS,
        visitas: v
      });
    } catch (e) {
      console.error("[INIT ERROR]:", e);
      res.json({
        pacientes: [],
        medicos: DEFAULT_MEDICOS,
        diagnosticos: [],
        medicamentos: [],
        examenes: [],
        farmacias: DEFAULT_FARMACIAS,
        farmaceutas: DEFAULT_FARMACEUTAS,
        visitas: []
      });
    }
  });

  // PACIENTES
  apiRouter.post('/pacientes', async (req, res) => {
    try {
      await ensureDbSynced();
      const data = req.body;
      const result = await db.insert(pacientes).values({
        rut: data.rut, dv: data.dv, nombres: data.nombres, paterno: data.paterno, materno: data.materno,
        fecha_nacimiento: data.fecha_nacimiento || null, correo: data.correo, telefono: data.telefono, direccion: data.direccion
      }).returning();
      res.json(result[0]);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: String(e) });
    }
  });

  apiRouter.put('/pacientes/:id', async (req, res) => {
    try {
      await ensureDbSynced();
      const { id } = req.params;
      const data = req.body;
      const result = await db.update(pacientes).set({
        rut: data.rut, dv: data.dv, nombres: data.nombres, paterno: data.paterno, materno: data.materno,
        fecha_nacimiento: data.fecha_nacimiento || null, correo: data.correo, telefono: data.telefono, direccion: data.direccion,
        updatedAt: new Date()
      }).where(eq(pacientes.id, Number(id))).returning();
      res.json(result[0]);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: String(e) });
    }
  });

  // MEDICAMENTOS
  apiRouter.post('/medicamentos', async (req, res) => {
    try {
      await ensureDbSynced();
      const data = req.body;
      const nextCode = `MED-${Math.floor(1000 + Math.random() * 9000)}`;
      const result = await db.insert(medicamentos).values({
        codigo: data.codigo || nextCode,
        descripcion: data.descripcion,
        laboratorio: data.laboratorio,
        departamento: data.departamento,
        restriccion: data.restriccion || 'Venta Directa',
        forma_farmaceutica: data.forma_farmaceutica || 'Comprimido',
        presentacion: data.presentacion,
        activo: 'X'
      }).returning();
      res.json(result[0]);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: String(e) });
    }
  });

  apiRouter.put('/medicamentos/:id', async (req, res) => {
    try {
      await ensureDbSynced();
      const { id } = req.params;
      const data = req.body;
      const result = await db.update(medicamentos).set({
        descripcion: data.descripcion,
        laboratorio: data.laboratorio,
        departamento: data.departamento,
        restriccion: data.restriccion,
        forma_farmaceutica: data.forma_farmaceutica,
        presentacion: data.presentacion
      }).where(eq(medicamentos.id, Number(id))).returning();
      res.json(result[0]);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: String(e) });
    }
  });

  // MEDICOS
  apiRouter.post('/medicos', async (req, res) => {
    try {
      await ensureDbSynced();
      const data = req.body;
      const result = await db.insert(medicos).values({
        nombres: data.nombres,
        apellidos: data.apellidos,
        rut: data.rut,
        dv: data.dv,
        telefono: data.telefono,
        correo: data.correo,
        registro_minsal: data.registro_minsal,
        especialidad: data.especialidad,
        activo: 'X'
      }).returning();
      res.json(result[0]);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: String(e) });
    }
  });

  // EXAMENES
  apiRouter.post('/examenes', async (req, res) => {
    try {
      await ensureDbSynced();
      const data = req.body;
      const nextCode = `EX-${Math.floor(100 + Math.random() * 900)}`;
      const result = await db.insert(examenes).values({
        codigo: data.codigo || nextCode,
        nombre: data.nombre,
        descripcion: data.descripcion,
        activo: 'X'
      }).returning();
      res.json(result[0]);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: String(e) });
    }
  });

  apiRouter.put('/examenes/:id', async (req, res) => {
    try {
      await ensureDbSynced();
      const { id } = req.params;
      const data = req.body;
      const result = await db.update(examenes).set({
        nombre: data.nombre,
        descripcion: data.descripcion
      }).where(eq(examenes.id, Number(id))).returning();
      res.json(result[0]);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: String(e) });
    }
  });

  // VISITAS / RECETAS
  apiRouter.post('/visitas', async (req, res) => {
    try {
      await ensureDbSynced();
      const { visita } = req.body;
      const vResult = await db.insert(visitas).values({
        medico_id: visita.medico_id,
        paciente_id: visita.paciente_id,
        diagnostico_id: visita.diagnostico_id || null,
        tratamiento: visita.tratamiento,
        codigo_verificacion: visita.codigo_verificacion,
        estado_id: 1,
        activo: 'X'
      }).returning();
      
      const vId = vResult[0].id;

      if (visita.recetas && visita.recetas.length > 0) {
        await db.insert(recetas).values(visita.recetas.map((r: any) => ({
          visita_id: vId,
          medicamento_id: r.medicamento_id,
          tratamiento: r.tratamiento,
          cantidad: r.cantidad,
          duracion: r.duracion,
          estado: 1,
          activo: 'X'
        })));
      }

      if (visita.examenes && visita.examenes.length > 0) {
        await db.insert(orden_examenes).values(visita.examenes.map((e: any) => ({
          visita_id: vId,
          examen_id: e.examen_id,
          indicaciones: e.indicaciones,
          estado: 1
        })));
      }

      if (visita.epicrisis && visita.epicrisis.length > 0) {
        await db.insert(epicrisis).values(visita.epicrisis.map((epi: any) => ({
          visita_id: vId,
          paciente_id: visita.paciente_id,
          medico_id: visita.medico_id,
          contenido: epi.contenido
        })));
      }

      const completeVisita = await db.query.visitas.findFirst({
        where: eq(visitas.id, vId),
        with: {
          paciente: true, medico: true, diagnostico: true,
          recetas: { with: { medicamento: true, farmaceuta: true } },
          examenes: { with: { examen: true } },
          epicrisis: true
        }
      });

      res.json(completeVisita);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: String(e) });
    }
  });

  // DISPENSAR (QUEMAR) RECETA INDIVIDUAL
  apiRouter.put('/recetas/:id/dispensar', async (req, res) => {
    try {
      await ensureDbSynced();
      const { id } = req.params;
      const { farmaceuta_id } = req.body;
      
      const rResult = await db.update(recetas)
        .set({ 
          estado: 3, 
          farmaceuta_id: farmaceuta_id || 1,
          dispensado_fecha: new Date()
        })
        .where(eq(recetas.id, Number(id)))
        .returning();

      if (rResult.length > 0) {
        const vId = rResult[0].visita_id;
        const remaining = await db.select().from(recetas).where(
           eq(recetas.visita_id, vId)
        );
        const allDispensadas = remaining.length === 0 || remaining.every((r: any) => r.estado === 3);
        const anyDispensadas = remaining.some((r: any) => r.estado === 3);
        
        await db.update(visitas)
          .set({ estado_id: allDispensadas ? 3 : (anyDispensadas ? 2 : 1) })
          .where(eq(visitas.id, vId));
      }

      res.json(rResult[0]);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: String(e) });
    }
  });

  // DISPENSAR (QUEMAR) TODA LA VISITA/RECETA
  apiRouter.put('/visitas/:id/dispensar-todo', async (req, res) => {
    try {
      await ensureDbSynced();
      const { id } = req.params;
      const { farmaceuta_id } = req.body;
      const vId = Number(id);

      await db.update(visitas)
        .set({ estado_id: 3 })
        .where(eq(visitas.id, vId));

      await db.update(recetas)
        .set({
          estado: 3,
          farmaceuta_id: farmaceuta_id || 1,
          dispensado_fecha: new Date()
        })
        .where(eq(recetas.visita_id, vId));

      const completeVisita = await db.query.visitas.findFirst({
        where: eq(visitas.id, vId),
        with: {
          paciente: true,
          medico: true,
          diagnostico: true,
          recetas: { with: { medicamento: true, farmaceuta: true } },
          examenes: { with: { examen: true } },
          epicrisis: true
        }
      });

      res.json(completeVisita);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: String(e) });
    }
  });

  // SEND PRESCRIPTION EMAIL TO PATIENT
  apiRouter.post('/visitas/:id/send-email', async (req, res) => {
    try {
      await ensureDbSynced();
      const { id } = req.params;
      const { targetEmail, visitaPayload } = req.body;

      let completeVisita = visitaPayload;

      if (!completeVisita || !completeVisita.recetas) {
        completeVisita = await db.query.visitas.findFirst({
          where: eq(visitas.id, Number(id)),
          with: {
            paciente: true,
            medico: true,
            diagnostico: true,
            recetas: { with: { medicamento: true, farmaceuta: true } },
            examenes: { with: { examen: true } },
            epicrisis: true
          }
        });
      }

      if (!completeVisita) {
        return res.status(404).json({ error: 'Receta no encontrada' });
      }

      const emailToSend = targetEmail || completeVisita.paciente?.correo || 'nelsonlastra4@gmail.com';
      const success = await sendPrescriptionEmail(emailToSend, completeVisita);

      if (success) {
        res.json({ success: true, email: emailToSend, message: 'Receta médica despachada al correo exitosamente' });
      } else {
        res.status(500).json({ success: false, error: 'No se pudo despachar el correo a través del servidor SMTP' });
      }
    } catch (e) {
      console.error('Error sending prescription email:', e);
      res.status(500).json({ error: String(e) });
    }
  });

  // Register router under both /api and root /
  app.use('/api', apiRouter);
  app.use(apiRouter);

  return app;
}

export const app = createExpressApp();
export default app;
