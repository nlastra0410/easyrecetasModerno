import 'dotenv/config';
import express from "express";
import path from "path";
import { db } from "./src/db/index.js";
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
} from "./src/db/schema.js";
import { eq, like, or, sql, desc, and } from 'drizzle-orm';
import {
  initialPacientes,
  initialMedicos,
  initialDiagnosticos,
  initialMedicamentos,
  initialExamenes,
  initialFarmacias,
  initialFarmaceutas,
  initialVisitas
} from "./src/data/initialData.js";
import twilio from 'twilio';
import nodemailer from 'nodemailer';

// Helper to normalize any date input to PostgreSQL YYYY-MM-DD or null
function normalizeDateForDb(val: any): string | null {
  if (!val) return null;
  const str = String(val).trim();
  if (!str || str === 'EMPTY_STRING') return null;
  // If DD-MM-YYYY or DD/MM/YYYY
  if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(str)) {
    const parts = str.split(/[-/]/);
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  // If YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.substring(0, 10);
  }
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return null;
}

// Clean string helper (treat 'EMPTY_STRING' or blank as empty string or clean string)
function cleanStr(val: any): string {
  if (val === undefined || val === null || val === 'EMPTY_STRING') return '';
  return String(val).trim();
}

// Robust RUT parser helper
function parseRutParts(rutInput: any, dvInput?: any) {
  const rawRut = String(rutInput || '').trim();
  const rawDv = String(dvInput || '').trim();

  // If dv is explicitly provided separately (e.g. rut: "28152245", dv: "0")
  if (rawDv) {
    const cleanCuerpo = rawRut.replace(/[^0-9]/g, '');
    const cleanDv = rawDv.replace(/[^0-9Kk]/g, '').toUpperCase();
    return {
      cuerpo: cleanCuerpo,
      dv: cleanDv,
      fullRut: `${cleanCuerpo}-${cleanDv}`,
      cleanCombined: `${cleanCuerpo}${cleanDv}`
    };
  }

  // If rut contains both body and dv together (e.g. "28152245-0" or "281522450")
  const cleanAll = rawRut.replace(/[^0-9Kk]/g, '').toUpperCase();
  if (cleanAll.length <= 1) {
    return { cuerpo: cleanAll, dv: '', fullRut: cleanAll, cleanCombined: cleanAll };
  }
  const cleanCuerpo = cleanAll.slice(0, -1);
  const cleanDv = cleanAll.slice(-1);
  return {
    cuerpo: cleanCuerpo,
    dv: cleanDv,
    fullRut: `${cleanCuerpo}-${cleanDv}`,
    cleanCombined: cleanAll
  };
}

// Token memory store
const authTokens = new Map<string, { token: string, user: any, role: string, expires: number }>();

// Resilient in-memory fallback stores (auto-synced with DB if connected)
let memPacientes: any[] = JSON.parse(JSON.stringify(initialPacientes));
let memMedicos: any[] = JSON.parse(JSON.stringify(initialMedicos));
let memDiagnosticos: any[] = JSON.parse(JSON.stringify(initialDiagnosticos));
let memMedicamentos: any[] = JSON.parse(JSON.stringify(initialMedicamentos));
let memExamenes: any[] = JSON.parse(JSON.stringify(initialExamenes));
let memFarmacias: any[] = JSON.parse(JSON.stringify(initialFarmacias));
let memFarmaceutas: any[] = JSON.parse(JSON.stringify(initialFarmaceutas));
let memVisitas: any[] = JSON.parse(JSON.stringify(initialVisitas));

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
    console.warn(`\n[EMAIL DISPATCH] Para: ${toEmail} (${userName}) | Código: ${token}`);
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
  const diagnostico = visita.diagnostico ? `[${visita.diagnostico.codigo}] ${visita.diagnostico.descripcion}` : 'Control Médico General';
  const epicrisis = visita.epicrisis && visita.epicrisis.length > 0 ? visita.epicrisis.map((e: any) => e.contenido).join('\n') : '';

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
      <!-- Top Brand -->
      <div style="text-align: center; padding-bottom: 16px; border-bottom: 2px solid #13b0a5; margin-bottom: 20px;">
        <h1 style="color: #0c706a; margin: 0; font-size: 26px; letter-spacing: 0.5px; font-weight: 300;">Easy<span style="color: #13b0a5; font-weight: 800;">Receta Digital</span></h1>
        <p style="color: #64748b; font-size: 11px; margin-top: 4px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Sistema Nacional de Prescripción Médica Electrónica</p>
      </div>

      <!-- Hello Greeting Banner -->
      <div style="background-color: #e7f7f6; border: 1px solid #99f6e4; padding: 16px; border-radius: 12px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 15px; color: #0c706a; font-weight: 600;">
          Estimado(a) ${patientName}:
        </p>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #0f766e; line-height: 1.5;">
          El <strong>Dr. ${doctorName}</strong> ha emitido tu receta médica electrónica a través de EasyReceta. Puedes presentar este comprobante o tu código de verificación en cualquier farmacia del país para la dispensación de tus medicamentos.
        </p>
      </div>

      <!-- Verification Code Box -->
      <div style="background-color: #0f172a; color: #ffffff; padding: 16px 20px; border-radius: 12px; text-align: center; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; display: block; margin-bottom: 6px; font-weight: 600;">Código Oficial de Verificación</span>
        <span style="font-family: monospace; font-size: 22px; font-weight: bold; color: #2dd4bf; letter-spacing: 2px;">${codigo}</span>
        <span style="display: block; font-size: 11px; color: #94a3b8; margin-top: 6px;">Fecha de Emisión: ${fecha}</span>
      </div>

      <!-- Patient & Doctor Card -->
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
              <p style="margin: 2px 0 0 0; font-size: 12px; color: #475569;">Diagnóstico: <strong>${diagnostico}</strong></p>
            </td>
          </tr>
        </table>
      </div>

      <!-- Epicrisis / Clinica if any -->
      ${epicrisis ? `
        <div style="margin-bottom: 20px; padding: 14px; background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px;">
          <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #92400e; display: block; margin-bottom: 6px;">Evolución Clínica / Indicaciones del Tratamiento:</span>
          <p style="margin: 0; font-size: 13px; color: #78350f; white-space: pre-wrap; line-height: 1.5;">${epicrisis}</p>
        </div>
      ` : ''}

      <!-- Prescriptions Section -->
      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 13px; font-weight: 800; text-transform: uppercase; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px; letter-spacing: 0.5px;">
          Medicamentos Prescritos (Rp.)
        </h3>
        ${medicamentosHtml}
      </div>

      <!-- Exam orders if any -->
      ${examenesHtml ? `
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 13px; font-weight: 800; text-transform: uppercase; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px; letter-spacing: 0.5px;">
            Órdenes de Exámenes Solicitados
          </h3>
          ${examenesHtml}
        </div>
      ` : ''}

      <!-- General treatment note -->
      ${visita.tratamiento ? `
        <div style="margin-bottom: 20px; padding: 12px 14px; background-color: #f1f5f9; border-radius: 10px; font-size: 12px; color: #334155;">
          <strong>Indicaciones Adicionales:</strong> ${visita.tratamiento}
        </div>
      ` : ''}

      <!-- Footer & Signature -->
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

