import React, { useState, useEffect } from 'react';
import { PlusCircle, Save, X } from 'lucide-react';

const PredevModule = () => {
  const [teps, setTeps] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // State for form
  const [formData, setFormData] = useState({
    gba_total: '',
    gla_approved: '',
    floors_max: '',
    density: ''
  });

  // Fetch logic will go here
  useEffect(() => {
    // Simulated fetch from our backend
    // fetch('/api/erp/predev/tep/1').then(...)
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Simulate sending data to our FastAPI backend
    /*
    const response = await fetch('http://localhost:8000/api/erp/predev/tep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, project_id: 1, is_frozen: false })
    });
    */
    
    // Locally save for preview
    setTeps({
      project_id: 1,
      gba_total: Number(formData.gba_total),
      gla_approved: Number(formData.gla_approved),
      floors_max: Number(formData.floors_max),
      density: Number(formData.density),
      is_frozen: false
    });
    setShowForm(false);
  };

  if (loading) return <div>Загрузка данных...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Технико-экономические показатели (ТЭП)</h3>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '4px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            <PlusCircle size={16} />
            Внести данные ТЭП
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ padding: '20px', backgroundColor: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h4 style={{ margin: 0 }}>Ввод показателей проекта</h4>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Общая площадь (GBA), м²</label>
              <input 
                type="number" 
                name="gba_total"
                value={formData.gba_total}
                onChange={handleInputChange}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-panel)', color: 'var(--text-color)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Продаваемая площадь (GLA), м² <span style={{color: '#e74c3c'}}>*Жесткий лимит</span></label>
              <input 
                type="number" 
                name="gla_approved"
                value={formData.gla_approved}
                onChange={handleInputChange}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-panel)', color: 'var(--text-color)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Макс. этажность</label>
              <input 
                type="number" 
                name="floors_max"
                value={formData.floors_max}
                onChange={handleInputChange}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-panel)', color: 'var(--text-color)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Плотность застройки</label>
              <input 
                type="number" 
                step="0.1"
                name="density"
                value={formData.density}
                onChange={handleInputChange}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-panel)', color: 'var(--text-color)' }}
              />
            </div>
            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '4px', backgroundColor: '#27ae60', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                <Save size={16} />
                Сохранить ТЭП
              </button>
            </div>
          </form>
        </div>
      )}

      {teps ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '16px', backgroundColor: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Общая площадь (GBA), м²</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{teps.gba_total.toLocaleString()}</div>
          </div>
          <div style={{ padding: '16px', backgroundColor: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Продаваемая площадь (GLA), м²</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary-color)' }}>{teps.gla_approved.toLocaleString()}</div>
            <div style={{ fontSize: '11px', marginTop: '4px', color: '#e74c3c' }}>Жесткий лимит</div>
          </div>
          <div style={{ padding: '16px', backgroundColor: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Этажность</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{teps.floors_max}</div>
          </div>
          <div style={{ padding: '16px', backgroundColor: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Статус ТЭП</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '8px', color: teps.is_frozen ? '#27ae60' : '#f39c12' }}>
              {teps.is_frozen ? 'ЗАМОРОЖЕН' : 'В РАЗРАБОТКЕ'}
            </div>
          </div>
        </div>
      ) : (
        !showForm && (
          <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--bg-color)', borderRadius: '8px', border: '1px dashed var(--border-color)', color: 'var(--text-muted)' }}>
            Данные проекта пока не внесены. Нажмите «Внести данные ТЭП», чтобы начать.
          </div>
        )
      )}

      {teps && (
        <div style={{ marginTop: '20px' }}>
          <h3>Финансовые сценарии</h3>
          {/* Table remains the same for now */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Тип</th>
                <th style={{ padding: '10px' }}>Выручка (₽)</th>
                <th style={{ padding: '10px' }}>CAPEX (₽)</th>
                <th style={{ padding: '10px' }}>IRR (%)</th>
                <th style={{ padding: '10px' }}>Статус</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '10px' }}>Базовый</td>
                <td style={{ padding: '10px' }}>3,500,000,000</td>
                <td style={{ padding: '10px' }}>2,100,000,000</td>
                <td style={{ padding: '10px' }}>22.5%</td>
                <td style={{ padding: '10px', color: '#27ae60', fontWeight: 'bold' }}>Утвержден</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PredevModule;
