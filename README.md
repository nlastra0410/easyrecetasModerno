# EasyRecetas - Sistema de Recetas Médicas Electrónicas y Dispensación Digital

[![React](https://img.shields.io/badge/React-18%2B-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon_Cloud-336791.svg)](https://neon.tech/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4.0-38bdf8.svg)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6.0%2B-646CFF.svg)](https://vitejs.dev/)

**EasyRecetas** es una plataforma integral de prescripción, validación y dispensación de recetas médicas electrónicas y órdenes de exámenes clínicos en Chile. Diseñada bajo los estándares del Ministerio de Salud (MINSAL), permite la emisión segura de recetas con firma digital, trazabilidad completa de tratamientos, y un mecanismo de "quemado" (dispensación única) en farmacias para prevenir duplicidades o falsificaciones.

---

## 🚀 Características Principales

### 1. Panel de Control y Métricas (Dashboard)
- Indicadores en tiempo real de recetas emitidas, dispensadas parcialmente y quemadas en farmacias.
- Gráficos y tablas interactivas de actividad reciente y distribución por estado.

### 2. Emisión Profesional de Recetas Médicas
- Validación algorítmica de RUT chileno (módulo 11) para pacientes y médicos.
- Catálogo de diagnósticos codificados **CIE-10**.
- Prescripción múltiple con posología detallada, duración de tratamiento y cantidad de envases.
- Solicitud paralela de órdenes de exámenes de laboratorio e imagenología.
- Generación instantánea de **código de verificación único** (ej. `ER-20250210-9481A`) y código QR criptográfico.

### 3. Módulo de Farmacia y Dispensación ("Quemar Receta")
- Búsqueda y verificación de recetas mediante código único o escaneo de QR.
- Despacho parcial por medicamento o **dispensación total ("Quemar Receta")**.
- Registro auditable del químico farmacéutico responsable, sucursal de farmacia, fecha y hora exacta del despacho.

### 4. Portal Público de Verificación de Recetas
- Acceso ciudadano para validar la autenticidad, vigencia y estado de una receta médica sin necesidad de iniciar sesión.
- Vista previa del documento oficial con firma digital, timbre y detalle de fármacos indicados.

### 5. Gestión Clínica Centralizada
- **Directorio de Pacientes**: Ficha clínica con historial de consultas, alergias y prescripciones anteriores.
- **Vademécum / Medicamentos**: Catálogo clasificado por laboratorio, forma farmacéutica y condición de venta (Venta Directa, Receta Simple, Receta Retenida).
- **Cuerpo Médico**: Registro de facultativos con especialidad y número de Registro Nacional de Prestadores Individuales de Salud (RNM / MINSAL).

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Tailwind CSS v4, Motion (`motion/react`), Lucide React |
| **Herramienta de Build** | Vite 6+, ESBuild |
| **Backend / API** | Node.js, Express, REST APIs estructuradas |
| **Base de Datos** | PostgreSQL en la nube (Neon Database / Cloud SQL), Drizzle ORM |
| **Autenticación** | Acceso seguro 2FA mediante código OTP de 6 dígitos vía SMS (Twilio) y Correo Electrónico |
| **Seguridad & Producción** | Desactivación de sourcemaps (`sourcemap: false`), minificación avanzada, bloqueo de clic derecho y anulación de atajos de inspección (`F12`, `Ctrl+Shift+I`) |

---

## 🔒 Arquitectura de Seguridad

1. **Protección de Código en Cliente:** El bundle de producción se compila sin mapas de código (`sourcemap: false`), eliminando logs de consola y previniendo la ingeniería inversa de los componentes fuente (`.tsx`).
2. **Aislamiento de Secretos:** Todas las credenciales críticas (`DATABASE_URL`, claves de Twilio y correo) se ejecutan de manera aislada en el servidor y nunca se exponen al navegador.
3. **Control de Duplicidad:** El flujo de dispensación actualiza el estado en la base de datos PostgreSQL de forma transaccional, imposibilitando el canje reiterado de una misma prescripción médica.

---

## 📋 Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto tomando como base `.env.example`:

```env
# Conexión a Base de Datos PostgreSQL (Neon / Cloud SQL)
DATABASE_URL=postgresql://neondb_owner:tu_password@ep-ejemplo.us-east-2.aws.neon.tech/neondb?sslmode=require

# Puerto de Ejecución Local
PORT=3000

# Integración SMS con Twilio (Opcional)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Credenciales de Correo para Notificaciones OTP (Opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```

---

## 📦 Instalación y Ejecución Local

### 1. Clonar el repositorio e instalar dependencias
```bash
git clone https://github.com/tu-usuario/easyrecetas.git
cd easyrecetas
npm install
```

### 2. Iniciar en modo desarrollo
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:3000`.

### 3. Compilar para producción
```bash
npm run build
```
Generará los artefactos optimizados en la carpeta `dist/`.

---

## 🌐 Despliegue en Vercel

1. Sube tu repositorio a GitHub.
2. Importa el proyecto en tu panel de **Vercel**.
3. En la sección **Environment Variables**, añade tu `DATABASE_URL` y las variables correspondientes.
4. Presiona **Deploy**. Vercel compilará automáticamente la aplicación con las directivas de seguridad optimizadas.

---

## 📄 Licencia

Este proyecto está bajo la licencia **MIT**. Desarrollado para optimizar y digitalizar la atención médica y farmacéutica.
