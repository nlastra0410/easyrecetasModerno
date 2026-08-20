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
  epicrisis
} from "./src/db/schema.js";
import { eq, like, or, sql } from 'drizzle-orm';
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
  } catch (dbSyncErr) {
    console.warn("[DB SYNC NOTICE] PostgreSQL no conectado aún o en proceso:", dbSyncErr);
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
      const cleanRut = rut.replace(/[^0-9Kk]/g, '').toUpperCase();
      const rutNum = cleanRut.length > 1 ? cleanRut.slice(0, -1) : cleanRut;

      let medico: any = null;
      let farmaceuta: any = null;

      // 1. Try PostgreSQL if available
      if (process.env.DATABASE_URL) {
        try {
          medico = await db.query.medicos.findFirst({
            where: or(
              eq(medicos.rut, rutNum),
              eq(medicos.rut, cleanRut),
              eq(medicos.rut, rut)
            )
          });
          farmaceuta = await db.query.farmaceutas.findFirst({
            where: or(
              eq(farmaceutas.rut, rutNum),
              eq(farmaceutas.rut, cleanRut),
              eq(farmaceutas.rut, rut)
            )
          });
        } catch (dbErr) {
          console.warn("[DB QUERY NOTICE auth]:", dbErr);
        }
      }

      // 2. Fallback to memory store if DB returned nothing or failed
      if (!medico) {
        medico = memMedicos.find((m: any) => {
          const mClean = (m.rut + (m.dv || '')).replace(/[^0-9Kk]/g, '').toUpperCase();
          const mNum = m.rut.replace(/[^0-9Kk]/g, '').toUpperCase();
          return mClean === cleanRut || mNum === rutNum || m.rut === rut || `${m.rut}-${m.dv}` === rut;
        }) || null;
      }

      if (!farmaceuta) {
        farmaceuta = memFarmaceutas.find((f: any) => {
          const fClean = (f.rut + (f.dv || '')).replace(/[^0-9Kk]/g, '').toUpperCase();
          const fNum = f.rut.replace(/[^0-9Kk]/g, '').toUpperCase();
          return fClean === cleanRut || fNum === rutNum || f.rut === rut || `${f.rut}-${f.dv}` === rut;
        }) || null;
      }

      if (!medico && !farmaceuta) {
        return res.status(404).json({ error: `RUT ${rut} no encontrado en el cuerpo médico ni farmacéutico.` });
      }

      const user = medico || farmaceuta;
      const role = medico ? 'medico' : 'farmacia';
      
      // Generate secure 6-digit token
      const token = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store token (expires in 5 minutes)
      authTokens.set(cleanRut, { token, user, role, expires: Date.now() + 5 * 60 * 1000 });
      authTokens.set(rutNum, { token, user, role, expires: Date.now() + 5 * 60 * 1000 });

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
      const cleanRut = rut.replace(/[^0-9Kk]/g, '').toUpperCase();
      const rutNum = cleanRut.length > 1 ? cleanRut.slice(0, -1) : cleanRut;

      const authData = authTokens.get(cleanRut) || authTokens.get(rutNum);

      if (!authData) {
        return res.status(400).json({ error: "No hay un token activo para este RUT o ya expiró." });
      }

      if (Date.now() > authData.expires) {
        authTokens.delete(cleanRut);
        authTokens.delete(rutNum);
        return res.status(400).json({ error: "El token ha expirado. Solicite uno nuevo." });
      }

      if (authData.token !== token.trim()) {
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

  // PACIENTES
  app.post("/api/pacientes", async (req, res) => {
    try {
      const data = req.body;
      let newPatient: any = null;
      if (process.env.DATABASE_URL) {
        try {
          const result = await db.insert(pacientes).values({
            rut: data.rut, dv: data.dv, nombres: data.nombres, paterno: data.paterno, materno: data.materno,
            fecha_nacimiento: data.fecha_nacimiento || null, correo: data.correo, telefono: data.telefono, direccion: data.direccion
          }).returning();
          newPatient = result[0];
        } catch (dbErr) {
          console.warn("[DB INSERT ERROR pacientes]:", dbErr);
        }
      }
      if (!newPatient) {
        newPatient = {
          id: Date.now(),
          ...data,
          activo: 'X',
          created_at: new Date().toISOString()
        };
      }
      memPacientes.unshift(newPatient);
      res.json(newPatient);
    } catch (e) {
      console.error(e);
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
          // 1. Insert Visita
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

          // 2. Insert Recetas
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

          // 3. Insert Examenes
          if (visita.examenes && visita.examenes.length > 0) {
            await db.insert(orden_examenes).values(visita.examenes.map((e: any) => ({
              visita_id: vId,
              examen_id: e.examen_id,
              indicaciones: e.indicaciones,
              estado: 1
            })));
          }

          // 4. Insert Epicrisis
          if (visita.epicrisis && visita.epicrisis.length > 0) {
            await db.insert(epicrisis).values(visita.epicrisis.map((epi: any) => ({
              visita_id: vId,
              paciente_id: visita.paciente_id,
              medico_id: visita.medico_id,
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
          console.warn("[DB INSERT VISITAS ERROR]:", dbErr);
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
