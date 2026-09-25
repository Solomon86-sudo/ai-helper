import React, { useState } from 'react';
import { LayoutDashboard, PenTool, Handshake, HardHat, DollarSign, CalendarDays } from 'lucide-react';
import PredevModule from './PredevModule';
import DesignModule from './DesignModule';
import ConstructionModule from './ConstructionModule';
import AdminModule from './AdminModule';
import { Users } from 'lucide-react';

const ERPDashboard = () => {
  const [activeModule, setActiveModule] = useState('predev');

  const modules = [
    { id: 'predev', name: 'Предпроект', icon: <LayoutDashboard size={18} /> },
    { id: 'design', name: 'Проектирование', icon: <PenTool size={18} /> },
    { id: 'commerce', name: 'Коммерция', icon: <Handshake size={18} /> },
    { id: 'construction', name: 'Строительство', icon: <HardHat size={18} /> },
    { id: 'budget', name: 'Бюджет', icon: <DollarSign size={18} /> },
    { id: 'schedule', name: 'График', icon: <CalendarDays size={18} /> },
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
              backgroundColor: activeModule === mod.id ? 'var(--primary-color)' : 'transparent',
              color: activeModule === mod.id ? 'white' : 'var(--text-color)',
              border: 'none',
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

      <div style={{ flex: 1, backgroundColor: 'var(--bg-panel)', borderRadius: '8px', padding: '24px', border: '1px solid var(--border-color)', overflowY: 'auto' }}>
        {/* Placeholder content for each module */}
        {activeModule === 'predev' && <PredevModule />}
        {activeModule === 'design' && <DesignModule />}
        {activeModule === 'commerce' && <div><h3>Модуль: Коммерция</h3><p>Тендеры, договоры и заморозка базовых смет. Управление Change Requests.</p></div>}
        {activeModule === 'construction' && <ConstructionModule />}
        {activeModule === 'budget' && <div><h3>Модуль: Бюджет</h3><p>Статьи бюджета, банковские лимиты, факты оплат и пересчет EAC.</p></div>}
        {activeModule === 'schedule' && <div><h3>Модуль: График</h3><p>WBS-структура, вехи и раздельный учет Physical% / Cost%.</p></div>}
        {activeModule === 'admin' && <AdminModule />}
      </div>
    </div>
  );
};

export default ERPDashboard;
