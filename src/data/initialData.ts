import { Paciente, Medicamento, Diagnostico, Profesion, Medico, Visita, Farmacia, Farmaceuta, Examen } from '../types';

export const initialProfesiones: Profesion[] = [
  { id: 1, nombre: 'Médico Cirujano' },
  { id: 2, nombre: 'Médico General' },
  { id: 3, nombre: 'Pediatra' },
  { id: 4, nombre: 'Cardiólogo' },
  { id: 5, nombre: 'Dermatólogo' },
  { id: 6, nombre: 'Psiquiatra' },
  { id: 7, nombre: 'Traumatólogo' },
  { id: 8, nombre: 'Odontólogo' },
];

export const initialMedicos: Medico[] = [
  {
    id: 1,
    user_id: 1,
    nombres: 'Dr. Roberto Carlos',
    apellidos: 'Vargas Silva',
    rut: '14285719',
    dv: '3',
    registro_minsal: 'RNM-482910',
    profesiones_id: 1,
    profesion_nombre: 'Médico Cirujano',
    especialidad: 'Medicina Interna',
    correo: 'dr.vargas@easyreceta.cl',
    telefono: '+56 9 8451 2293',
    firma_digital: 'DIGITAL_SIG_CERT_784910'
  },
  {
    id: 2,
    user_id: 2,
    nombres: 'Dra. Marcela Andrea',
    apellidos: 'Pavez Muñoz',
    rut: '16738920',
    dv: 'K',
    registro_minsal: 'RNM-592811',
    profesiones_id: 3,
    profesion_nombre: 'Pediatra',
    especialidad: 'Pediatría y Salud Infantil',
    correo: 'dra.pavez@easyreceta.cl',
    telefono: '+56 9 7122 4589',
    firma_digital: 'DIGITAL_SIG_CERT_901248'
  },
  {
    id: 3,
    user_id: 3,
    nombres: 'Dr. Esteban Javier',
    apellidos: 'Morales Alarcón',
    rut: '12490182',
    dv: '5',
    registro_minsal: 'RNM-301928',
    profesiones_id: 4,
    profesion_nombre: 'Cardiólogo',
    especialidad: 'Cardiología Clínica',
    correo: 'dr.morales@easyreceta.cl',
    telefono: '+56 9 9234 1102',
    firma_digital: 'DIGITAL_SIG_CERT_119024'
  },
  {
    id: 4,
    user_id: 4,
    nombres: 'Dr. Nelson',
    apellidos: 'Lastra Delgado',
    rut: '16778715',
    dv: '0',
    registro_minsal: 'RNM-715820',
    profesiones_id: 1,
    profesion_nombre: 'Médico Cirujano',
    especialidad: 'Medicina General y Familiar',
    correo: 'nelsonlastra4@gmail.com',
    telefono: '+56934456811',
    firma_digital: 'DIGITAL_SIG_CERT_16778715'
  },
  {
    id: 5,
    user_id: 5,
    nombres: 'Dr. Hans',
    apellidos: 'Lembach Palma',
    rut: '12792034',
    dv: '6',
    registro_minsal: 'RNM-639102',
    profesiones_id: 1,
    profesion_nombre: 'Médico Cirujano',
    especialidad: 'Medicina General',
    correo: 'qflembach@gmail.com',
    telefono: '+56912345678',
    firma_digital: 'DIGITAL_SIG_CERT_12792034'
  }
];

