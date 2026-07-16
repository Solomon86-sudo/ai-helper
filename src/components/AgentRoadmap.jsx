import React, { useState } from 'react';
import { Map, Calendar, FileCheck, Search, Loader } from 'lucide-react';

export default function AgentRoadmap() {
  const [query, setQuery] = useState('');
  const [roadmapData, setRoadmapData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setRoadmapData(null);
    try {
      const res = await fetch(`https://ai-helper-e4qp.onrender.com/api/roadmap?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setRoadmapData(data);
    } catch (e) {
      setRoadmapData({ title: "Ошибка соединения с сервером", steps: [] });
    }
    setLoading(false);
  };

  return (
    <div className="roadmap-container">
      {!roadmapData && !loading ? (
        <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '48px 32px' }}>
          <Map size={48} color="var(--accent-blue)" style={{ marginBottom: '24px' }} />
          <h2 style={{ marginBottom: '16px' }}>Навигатор согласований</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
            Введите тип услуги (например, "Разрешение на строительство") для генерации пошаговой дорожной карты с помощью ИИ.
          </p>
          <div className="chat-input-area" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
            <input 
              type="text" 
              placeholder="Например: Разрешение на строительство" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="btn-primary" onClick={handleSearch}>
              <Search size={18} /> Найти
            </button>
          </div>
        </div>
      ) : loading ? (
        <div className="ocr-progress">
          <div className="spinner">
            <Loader size={48} />
          </div>
          <h3>ИИ генерирует дорожную карту...</h3>
          <p style={{ color: 'var(--text-muted)' }}>Анализ регламентов и процедур...</p>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h2 style={{ marginBottom: '8px' }}>{roadmapData.title}</h2>
              {roadmapData.authority && <p style={{ color: 'var(--text-muted)' }}>Инстанция: {roadmapData.authority}</p>}
            </div>
            <button className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} onClick={() => setRoadmapData(null)}>
              Назад к поиску
            </button>
          </div>

          <div className="timeline">
            {roadmapData.steps && roadmapData.steps.length > 0 ? roadmapData.steps.map((step, index) => (
              <div className="timeline-item" key={index}>
                <div className="timeline-icon">
                  <FileCheck size={20} />
                </div>
                <div className="timeline-content">
                  <h3>{index + 1}. {step.title}</h3>
                  <p style={{ color: 'var(--text-muted)' }}>{step.desc}</p>
                  <div className="timeline-meta">
                    {step.meta && <span><Calendar size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }}/> {step.meta}</span>}
                  </div>
                </div>
              </div>
            )) : (
              <p>Шаги не найдены или ИИ не инициализирован.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
