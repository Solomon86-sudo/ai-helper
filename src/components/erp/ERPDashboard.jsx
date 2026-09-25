import React, { useState } from 'react';
import { LayoutDashboard, PenTool, HardHat, DollarSign, CalendarDays, BookOpen, Map, Wrench, Users } from 'lucide-react';
import PredevModule from './PredevModule';
import DesignModule from './DesignModule';
import ConstructionModule from './ConstructionModule';
import AdminModule from './AdminModule';
import AgentNorms from '../AgentNorms';
import AgentRoadmap from '../AgentRoadmap';
import AgentManual from '../AgentManual';

const ERPDashboard = ({ project }) => {
  const [activeModule, setActiveModule] = useState('predev');

  const modules = [
    { id: 'predev', name: 'Предпроект', icon: <LayoutDashboard size={18} /> },
    { id: 'design', name: 'Проектирование', icon: <PenTool size={18} /> },
    { id: 'construction', name: 'Строительство', icon: <HardHat size={18} /> },
    { id: 'budget', name: 'Бюджет', icon: <DollarSign size={18} /> },
    { id: 'schedule', name: 'График', icon: <CalendarDays size={18} /> },
    { id: 'norms', name: 'Спросить норму', icon: <BookOpen size={18} /> },
    { id: 'roadmap', name: 'Дорожные карты', icon: <Map size={18} /> },
    { id: 'manual', name: 'Эксплуатация', icon: <Wrench size={18} /> },
    { id: 'admin', name: 'Пользователи', icon: <Users size={18} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
        {modules.map(mod => (
          <button
            key={mod.id}
            onClick={() => setActiveModule(mod.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: activeModule === mod.id ? 'var(--accent-blue)' : 'var(--bg-card)',
              color: activeModule === mod.id ? 'white' : 'var(--text-main)',
              border: '1px solid',
              borderColor: activeModule === mod.id ? 'var(--accent-blue)' : 'var(--border-color)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: activeModule === mod.id ? '600' : '400',
              transition: 'all 0.2s'
            }}
          >
            {mod.icon}
            {mod.name}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, backgroundColor: 'var(--bg-card)', borderRadius: '8px', padding: '24px', border: '1px solid var(--border-color)', overflowY: 'auto' }}>
        {activeModule === 'predev' && <PredevModule />}
        {activeModule === 'design' && <DesignModule />}
        {activeModule === 'construction' && <ConstructionModule />}
        {activeModule === 'budget' && <div><h3>Модуль: Бюджет</h3><p>Статьи бюджета, банковские лимиты, факты оплат и пересчет EAC.</p></div>}
        {activeModule === 'schedule' && <div><h3>Модуль: График</h3><p>WBS-структура, вехи и раздельный учет Physical% / Cost%.</p></div>}
        {activeModule === 'norms' && <AgentNorms />}
        {activeModule === 'roadmap' && <AgentRoadmap />}
        {activeModule === 'manual' && <AgentManual />}
        {activeModule === 'admin' && <AdminModule />}
      </div>
    </div>
  );
};

export default ERPDashboard;