export const initialPacientes: Paciente[] = [
  {
    id: 1,
    rut: '18492019',
    dv: '4',
    nombres: 'CAMILA ANDREA',
    paterno: 'ROJAS',
    materno: 'GONZALEZ',
    fecha_nacimiento: '1993-05-14',
    correo: 'camila.rojas@gmail.com',
    direccion: 'Av. Providencia 1420, Depto 402, Santiago',
    telefono: '+56 9 9871 2341',
    activo: 'X',
    created_at: '2025-01-10 10:30:00'
  },
  {
    id: 2,
    rut: '15892104',
    dv: '8',
    nombres: 'GONZALO IGNACIO',
    paterno: 'HERNANDEZ',
    materno: 'CASTRO',
    fecha_nacimiento: '1984-11-22',
    correo: 'ghernandez@empresa.cl',
    direccion: 'Calle Los Alerces 850, Ñuñoa, Santiago',
    telefono: '+56 9 8765 4321',
    activo: 'X',
    created_at: '2025-01-14 11:15:00'
  },
  {
    id: 3,
    rut: '20194820',
    dv: '1',
    nombres: 'MATIAS SEBASTIAN',
    paterno: 'VALENZUELA',
    materno: 'RIOS',
    fecha_nacimiento: '1999-08-03',
    correo: 'matias.valenzuela@outlook.com',
    direccion: 'Pasaje Las Violetas 412, La Florida, Santiago',
    telefono: '+56 9 6543 9081',
    activo: 'X',
    created_at: '2025-01-18 15:40:00'
  },
  {
    id: 4,
    rut: '11482910',
    dv: 'K',
    nombres: 'PATRICIA ELENA',
    paterno: 'SOTO',
    materno: 'NAVARRO',
    fecha_nacimiento: '1968-03-29',
    correo: 'patricia.soto@hotmail.com',
    direccion: 'Av. Las Condes 10200, Las Condes, Santiago',
    telefono: '+56 9 5412 8901',
    activo: 'X',
    created_at: '2025-01-20 09:00:00'
  },
  {
    id: 5,
    rut: '22849102',
    dv: '7',
    nombres: 'SOFIA BEATRIZ',
    paterno: 'AGUILERA',
    materno: 'CONTRERAS',
    fecha_nacimiento: '2005-12-11',
    correo: 'sofia.aguilera@alumnos.cl',
    direccion: 'Manuel Montt 580, Providencia, Santiago',
    telefono: '+56 9 4321 0987',
    activo: 'X',
    created_at: '2025-02-01 16:20:00'
  },
  {
    id: 6,
    rut: '28152245',
    dv: '0',
    nombres: 'MAXIMILIANO',
    paterno: 'LASTRA',
    materno: 'ITURRIAGA',
    fecha_nacimiento: '2024-05-23',
    correo: 'nlastra@outlook.cl',
    direccion: '',
    telefono: '',
    activo: 'X',
    created_at: '2026-08-19 16:54:53'
  }
];

export const initialDiagnosticos: Diagnostico[] = [
  { id: 1, codigo: 'J00', descripcion: 'Rinofaringitis aguda (Resfriado común)', categoria: 'Enfermedades respiratorias' },
  { id: 2, codigo: 'I10', descripcion: 'Hipertensión esencial (primaria)', categoria: 'Sistema circulatorio' },
  { id: 3, codigo: 'E11', descripcion: 'Diabetes mellitus tipo 2 no insulinodependiente', categoria: 'Endocrino y metabólico' },
  { id: 4, codigo: 'K29.7', descripcion: 'Gastritis, no especificada', categoria: 'Aparato digestivo' },
  { id: 5, codigo: 'M54.5', descripcion: 'Lumbago no especificado / Dolor lumbar bajo', categoria: 'Osteomuscular' },
  { id: 6, codigo: 'F41.1', descripcion: 'Trastorno de ansiedad generalizada', categoria: 'Salud mental' },
  { id: 7, codigo: 'J20.9', descripcion: 'Bronquitis aguda, no especificada', categoria: 'Enfermedades respiratorias' },
  { id: 8, codigo: 'L20', descripcion: 'Dermatitis atópica', categoria: 'Piel' },
  { id: 9, codigo: 'N39.0', descripcion: 'Infección del tracto urinario, sitio no especificado', categoria: 'Genitourinario' },
  { id: 10, codigo: 'G43.9', descripcion: 'Migraña, no especificada', categoria: 'Sistema nervioso' }
];

