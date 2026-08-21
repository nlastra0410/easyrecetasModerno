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
  initialProfesiones
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
      populateData(data);
    } catch (err) {
      console.warn('Backend /api/init error:', err);
    } finally {
      setLoading(false);
    }
  };

  const populateData = (data: any) => {
    if (!data) return;
    setPacientes(Array.isArray(data.pacientes) ? data.pacientes : []);
    setMedicamentos(Array.isArray(data.medicamentos) ? data.medicamentos : []);
    setDiagnosticos(Array.isArray(data.diagnosticos) ? data.diagnosticos : []);
    setExamenes(Array.isArray(data.examenes) ? data.examenes : []);
    setMedicos(Array.isArray(data.medicos) ? data.medicos : []);
    setFarmacias(Array.isArray(data.farmacias) ? data.farmacias : []);
    setFarmaceutas(Array.isArray(data.farmaceutas) ? data.farmaceutas : []);
    setVisitas(Array.isArray(data.visitas) ? data.visitas : []);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers
  const handleAddNewPaciente = (newPac: Paciente): Paciente => {
    // Optimistic
    const tempPac = { ...newPac, id: Date.now() };
    setPacientes(prev => {
      const next = [tempPac, ...prev];
      try { localStorage.setItem('easyrecetas_pacientes', JSON.stringify(next)); } catch {}
      return next;
    });

    fetch('/api/pacientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPac)
    })
      .then(r => r.json())
      .then(saved => {
        if (saved && (saved.id || saved.rut)) {
          setPacientes(prev => {
            const next = prev.map(p => (p.id === tempPac.id || (p.rut === saved.rut && p.dv === saved.dv)) ? { ...p, ...saved } : p);
            try { localStorage.setItem('easyrecetas_pacientes', JSON.stringify(next)); } catch {}
            return next;
          });
        }
      })
      .catch(err => console.error('Error saving patient to DB:', err));

    return tempPac;
  };

  const handleUpdatePaciente = (updatedPac: Paciente) => {
    setPacientes(prev => {
      const next = prev.map(p => (p.id === updatedPac.id || (p.rut === updatedPac.rut && p.dv === updatedPac.dv)) ? updatedPac : p);
      try { localStorage.setItem('easyrecetas_pacientes', JSON.stringify(next)); } catch {}
      return next;
    });

    fetch(`/api/pacientes/${updatedPac.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPac)
    })
      .then(r => r.json())
      .then(saved => {
        if (saved && (saved.id || saved.rut)) {
          setPacientes(prev => {
            const next = prev.map(p => (p.id === updatedPac.id || (p.rut === saved.rut && p.dv === saved.dv)) ? { ...p, ...saved } : p);
            try { localStorage.setItem('easyrecetas_pacientes', JSON.stringify(next)); } catch {}
            return next;
          });
        }
      })
      .catch(err => console.error('Error updating patient in DB:', err));
  };

  const handleAddNewMedicamento = (newMed: Medicamento) => {
    const tempMed = { ...newMed, id: Date.now() };
    setMedicamentos(prev => [tempMed, ...prev]);

    fetch('/api/medicamentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMed)
    })
      .then(r => r.json())
      .then(saved => {
        setMedicamentos(prev => prev.map(m => m.id === tempMed.id ? saved : m));
      })
      .catch(err => console.error('Error creating medicamento in DB:', err));
  };

  const handleUpdateMedicamento = (updatedMed: Medicamento) => {
    setMedicamentos(prev => prev.map(m => m.id === updatedMed.id ? updatedMed : m));
    fetch(`/api/medicamentos/${updatedMed.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedMed)
    }).catch(err => console.error('Error updating medicamento in DB:', err));
  };

  const handleAddNewExamen = (newEx: Examen) => {
    const tempEx = { ...newEx, id: Date.now() };
    setExamenes(prev => [tempEx, ...prev]);

    fetch('/api/examenes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEx)
    })
      .then(r => r.json())
      .then(saved => {
        setExamenes(prev => prev.map(e => e.id === tempEx.id ? saved : e));
      })
      .catch(err => console.error('Error creating examen in DB:', err));
  };

  const handleAddNewMedico = (newMed: Medico) => {
    const tempMed = { ...newMed, id: Date.now() };
    setMedicos(prev => [...prev, tempMed]);

    fetch('/api/medicos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMed)
    })
      .then(r => r.json())
      .then(saved => {
        setMedicos(prev => prev.map(m => m.id === tempMed.id ? saved : m));
      })
      .catch(err => console.error('Error creating medico in DB:', err));
  };

  const handleSaveVisita = (newVisita: Visita) => {
    // Optimistic Update
    setVisitas(prev => {
      const next = [newVisita, ...prev];
      try { localStorage.setItem('easyrecetas_visitas', JSON.stringify(next)); } catch {}
      return next;
    });

    // Post to API
    fetch('/api/visitas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visita: newVisita })
    })
      .then(res => res.json())
      .then(saved => {
        setVisitas(prev => {
          const next = prev.map(v => (v.id === newVisita.id || v.codigo_verificacion === saved.codigo_verificacion) ? saved : v);
          try { localStorage.setItem('easyrecetas_visitas', JSON.stringify(next)); } catch {}
          return next;
        });
        setSelectedVisitaForModal(saved);
      })
      .catch(err => console.error('Error saving visita:', err));
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
    setVisitas(prev => {
      const next = prev.map(vi => {
        if (vi.id === visitaId) {
          return {
            ...vi,
            estado_id: 3,
            recetas: vi.recetas?.map(r => ({ ...r, estado: 3, farmaceuta_nombre: farmaceutaNombre, dispensado_fecha: now }))
          };
        }
        return vi;
      });
      try { localStorage.setItem('easyrecetas_visitas', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const handleQuemarItemMedicamento = (visitaId: number, itemId: number, farmaceutaNombre: string) => {
    // 1. Real persistence in PostgreSQL (Neon)
    fetch(`/api/recetas/${itemId}/dispensar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ farmaceuta_id: activeFarmaceuta?.id || 1, visita_id: visitaId })
    }).catch(err => console.error('Error al dispensar fármaco en DB:', err));

    // 2. Optimistic Update
    const now = new Date().toISOString();
    setVisitas((prev) => {
      const next = prev.map((v) => {
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
      });
      try { localStorage.setItem('easyrecetas_visitas', JSON.stringify(next)); } catch {}
      return next;
    });
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
  const activeFarmacia = activeRole === 'farmacia' 
    ? (farmacias.find(f => f.id === authenticatedUser?.farmacia_id) || farmacias[0] || { id: 1, nombre: 'Farmacia Central EasyRecetas', direccion: 'Av. Providencia 1208', ciudad: 'Santiago', comuna: 'Providencia', telefono: '+56223456789', rut: '76543210-K' })
    : (farmacias[0] || { id: 1, nombre: 'Farmacia Central EasyRecetas', direccion: 'Av. Providencia 1208', ciudad: 'Santiago', comuna: 'Providencia', telefono: '+56223456789', rut: '76543210-K' });
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
        activeFarmaceuta={activeFarmaceuta}
        onLogout={handleLogout}
      />

      <div className="flex-1 w-full flex overflow-hidden">
        {isAuthenticated && currentTab !== 'login' && (
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
              activeRole={activeRole}
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
              onAddNewMedicamento={handleAddNewMedicamento}
            />
          )}

          {currentTab === 'visitas' && isAuthenticated && (
            <VisitasView
              visitas={visitas}
              activeRole={activeRole}
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
              onAddNewExamen={handleAddNewExamen}
              onUpdateExamen={(ex) => {
                setExamenes(prev => prev.map(e => e.id === ex.id ? ex : e));
              }}
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
              isAuthenticated={isAuthenticated}
              activeRole={activeRole}
              onBackToMain={() => {
                if (activeRole === 'farmacia') {
                  setCurrentTab('farmacia-despacho');
                } else {
                  setCurrentTab('dashboard');
                }
              }}
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
