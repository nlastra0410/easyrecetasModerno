import React, { useState, useEffect } from 'react';
import {
  Paciente,
  Medicamento,
  Diagnostico,
  Profesion,
  Medico,
  Visita,
  Farmacia,
  Farmaceuta,
  ViewTab,
  Examen
} from './types';
import {
  initialProfesiones,
  initialPacientes,
  initialMedicamentos,
  initialDiagnosticos,
  initialExamenes,
  initialMedicos,
  initialFarmacias,
  initialFarmaceutas,
  initialVisitas
} from './data/initialData';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { NuevaRecetaView } from './components/NuevaRecetaView';
import { VisitasView } from './components/VisitasView';
import { PacientesView } from './components/PacientesView';
import { MedicamentosView } from './components/MedicamentosView';
import { ExamenesView } from './components/ExamenesView';
import { FarmaciaDespachoView } from './components/FarmaciaDespachoView';
import { MedicosView } from './components/MedicosView';
import { VerificadorPublicoView } from './components/VerificadorPublicoView';
import { RecetaModal } from './components/RecetaModal';
import { LoginView } from './components/LoginView';

export const App: React.FC = () => {
  // Navigation & Role
  const [currentTab, setCurrentTab] = useState<ViewTab>('verificador-publico');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeRole, setActiveRole] = useState<'medico' | 'farmacia' | 'paciente' | null>(null);
  const [authenticatedUser, setAuthenticatedUser] = useState<any>(null);

  const [quickVerifyCode, setQuickVerifyCode] = useState<string>('');

  const [loading, setLoading] = useState(true);

  // States
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([]);
  const [profesiones] = useState<Profesion[]>(initialProfesiones);
  const [examenes, setExamenes] = useState<Examen[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [farmacias, setFarmacias] = useState<Farmacia[]>([]);
  const [farmaceutas, setFarmaceutas] = useState<Farmaceuta[]>([]);

  // Prescription preview modal
  const [selectedVisitaForModal, setSelectedVisitaForModal] = useState<Visita | null>(null);

  const loadData = async () => {
    try {
      const res = await fetch('/api/init');
      if (!res.ok) {
        throw new Error(`Status ${res.status}`);
      }
      const data = await res.json();

      if (data && Array.isArray(data.pacientes) && data.pacientes.length > 0) {
        populateData(data);
      } else {
        // Try seeding if empty
        try {
          await fetch('/api/seed', { method: 'POST' });
          const res2 = await fetch('/api/init');
          if (res2.ok) {
            const data2 = await res2.json();
            if (data2 && Array.isArray(data2.pacientes) && data2.pacientes.length > 0) {
              populateData(data2);
              return;
            }
          }
        } catch {
          // Ignore
        }
        populateFallbackData();
      }
    } catch (err) {
      console.warn('Backend /api/init not ready, utilizing robust local dataset:', err);
      populateFallbackData();
    } finally {
      setLoading(false);
    }
  };

  const populateFallbackData = () => {
    setPacientes(initialPacientes);
    setMedicamentos(initialMedicamentos);
    setDiagnosticos(initialDiagnosticos);
    setExamenes(initialExamenes);
    setMedicos(initialMedicos);
    setFarmacias(initialFarmacias);
    setFarmaceutas(initialFarmaceutas);
    setVisitas(initialVisitas);
  };

  const populateData = (data: any) => {
    setPacientes(Array.isArray(data.pacientes) && data.pacientes.length ? data.pacientes : initialPacientes);
    setMedicamentos(Array.isArray(data.medicamentos) && data.medicamentos.length ? data.medicamentos : initialMedicamentos);
    setDiagnosticos(Array.isArray(data.diagnosticos) && data.diagnosticos.length ? data.diagnosticos : initialDiagnosticos);
    setExamenes(Array.isArray(data.examenes) && data.examenes.length ? data.examenes : initialExamenes);
    setMedicos(Array.isArray(data.medicos) && data.medicos.length ? data.medicos : initialMedicos);
    setFarmacias(Array.isArray(data.farmacias) && data.farmacias.length ? data.farmacias : initialFarmacias);
    setFarmaceutas(Array.isArray(data.farmaceutas) && data.farmaceutas.length ? data.farmaceutas : initialFarmaceutas);
    setVisitas(Array.isArray(data.visitas) && data.visitas.length ? data.visitas : initialVisitas);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers
  const handleAddNewPaciente = (newPac: Paciente): Paciente => {
    // Optimistic
    const tempPac = { ...newPac, id: Date.now() };
    setPacientes(prev => [tempPac, ...prev]);

    fetch('/api/pacientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPac)
    })
      .then(r => r.json())
      .then(saved => {
        setPacientes(prev => prev.map(p => p.id === tempPac.id ? saved : p));
      });

    return tempPac;
  };

  const handleUpdatePaciente = (updatedPac: Paciente) => {
    setPacientes(prev => prev.map(p => p.id === updatedPac.id ? updatedPac : p));
  };

  const handleAddNewMedicamento = (newMed: Medicamento) => {
    setMedicamentos(prev => [newMed, ...prev]);
  };

  const handleUpdateMedicamento = (updatedMed: Medicamento) => {
    setMedicamentos(prev => prev.map(m => m.id === updatedMed.id ? updatedMed : m));
  };

  const handleAddNewMedico = (newMed: Medico) => {
    setMedicos(prev => [...prev, newMed]);
  };

  const handleSaveVisita = (newVisita: Visita) => {
    // Post to API
    fetch('/api/visitas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visita: newVisita })
    })
      .then(res => res.json())
      .then(saved => {
        setVisitas(prev => [saved, ...prev]);
        setSelectedVisitaForModal(saved);
      });
  };

  const handleQuemarTodaReceta = (visitaId: number, farmaceutaNombre: string) => {
    // 1. Real persistence in PostgreSQL (Neon)
    fetch(`/api/visitas/${visitaId}/dispensar-todo`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ farmaceuta_id: activeFarmaceuta?.id || 1 })
    }).catch(err => console.error('Error al persistir quema en DB:', err));

    // 2. Optimistic Update in UI
    const now = new Date().toISOString();
    setVisitas(prev => prev.map(vi => {
      if (vi.id === visitaId) {
        return {
          ...vi,
          estado_id: 3,
          recetas: vi.recetas?.map(r => ({ ...r, estado: 3, farmaceuta_nombre: farmaceutaNombre, dispensado_fecha: now }))
        };
      }
      return vi;
    }));
  };

  const handleQuemarItemMedicamento = (visitaId: number, itemId: number, farmaceutaNombre: string) => {
    // 1. Real persistence in PostgreSQL (Neon)
    fetch(`/api/recetas/${itemId}/dispensar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ farmaceuta_id: activeFarmaceuta?.id || 1 })
    }).catch(err => console.error('Error al dispensar fármaco en DB:', err));

    // 2. Optimistic Update
    const now = new Date().toISOString();
    setVisitas((prev) =>
      prev.map((v) => {
        if (v.id === visitaId) {
          const updatedRecetas = v.recetas?.map((r) => {
            if (r.id === itemId) {
              return { ...r, estado: 3, farmaceuta_nombre: farmaceutaNombre, dispensado_fecha: now };
            }
            return r;
          }) || [];

          const allBurned = updatedRecetas.every((r) => r.estado === 3);
          const someBurned = updatedRecetas.some((r) => r.estado === 3);

          return { ...v, estado_id: allBurned ? 3 : someBurned ? 2 : 1, recetas: updatedRecetas };
        }
        return v;
      })
    );
  };

  const handleQuickVerify = (code: string) => {
    setQuickVerifyCode(code);
    setCurrentTab('verificador-publico');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-500">Cargando aplicación y conectando a Neon DB...</div>;
  }

  // Active Contexts
  const activeMedico = activeRole === 'medico' ? authenticatedUser : medicos[0];
  const activeFarmacia = activeRole === 'farmacia' ? authenticatedUser : (farmacias[0] || { id: 1, nombre: 'Farmacia Central EasyRecetas', direccion: 'Av. Providencia 1208', ciudad: 'Santiago' });
  const activeFarmaceuta = activeRole === 'farmacia' ? authenticatedUser : (farmaceutas[0] || { id: 1, nombres: 'Químico Farmacéutico', paterno: 'de Turno' });

  const pendingCount = visitas.filter((v) => v.estado_id !== 3).length;

  const handleLogin = (role: 'medico' | 'farmacia' | 'paciente', user: any) => {
    setIsAuthenticated(true);
    setActiveRole(role);
    setAuthenticatedUser(user);
    setCurrentTab(role === 'medico' ? 'dashboard' : 'farmacia-despacho');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveRole(null);
    setAuthenticatedUser(null);
    setCurrentTab('verificador-publico');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isAuthenticated={isAuthenticated}
        activeRole={activeRole}
        activeMedico={activeMedico}
        activeFarmacia={activeFarmacia}
        onLogout={handleLogout}
      />

      <div className="flex-1 w-full flex overflow-hidden">
        {currentTab !== 'verificador-publico' && currentTab !== 'login' && (
          <Sidebar
            currentTab={currentTab}
            onSelectTab={setCurrentTab}
            activeRole={activeRole!}
            pendingVisitasCount={pendingCount}
          />
        )}

        <main className="flex-1 min-w-0 overflow-y-auto bg-slate-50">
          {currentTab === 'login' && (
            <LoginView
              onLogin={handleLogin}
            />
          )}

          {currentTab === 'dashboard' && isAuthenticated && (
            <DashboardView
              visitas={visitas}
              pacientes={pacientes}
              medicamentos={medicamentos}
              onSelectTab={setCurrentTab}
              onViewReceta={(v) => setSelectedVisitaForModal(v)}
              onOpenQuemar={(v) => {
                setQuickVerifyCode(v.codigo_verificacion);
                setCurrentTab('farmacia-despacho');
              }}
            />
          )}

          {currentTab === 'nueva-receta' && isAuthenticated && activeRole === 'medico' && (
            <NuevaRecetaView
              pacientes={pacientes}
              medicamentos={medicamentos}
              diagnosticos={diagnosticos}
              examenes={examenes}
              activeMedico={activeMedico!}
              onSaveVisita={handleSaveVisita}
              onAddNewPaciente={handleAddNewPaciente}
            />
          )}

          {currentTab === 'visitas' && isAuthenticated && (
            <VisitasView
              visitas={visitas}
              onViewReceta={(v) => setSelectedVisitaForModal(v)}
              onOpenQuemar={(v) => {
                setQuickVerifyCode(v.codigo_verificacion);
                setCurrentTab('farmacia-despacho');
              }}
            />
          )}

          {currentTab === 'pacientes' && isAuthenticated && activeRole === 'medico' && (
            <PacientesView
              pacientes={pacientes}
              visitas={visitas}
              onAddNewPaciente={handleAddNewPaciente}
              onUpdatePaciente={handleUpdatePaciente}
              onViewReceta={(v) => setSelectedVisitaForModal(v)}
            />
          )}

          {currentTab === 'medicamentos' && isAuthenticated && (
            <MedicamentosView
              medicamentos={medicamentos}
              onAddNewMedicamento={handleAddNewMedicamento}
              onUpdateMedicamento={handleUpdateMedicamento}
            />
          )}

          {currentTab === 'examenes' && isAuthenticated && (
            <ExamenesView
              examenes={examenes}
              onAddNewExamen={(ex) => console.log('Examen added:', ex)}
              onUpdateExamen={(ex) => console.log('Examen updated:', ex)}
            />
          )}

          {currentTab === 'farmacia-despacho' && isAuthenticated && (
            <FarmaciaDespachoView
              visitas={visitas}
              activeFarmacia={activeFarmacia!}
              activeFarmaceuta={activeFarmaceuta}
              onQuemarTodaReceta={handleQuemarTodaReceta}
              onQuemarItemMedicamento={handleQuemarItemMedicamento}
              onViewReceta={(v) => setSelectedVisitaForModal(v)}
            />
          )}

          {currentTab === 'medicos' && isAuthenticated && (
            <MedicosView
              medicos={medicos}
              profesiones={profesiones}
              onAddNewMedico={handleAddNewMedico}
            />
          )}

          {currentTab === 'verificador-publico' && (
            <VerificadorPublicoView
              visitas={visitas}
              onViewReceta={(v) => setSelectedVisitaForModal(v)}
              initialCode={quickVerifyCode}
            />
          )}
        </main>
      </div>

      {selectedVisitaForModal && (
        <RecetaModal
          visita={selectedVisitaForModal}
          onClose={() => setSelectedVisitaForModal(null)}
          onSendEmail={(v) => {
            console.log('Prescription emailed to patient:', v.paciente?.correo);
          }}
        />
      )}
    </div>
  );
};
export default App;