export const initialMedicamentos: Medicamento[] = [
  {
    id: 1,
    codigo: 'MED-1001',
    descripcion: 'Paracetamol 500 mg Comprimidos',
    laboratorio: 'Laboratorio Chile / Teva',
    departamento: 'Analgésicos y Antipiréticos',
    restriccion: 'Venta Directa',
    forma_farmaceutica: 'Comprimido',
    presentacion: 'Caja x 16 comprimidos',
    activo: 'X'
  },
  {
    id: 2,
    codigo: 'MED-1002',
    descripcion: 'Ibuprofeno 400 mg Comprimidos Recubiertos',
    laboratorio: 'Mintlab Farmacéutica',
    departamento: 'Antiinflamatorios no esteroideos (AINEs)',
    restriccion: 'Venta Directa',
    forma_farmaceutica: 'Comprimido recubierto',
    presentacion: 'Caja x 20 comprimidos',
    activo: 'X'
  },
  {
    id: 3,
    codigo: 'MED-1003',
    descripcion: 'Amoxicilina + Ácido Clavulánico 875/125 mg',
    laboratorio: 'Laboratorios Saval',
    departamento: 'Antibióticos sistémicos',
    restriccion: 'Receta Médica Simple',
    forma_farmaceutica: 'Comprimido recubierto',
    presentacion: 'Caja x 14 comprimidos',
    activo: 'X'
  },
  {
    id: 4,
    codigo: 'MED-1004',
    descripcion: 'Losartán Potásico 50 mg',
    laboratorio: 'Laboratorio Bagó',
    departamento: 'Cardiovascular / Antihipertensivos',
    restriccion: 'Receta Médica Simple',
    forma_farmaceutica: 'Comprimido',
    presentacion: 'Caja x 30 comprimidos',
    activo: 'X'
  },
  {
    id: 5,
    codigo: 'MED-1005',
    descripcion: 'Metformina Clorhidrato 850 mg',
    laboratorio: 'Laboratorio Sanitas',
    departamento: 'Antidiabéticos orales',
    restriccion: 'Receta Médica Simple',
    forma_farmaceutica: 'Comprimido',
    presentacion: 'Caja x 30 comprimidos',
    activo: 'X'
  },
  {
    id: 6,
    codigo: 'MED-1006',
    descripcion: 'Omeprazol 20 mg Cápsulas con microgránulos',
    laboratorio: 'Laboratorio Chile',
    departamento: 'Gastroenterología / Antiulcerosos',
    restriccion: 'Venta Directa',
    forma_farmaceutica: 'Cápsula con microgránulos gastroresistentes',
    presentacion: 'Caja x 30 cápsulas',
    activo: 'X'
  },
  {
    id: 7,
    codigo: 'MED-1007',
    descripcion: 'Ketorolaco Trometamol 10 mg Comprimidos sublinguales',
    laboratorio: 'Laboratorios Andrómaco',
    departamento: 'Analgésicos potentes',
    restriccion: 'Receta Médica Retenida',
    forma_farmaceutica: 'Comprimido sublingual',
    presentacion: 'Caja x 10 comprimidos',
    activo: 'X'
  },
  {
    id: 8,
    codigo: 'MED-1008',
    descripcion: 'Loratadina 10 mg Comprimidos',
    laboratorio: 'Laboratorio Pasteur',
    departamento: 'Antihistamínicos',
    restriccion: 'Venta Directa',
    forma_farmaceutica: 'Comprimido',
    presentacion: 'Caja x 30 comprimidos',
    activo: 'X'
  },
  {
    id: 9,
    codigo: 'MED-1009',
    descripcion: 'Salbutamol 100 mcg/dosis Aerosol para inhalación',
    laboratorio: 'GlaxoSmithKline',
    departamento: 'Broncodilatadores respiratorios',
    restriccion: 'Receta Médica Simple',
    forma_farmaceutica: 'Inhalador aerosol',
    presentacion: 'Frasco presurizado x 200 dosis',
    activo: 'X'
  },
  {
    id: 10,
    codigo: 'MED-1010',
    descripcion: 'Sertralina 50 mg Comprimidos Recubiertos',
    laboratorio: 'Laboratorio Silesia',
    departamento: 'Psiquiatría / Antidepresivos',
    restriccion: 'Receta Médica Retenida',
    forma_farmaceutica: 'Comprimido recubierto',
    presentacion: 'Caja x 30 comprimidos',
    activo: 'X'
  }
];

