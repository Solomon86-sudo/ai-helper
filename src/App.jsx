import React, { useState } from 'react';
import ERPDashboard from './components/erp/ERPDashboard';
import { Building2, Plus, Calendar, MapPin, ArrowLeft } from 'lucide-react';

function App() {
  const [activeProject, setActiveProject] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const [projects, setProjects] = useState([
    { id: 1, name: 'ЖК Астра', address: 'ул. Цветочная, 15', status: 'В работе', date: '2025-01-15' },
    { id: 2, name: 'БЦ Невский', address: 'Невский пр., 100', status: 'Проектирование', date: '2025-03-10' },
  ]);

  const [newProject, setNewProject] = useState({ name: '', address: '', client: '' });

  const handleCreateProject = (e) => {
    e.preventDefault();
    if (!newProject.name) return;
    const project = {
      id: Date.now(),
      name: newProject.name,
      address: newProject.address,
      status: 'Новый',
      date: new Date().toISOString().split('T')[0]
    };
    setProjects([...projects, project]);
    setNewProject({ name: '', address: '', client: '' });
    setShowCreateForm(false);
  };

  if (activeProject) {
    return (
      <div className="app-container" style={{ display: 'block', width: '100%', height: '100vh', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: 'var(--bg-card)' }}>
          <button 
            onClick={() => setActiveProject(null)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <ArrowLeft size={20} />
            Назад к проектам
          </button>
          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)' }}></div>
          <h1 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={24} color="var(--accent-blue)" />
            {activeProject.name}
          </h1>
          <span style={{ padding: '4px 12px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-blue)', borderRadius: '12px', fontSize: '0.875rem' }}>
            {activeProject.status}
          </span>
        </div>
        
        <div style={{ height: 'calc(100vh - 65px)', padding: '24px', backgroundColor: 'var(--bg-dark)', overflowY: 'auto' }}>
          <ERPDashboard project={activeProject} />
        </div>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ display: 'block', width: '100%', minHeight: '100vh', padding: '40px', backgroundColor: 'var(--bg-dark)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0', color: 'var(--text-main)' }}>EA Development — Управление проектами</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Единая платформа девелоперского цикла</p>
          </div>
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: 'var(--accent-blue)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}
          >
            <Plus size={20} />
            Создать проект
          </button>
        </div>

        {showCreateForm && (
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '32px' }}>
            <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.25rem' }}>Новый проект</h2>
            <form onSubmit={handleCreateProject} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Название</label>
                <input 
                  type="text" 
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                  style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)' }}
                  placeholder="Название объекта"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Адрес</label>
                <input 
                  type="text" 
                  value={newProject.address}
                  onChange={(e) => setNewProject({...newProject, address: e.target.value})}
                  style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)' }}
                  placeholder="Адрес объекта"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Заказчик</label>
                <input 
                  type="text" 
                  value={newProject.client}
                  onChange={(e) => setNewProject({...newProject, client: e.target.value})}
                  style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)' }}
                  placeholder="Наименование заказчика"
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" style={{ padding: '10px 24px', backgroundColor: 'var(--accent-green)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
                  Сохранить
                </button>
                <button type="button" onClick={() => setShowCreateForm(false)} style={{ padding: '10px 24px', backgroundColor: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer' }}>
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {projects.map(project => (
            <div 
              key={project.id} 
              onClick={() => setActiveProject(project)}
              style={{ 
                backgroundColor: 'var(--bg-card)', 
                border: '1px solid var(--border-color)', 
                borderRadius: '12px', 
                padding: '24px',
                cursor: 'pointer',
                transition: 'transform 0.2s, borderColor 0.2s',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--accent-blue)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)' }}>
                    <Building2 size={24} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)' }}>{project.name}</h3>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={16} />
                  <span>{project.address}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={16} />
                  <span>Создан: {project.date}</span>
                </div>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Статус</span>
                <span style={{ padding: '4px 12px', backgroundColor: 'rgba(16, 163, 127, 0.1)', color: 'var(--accent-green)', borderRadius: '12px', fontSize: '0.875rem' }}>
                  {project.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
