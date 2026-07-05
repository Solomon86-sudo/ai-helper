import React, { useState } from 'react';
import AgentNorms from './components/AgentNorms';
import AgentAudit from './components/AgentAudit';
import AgentRoadmap from './components/AgentRoadmap';
import AgentManual from './components/AgentManual';
import { BookOpen, FileCheck, Map, Building2, Wrench } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('norms');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'norms':
        return <AgentNorms />;
      case 'audit':
        return <AgentAudit />;
      case 'roadmap':
        return <AgentRoadmap />;
      case 'manual':
        return <AgentManual />;
      default:
        return <AgentNorms />;
    }
  };

  const getTabHeader = () => {
    switch (activeTab) {
      case 'norms':
        return { title: 'Спросить норму', desc: 'Консультации по ГрК РФ, ПЗЗ, СНиП и ГОСТ' };
      case 'audit':
        return { title: 'Проверить документацию', desc: 'Интеллектуальный нормоконтроль проектной документации' };
      case 'roadmap':
        return { title: 'Дорожные карты', desc: 'Навигатор по согласованиям и процедурам (КГА, КГИОП, Госстройнадзор)' };
      case 'manual':
        return { title: 'Инструкция по эксплуатации', desc: 'Генерация ИЭЗ на основе загруженной документации и паспортов' };
      default:
        return { title: '', desc: '' };
    }
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="sidebar-title">
          <Building2 size={24} />
          <span>ИИ-Помощник</span>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button 
            className={`nav-item ${activeTab === 'norms' ? 'active' : ''}`}
            onClick={() => setActiveTab('norms')}
          >
            <BookOpen size={20} />
            Спросить норму
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            <FileCheck size={20} />
            Проверить документацию
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'roadmap' ? 'active' : ''}`}
            onClick={() => setActiveTab('roadmap')}
          >
            <Map size={20} />
            Дорожные карты
          </button>

          <button 
            className={`nav-item ${activeTab === 'manual' ? 'active' : ''}`}
            onClick={() => setActiveTab('manual')}
          >
            <Wrench size={20} />
            Эксплуатация здания
          </button>
        </nav>

        <div style={{ marginTop: 'auto', padding: '16px', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          Версия 1.0.0<br/>Санкт-Петербург и ЛО
        </div>
      </div>

      <div className="main-content">
        <div className="tab-header">
          <h1>{getTabHeader().title}</h1>
          <p>{getTabHeader().desc}</p>
        </div>
        
        <div className="tab-body">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}

export default App;