export const initialExamenes: Examen[] = [
  // Exámenes Generales
  { id: 1, codigo: 'EX-001', nombre: 'Hemograma Completo', categoria: 'General', descripcion: 'Recuento globular, fórmula leucocitaria y plaquetas', activo: 'X' },
  { id: 2, codigo: 'EX-002', nombre: 'Perfil Lipídico', categoria: 'General', descripcion: 'Colesterol total, HDL, LDL y triglicéridos', activo: 'X' },
  { id: 3, codigo: 'EX-003', nombre: 'Glicemia en Ayunas', categoria: 'General', descripcion: 'Nivel de glucosa basal', activo: 'X' },
  { id: 4, codigo: 'EX-004', nombre: 'Creatinina en Sangre', categoria: 'General', descripcion: 'Evaluación de función renal y filtración', activo: 'X' },
  { id: 5, codigo: 'EX-005', nombre: 'Orina Completa (Urocultivo)', categoria: 'General', descripcion: 'Sedimento urinario y cultivo bacteriano', activo: 'X' },
  { id: 6, codigo: 'EX-006', nombre: 'Radiografía de Tórax AP y Lateral', categoria: 'General', descripcion: 'Estudio de campos pulmonares y silueta cardíaca', activo: 'X' },
  { id: 7, codigo: 'EX-007', nombre: 'Electrocardiograma de Reposo (ECG)', categoria: 'General', descripcion: 'Trazado eléctrico cardíaco de 12 derivaciones', activo: 'X' },
  { id: 8, codigo: 'EX-008', nombre: 'Ecografía Abdominal', categoria: 'General', descripcion: 'Visualización de hígado, vesícula, bazo y riñones', activo: 'X' },
  { id: 9, codigo: 'EX-009', nombre: 'TSH y Hormonas Tiroideas', categoria: 'General', descripcion: 'Tamizaje y control de función tiroidea', activo: 'X' },
  { id: 10, codigo: 'EX-010', nombre: 'Antígeno Prostático Específico (PSA)', categoria: 'General', descripcion: 'Marcador prostático total y libre', activo: 'X' },
  
  // Exámenes Odontológicos / Dentales (US-07)
  { id: 11, codigo: 'EX-101', nombre: 'Radiografía Panorámica Digital (Ortopantomografía)', categoria: 'Odontologico', descripcion: 'Evaluación integral maxilomandibular y piezas dentarias', activo: 'X' },
  { id: 12, codigo: 'EX-102', nombre: 'Radiografía Bitewing (Aleta Mordida Bilateral)', categoria: 'Odontologico', descripcion: 'Detección de caries interproximales y cresta ósea alveolar', activo: 'X' },
  { id: 13, codigo: 'EX-103', nombre: 'Radiografía Periapical Seriada / Aislada', categoria: 'Odontologico', descripcion: 'Visualización de raíz dental, ápice y tejido periapical', activo: 'X' },
  { id: 14, codigo: 'EX-104', nombre: 'Tomografía Cone Beam Maxilofacial (CBCT)', categoria: 'Odontologico', descripcion: 'Estudio 3D volumétrico para implantes y endodoncia', activo: 'X' },
  { id: 15, codigo: 'EX-105', nombre: 'Telerradiografía Lateral de Cráneo con Cefalometría', categoria: 'Odontologico', descripcion: 'Planificación de ortodoncia y ortopedia maxilar', activo: 'X' }
];

export const initialFarmacias: Farmacia[] = [
  {
    id: 1,
    nombre: 'Farmacia Cruz Verde - Sucursal Providencia',
    direccion: 'Av. Pedro de Valdivia 180',
    comuna: 'Providencia',
    ciudad: 'Santiago',
    telefono: '+56 2 2489 1000',
    rut: '76892019'
  },
  {
    id: 2,
    nombre: 'Farmacia Salcobrand - Sucursal Las Condes',
    direccion: 'Av. Apoquindo 4400',
    comuna: 'Las Condes',
    ciudad: 'Santiago',
    telefono: '+56 2 2673 8900',
    rut: '77129038'
  },
  {
    id: 3,
    nombre: 'Farmacia Ahumada - Sucursal Santiago Centro',
    direccion: 'Paseo Ahumada 250',
    comuna: 'Santiago',
    ciudad: 'Santiago',
    telefono: '+56 2 2631 3000',
    rut: '78201928'
  }
];

export const initialFarmaceutas: Farmaceuta[] = [
  {
    id: 1,
    user_id: 101,
    nombres: 'Esteban Andrés',
    paterno: 'López',
    materno: 'Vega',
    rut: '16892103',
    dv: '9',
    farmacia_id: 1,
    farmacia_nombre: 'Farmacia Cruz Verde - Providencia',
    correo: 'esteban.lopez@cruzverde.cl',
    activo: 'X'
  },
  {
    id: 2,
    user_id: 102,
    nombres: 'Carolina Paz',
    paterno: 'Figueroa',
    materno: 'Sanhueza',
    rut: '17892011',
    dv: '2',
    farmacia_id: 2,
    farmacia_nombre: 'Farmacia Salcobrand - Las Condes',
    correo: 'carolina.figueroa@salcobrand.cl',
    activo: 'X'
  },
  {
    id: 3,
    user_id: 103,
    nombres: 'Hans',
    paterno: 'Lembach',
    materno: 'Palma',
    rut: '12792034',
    dv: '6',
    farmacia_id: 1,
    farmacia_nombre: 'Farmacia Cruz Verde - Providencia',
    correo: 'hplembac@uc.cl',
    activo: 'X'
  },
  {
    id: 4,
    user_id: 104,
    nombres: 'Vicente Andres',
    paterno: 'Saavedra',
    materno: 'Rojas',
    rut: '18731753',
    dv: '3',
    farmacia_id: 2,
    farmacia_nombre: 'Farmacia Salcobrand - Las Condes',
    correo: 'nelsonlastra4@gmail.com',
    telefono: '+56934456811',
    activo: 'X'
  }
];

