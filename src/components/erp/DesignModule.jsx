import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, ShieldAlert, Users, FolderOpen, FileCheck, Layers, FileSignature, MessageSquare, Plus } from 'lucide-react';

const DesignModule = () => {
  const [role, setRole] = useState('client'); // 'client' or 'designer'
  const [activeSubTab, setActiveSubTab] = useState('rd'); // Default to RD for testing
  
  const fileInputRef = useRef(null);
  const [uploadingSheet, setUploadingSheet] = useState(null);

  // --- ИРД State ---
  const [irdDocs] = useState([
    { id: 1, name: 'Градостроительный план земельного участка (ГПЗУ)', status: 'approved', uploadedBy: 'client' },
    { id: 9, name: 'Задание на проектирование', status: 'approved', uploadedBy: 'client' }
  ]);

  // --- Стадия П State ---
  const [stagePDocs] = useState([
    { id: 1, section: 'Раздел 1', title: 'Пояснительная записка (ПЗ)', status: 'approved_for_expertise', ai_check: 'passed' },
  ]);

  // --- РД State ---
  const [rdStructure] = useState([
    { id: 'GP', name: 'ГП - Генеральный план', sheetsCount: 5, uploadedCount: 0 },
    { id: 'AR', name: 'АР - Архитектурные решения', sheetsCount: 45, uploadedCount: 12 },
    { id: 'KZh', name: 'КЖ - Конструкции железобетонные', sheetsCount: 120, uploadedCount: 120 },
  ]);
  const [activeRdSection, setActiveRdSection] = useState('AR');

  const [rdSheets, setRdSheets] = useState([
    { id: 1, section: 'AR', number: 1, name: 'Общие данные', pdfLink: 'dummy', pdfFilename: '01-AR_Sheet_1.pdf', dwgLink: 'dummy', dwgFilename: '01-AR_Sheet_1.dwg', revision: 0, comments: [] },
    { id: 2, section: 'AR', number: 2, name: 'План на отм. 0.000', pdfLink: 'dummy', pdfFilename: '01-AR_Sheet_2_rev0.pdf', dwgLink: null, dwgFilename: null, revision: 0, comments: [{ text: 'Уточнить привязку осей', author: 'Заказчик', resolved: false }] },
    { id: 3, section: 'AR', number: 3, name: 'Разрез 1-1', pdfLink: null, pdfFilename: null, dwgLink: null, dwgFilename: null, revision: 0, comments: [] }
  ]);

  const [uploadTarget, setUploadTarget] = useState({ sheetId: null, type: null }); // type: 'pdf' or 'dwg'

  const handleFileClick = (e, sheetId, type) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadTarget({ sheetId, type });
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !uploadTarget.sheetId) return;
    
    const { sheetId, type } = uploadTarget;

    // Temporary Loading state
    setRdSheets(prev => prev.map(s => 
      s.id === sheetId ? { ...s, [type === 'pdf' ? 'pdfFilename' : 'dwgFilename']: 'Загрузка...' } : s
    ));

    const API_URL = import.meta.env.VITE_API_URL || 'https://facade-backend.onrender.com';
    const formData = new FormData();
    formData.append('file', file);

    let link = null;
    let actualFilename = file.name;

    try {
      const res = await fetch(`${API_URL}/api/erp/design/upload_rd`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        link = data.drive_link;
      } else {
        throw new Error('API Error');
      }
    } catch (err) {
      console.warn("Бэкенд недоступен, симулируем локальную загрузку для UI");
      link = URL.createObjectURL(file);
    }

    setRdSheets(prev => prev.map(s => {
      if (s.id === sheetId) {
        const isUpdate = s[type === 'pdf' ? 'pdfLink' : 'dwgLink'] !== null;
        return { 
          ...s, 
          [type === 'pdf' ? 'pdfLink' : 'dwgLink']: link, 
          [type === 'pdf' ? 'pdfFilename' : 'dwgFilename']: actualFilename,
          revision: isUpdate ? s.revision + 1 : s.revision 
        };
      }
      return s;
    }));
    
    setUploadTarget({ sheetId: null, type: null });
    e.target.value = null;
  };

  const addComment = (e, sheetId) => {
    e.preventDefault();
    const text = prompt("Введите замечание к листу:");
    if (text) {
      setRdSheets(prev => prev.map(s => 
        s.id === sheetId ? { ...s, comments: [...s.comments, { text, author: role === 'client' ? 'Заказчик' : 'Генпроектировщик', resolved: false }] } : s
      ));
    }
  };

  const resolveComment = (e, sheetId, commentIndex) => {
    e.preventDefault();
    setRdSheets(prev => prev.map(s => {
      if (s.id === sheetId) {
        const newComments = [...s.comments];
        newComments[commentIndex].resolved = true;
        return { ...s, comments: newComments };
      }
      return s;
    }));
  };

  const renderRoleToggle = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'var(--bg-color)', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', alignSelf: 'flex-start' }}>
      <Users size={18} color="var(--text-muted)" />
      <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Текущая роль:</span>
      <select 
        value={role} 
        onChange={(e) => setRole(e.target.value)}
        style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--primary-color)', backgroundColor: 'var(--bg-panel)', color: 'var(--text-color)', fontWeight: 'bold', outline: 'none', cursor: 'pointer' }}
      >
        <option value="client">Заказчик (Проверка)</option>
        <option value="designer">Генпроектировщик (Выдача РД)</option>
      </select>
    </div>
  );

  const subTabStyle = (isActive) => ({
    display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', border: 'none', 
    backgroundColor: isActive ? 'var(--primary-color)' : 'transparent',
    color: isActive ? 'white' : 'var(--text-color)',
    borderRadius: '4px', cursor: 'pointer', fontWeight: isActive ? 'bold' : 'normal',
    transition: 'all 0.2s'
  });

  // ========== SUB-TAB 3: Рабочая документация ==========
  const renderRD = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Скрытый инпут для загрузки файлов */}
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleFileChange} 
        accept="application/pdf,image/*,.dwg,.dxf" 
      />

      <div style={{ padding: '16px', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1 }}>
          <h5 style={{ margin: '0 0 8px 0' }}>Состав проекта</h5>
          <span style={{ fontSize: '13px', color: 'var(--primary-color)' }}>Утвержден Заказчиком</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        
        {/* Вертикальные табы (Состав проекта) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '280px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', marginBottom: '8px' }}>Состав проекта</div>
          {rdStructure.map(sec => (
            <button 
              key={sec.id}
              onClick={() => setActiveRdSection(sec.id)}
              style={{ 
                padding: '12px', textAlign: 'left', border: 'none', borderRadius: '6px', cursor: 'pointer',
                backgroundColor: activeRdSection === sec.id ? 'var(--primary-color)' : 'var(--bg-panel)',
                color: activeRdSection === sec.id ? 'white' : 'var(--text-color)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', opacity: 0.8, fontFamily: 'monospace' }}>01-{sec.id}</span>
                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{sec.name.split(' - ')[1]}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Рабочая область выбранного раздела (Ведомость) */}
        <div style={{ flex: 1, padding: '20px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Форма 1 (ГОСТ Р 21.101-2020)</div>
              <h3>Ведомость рабочих чертежей основного комплекта: 01-{activeRdSection}</h3>
            </div>
            {role === 'designer' && (
              <button onClick={(e) => e.preventDefault()} style={{ padding: '8px 16px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', display: 'flex', gap: '8px', cursor: 'pointer' }}>
                <Upload size={16}/> Умная загрузка (PDF)
              </button>
            )}
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', backgroundColor: 'var(--bg-panel)', boxShadow: '0 0 0 1px var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', backgroundColor: 'rgba(0,0,0,0.02)' }}>
                <th style={{ padding: '12px 10px', width: '50px' }}>Лист</th>
                <th style={{ padding: '12px 10px' }}>Наименование</th>
                <th style={{ padding: '12px 10px', width: '60px' }}>Версия</th>
                <th style={{ padding: '12px 10px', width: '160px' }}>Скан (PDF)</th>
                <th style={{ padding: '12px 10px', width: '160px' }}>Исходник (DWG)</th>
                <th style={{ padding: '12px 10px', width: '200px' }}>Замечания</th>
              </tr>
            </thead>
            <tbody>
              {rdSheets.filter(s => s.section === activeRdSection).map(sheet => (
                <tr key={sheet.id} style={{ borderBottom: '1px solid var(--border-color)', verticalAlign: 'top' }}>
                  <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>{sheet.number}</td>
                  <td style={{ padding: '12px 10px' }}>{sheet.name}</td>
                  <td style={{ padding: '12px 10px', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                    Изм. {sheet.revision}
                  </td>
                  
                  {/* PDF Column */}
                  <td style={{ padding: '12px 10px' }}>
                    {sheet.pdfLink ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <a href={sheet.pdfLink === 'dummy' ? undefined : sheet.pdfLink} target="_blank" rel="noreferrer" style={{ color: '#e74c3c', display: 'flex', gap: '6px', alignItems: 'center', textDecoration: 'none', fontSize: '12px', fontWeight: 'bold', cursor: sheet.pdfLink === 'dummy' ? 'default' : 'pointer' }}>
                          <CheckCircle2 size={14} color="#27ae60"/> {sheet.pdfFilename}
                        </a>
                        {role === 'designer' && (
                          <button onClick={(e) => handleFileClick(e, sheet.id, 'pdf')} style={{ fontSize: '10px', padding: '4px', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: 'transparent', cursor: 'pointer', width: 'fit-content' }}>Заменить PDF</button>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Нет PDF</span>
                        {role === 'designer' && (
                          <button onClick={(e) => handleFileClick(e, sheet.id, 'pdf')} style={{ fontSize: '10px', padding: '4px 8px', border: 'none', borderRadius: '4px', backgroundColor: '#e74c3c', color: 'white', cursor: 'pointer', width: 'fit-content' }}>Загрузить PDF</button>
                        )}
                      </div>
                    )}
                  </td>

                  {/* DWG Column */}
                  <td style={{ padding: '12px 10px' }}>
                    {sheet.dwgLink ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <a href={sheet.dwgLink === 'dummy' ? undefined : sheet.dwgLink} target="_blank" rel="noreferrer" style={{ color: '#2980b9', display: 'flex', gap: '6px', alignItems: 'center', textDecoration: 'none', fontSize: '12px', fontWeight: 'bold', cursor: sheet.dwgLink === 'dummy' ? 'default' : 'pointer' }}>
                          <CheckCircle2 size={14} color="#27ae60"/> {sheet.dwgFilename}
                        </a>
                        {role === 'designer' && (
                          <button onClick={(e) => handleFileClick(e, sheet.id, 'dwg')} style={{ fontSize: '10px', padding: '4px', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: 'transparent', cursor: 'pointer', width: 'fit-content' }}>Заменить DWG</button>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ color: '#e67e22', fontSize: '12px' }}>Ожидается DWG</span>
                        {role === 'designer' && (
                          <button onClick={(e) => handleFileClick(e, sheet.id, 'dwg')} style={{ fontSize: '10px', padding: '4px 8px', border: 'none', borderRadius: '4px', backgroundColor: '#2980b9', color: 'white', cursor: 'pointer', width: 'fit-content' }}>Загрузить DWG</button>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Comments Column */}
                  <td style={{ padding: '12px 10px' }}>
                    {sheet.comments.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {sheet.comments.map((c, idx) => (
                          <div key={idx} style={{ padding: '6px', backgroundColor: c.resolved ? 'rgba(39, 174, 96, 0.1)' : 'rgba(231, 76, 60, 0.1)', borderLeft: `2px solid ${c.resolved ? '#27ae60' : '#e74c3c'}`, borderRadius: '0 4px 4px 0', fontSize: '11px' }}>
                            <strong>{c.author}:</strong> {c.text}
                            {!c.resolved && role === 'designer' && (
                              <button onClick={(e) => resolveComment(e, sheet.id, idx)} style={{ marginTop: '4px', padding: '2px 6px', fontSize: '10px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', display: 'block' }}>Ответить / Исправлено</button>
                            )}
                            {c.resolved && <span style={{ color: '#27ae60', display: 'block', marginTop: '2px' }}>✓ Исправлено</span>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Нет замечаний</span>
                    )}
                    {role === 'client' && (sheet.pdfLink || sheet.dwgLink) && (
                      <button onClick={(e) => addComment(e, sheet.id)} style={{ marginTop: '8px', padding: '4px 8px', fontSize: '11px', display: 'flex', gap: '4px', alignItems: 'center', backgroundColor: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer' }}>
                        <MessageSquare size={12}/> Замечание
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Проектирование</h2>
        {renderRoleToggle()}
      </div>
      
      <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px' }}>
        <button onClick={() => setActiveSubTab('ird')} style={subTabStyle(activeSubTab === 'ird')}><FolderOpen size={16} /> 1. ИРД и ТЗ</button>
        <button onClick={() => setActiveSubTab('stage_p')} style={subTabStyle(activeSubTab === 'stage_p')}><Layers size={16} /> 2. Стадия П</button>
        <button onClick={() => setActiveSubTab('rd')} style={subTabStyle(activeSubTab === 'rd')}><FileCheck size={16} /> 3. Рабочая документация</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
        {activeSubTab === 'ird' && <p>Раздел ИРД (скрыт для теста)</p>}
        {activeSubTab === 'stage_p' && <p>Раздел Стадия П (скрыт для теста)</p>}
        {activeSubTab === 'rd' && renderRD()}
      </div>
    </div>
  );
};

export default DesignModule;