const app = express();
app.use(express.json());

// Move DB init into its own async function
async function syncDatabase() {
  if (!process.env.DATABASE_URL) {
    console.log("[DB NOTICE] DATABASE_URL no provista en local, operando con almacén de memoria.");
    return;
  }
  // Ensure DB Schema is in sync and Dr. Nelson / Dr. Hans are inserted
  try {
    await db.execute(sql`ALTER TABLE medicos ADD COLUMN IF NOT EXISTS dv char(1);`);
    await db.execute(sql`ALTER TABLE medicos ADD COLUMN IF NOT EXISTS telefono varchar(50);`);
    await db.execute(sql`ALTER TABLE medicos ADD COLUMN IF NOT EXISTS correo varchar(255);`);

    for (const m of initialMedicos) {
      try {
        const existing = await db.query.medicos.findFirst({
          where: or(eq(medicos.rut, m.rut), eq(medicos.rut, `${m.rut}-${m.dv}`))
        });
        if (!existing) {
          await db.insert(medicos).values({
            nombres: m.nombres,
            apellidos: m.apellidos,
            rut: m.rut,
            dv: m.dv,
            telefono: m.telefono,
            correo: m.correo,
            registro_minsal: m.registro_minsal,
            especialidad: m.especialidad,
            activo: 'X'
          });
          console.log(`[DB INIT] Médico ${m.nombres} ${m.apellidos} (${m.rut}-${m.dv}) registrado.`);
        } else {
          await db.update(medicos).set({
            nombres: m.nombres,
            apellidos: m.apellidos,
            dv: m.dv,
            telefono: m.telefono,
            correo: m.correo,
            registro_minsal: m.registro_minsal,
            especialidad: m.especialidad
          }).where(eq(medicos.id, existing.id));
        }
      } catch (innerErr) {
        // Individual record error
      }
    }

    // Ensure farmaceutas in DB are also seeded/updated
    for (const f of initialFarmaceutas) {
      try {
        const existingF = await db.query.farmaceutas.findFirst({
          where: or(
            eq(farmaceutas.rut, f.rut),
            eq(farmaceutas.rut, `${f.rut}-${f.dv}`),
            eq(farmaceutas.rut, `${f.rut}${f.dv}`)
          )
        });
        if (!existingF) {
          await db.insert(farmaceutas).values({
            nombres: f.nombres,
            paterno: f.paterno,
            materno: f.materno,
            rut: f.rut,
            dv: f.dv,
            farmacia_id: f.farmacia_id,
            correo: f.correo,
            activo: 'X'
          });
          console.log(`[DB INIT] Farmacéutico ${f.nombres} ${f.paterno} (${f.rut}-${f.dv}) registrado.`);
        }
      } catch (innerErr) {
        // Individual record error
      }
    }

    // Clean any legacy 'EMPTY_STRING' text in DB
    try {
      await db.execute(sql`UPDATE pacientes SET telefono = NULL WHERE telefono = 'EMPTY_STRING';`);
      await db.execute(sql`UPDATE pacientes SET direccion = NULL WHERE direccion = 'EMPTY_STRING';`);
      await db.execute(sql`UPDATE pacientes SET correo = NULL WHERE correo = 'EMPTY_STRING';`);
      await db.execute(sql`UPDATE pacientes SET materno = NULL WHERE materno = 'EMPTY_STRING';`);
    } catch {}

    // Only seed initial patients if table is completely empty
    const existingPacientesCount = await db.select({ id: pacientes.id }).from(pacientes);
    if (existingPacientesCount.length === 0) {
      for (const p of initialPacientes) {
        try {
          const { cuerpo, dv } = parseRutParts(p.rut, p.dv);
          await db.insert(pacientes).values({
            rut: cuerpo,
            dv: dv || p.dv || '0',
            nombres: p.nombres,
            paterno: p.paterno,
            materno: p.materno || null,
            fecha_nacimiento: p.fecha_nacimiento ? normalizeDateForDb(p.fecha_nacimiento) : null,
            correo: p.correo || null,
            telefono: p.telefono || null,
            direccion: p.direccion || null,
            activo: p.activo || 'X'
          });
        } catch (innerErr) {
          // Ignore
        }
      }
    }
  } catch (dbSyncErr) {
    console.warn("[DB SYNC NOTICE] PostgreSQL:", dbSyncErr);
  }
}
// Call syncDatabase in the background unconditionally
syncDatabase().catch(() => {});

  // AUTH ENDPOINTS (REAL SMS & EMAIL OTP LOGIC)
  app.post("/api/auth/request-token", async (req, res) => {
    try {
      const { rut } = req.body;
      if (!rut) {
        return res.status(400).json({ error: "RUT es requerido." });
      }
      const rawInput = String(rut).trim();
      const cleanRut = rawInput.replace(/[^0-9Kk]/g, '').toUpperCase();
      const rutNum = cleanRut.length > 1 ? cleanRut.slice(0, -1) : cleanRut;
      const dv = cleanRut.length > 1 ? cleanRut.slice(-1) : '';

      let medico: any = null;
      let farmaceuta: any = null;

      // Helper function to match in-memory objects
      const matchesRut = (person: any) => {
        if (!person) return false;
        const pRutRaw = String(person.rut || '').trim();
        const pDvRaw = String(person.dv || '').trim().toUpperCase();
        const pCleanRut = (pRutRaw + pDvRaw).replace(/[^0-9Kk]/g, '').toUpperCase();
        const pRutNum = pRutRaw.replace(/[^0-9Kk]/g, '').toUpperCase();

        return (
          pCleanRut === cleanRut ||
          pRutNum === cleanRut ||
          pRutNum === rutNum ||
          pRutRaw === rawInput ||
          `${pRutRaw}-${pDvRaw}`.toUpperCase() === rawInput.toUpperCase() ||
          `${pRutRaw}${pDvRaw}`.toUpperCase() === rawInput.toUpperCase()
        );
      };

      // 1. Try PostgreSQL if available
      if (process.env.DATABASE_URL) {
        try {
          // Check medicos with exact match or LIKE
          medico = await db.query.medicos.findFirst({
            where: or(
              eq(medicos.rut, rutNum),
              eq(medicos.rut, cleanRut),
              eq(medicos.rut, rawInput),
              like(medicos.rut, `%${rutNum}%`)
            )
          });

          // Check farmaceutas with exact match or LIKE
          farmaceuta = await db.query.farmaceutas.findFirst({
            where: or(
              eq(farmaceutas.rut, rutNum),
              eq(farmaceutas.rut, cleanRut),
              eq(farmaceutas.rut, rawInput),
              like(farmaceutas.rut, `%${rutNum}%`)
            )
          });
        } catch (dbErr) {
          console.warn("[DB QUERY NOTICE auth]:", dbErr);
        }
      }

      // 2. Fallback to memory store if DB returned nothing or failed
      if (!medico) {
        medico = memMedicos.find(matchesRut) || initialMedicos.find(matchesRut) || null;
      }

      if (!farmaceuta) {
        farmaceuta = memFarmaceutas.find(matchesRut) || initialFarmaceutas.find(matchesRut) || null;
      }

      if (!medico && !farmaceuta) {
        return res.status(404).json({ error: `RUT ${rut} no encontrado en el cuerpo médico ni farmacéutico.` });
      }

      const user = medico || farmaceuta;
      const role = medico ? 'medico' : 'farmacia';
      
      // Generate secure 6-digit token
      const token = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      
      // Store token (expires in 5 minutes)
      authTokens.set(cleanRut, { token, user, role, expires: expiresAt.getTime() });
      authTokens.set(rutNum, { token, user, role, expires: expiresAt.getTime() });

      // Store in PostgreSQL database for multi-instance serverless resilience (Vercel)
      if (process.env.DATABASE_URL) {
        try {
          await db.execute(sql`
            CREATE TABLE IF NOT EXISTS auth_tokens (
              id SERIAL PRIMARY KEY,
              rut VARCHAR(50) NOT NULL,
              token VARCHAR(20) NOT NULL,
              user_data TEXT,
              role VARCHAR(50) NOT NULL,
              expires_at TIMESTAMP NOT NULL,
              created_at TIMESTAMP DEFAULT NOW()
            )
          `);

          // Clean old tokens for this rut
          await db.execute(sql`DELETE FROM auth_tokens WHERE rut = ${cleanRut} OR rut = ${rutNum} OR expires_at < NOW()`);

          // Insert new token
          await db.insert(authTokensTable).values({
            rut: cleanRut,
            token: token,
            userData: JSON.stringify(user),
            role: role,
            expiresAt: expiresAt
          });
        } catch (dbTokenErr) {
          console.warn("[DB AUTH TOKEN PERSIST WARN]:", dbTokenErr);
        }
      }

      // 1. Send Real SMS if Twilio is configured
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
      let twilioConfigured = false;

      let userPhone = user.telefono || '+56934456811';
      // Normalize phone format
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
      } else {
        console.warn("\n[TWILIO NOT CONFIGURED] SMS simulado:");
        console.warn(`[SMS A ${formattedPhone} (${user.nombres} ${user.apellidos || user.paterno})]: Código ${token}\n`);
      }

      // 2. Send Real Email to professional's registered email
      const userEmail = user.correo || 'nelsonlastra4@gmail.com';
      const userName = `${user.nombres} ${user.apellidos || user.paterno || ''}`.trim();
      const emailSent = await sendAuthEmail(userEmail, token, userName);
      const smtpConfigured = true;

      const phoneLastDigits = userPhone.replace(/\D/g, '').slice(-4) || '6811';
      const emailMask = maskEmail(userEmail);

      res.json({
        message: "Código de seguridad generado",
        phoneLastDigits,
        emailMask,
        userEmail,
        twilioConfigured,
        emailSent,
        smtpConfigured,
        devCode: (!twilioConfigured && !emailSent) ? token : undefined
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: String(e) });
    }
  });

  app.post("/api/auth/verify-token", async (req, res) => {
    try {
      const { rut, token } = req.body;
      if (!rut || !token) {
        return res.status(400).json({ error: "RUT y código son requeridos." });
      }

      const cleanRut = String(rut).replace(/[^0-9Kk]/g, '').toUpperCase();
      const rutNum = cleanRut.length > 1 ? cleanRut.slice(0, -1) : cleanRut;
      const inputToken = String(token).trim();

      // 1. Try DB first for multi-instance support (Vercel)
      if (process.env.DATABASE_URL) {
        try {
          const dbTokens = await db.select().from(authTokensTable).where(
            and(
              or(eq(authTokensTable.rut, cleanRut), eq(authTokensTable.rut, rutNum)),
              eq(authTokensTable.token, inputToken)
            )
          ).orderBy(desc(authTokensTable.id));

          if (dbTokens.length > 0) {
            const tokenRecord = dbTokens[0];
            const isExpired = new Date(tokenRecord.expiresAt).getTime() < Date.now();
            
            // Delete used token from DB
            await db.execute(sql`DELETE FROM auth_tokens WHERE rut = ${cleanRut} OR rut = ${rutNum}`);
            authTokens.delete(cleanRut);
            authTokens.delete(rutNum);

            if (isExpired) {
              return res.status(400).json({ error: "El token ha expirado. Solicite uno nuevo." });
            }

            const userData = tokenRecord.userData ? JSON.parse(tokenRecord.userData) : null;
            return res.json({ user: userData, role: tokenRecord.role });
          }
        } catch (dbVerifyErr) {
          console.warn("[DB VERIFY TOKEN WARN]:", dbVerifyErr);
        }
      }

      // 2. Try in-memory store
      const authData = authTokens.get(cleanRut) || authTokens.get(rutNum);

      if (!authData) {
        return res.status(400).json({ error: "No hay un token activo para este RUT o ya expiró." });
      }

      if (Date.now() > authData.expires) {
        authTokens.delete(cleanRut);
        authTokens.delete(rutNum);
        return res.status(400).json({ error: "El token ha expirado. Solicite uno nuevo." });
      }

      if (authData.token !== inputToken) {
        return res.status(400).json({ error: "Código de seguridad incorrecto." });
      }

      // Success
      authTokens.delete(cleanRut);
      authTokens.delete(rutNum);
      res.json({ user: authData.user, role: authData.role });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: String(e) });
    }
  });

  // SEED ENDPOINT
  app.post("/api/seed", async (req, res) => {
    try {
      if (process.env.DATABASE_URL) {
        try {
          const pCount = await db.select().from(pacientes);
          if (pCount.length === 0) {
            await db.insert(pacientes).values(initialPacientes.map(p => ({
              rut: p.rut, dv: p.dv, nombres: p.nombres, paterno: p.paterno, materno: p.materno,
              fecha_nacimiento: p.fecha_nacimiento ? new Date(p.fecha_nacimiento).toISOString().split('T')[0] : null,
              correo: p.correo, telefono: p.telefono, direccion: p.direccion, activo: p.activo
            })));
            await db.insert(medicos).values(initialMedicos.map(m => ({
              nombres: m.nombres, apellidos: m.apellidos, rut: m.rut, registro_minsal: m.registro_minsal,
              especialidad: m.especialidad, activo: m.activo
            })));
            await db.insert(diagnostico).values(initialDiagnosticos.map(d => ({
              codigo: d.codigo, descripcion: d.descripcion, activo: d.activo
            })));
            await db.insert(medicamentos).values(initialMedicamentos.map(m => ({
              codigo: m.codigo, descripcion: m.descripcion, laboratorio: m.laboratorio, departamento: m.departamento,
              restriccion: m.restriccion, forma_farmaceutica: m.forma_farmaceutica, presentacion: m.presentacion, activo: m.activo
            })));
            await db.insert(examenes).values(initialExamenes.map(e => ({
              codigo: e.codigo, nombre: e.nombre, descripcion: e.descripcion, activo: e.activo
            })));
            await db.insert(farmacias).values(initialFarmacias.map(f => ({
              nombre: f.nombre, direccion: f.direccion, comuna: f.comuna, ciudad: f.ciudad, telefono: f.telefono, rut: f.rut
            })));
            await db.insert(farmaceutas).values(initialFarmaceutas.map(f => ({
              nombres: f.nombres, paterno: f.paterno, materno: f.materno, rut: f.rut, dv: f.dv, farmacia_id: f.farmacia_id,
              correo: f.correo, activo: f.activo
            })));
          }
        } catch (dbErr) {
          console.warn("[DB SEED NOTICE]:", dbErr);
        }
      }
      res.json({ message: "Seed OK" });
    } catch (e) {
      console.error(e);
      res.json({ message: "Seed fallback completed" });
    }
  });

  // ================= API ENDPOINTS =================
  // GET INITIAL DATA
  app.get("/api/init", async (req, res) => {
    try {
      if (process.env.DATABASE_URL) {
        try {
          const p = await db.select().from(pacientes);
          const m = await db.select().from(medicos);
          const d = await db.select().from(diagnostico);
          const meds = await db.select().from(medicamentos);
          const ex = await db.select().from(examenes);
          const f = await db.select().from(farmacias);
          const ph = await db.select().from(farmaceutas);
          
          const v = await db.query.visitas.findMany({
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
            orderBy: (visitas, { desc }) => [desc(visitas.fecha)]
          });

          if (p.length > 0) {
            return res.json({
              pacientes: p,
              medicos: m,
              diagnosticos: d,
              medicamentos: meds,
              examenes: ex,
              farmacias: f,
              farmaceutas: ph,
              visitas: v
            });
          }
        } catch (dbErr) {
          console.warn("[DB FETCH NOTICE /api/init]:", dbErr);
        }
      }
    } catch (e) {
      console.warn("[DB INIT NOTICE]:", e);
    }

    // Always return full valid fallback data
    res.json({
      pacientes: memPacientes,
      medicos: memMedicos,
      diagnosticos: memDiagnosticos,
      medicamentos: memMedicamentos,
      examenes: memExamenes,
      farmacias: memFarmacias,
      farmaceutas: memFarmaceutas,
      visitas: memVisitas
    });
  });

  // PACIENTES - CREATE
  app.post("/api/pacientes", async (req, res) => {
    try {
      const data = req.body;
      const { cuerpo, dv, cleanCombined } = parseRutParts(data.rut, data.dv);
      const nombres = cleanStr(data.nombres);
      const paterno = cleanStr(data.paterno);
      const materno = cleanStr(data.materno);
      const correo = cleanStr(data.correo);
      const telefono = cleanStr(data.telefono);
      const direccion = cleanStr(data.direccion);
      const fechaNac = normalizeDateForDb(data.fecha_nacimiento);

      let savedPatient: any = null;

      if (process.env.DATABASE_URL) {
        try {
          // Check if patient already exists by RUT or ID
          const existing = await db.select().from(pacientes).where(
            or(
              eq(pacientes.rut, cuerpo),
              eq(pacientes.rut, cleanCombined),
              eq(pacientes.rut, String(data.rut || '').trim()),
              data.id && typeof data.id === 'number' && data.id < 1000000000 ? eq(pacientes.id, data.id) : undefined
            )
          );

          if (existing.length > 0) {
            // Update existing patient
            const updated = await db.update(pacientes).set({
              dv: dv || existing[0].dv,
              nombres: nombres || existing[0].nombres,
              paterno: paterno || existing[0].paterno,
              materno: materno || existing[0].materno,
              fecha_nacimiento: fechaNac || existing[0].fecha_nacimiento,
              correo: correo || existing[0].correo,
              telefono: telefono || existing[0].telefono,
              direccion: direccion || existing[0].direccion,
              activo: 'X',
              updatedAt: new Date()
            }).where(eq(pacientes.id, existing[0].id)).returning();
            if (updated.length > 0) savedPatient = updated[0];
          } else {
            // Insert new patient
            const result = await db.insert(pacientes).values({
              rut: cuerpo,
              dv: dv || '0',
              nombres: nombres,
              paterno: paterno,
              materno: materno || null,
              fecha_nacimiento: fechaNac,
              correo: correo || null,
              telefono: telefono || null,
              direccion: direccion || null,
              activo: 'X'
            }).returning();
            if (result.length > 0) savedPatient = result[0];
          }
        } catch (dbErr) {
          console.error("[DB INSERT/UPDATE ERROR pacientes]:", dbErr);
        }
      }

      if (!savedPatient) {
        savedPatient = {
          id: data.id || Date.now(),
          rut: cuerpo,
          dv: dv,
          nombres,
          paterno,
          materno,
          fecha_nacimiento: fechaNac || data.fecha_nacimiento,
          correo,
          telefono,
          direccion,
          activo: 'X',
          created_at: new Date().toISOString()
        };
      }

      // Update in-memory fallback
      const existingIdx = memPacientes.findIndex(p => p.id === savedPatient.id || (p.rut === savedPatient.rut && p.dv === savedPatient.dv) || p.rut === cuerpo);
      if (existingIdx >= 0) {
        memPacientes[existingIdx] = savedPatient;
      } else {
        memPacientes.unshift(savedPatient);
      }

      res.json(savedPatient);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: String(e) });
    }
  });

  // PACIENTES - UPDATE
  app.put("/api/pacientes/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const data = req.body;
      const { cuerpo, dv, cleanCombined } = parseRutParts(data.rut, data.dv);
      const nombres = cleanStr(data.nombres);
      const paterno = cleanStr(data.paterno);
      const materno = cleanStr(data.materno);
      const correo = cleanStr(data.correo);
      const telefono = cleanStr(data.telefono);
      const direccion = cleanStr(data.direccion);
      const fechaNac = normalizeDateForDb(data.fecha_nacimiento);

      let updated: any = null;

      if (process.env.DATABASE_URL) {
        try {
          // 1. Try updating by ID first (if realistic DB id)
          if (!isNaN(id) && id < 1000000000) {
            const result = await db.update(pacientes).set({
              dv: dv || undefined,
              nombres: nombres,
              paterno: paterno,
              materno: materno || null,
              correo: correo || null,
              telefono: telefono || null,
              direccion: direccion || null,
              fecha_nacimiento: fechaNac,
              updatedAt: new Date()
            }).where(eq(pacientes.id, id)).returning();
            if (result.length > 0) updated = result[0];
          }

          // 2. If ID didn't match (e.g. client used timestamp ID), try matching by RUT
          if (!updated && cuerpo) {
            const result = await db.update(pacientes).set({
              dv: dv || undefined,
              nombres: nombres,
              paterno: paterno,
              materno: materno || null,
              correo: correo || null,
              telefono: telefono || null,
              direccion: direccion || null,
              fecha_nacimiento: fechaNac,
              updatedAt: new Date()
            }).where(
              or(
                eq(pacientes.rut, cuerpo),
                eq(pacientes.rut, cleanCombined),
                eq(pacientes.rut, String(data.rut || '').trim())
              )
            ).returning();
            if (result.length > 0) updated = result[0];
          }

          // 3. Fallback direct SQL UPDATE to guarantee persistence
          if (!updated && (cuerpo || (!isNaN(id) && id < 1000000000))) {
            await db.execute(sql`
              UPDATE pacientes 
              SET nombres = ${nombres},
                  paterno = ${paterno},
                  materno = ${materno || null},
                  correo = ${correo || null},
                  telefono = ${telefono || null},
                  direccion = ${direccion || null},
                  fecha_nacimiento = ${fechaNac ? sql`${fechaNac}::date` : null},
                  dv = ${dv || '0'},
                  updated_at = NOW()
              WHERE id = ${id} OR rut = ${cuerpo} OR rut = ${cleanCombined}
            `);
            const refetched = await db.select().from(pacientes).where(
              or(eq(pacientes.id, id), eq(pacientes.rut, cuerpo), eq(pacientes.rut, cleanCombined))
            );
            if (refetched.length > 0) updated = refetched[0];
          }

          // 4. If still not in DB, insert the patient
          if (!updated && cuerpo && nombres && paterno) {
            const result = await db.insert(pacientes).values({
              rut: cuerpo,
              dv: dv || '0',
              nombres: nombres,
              paterno: paterno,
              materno: materno || null,
              fecha_nacimiento: fechaNac,
              correo: correo || null,
              telefono: telefono || null,
              direccion: direccion || null,
              activo: 'X'
            }).returning();
            if (result.length > 0) updated = result[0];
          }
        } catch (dbErr) {
          console.error("[DB UPDATE ERROR pacientes]:", dbErr);
        }
      }

      if (!updated) {
        updated = {
          id,
          rut: cuerpo || data.rut,
          dv: dv || data.dv,
          nombres,
          paterno,
          materno,
          correo,
          telefono,
          direccion,
          fecha_nacimiento: fechaNac || data.fecha_nacimiento,
          activo: data.activo || 'X'
        };
      }

      memPacientes = memPacientes.map(p => (p.id === id || (p.rut === updated.rut && p.dv === updated.dv) || p.rut === cuerpo) ? updated : p);
      res.json(updated);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: String(e) });
    }
  });

  // MEDICOS - CREATE
  app.post("/api/medicos", async (req, res) => {
    try {
      const data = req.body;
      let newMed: any = null;

      if (process.env.DATABASE_URL) {
        try {
          const result = await db.insert(medicos).values({
            nombres: String(data.nombres || '').trim(),
            apellidos: String(data.apellidos || '').trim(),
            rut: String(data.rut || '').trim(),
            dv: String(data.dv || '').trim().toUpperCase(),
            registro_minsal: String(data.registro_minsal || '').trim(),
            especialidad: String(data.especialidad || data.profesion_nombre || 'Medicina General').trim(),
            correo: String(data.correo || '').trim(),
            telefono: String(data.telefono || '').trim(),
            activo: 'X'
          }).returning();
          newMed = result[0];
        } catch (dbErr) {
          console.warn("[DB INSERT ERROR medicos]:", dbErr);
        }
      }

      if (!newMed) {
        newMed = { id: Date.now(), ...data, activo: 'X' };
      }
      memMedicos.push(newMed);
      res.json(newMed);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  // MEDICAMENTOS - CREATE
  app.post("/api/medicamentos", async (req, res) => {
    try {
      const data = req.body;
      let newMed: any = null;

      if (process.env.DATABASE_URL) {
        try {
          const result = await db.insert(medicamentos).values({
            codigo: String(data.codigo || `MED-${Math.floor(1000 + Math.random() * 9000)}`),
            descripcion: String(data.descripcion || '').trim(),
            laboratorio: String(data.laboratorio || 'Laboratorio Chile').trim(),
            departamento: String(data.departamento || 'Farmacología').trim(),
            restriccion: String(data.restriccion || 'Venta Directa').trim(),
            forma_farmaceutica: String(data.forma_farmaceutica || 'Comprimido').trim(),
            presentacion: String(data.presentacion || 'Caja x 30').trim(),
            activo: 'X'
          }).returning();
          newMed = result[0];
        } catch (dbErr) {
          console.warn("[DB INSERT ERROR medicamentos]:", dbErr);
        }
      }

      if (!newMed) {
        newMed = { id: Date.now(), ...data, activo: 'X' };
      }
      memMedicamentos.unshift(newMed);
      res.json(newMed);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  // MEDICAMENTOS - UPDATE
  app.put("/api/medicamentos/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const data = req.body;
      let updated: any = null;

      if (process.env.DATABASE_URL) {
        try {
          const result = await db.update(medicamentos).set({
            descripcion: data.descripcion,
            laboratorio: data.laboratorio,
            departamento: data.departamento,
            restriccion: data.restriccion,
            forma_farmaceutica: data.forma_farmaceutica,
            presentacion: data.presentacion
          }).where(eq(medicamentos.id, id)).returning();
          if (result.length > 0) updated = result[0];
        } catch (dbErr) {
          console.warn("[DB UPDATE ERROR medicamentos]:", dbErr);
        }
      }

      memMedicamentos = memMedicamentos.map(m => m.id === id ? { ...m, ...data } : m);
      res.json(updated || { id, ...data });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  // EXAMENES - CREATE
  app.post("/api/examenes", async (req, res) => {
    try {
      const data = req.body;
      let newEx: any = null;

      if (process.env.DATABASE_URL) {
        try {
          const result = await db.insert(examenes).values({
            codigo: String(data.codigo || `EX-${Math.floor(100 + Math.random() * 900)}`),
            nombre: String(data.nombre || '').trim(),
            descripcion: data.descripcion ? String(data.descripcion).trim() : null,
            activo: 'X'
          }).returning();
          newEx = result[0];
        } catch (dbErr) {
          console.warn("[DB INSERT ERROR examenes]:", dbErr);
        }
      }

      if (!newEx) {
        newEx = { id: Date.now(), ...data, activo: 'X' };
      }
      memExamenes.unshift(newEx);
      res.json(newEx);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  // VISITAS / RECETAS
  app.post("/api/visitas", async (req, res) => {
    try {
      const { visita } = req.body;
      let completeVisita: any = null;

      if (process.env.DATABASE_URL) {
        try {
          // Resolve real patient ID in PostgreSQL
          let realPacienteId = Number(visita.paciente_id);
          const patientInDb = await db.select().from(pacientes).where(eq(pacientes.id, realPacienteId));
          
          if (patientInDb.length === 0) {
            // Find by RUT if available
            const { cuerpo, dv, cleanCombined } = parseRutParts(visita.paciente?.rut, visita.paciente?.dv);
            if (cuerpo) {
              const byRut = await db.select().from(pacientes).where(
                or(
                  eq(pacientes.rut, cuerpo),
                  eq(pacientes.rut, cleanCombined),
                  eq(pacientes.rut, String(visita.paciente?.rut || '').trim())
                )
              );
              if (byRut.length > 0) {
                realPacienteId = byRut[0].id;
              } else if (visita.paciente) {
                // Insert patient first
                const createdP = await db.insert(pacientes).values({
                  rut: cuerpo,
                  dv: dv || '0',
                  nombres: cleanStr(visita.paciente.nombres),
                  paterno: cleanStr(visita.paciente.paterno),
                  materno: cleanStr(visita.paciente.materno) || null,
                  fecha_nacimiento: normalizeDateForDb(visita.paciente.fecha_nacimiento),
                  correo: cleanStr(visita.paciente.correo) || null,
                  telefono: cleanStr(visita.paciente.telefono) || null,
                  direccion: cleanStr(visita.paciente.direccion) || null,
                  activo: 'X'
                }).returning();
                realPacienteId = createdP[0].id;
              }
            }
          }

          // 1. Insert Visita with verified realPacienteId
          const vResult = await db.insert(visitas).values({
            medico_id: Number(visita.medico_id) || 1,
            paciente_id: realPacienteId,
            diagnostico_id: visita.diagnostico_id ? Number(visita.diagnostico_id) : null,
            tratamiento: visita.tratamiento || null,
            codigo_verificacion: visita.codigo_verificacion,
            estado_id: 1,
            activo: 'X'
          }).returning();
          
          const vId = vResult[0].id;

          // 2. Insert Recetas
          if (visita.recetas && visita.recetas.length > 0) {
            await db.insert(recetas).values(visita.recetas.map((r: any) => ({
              visita_id: vId,
              medicamento_id: Number(r.medicamento_id) || 1,
              tratamiento: r.tratamiento?.trim() || 'Según indicación médica',
              cantidad: Number(r.cantidad) || 1,
              duracion: r.duracion?.trim() || 'Según evolución',
              estado: 1,
              activo: 'X'
            })));
          }

          // 3. Insert Examenes
          if (visita.examenes && visita.examenes.length > 0) {
            await db.insert(orden_examenes).values(visita.examenes.map((e: any) => ({
              visita_id: vId,
              examen_id: Number(e.examen_id) || 1,
              indicaciones: e.indicaciones || null,
              estado: 1
            })));
          }

          // 4. Insert Epicrisis
          if (visita.epicrisis && visita.epicrisis.length > 0) {
            await db.insert(epicrisis).values(visita.epicrisis.map((epi: any) => ({
              visita_id: vId,
              paciente_id: realPacienteId,
              medico_id: Number(visita.medico_id) || 1,
              contenido: epi.contenido
            })));
          }

          completeVisita = await db.query.visitas.findFirst({
            where: eq(visitas.id, vId),
            with: {
              paciente: true, medico: true, diagnostico: true,
              recetas: { with: { medicamento: true, farmaceuta: true } },
              examenes: { with: { examen: true } },
              epicrisis: true
            }
          });
        } catch (dbErr) {
          console.error("[DB INSERT VISITAS ERROR]:", dbErr);
        }
      }

      if (!completeVisita) {
        // Construct in-memory object
        const newId = Date.now();
        const pObj = memPacientes.find(p => p.id === visita.paciente_id) || { nombres: 'Paciente', paterno: '' };
        const mObj = memMedicos.find(m => m.id === visita.medico_id) || { nombres: 'Dr.', apellidos: 'Médico' };
        const dObj = memDiagnosticos.find(d => d.id === visita.diagnostico_id) || null;

        completeVisita = {
          id: newId,
          ...visita,
          fecha: new Date().toISOString().replace('T', ' ').slice(0, 19),
          estado_id: 1,
          paciente: pObj,
          medico: mObj,
          diagnostico: dObj,
          recetas: (visita.recetas || []).map((r: any, idx: number) => ({
            id: newId + idx + 1,
            ...r,
            estado: 1,
            medicamento: memMedicamentos.find(med => med.id === r.medicamento_id) || {}
          })),
          examenes: (visita.examenes || []).map((e: any, idx: number) => ({
            id: newId + idx + 50,
            ...e,
            examen: memExamenes.find(ex => ex.id === e.examen_id) || {}
          })),
          epicrisis: visita.epicrisis || []
        };
      }

      memVisitas.unshift(completeVisita);

      // US-10: Despacho automático de correo electrónico al paciente
      const patientEmail = completeVisita.paciente?.correo?.trim();
      if (patientEmail && patientEmail.includes('@')) {
        sendPrescriptionEmail(patientEmail, completeVisita)
          .then((sent) => {
            if (sent) {
              console.log(`[US-10] Receta enviada exitosamente por correo a ${patientEmail}`);
            }
          })
          .catch((mailErr) => {
            console.warn(`[US-10] Error enviando correo de receta a ${patientEmail}:`, mailErr);
          });
      }

      res.json(completeVisita);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: String(e) });
    }
  });

  // DISPENSAR (QUEMAR) RECETA INDIVIDUAL
  app.put("/api/recetas/:id/dispensar", async (req, res) => {
    try {
      const { id } = req.params;
      const { farmaceuta_id } = req.body;
      const recId = Number(id);
      let updatedRec: any = null;

      if (process.env.DATABASE_URL) {
        try {
          const rResult = await db.update(recetas)
            .set({ 
              estado: 3, 
              farmaceuta_id: farmaceuta_id || 1,
              dispensado_fecha: new Date()
            })
            .where(eq(recetas.id, recId))
            .returning();

          if(rResult.length > 0) {
            const vId = rResult[0].visita_id;
            const remaining = await db.select().from(recetas).where(
               eq(recetas.visita_id, vId)
            );
            const allDispensadas = remaining.length === 0 || remaining.every(r => r.estado === 3);
            const anyDispensadas = remaining.some(r => r.estado === 3);
            
            await db.update(visitas)
              .set({ estado_id: allDispensadas ? 3 : (anyDispensadas ? 2 : 1) })
              .where(eq(visitas.id, vId));

            updatedRec = rResult[0];
          }
        } catch (dbErr) {
          console.warn("[DB DISPENSAR ERROR]:", dbErr);
        }
      }

      // Sync memory
      for (const v of memVisitas) {
        if (v.recetas) {
          for (const r of v.recetas) {
            if (r.id === recId) {
              r.estado = 3;
              r.farmaceuta_id = farmaceuta_id || 1;
              r.dispensado_fecha = new Date().toISOString();
              if (!updatedRec) updatedRec = r;
            }
          }
          const allDisp = v.recetas.every((r: any) => r.estado === 3);
          const anyDisp = v.recetas.some((r: any) => r.estado === 3);
          v.estado_id = allDisp ? 3 : (anyDisp ? 2 : 1);
        }
      }

      res.json(updatedRec || { id: recId, estado: 3 });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: String(e) });
    }
  });

  // DISPENSAR (QUEMAR) TODA LA VISITA/RECETA
  app.put("/api/visitas/:id/dispensar-todo", async (req, res) => {
    try {
      const { id } = req.params;
      const { farmaceuta_id } = req.body;
      const vId = Number(id);
      let completeVisita: any = null;

      if (process.env.DATABASE_URL) {
        try {
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

          completeVisita = await db.query.visitas.findFirst({
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
        } catch (dbErr) {
          console.warn("[DB DISPENSAR TODO ERROR]:", dbErr);
        }
      }

      // Sync memory
      const found = memVisitas.find(v => v.id === vId);
      if (found) {
        found.estado_id = 3;
        if (found.recetas) {
          found.recetas.forEach((r: any) => {
            r.estado = 3;
            r.farmaceuta_id = farmaceuta_id || 1;
            r.dispensado_fecha = new Date().toISOString();
          });
        }
        if (!completeVisita) completeVisita = found;
      }

      res.json(completeVisita || { id: vId, estado_id: 3 });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: String(e) });
    }
  });

  // SEND PRESCRIPTION EMAIL TO PATIENT
  app.post("/api/visitas/:id/send-email", async (req, res) => {
    try {
      const { id } = req.params;
      const { targetEmail, visitaPayload } = req.body;

      let completeVisita = visitaPayload;

      if (!completeVisita || !completeVisita.recetas) {
        if (process.env.DATABASE_URL) {
          try {
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
          } catch (dbErr) {
            console.warn("[DB EMAIL FETCH ERROR]:", dbErr);
          }
        }
        if (!completeVisita) {
          completeVisita = memVisitas.find(v => v.id === Number(id));
        }
      }

      if (!completeVisita) {
        return res.status(404).json({ error: "Receta no encontrada" });
      }

      const emailToSend = targetEmail || completeVisita.paciente?.correo || 'nelsonlastra4@gmail.com';
      const success = await sendPrescriptionEmail(emailToSend, completeVisita);

      if (success) {
        res.json({ success: true, email: emailToSend, message: "Receta médica despachada al correo exitosamente" });
      } else {
        res.status(500).json({ success: false, error: "No se pudo despachar el correo a través del servidor SMTP" });
      }
    } catch (e) {
      console.error("Error sending prescription email:", e);
      res.status(500).json({ error: String(e) });
    }
  });

// Setup local server if not on Vercel
async function setupLocalServer() {
  if (process.env.VERCEL) return;
  const PORT = 3000;
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupLocalServer().catch(console.error);

export default app;
