import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, ShieldAlert, Users, FolderOpen, FileCheck, Layers, MessageSquare, AlertTriangle, Loader } from 'lucide-react';

// Жёстко прописываем новый бэкенд, игнорируя старые настройки Vercel
const API_URL = 'https://ai-helper-backend-2u9t.onrender.com';

const DesignModule = () => {
  const [role, setRole] = useState('designer');
  const [activeSubTab, setActiveSubTab] = useState('rd');
  
  const fileInputRef = useRef(null);
  const tomeInputRef = useRef(null);
  const tomeDwgInputRef = useRef(null);

  // --- РД State ---
  const [rdStructure] = useState([
    { id: 'GP', name: 'ГП - Генеральный план' },
    { id: 'AR', name: 'АР - Архитектурные решения' },
    { id: 'KZh', name: 'КЖ - Конструкции железобетонные' },
  ]);
  const [activeRdSection, setActiveRdSection] = useState('GP');
  const [tomeExtractedText, setTomeExtractedText] = useState("");
  const [approvedSections, setApprovedSections] = useState([]);

  const [rdSheets, setRdSheets] = useState([
    { id: 1, section: 'AR', number: 1, name: 'Общие данные', pdfLink: 'uploaded', pdfFilename: '01-AR_Лист1.pdf', dwgLink: 'uploaded', dwgFilename: '01-AR_Лист1.dwg', revision: 0, remarks: [] },
    { id: 2, section: 'AR', number: 2, name: 'План на отм. 0.000', pdfLink: 'uploaded', pdfFilename: '01-AR_Лист2.pdf', dwgLink: null, dwgFilename: null, revision: 0, remarks: [] },
    { id: 3, section: 'AR', number: 3, name: 'Разрез 1-1', pdfLink: null, pdfFilename: null, dwgLink: null, dwgFilename: null, revision: 0, remarks: [] },
    { id: 4, section: 'GP', number: 1, name: 'Общие данные', pdfLink: null, pdfFilename: null, dwgLink: null, dwgFilename: null, revision: 0, remarks: [] },
    { id: 5, section: 'GP', number: 2, name: 'Разбивочный план', pdfLink: null, pdfFilename: null, dwgLink: null, dwgFilename: null, revision: 0, remarks: [] },
    { id: 6, section: 'GP', number: 3, name: 'План организации рельефа', pdfLink: null, pdfFilename: null, dwgLink: null, dwgFilename: null, revision: 0, remarks: [] },
    { id: 7, section: 'KZh', number: 1, name: 'Общие данные', pdfLink: null, pdfFilename: null, dwgLink: null, dwgFilename: null, revision: 0, remarks: [] },
    { id: 8, section: 'KZh', number: 2, name: 'Схема расположения фундаментов', pdfLink: null, pdfFilename: null, dwgLink: null, dwgFilename: null, revision: 0, remarks: [] }
  ]);

  const [uploadTarget, setUploadTarget] = useState({ sheetId: null, type: null });
  const [compositionFile, setCompositionFile] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const runRealAICheck = async (sheetId, section, sheetName, pdfName, dwgName, extractedText = "", isRetry = false) => {
    setAiLoading(true);
    const hasBoth = pdfName && dwgName;

    const prompt = `Ты — AI-аудитор рабочей документации (РД) по нормативам РФ.
Проверяемый лист: Раздел ${section}, Лист «${sheetName}».
Загружены файлы: PDF=${pdfName || 'нет'}, DWG=${dwgName || 'нет'}.

Извлеченный текст из PDF (если есть):
"""
${extractedText}
"""

Проведи аудит по следующим направлениям:
1. ГОСТ Р 21.101-2020 — оформление, угловой штамп (ищи соответствие наименования листа в извлеченном тексте).
2. Соответствие Стадии П (ПП РФ №87).
3. Профильные СП для раздела ${section}.
4. ${hasBoth ? 'Сравнение форматов (укажи, что при наличии DWG важно проверять слои)' : 'Отсутствие одного из форматов (PDF или DWG)'}.

Выдай от 2 до 5 конкретных замечаний, опираясь на извлеченный текст, если он есть. Каждое замечание должно содержать:
- Номер нормативного документа и пункт
- Суть нарушения
- Что требуется исправить

Формат ответа — JSON массив:
[{"norm": "ГОСТ/СП/СНиП номер", "text": "Описание нарушения", "severity": "critical|major|minor"}]
Ответь ТОЛЬКО JSON, без пояснений.`;

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt })
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `HTTP error ${res.status}`);
      }
      
      const data = await res.json();
      const text = data.reply || '';
        
        let aiRemarks = [];
        try {
          const jsonMatch = text.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            aiRemarks = parsed.map(r => ({
              text: `[${r.norm}] ${r.text}`,
              author: 'AI-Аудитор',
              severity: r.severity || 'major',
              resolved: false,
              response: null
            }));
          }
        } catch {
          aiRemarks = [{ text: text.substring(0, 500), author: 'AI-Аудитор', severity: 'major', resolved: false, response: null }];
        }
        
        if (aiRemarks.length > 0) {
          setRdSheets(prev => prev.map(s =>
            s.id === sheetId ? { ...s, remarks: [...s.remarks, ...aiRemarks] } : s
          ));
        }
    } catch (err) {
      console.warn("AI backend error:", err);
      const errMsg = err.message || "Неизвестная ошибка";
      if (!isRetry && errMsg.includes("Failed to fetch")) {
        setRdSheets(prev => prev.map(s =>
          s.id === sheetId ? { ...s, remarks: [...s.remarks, { text: '⏳ AI-сервер просыпается (~30 сек). Повторная проверка запущена...', author: 'Система', severity: 'minor', resolved: false, response: null, isTemp: true }] } : s
        ));
        setTimeout(() => {
          setRdSheets(prev => prev.map(s =>
            s.id === sheetId ? { ...s, remarks: s.remarks.filter(r => !r.isTemp) } : s
          ));
          runRealAICheck(sheetId, section, sheetName, pdfName, dwgName, extractedText, true);
        }, 30000);
      } else {
        setRdSheets(prev => prev.map(s =>
          s.id === sheetId ? { ...s, remarks: [...s.remarks, { text: `Ошибка ИИ: ${errMsg}`, author: 'Система', severity: 'minor', resolved: false, response: null }] } : s
        ));
      }
    }
    setAiLoading(false);
  };

  // ====== File upload (per sheet) ======
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

    setRdSheets(prev => prev.map(s => 
      s.id === sheetId ? { ...s, [type === 'pdf' ? 'pdfFilename' : 'dwgFilename']: 'Загрузка...' } : s
    ));

    const formData = new FormData();
    formData.append('file', file);
    let link = null;
    let extractedText = "";

    try {
      const res = await fetch(`${API_URL}/api/erp/design/upload_rd`, { method: 'POST', body: formData });
      if (res.ok) { 
        const json = await res.json();
        link = json.drive_link; 
        extractedText = json.extracted_text || "";
      }
      else throw new Error();
    } catch { link = URL.createObjectURL(file); }

    const updatedSheet = rdSheets.find(s => s.id === sheetId);
    const isUpdate = updatedSheet[type === 'pdf' ? 'pdfLink' : 'dwgLink'] !== null;

    setRdSheets(prev => prev.map(s => {
      if (s.id === sheetId) {
        return { ...s, 
          [type === 'pdf' ? 'pdfLink' : 'dwgLink']: link, 
          [type === 'pdf' ? 'pdfFilename' : 'dwgFilename']: file.name,
          revision: isUpdate ? s.revision + 1 : s.revision 
        };
      }
      return s;
    }));
    
    // Auto-trigger AI check after upload
    const sheet = rdSheets.find(s => s.id === sheetId);
    const newPdf = type === 'pdf' ? file.name : sheet.pdfFilename;
    const newDwg = type === 'dwg' ? file.name : sheet.dwgFilename;
    runRealAICheck(sheetId, sheet.section, sheet.name, newPdf, newDwg, extractedText);

    setUploadTarget({ sheetId: null, type: null });
    e.target.value = null;
  };

  // ====== Tome upload (entire section as PDF) ======
  const handleTomeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Показываем индикатор загрузки (временная заглушка для первого листа)
    setRdSheets(prev => prev.map((s, i) => i === 0 ? { ...s, remarks: [{ text: '⏳ AI читает ведомость чертежей...', author: 'Система', severity: 'minor', resolved: false, response: null }] } : s));

    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch(`${API_URL}/api/erp/design/parse_tome`, { method: 'POST', body: formData });
      if (res.ok) {
        const json = await res.json();
        if (json.sheets && json.sheets.length > 0) {
          const link = URL.createObjectURL(file);
          // Полностью заменяем листы в этом разделе
          const newSheets = json.sheets.map(sh => ({
            id: `${activeRdSection}${sh.sheet_number}`,
            section: activeRdSection,
            name: sh.name,
            rev: 0,
            pdfFilename: `${activeRdSection}_лист${sh.sheet_number}.pdf`,
            pdfLink: link,
            dwgFilename: '-',
            dwgLink: null,
            remarks: []
          }));
          
          setRdSheets(prev => {
            const otherSections = prev.filter(s => s.section !== activeRdSection);
            return [...otherSections, ...newSheets];
          });
          
          // Сохраняем извлеченный текст тома в состояние для последующей проверки
          setTomeExtractedText(json.extracted_text || "");
          
          // Убираем заглушку чтения
          setRdSheets(prev => prev.map((s, i) => i === 0 ? { ...s, remarks: [] } : s));
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `HTTP error ${res.status}`);
      }
    } catch (err) {
      console.warn("Parse tome error:", err);
      setRdSheets(prev => prev.map((s, i) => i === 0 ? { ...s, remarks: [{ text: `Ошибка при чтении тома: ${err.message}`, author: 'Система', severity: 'minor', resolved: false, response: null }] } : s));
    }
    
    e.target.value = null;
  };

  // Функция для ручного запуска проверки всех листов текущего раздела
  const handleRunSectionAudit = () => {
    const sectionSheets = rdSheets.filter(s => s.section === activeRdSection);
    sectionSheets.forEach((sheet, idx) => {
      setTimeout(() => {
        runRealAICheck(sheet.id, sheet.section, sheet.name, sheet.pdfFilename, sheet.dwgFilename, tomeExtractedText || "Текст не извлечен или пуст.");
      }, idx * 1500); // 1.5 сек интервал, чтобы не заспамить API
    });
  };

  const handleApproveTome = () => {
    if (!window.confirm(`Вы уверены, что хотите утвердить весь том ${activeRdSection}? Все открытые замечания будут закрыты автоматически.`)) return;
    
    setRdSheets(prev => prev.map(s => {
      if (s.section === activeRdSection) {
        return {
          ...s,
          remarks: s.remarks.map(r => ({ ...r, resolved: true }))
        };
      }
      return s;
    }));
    
    setApprovedSections(prev => [...new Set([...prev, activeRdSection])]);
  };

  // ====== Tome upload (entire section as DWG) ======
  const handleTomeDwgUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const sectionSheets = rdSheets.filter(s => s.section === activeRdSection);
    sectionSheets.forEach((sheet, idx) => {
      setTimeout(() => {
        const link = URL.createObjectURL(file);
        setRdSheets(prev => prev.map(s => {
          if (s.id === sheet.id) {
            return { ...s, dwgLink: link, dwgFilename: `${activeRdSection}_лист${idx+1}.dwg` };
          }
          return s;
        }));
      }, idx * 500);
    });
    e.target.value = null;
  };

  // ====== Comments & Responses ======
  const addComment = (e, sheetId) => {
    e.preventDefault();
    const text = prompt("Введите замечание к листу:");
    if (text) {
      setRdSheets(prev => prev.map(s => 
        s.id === sheetId ? { ...s, remarks: [...s.remarks, { text, author: 'Заказчик', severity: 'major', resolved: false, response: null }] } : s
      ));
      setApprovedSections(prev => prev.filter(sec => sec !== activeRdSection));
    }
  };

  const respondToRemark = (e, sheetId, remarkIdx) => {
    e.preventDefault();
    const text = prompt("Ответ на замечание (или оставьте пустым, если 'Исправлено'):");
    setRdSheets(prev => prev.map(s => {
      if (s.id === sheetId) {
        const newRemarks = [...s.remarks];
        if (text) {
          newRemarks[remarkIdx] = { ...newRemarks[remarkIdx], response: text };
        } else {
          newRemarks[remarkIdx] = { ...newRemarks[remarkIdx], resolved: true, response: 'Исправлено' };
        }
        return { ...s, remarks: newRemarks };
      }
      return s;
    }));
  };

  const acceptResponse = (e, sheetId, remarkIdx) => {
    e.preventDefault();
    setRdSheets(prev => prev.map(s => {
      if (s.id === sheetId) {
        const newRemarks = [...s.remarks];
        newRemarks[remarkIdx] = { ...newRemarks[remarkIdx], resolved: true };
        return { ...s, remarks: newRemarks };
      }
      return s;
    }));
  };

  // ====== Collect all remarks for active section ======
  const sectionRemarks = [];
  rdSheets.filter(s => s.section === activeRdSection).forEach(sheet => {
    sheet.remarks.forEach((r, idx) => {
      sectionRemarks.push({ ...r, sheetId: sheet.id, remarkIdx: idx, sheetNumber: sheet.number, sheetName: sheet.name });
    });
  });

  // ====== RENDER ======
  const renderRD = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} accept="application/pdf,image/*,.dwg,.dxf" />
      <input type="file" ref={tomeInputRef} style={{ display: 'none' }} onChange={handleTomeUpload} accept="application/pdf" />
      <input type="file" ref={tomeDwgInputRef} style={{ display: 'none' }} onChange={handleTomeDwgUpload} accept=".dwg,.dxf" />

      {/* Состав проекта */}
      <div style={{ padding: '16px', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h5 style={{ margin: '0 0 8px 0' }}>Состав проекта</h5>
          <span style={{ fontSize: '13px', color: compositionFile ? '#27ae60' : 'var(--text-muted)' }}>
            {compositionFile ? `✓ Загружен: ${compositionFile}` : 'Ожидает загрузки состава (PDF/Word)'}
          </span>
        </div>
        {role === 'designer' && (
          <div>
            <input type="file" id="compositionUpload" style={{ display: 'none' }} accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => {
              if (e.target.files[0]) setCompositionFile(e.target.files[0].name);
            }} />
            <button onClick={() => document.getElementById('compositionUpload').click()} style={{ padding: '8px 16px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', whiteSpace: 'nowrap' }}>
              <Upload size={16}/> Загрузить шифры (PDF/Word/Excel)
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        
        {/* Sidebar: sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '280px', flexShrink: 0 }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', marginBottom: '8px' }}>Состав проекта</div>
          {rdStructure.map(sec => {
            const secSheets = rdSheets.filter(s => s.section === sec.id);
            const uploaded = secSheets.filter(s => s.pdfLink).length;
            const unresolvedCount = secSheets.reduce((sum, s) => sum + s.remarks.filter(r => !r.resolved).length, 0);
            return (
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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                  <span style={{ fontSize: '10px', padding: '1px 6px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '10px' }}>{uploaded}/{secSheets.length}</span>
                  {approvedSections.includes(sec.id) ? (
                    <span style={{ fontSize: '10px', padding: '1px 6px', backgroundColor: '#27ae60', color: 'white', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '2px' }}><CheckCircle2 size={10}/> Утв.</span>
                  ) : unresolvedCount > 0 ? (
                    <span style={{ fontSize: '10px', padding: '1px 6px', backgroundColor: '#e74c3c', color: 'white', borderRadius: '10px' }}>{unresolvedCount} зам.</span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>

        {/* Main area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Header + Tome upload */}
          <div style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Форма 1 (ГОСТ Р 21.101-2020)</div>
                <h3 style={{ margin: 0 }}>Ведомость: 01-{activeRdSection}</h3>
              </div>
              {role === 'designer' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={(e) => { e.preventDefault(); handleRunSectionAudit(); }} style={{ padding: '8px 14px', backgroundColor: '#8e44ad', color: 'white', border: 'none', borderRadius: '4px', display: 'flex', gap: '6px', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '12px' }}>
                    <AlertTriangle size={14}/> Запустить AI-Аудит
                  </button>
                  <button onClick={(e) => { e.preventDefault(); tomeInputRef.current.click(); }} style={{ padding: '8px 14px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', display: 'flex', gap: '6px', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '12px' }}>
                    <Upload size={14}/> Том PDF
                  </button>
                  <button onClick={(e) => { e.preventDefault(); tomeDwgInputRef.current.click(); }} style={{ padding: '8px 14px', backgroundColor: '#2980b9', color: 'white', border: 'none', borderRadius: '4px', display: 'flex', gap: '6px', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '12px' }}>
                    <Upload size={14}/> Том DWG
                  </button>
                </div>
              )}
            </div>

            {aiLoading && (
              <div style={{ padding: '10px', backgroundColor: 'rgba(142,68,173,0.15)', border: '1px solid #8e44ad', borderRadius: '6px', marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: '#8e44ad' }}>
                <Loader size={16} className="spin" /> AI-Аудитор анализирует загруженные чертежи по нормативам РФ...
              </div>
            )}
            
            {/* Sheet table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', backgroundColor: 'var(--bg-panel)', boxShadow: '0 0 0 1px var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', backgroundColor: 'rgba(0,0,0,0.02)' }}>
                  <th style={{ padding: '10px 8px', width: '40px' }}>Лист</th>
                  <th style={{ padding: '10px 8px' }}>Наименование</th>
                  <th style={{ padding: '10px 8px', width: '50px' }}>Изм.</th>
                  <th style={{ padding: '10px 8px', width: '150px' }}>PDF</th>
                  <th style={{ padding: '10px 8px', width: '150px' }}>DWG</th>
                  <th style={{ padding: '10px 8px', width: '60px' }}>Зам.</th>
                </tr>
              </thead>
              <tbody>
                {rdSheets.filter(s => s.section === activeRdSection).map(sheet => {
                  const unresolvedCount = sheet.remarks.filter(r => !r.resolved).length;
                  return (
                    <React.Fragment key={sheet.id}>
                      <tr style={{ borderBottom: sheet.remarks.length > 0 ? 'none' : '1px solid var(--border-color)', backgroundColor: unresolvedCount > 0 ? 'rgba(231,76,60,0.02)' : 'transparent' }}>
                        <td style={{ padding: '10px 8px', fontWeight: 'bold' }}>{sheet.number}</td>
                        <td style={{ padding: '10px 8px' }}>{sheet.name}</td>
                        <td style={{ padding: '10px 8px', color: 'var(--text-muted)' }}>{sheet.revision}</td>
                        
                        <td style={{ padding: '10px 8px' }}>
                          {sheet.pdfLink ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              <a href={sheet.pdfLink === 'uploaded' ? undefined : sheet.pdfLink} target="_blank" rel="noreferrer" style={{ color: '#27ae60', fontSize: '12px', display: 'flex', gap: '4px', alignItems: 'center', textDecoration: 'none', cursor: sheet.pdfLink === 'uploaded' ? 'default' : 'pointer' }}>
                                <CheckCircle2 size={12}/> {sheet.pdfFilename}
                              </a>
                              {role === 'designer' && <button onClick={(e) => handleFileClick(e, sheet.id, 'pdf')} style={{ fontSize: '10px', padding: '2px 6px', border: '1px solid var(--border-color)', borderRadius: '3px', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', cursor: 'pointer', width: 'fit-content' }}>Заменить</button>}
                            </div>
                          ) : (
                            role === 'designer' ? (
                              <button onClick={(e) => handleFileClick(e, sheet.id, 'pdf')} style={{ fontSize: '11px', padding: '4px 10px', border: 'none', borderRadius: '4px', backgroundColor: '#e74c3c', color: 'white', cursor: 'pointer' }}>PDF</button>
                            ) : <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>
                          )}
                        </td>

                        <td style={{ padding: '10px 8px' }}>
                          {sheet.dwgLink ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              <a href={sheet.dwgLink === 'uploaded' ? undefined : sheet.dwgLink} target="_blank" rel="noreferrer" style={{ color: '#27ae60', fontSize: '12px', display: 'flex', gap: '4px', alignItems: 'center', textDecoration: 'none', cursor: sheet.dwgLink === 'uploaded' ? 'default' : 'pointer' }}>
                                <CheckCircle2 size={12}/> {sheet.dwgFilename}
                              </a>
                              {role === 'designer' && <button onClick={(e) => handleFileClick(e, sheet.id, 'dwg')} style={{ fontSize: '10px', padding: '2px 6px', border: '1px solid var(--border-color)', borderRadius: '3px', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', cursor: 'pointer', width: 'fit-content' }}>Заменить</button>}
                            </div>
                          ) : (
                            role === 'designer' ? (
                              <button onClick={(e) => handleFileClick(e, sheet.id, 'dwg')} style={{ fontSize: '11px', padding: '4px 10px', border: 'none', borderRadius: '4px', backgroundColor: '#2980b9', color: 'white', cursor: 'pointer' }}>DWG</button>
                            ) : <span style={{ color: '#e67e22', fontSize: '12px' }}>Ожидается</span>
                          )}
                        </td>

                        <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            {unresolvedCount > 0 ? (
                              <span style={{ backgroundColor: '#e74c3c', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}>{unresolvedCount}</span>
                            ) : sheet.remarks.length > 0 ? (
                              <span style={{ backgroundColor: '#27ae60', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '11px' }}>✓</span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>—</span>
                            )}
                            {role === 'client' && (
                              <button onClick={(e) => addComment(e, sheet.id)} style={{ padding: '2px 6px', fontSize: '10px', backgroundColor: 'transparent', border: '1px solid var(--border-color)', borderRadius: '3px', cursor: 'pointer', color: 'var(--text-color)' }}>
                                + Зам.
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      
                      {sheet.remarks.length > 0 && (
                        <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
                          <td colSpan={6} style={{ padding: '12px 16px', borderLeft: '3px solid #e74c3c' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              {sheet.remarks.map((rem, idx) => (
                                <div key={idx} style={{ padding: '10px', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: rem.author.includes('AI') ? '#8e44ad' : '#e67e22' }}>{rem.author}</span>
                                    {rem.severity === 'critical' && <span style={{ fontSize: '9px', padding: '2px 4px', backgroundColor: '#e74c3c', color: 'white', borderRadius: '4px', fontWeight: 'bold' }}>КРИТИЧНО</span>}
                                    {rem.severity === 'major' && <span style={{ fontSize: '9px', padding: '2px 4px', backgroundColor: '#e67e22', color: 'white', borderRadius: '4px', fontWeight: 'bold' }}>ВАЖНО</span>}
                                    {rem.severity === 'minor' && <span style={{ fontSize: '9px', padding: '2px 4px', backgroundColor: '#f1c40f', color: 'black', borderRadius: '4px', fontWeight: 'bold' }}>МИНОР</span>}
                                  </div>
                                  <div style={{ fontSize: '13px', lineHeight: '1.4', marginBottom: '8px', color: 'var(--text-color)' }}>{rem.text}</div>
                                  
                                  {rem.response ? (
                                    <div style={{ padding: '8px', backgroundColor: 'rgba(39, 174, 96, 0.1)', borderLeft: '3px solid #27ae60', borderRadius: '4px', fontSize: '12px', marginTop: '8px' }}>
                                      <strong>Ответ подрядчика:</strong> {rem.response}
                                    </div>
                                  ) : null}

                                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                    {!rem.resolved && (
                                      <>
                                        <button onClick={(e) => respondToRemark(e, sheet.id, idx)} style={{ fontSize: '11px', padding: '4px 12px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                          Ответить / Исправлено
                                        </button>
                                        <button onClick={(e) => acceptResponse(e, sheet.id, idx)} style={{ fontSize: '11px', padding: '4px 12px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                          Утвердить (Снять замечание)
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ====== FULL-WIDTH REMARKS SECTION ====== */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
             <button onClick={handleApproveTome} style={{ padding: '10px 20px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
               ✓ Утвердить Том (Снять все замечания)
             </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Проектирование</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'var(--bg-color)', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <Users size={18} color="var(--text-muted)" />
          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Текущая роль:</span>
          <select 
            value={role} 
            onChange={(e) => setRole(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--primary-color)', backgroundColor: '#1a1a2e', color: '#ffffff', fontWeight: 'bold', outline: 'none', cursor: 'pointer' }}
          >
            <option value="client" style={{ backgroundColor: '#1a1a2e', color: '#ffffff' }}>Заказчик (Проверка)</option>
            <option value="designer" style={{ backgroundColor: '#1a1a2e', color: '#ffffff' }}>Генпроектировщик (Выдача РД)</option>
          </select>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px' }}>
        {[
          { key: 'ird', icon: <FolderOpen size={16} />, label: '1. ИРД и ТЗ' },
          { key: 'stage_p', icon: <Layers size={16} />, label: '2. Стадия П' },
          { key: 'rd', icon: <FileCheck size={16} />, label: '3. Рабочая документация' }
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveSubTab(tab.key)} style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', border: 'none',
            backgroundColor: activeSubTab === tab.key ? 'var(--primary-color)' : 'transparent',
            color: activeSubTab === tab.key ? 'white' : 'var(--text-color)',
            borderRadius: '4px', cursor: 'pointer', fontWeight: activeSubTab === tab.key ? 'bold' : 'normal',
            transition: 'all 0.2s'
          }}>{tab.icon} {tab.label}</button>
        ))}
      </div>

      <div style={{ flex: 1, paddingRight: '10px' }}>
        {activeSubTab === 'ird' && <p style={{ color: 'var(--text-muted)' }}>Раздел ИРД и ТЗ — в разработке</p>}
        {activeSubTab === 'stage_p' && <p style={{ color: 'var(--text-muted)' }}>Раздел Стадия П — в разработке</p>}
        {activeSubTab === 'rd' && renderRD()}
      </div>
    </div>
  );
};

export default DesignModule;