export const initialVisitas: Visita[] = [
  {
    id: 1,
    medico_id: 1,
    medico: initialMedicos[0],
    paciente_id: 1,
    paciente: initialPacientes[0],
    diagnostico_id: 1,
    diagnostico: initialDiagnosticos[0],
    tratamiento: 'Reposo relativo por 48 horas. Buena hidratación oral. Control SOS en caso de fiebre superior a 38.5°C por más de 3 días.',
    fecha: '2025-02-10 10:45:00',
    estado_id: 3, // Dispensada
    codigo_verificacion: 'ER-20250210-9481A',
    activo: 'X',
    recetas: [
      {
        id: 1,
        visita_id: 1,
        medicamento_id: 1,
        medicamento: initialMedicamentos[0],
        tratamiento: '1 comprimido de 500mg cada 8 horas por 5 días en caso de dolor o fiebre.',
        cantidad: 1,
        duracion: '5 días',
        estado: 3, // Dispensada
        farmaceuta_id: 1,
        farmaceuta_nombre: 'Esteban Andrés López (Cruz Verde)',
        dispensado_fecha: '2025-02-10 14:20:00',
        activo: 'X'
      },
      {
        id: 2,
        visita_id: 1,
        medicamento_id: 8,
        medicamento: initialMedicamentos[7],
        tratamiento: '1 comprimido de 10mg por la noche durante 7 días.',
        cantidad: 1,
        duracion: '7 días',
        estado: 3, // Dispensada
        farmaceuta_id: 1,
        farmaceuta_nombre: 'Esteban Andrés López (Cruz Verde)',
        dispensado_fecha: '2025-02-10 14:20:00',
        activo: 'X'
      }
    ]
  },
  {
    id: 2,
    medico_id: 1,
    medico: initialMedicos[0],
    paciente_id: 2,
    paciente: initialPacientes[1],
    diagnostico_id: 2,
    diagnostico: initialDiagnosticos[1],
    tratamiento: 'Régimen hiposódico estricto. Registro diario de presión arterial matutina y vespertina. Control en 30 días con perfil bioquímico.',
    fecha: '2025-02-14 11:30:00',
    estado_id: 1, // Activa / Pendiente
    codigo_verificacion: 'ER-20250214-7723B',
    activo: 'X',
    recetas: [
      {
        id: 3,
        visita_id: 2,
        medicamento_id: 4,
        medicamento: initialMedicamentos[3],
        tratamiento: '1 comprimido de 500mg cada 12 horas (8:00 y 20:00 hrs) de forma continua.',
        cantidad: 2,
        duracion: '60 días',
        estado: 1, // Pendiente
        activo: 'X'
      }
    ]
  },
  {
    id: 3,
    medico_id: 2,
    medico: initialMedicos[1],
    paciente_id: 3,
    paciente: initialPacientes[2],
    diagnostico_id: 5,
    diagnostico: initialDiagnosticos[4],
    tratamiento: 'Evitar levantamiento de peso. Calor local en zona lumbar 15 min 2 veces al día. Ejercicios de elongación suaves.',
    fecha: '2025-02-18 16:15:00',
    estado_id: 2, // Parcialmente dispensada
    codigo_verificacion: 'ER-20250218-3319C',
    activo: 'X',
    recetas: [
      {
        id: 4,
        visita_id: 3,
        medicamento_id: 2,
        medicamento: initialMedicamentos[1],
        tratamiento: '1 comprimido de 400mg cada 8 horas después de las comidas por 5 días.',
        cantidad: 1,
        duracion: '5 días',
        estado: 3, // Dispensado
        farmaceuta_id: 2,
        farmaceuta_nombre: 'Carolina Paz Figueroa (Salcobrand)',
        dispensado_fecha: '2025-02-18 19:10:00',
        activo: 'X'
      },
      {
        id: 5,
        visita_id: 3,
        medicamento_id: 7,
        medicamento: initialMedicamentos[6],
        tratamiento: '1 comprimido sublingual cada 12 horas solo en caso de dolor severo por un máximo de 3 días.',
        cantidad: 1,
        duracion: '3 días',
        estado: 1, // Pendiente
        activo: 'X'
      }
    ]
  }
];
