import React, { useState } from 'react';
import { 
  FileText, Briefcase, FileSignature, Plus, CheckCircle, 
  ChevronDown, ChevronUp, Download, Upload, Star, Filter, Check
} from 'lucide-react';

export default function ConstructionModule() {
  const [activeTab, setActiveTab] = useState(0);

  // === ТАБ 1: ПТО (Production Technical Department) ===
  const [ptoVolumes, setPtoVolumes] = useState([
    { id: 1, shifr: 'АР-01.1', name: 'Архитектурные решения. Корпус 1', status: 'Принят' },
    { id: 2, shifr: 'КЖ-02', name: 'Конструкции железобетонные. Фундаменты', status: 'В производстве' },
    { id: 3, shifr: 'ОВ-03', name: 'Отопление и вентиляция', status: 'Выдано ТЗ' },
  ]);
  const [showAddVolumeModal, setShowAddVolumeModal] = useState(false);
  const [newVolume, setNewVolume] = useState({ shifr: '', name: '' });
  
  const [showTenderTaskModal, setShowTenderTaskModal] = useState(false);
  const [tenderTask, setTenderTask] = useState({ theme: '', description: '', volumeId: null });

  // === ТАБ 2: Тендерный отдел ===
  const [tenderSubTab, setTenderSubTab] = useState(0); // 0 - Реестр, 1 - Контрагенты, 2 - Шаблоны
  
  const [tenders, setTenders] = useState([
    { id: 1, name: 'Монолитные работы К1', discipline: 'Общестрой', status: 'Оценка', date: '2026-09-20',
      documents: ['ТЗ_Монолит.pdf', 'ВО_Монолит.xlsx'],
      proposals: [
        { contractor: 'ООО СтройМонолит', sum: 15000000, term: '45 дней', guarantee: '5 лет', note: 'Опыт есть', status: 'Рассматривается' },
        { contractor: 'ЗАО АльфаСтрой', sum: 14200000, term: '50 дней', guarantee: '3 года', note: 'Дешевле', status: 'Рассматривается' },
      ]
    },
    { id: 2, name: 'Окна и витражи', discipline: 'Фасады', status: 'Сбор КП', date: '2026-09-22', documents: [], proposals: [] },
  ]);
  const [expandedTenderId, setExpandedTenderId] = useState(null);
  const [showAddTenderModal, setShowAddTenderModal] = useState(false);
  
  const [contractors, setContractors] = useState([
    { id: 1, name: 'ООО СтройМонолит', inn: '7712345678', tags: ['Общестрой', 'Благоустройство'], rating: 5, status: 'Аккредитован', contact: 'Иванов И.И. (999-123-45)', date: '2026-01-15' },
    { id: 2, name: 'ЗАО АльфаСтрой', inn: '7798765432', tags: ['Общестрой', 'Кровля'], rating: 4, status: 'Аккредитован', contact: 'Петров П.П. (999-987-65)', date: '2025-11-20' },
  ]);
  const [showAddContractorModal, setShowAddContractorModal] = useState(false);

  const [templates] = useState([
    'Договор подряда (типовой)',
    'Договор поставки',
    'Договор на проектирование',
  ]);

  // === ТАБ 3: СДО (Contract Administration) ===
  const [sdoSubTab, setSdoSubTab] = useState(0); // 0 - Согласование, 1 - Реестр

  const [approvals, setApprovals] = useState([
    { id: 1, num: 'Д-26-105', contractor: 'ООО СтройМонолит', tenderLink: 'Монолитные работы К1', sum: 14200000, status: 'На согласовании',
      chain: [
        { role: 'ГИП', name: 'Сидоров А.А.', approved: true },
        { role: 'Юрист', name: 'Смирнова В.В.', approved: true },
        { role: 'Финансист', name: 'Кузнецов Б.Б.', approved: false },
        { role: 'Директор', name: 'Волков Г.Г.', approved: false },
      ]
    }
  ]);
  const [expandedApprovalId, setExpandedApprovalId] = useState(null);

  const [contracts, setContracts] = useState([
    { id: 1, num: 'Д-26-001', contractor: 'ООО БетонСнаб', subject: 'Поставка бетона', sum: 5000000, paid: 2500000, start: '2026-02-01', end: '2026-12-31', status: 'Действующий',
      payments: [{ date: '2026-03-01', sum: 2500000, reason: 'Аванс 50%' }]
    },
    { id: 2, num: 'Д-26-042', contractor: 'ООО ЗемляПлюс', subject: 'Земляные работы', sum: 3000000, paid: 3000000, start: '2026-04-15', end: '2026-06-30', status: 'Завершен',
      payments: [{ date: '2026-04-20', sum: 1500000, reason: 'Аванс' }, { date: '2026-07-05', sum: 1500000, reason: 'Окончательный расчет КС-2' }]
    }
  ]);
  const [expandedContractId, setExpandedContractId] = useState(null);

  // Common Styles
  const s = {
    container: { padding: '20px', color: 'var(--text-main)', background: 'var(--bg-dark)', minHeight: '100vh', fontFamily: 'sans-serif' },
    tabsHeader: { display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' },
    tabBtn: (active) => ({
      padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
      background: active ? 'var(--accent-blue)' : 'transparent',
      color: active ? '#fff' : 'var(--text-main)',
      border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: 'bold', transition: 'all 0.2s'
    }),
    subTabsHeader: { display: 'flex', gap: '10px', marginBottom: '15px' },
    subTabBtn: (active) => ({
      padding: '8px 16px', cursor: 'pointer',
      background: active ? 'var(--bg-card)' : 'transparent',
      color: active ? 'var(--text-main)' : 'var(--text-muted)',
      border: `1px solid ${active ? 'var(--accent-blue)' : 'var(--border-color)'}`, 
      borderRadius: '20px', fontSize: '14px', transition: 'all 0.2s'
    }),
    card: { background: 'var(--bg-card)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '20px' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px' },
    th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase' },
    td: { padding: '12px', borderBottom: '1px solid var(--border-color)', fontSize: '14px' },
    btnPrimary: { background: 'var(--accent-blue)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px' },
    btnSecondary: { background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px' },
    btnSuccess: { background: 'var(--accent-green)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' },
    btnAction: { background: 'transparent', color: 'var(--accent-blue)', border: '1px solid var(--accent-blue)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' },
    tag: { background: 'var(--bg-dark)', border: '1px solid var(--border-color)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', display: 'inline-block', marginRight: '6px', marginBottom: '6px' },
    status: (st) => ({
      padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block',
      background: st.includes('производстве') || st.includes('Действующий') || st.includes('Согласован') ? 'var(--accent-blue)' :
                  st.includes('ТЗ') || st.includes('Оценка') || st.includes('согласовании') ? 'var(--accent-green)' :
                  st.includes('Черновик') || st.includes('Принят') ? 'var(--bg-dark)' :
                  st.includes('Отклонен') || st.includes('Расторгнут') ? 'var(--accent-red)' : 'var(--bg-dark)',
      border: '1px solid var(--border-color)'
    }),
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { background: 'var(--bg-card)', padding: '24px', borderRadius: '8px', width: '500px', maxWidth: '90vw', border: '1px solid var(--border-color)' },
    input: { width: '100%', padding: '10px', marginBottom: '15px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '4px', boxSizing: 'border-box' },
    label: { display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-muted)' },
    flexRow: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }
  };

  // Handlers
  const handlePtoStatusChange = (id) => {
    setPtoVolumes(vols => vols.map(v => v.id === id ? { ...v, status: 'В производстве' } : v));
  };
  const handleAddVolume = () => {
    if (!newVolume.shifr) return;
    setPtoVolumes([...ptoVolumes, { id: Date.now(), ...newVolume, status: 'Принят' }]);
    setShowAddVolumeModal(false);
    setNewVolume({ shifr: '', name: '' });
  };
  const handleTenderWinner = (tenderId, contractorName) => {
    setTenders(tenders.map(t => {
      if (t.id === tenderId) {
        return {
          ...t,
          proposals: t.proposals.map(p => ({
            ...p,
            status: p.contractor === contractorName ? 'Победитель' : 'Отклонен'
          }))
        };
      }
      return t;
    }));
  };
  const handleApprove = (approvalId, roleName) => {
    setApprovals(apps => apps.map(a => {
      if(a.id === approvalId) {
        return {
          ...a,
          chain: a.chain.map(c => c.role === roleName ? {...c, approved: true} : c)
        }
      }
      return a;
    }))
  };

  const handleCreateTenderTask = () => {
    if (tenderTask.volumeId) {
      setPtoVolumes(vols => vols.map(v => v.id === tenderTask.volumeId ? { ...v, status: 'Выдано ТЗ' } : v));
    }
    
    const newTender = {
      id: Date.now(),
      name: tenderTask.theme || 'Новый тендер',
      discipline: 'Общестрой', // or derived from task
      status: 'Сбор КП',
      date: new Date().toISOString().split('T')[0],
      documents: [],
      proposals: []
    };
    
    setTenders(prev => [...prev, newTender]);
    
    setActiveTab(1);
    setTenderSubTab(0);
    
    setShowTenderTaskModal(false);
    setTenderTask({ theme: '', description: '', volumeId: null });
  };

  const handleTransferToSdo = (tender) => {
    const winner = tender.proposals.find(p => p.status === 'Победитель');
    if (!winner) {
      alert('Сначала утвердите победителя тендера!');
      return;
    }
    
    const newApproval = {
      id: Date.now(),
      num: `Д-26-${Math.floor(Math.random() * 900) + 100}`,
      contractor: winner.contractor,
      tenderLink: tender.name,
      sum: winner.sum,
      status: 'На согласовании',
      chain: [
        { role: 'ГИП', name: 'Сидоров А.А.', approved: false },
        { role: 'Юрист', name: 'Смирнова В.В.', approved: false },
        { role: 'Финансист', name: 'Кузнецов Б.Б.', approved: false },
        { role: 'Директор', name: 'Волков Г.Г.', approved: false },
      ]
    };
    setApprovals(prev => [...prev, newApproval]);
    setActiveTab(2);
    setSdoSubTab(0);
  };

  return (
    <div style={s.container}>
      <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Briefcase /> Строительный модуль ERP
      </h2>
      
      {/* Main Tabs */}
      <div style={s.tabsHeader}>
        <button style={s.tabBtn(activeTab === 0)} onClick={() => setActiveTab(0)}><FileText size={18}/> ПТО</button>
        <button style={s.tabBtn(activeTab === 1)} onClick={() => setActiveTab(1)}><Briefcase size={18}/> Тендерный отдел</button>
        <button style={s.tabBtn(activeTab === 2)} onClick={() => setActiveTab(2)}><FileSignature size={18}/> СДО</button>
      </div>

      {/* === TAB 1: ПТО === */}
      {activeTab === 0 && (
        <div style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3>Реестр объемов рабочей документации</h3>
            <button style={s.btnPrimary} onClick={() => setShowAddVolumeModal(true)}><Plus size={16}/> Добавить том РД</button>
          </div>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Шифр тома</th>
                <th style={s.th}>Наименование</th>
                <th style={s.th}>Статус</th>
                <th style={s.th}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {ptoVolumes.map(v => (
                <tr key={v.id}>
                  <td style={s.td}><strong>{v.shifr}</strong></td>
                  <td style={s.td}>{v.name}</td>
                  <td style={s.td}><span style={s.status(v.status)}>{v.status}</span></td>
                  <td style={s.td}>
                    <div style={s.flexRow}>
                      <button style={s.btnAction} onClick={() => handlePtoStatusChange(v.id)}>В производство</button>
                      <button style={s.btnSecondary} onClick={() => { setTenderTask({...tenderTask, volumeId: v.id}); setShowTenderTaskModal(true); }}>
                        Создать ТЗ на тендер
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* === TAB 2: Тендерный отдел === */}
      {activeTab === 1 && (
        <div>
          <div style={s.subTabsHeader}>
            <button style={s.subTabBtn(tenderSubTab === 0)} onClick={() => setTenderSubTab(0)}>Реестр тендеров</button>
            <button style={s.subTabBtn(tenderSubTab === 1)} onClick={() => setTenderSubTab(1)}>Реестр контрагентов</button>
            <button style={s.subTabBtn(tenderSubTab === 2)} onClick={() => setTenderSubTab(2)}>Шаблоны договоров</button>
          </div>

          {/* 2a. Реестр тендеров */}
          {tenderSubTab === 0 && (
            <div style={s.card}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                 <h3>Открытые и завершенные тендеры</h3>
                 <button style={s.btnPrimary} onClick={() => setShowAddTenderModal(true)}><Plus size={16}/> Создать тендер</button>
               </div>
               <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>№ / Дата</th>
                      <th style={s.th}>Название тендера</th>
                      <th style={s.th}>Дисциплина</th>
                      <th style={s.th}>Статус</th>
                      <th style={s.th}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenders.map(t => (
                      <React.Fragment key={t.id}>
                        <tr>
                          <td style={s.td}>{t.id} <br/><small style={{color:'var(--text-muted)'}}>{t.date}</small></td>
                          <td style={s.td}><strong>{t.name}</strong></td>
                          <td style={s.td}>{t.discipline}</td>
                          <td style={s.td}><span style={s.status(t.status)}>{t.status}</span></td>
                          <td style={s.td}>
                            <button style={s.btnSecondary} onClick={() => setExpandedTenderId(expandedTenderId === t.id ? null : t.id)}>
                              {expandedTenderId === t.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>} Детали
                            </button>
                          </td>
                        </tr>
                        {expandedTenderId === t.id && (
                          <tr>
                            <td colSpan={5} style={{ padding: 0 }}>
                              <div style={{ padding: '15px 20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                                <div style={{ marginBottom: '15px' }}>
                                  <strong>Документы: </strong>
                                  {t.documents.map(d => <span key={d} style={s.tag}><FileText size={12}/> {d}</span>)}
                                  {t.documents.length === 0 && <span style={{color: 'var(--text-muted)'}}>Нет документов</span>}
                                </div>
                                
                                <h4>Сравнительная таблица предложений</h4>
                                <table style={{ ...s.table, background: 'var(--bg-dark)' }}>
                                  <thead>
                                    <tr>
                                      <th style={s.th}>Контрагент</th>
                                      <th style={s.th}>Сумма (руб)</th>
                                      <th style={s.th}>Срок</th>
                                      <th style={s.th}>Гарантия</th>
                                      <th style={s.th}>Статус</th>
                                      <th style={s.th}>Действия</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {t.proposals.map((p, i) => (
                                      <tr key={i}>
                                        <td style={s.td}>{p.contractor}</td>
                                        <td style={s.td}>{p.sum.toLocaleString('ru-RU')}</td>
                                        <td style={s.td}>{p.term}</td>
                                        <td style={s.td}>{p.guarantee}</td>
                                        <td style={s.td}><span style={s.status(p.status)}>{p.status}</span></td>
                                        <td style={s.td}>
                                          {p.status === 'Рассматривается' && (
                                            <button style={s.btnSuccess} onClick={() => handleTenderWinner(t.id, p.contractor)}>Утвердить</button>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                    {t.proposals.length === 0 && <tr><td colSpan={6} style={s.td}>Нет предложений</td></tr>}
                                  </tbody>
                                </table>
                                <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                                  <button style={s.btnSecondary}><Plus size={16}/> Добавить КП</button>
                                  <button style={s.btnAction} onClick={() => handleTransferToSdo(t)}>Передать в СДО</button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
               </table>
            </div>
          )}

          {/* 2b. Реестр контрагентов */}
          {tenderSubTab === 1 && (
            <div style={s.card}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                 <div style={s.flexRow}>
                   <h3>Реестр контрагентов</h3>
                   <button style={s.btnSecondary}><Filter size={16}/> Фильтр</button>
                 </div>
                 <button style={s.btnPrimary} onClick={() => setShowAddContractorModal(true)}><Plus size={16}/> Добавить контрагента</button>
               </div>
               <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>Наименование / ИНН</th>
                      <th style={s.th}>Виды работ</th>
                      <th style={s.th}>Рейтинг</th>
                      <th style={s.th}>Статус</th>
                      <th style={s.th}>Контакт</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contractors.map(c => (
                      <tr key={c.id}>
                        <td style={s.td}><strong>{c.name}</strong><br/><small style={{color:'var(--text-muted)'}}>ИНН: {c.inn}</small></td>
                        <td style={s.td}>{c.tags.map(t => <span key={t} style={s.tag}>{t}</span>)}</td>
                        <td style={s.td}>
                          {Array.from({length: c.rating}).map((_, i) => <Star key={i} size={14} color="#ffd700" fill="#ffd700" />)}
                        </td>
                        <td style={s.td}><span style={s.status(c.status)}>{c.status}</span></td>
                        <td style={s.td}>{c.contact}</td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          )}

          {/* 2c. Шаблоны договоров */}
          {tenderSubTab === 2 && (
            <div style={s.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <h3>Шаблоны документов</h3>
                <button style={s.btnPrimary}><Upload size={16}/> Загрузить шаблон</button>
              </div>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {templates.map((tpl, i) => (
                  <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><FileText size={18} color="var(--accent-blue)"/> {tpl}</span>
                    <button style={s.btnSecondary}><Download size={16}/> Скачать</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* === TAB 3: СДО === */}
      {activeTab === 2 && (
        <div>
          <div style={s.subTabsHeader}>
            <button style={s.subTabBtn(sdoSubTab === 0)} onClick={() => setSdoSubTab(0)}>Согласование договоров</button>
            <button style={s.subTabBtn(sdoSubTab === 1)} onClick={() => setSdoSubTab(1)}>Реестр заключенных договоров</button>
          </div>

          {/* 3a. Согласование */}
          {sdoSubTab === 0 && (
             <div style={s.card}>
               <h3>Лист согласования</h3>
               <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>№</th>
                      <th style={s.th}>Контрагент / Тендер</th>
                      <th style={s.th}>Сумма (руб)</th>
                      <th style={s.th}>Статус</th>
                      <th style={s.th}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvals.map(a => (
                      <React.Fragment key={a.id}>
                        <tr>
                          <td style={s.td}>{a.num}</td>
                          <td style={s.td}><strong>{a.contractor}</strong><br/><small style={{color:'var(--text-muted)'}}>{a.tenderLink}</small></td>
                          <td style={s.td}>{a.sum.toLocaleString('ru-RU')}</td>
                          <td style={s.td}><span style={s.status(a.status)}>{a.status}</span></td>
                          <td style={s.td}>
                            <button style={s.btnSecondary} onClick={() => setExpandedApprovalId(expandedApprovalId === a.id ? null : a.id)}>
                              {expandedApprovalId === a.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>} Маршрут
                            </button>
                          </td>
                        </tr>
                        {expandedApprovalId === a.id && (
                          <tr>
                            <td colSpan={5} style={{ padding: '15px', background: 'rgba(255,255,255,0.02)' }}>
                              <h4>Маршрут согласования</h4>
                              <div style={{ display: 'flex', gap: '15px', marginTop: '10px', flexWrap: 'wrap' }}>
                                {a.chain.map((c, i) => (
                                  <div key={i} style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-dark)', minWidth: '150px' }}>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.role}</div>
                                    <div style={{ fontWeight: 'bold', margin: '4px 0' }}>{c.name}</div>
                                    {c.approved ? 
                                      <div style={{ color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}><CheckCircle size={14}/> Согласовано</div> 
                                      : 
                                      <button style={s.btnAction} onClick={() => handleApprove(a.id, c.role)}>Согласовать</button>
                                    }
                                  </div>
                                ))}
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                  <button style={s.btnSecondary}><Plus size={16}/> Добавить</button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
               </table>
             </div>
          )}

          {/* 3b. Реестр договоров */}
          {sdoSubTab === 1 && (
             <div style={s.card}>
               <h3>Реестр заключенных договоров</h3>
               <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>№ / Период</th>
                      <th style={s.th}>Контрагент / Предмет</th>
                      <th style={s.th}>Сумма договора</th>
                      <th style={s.th}>Оплачено / Остаток</th>
                      <th style={s.th}>Статус</th>
                      <th style={s.th}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.map(c => (
                      <React.Fragment key={c.id}>
                        <tr>
                          <td style={s.td}><strong>{c.num}</strong><br/><small style={{color:'var(--text-muted)'}}>{c.start} - {c.end}</small></td>
                          <td style={s.td}><strong>{c.contractor}</strong><br/><small>{c.subject}</small></td>
                          <td style={s.td}>{c.sum.toLocaleString('ru-RU')}</td>
                          <td style={s.td}>
                            <span style={{color: 'var(--accent-green)'}}>{c.paid.toLocaleString('ru-RU')}</span><br/>
                            <span style={{color: 'var(--text-muted)'}}>{(c.sum - c.paid).toLocaleString('ru-RU')}</span>
                          </td>
                          <td style={s.td}><span style={s.status(c.status)}>{c.status}</span></td>
                          <td style={s.td}>
                            <button style={s.btnSecondary} onClick={() => setExpandedContractId(expandedContractId === c.id ? null : c.id)}>
                              {expandedContractId === c.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>} Оплаты
                            </button>
                          </td>
                        </tr>
                        {expandedContractId === c.id && (
                          <tr>
                            <td colSpan={6} style={{ padding: '15px', background: 'rgba(255,255,255,0.02)' }}>
                              <h4>История платежей</h4>
                              <table style={{...s.table, background: 'var(--bg-dark)'}}>
                                <thead>
                                  <tr>
                                    <th style={s.th}>Дата</th>
                                    <th style={s.th}>Сумма (руб)</th>
                                    <th style={s.th}>Основание</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {c.payments.map((p, i) => (
                                    <tr key={i}>
                                      <td style={s.td}>{p.date}</td>
                                      <td style={s.td}>{p.sum.toLocaleString('ru-RU')}</td>
                                      <td style={s.td}>{p.reason}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={2} style={{...s.td, textAlign: 'right'}}><strong>ИТОГО:</strong></td>
                      <td style={{...s.td, fontWeight: 'bold'}}>{contracts.reduce((acc, c) => acc + c.sum, 0).toLocaleString('ru-RU')}</td>
                      <td style={{...s.td, fontWeight: 'bold'}}>
                        <span style={{color: 'var(--accent-green)'}}>{contracts.reduce((acc, c) => acc + c.paid, 0).toLocaleString('ru-RU')}</span> / <span style={{color: 'var(--text-muted)'}}>{contracts.reduce((acc, c) => acc + (c.sum - c.paid), 0).toLocaleString('ru-RU')}</span>
                      </td>
                      <td colSpan={2} style={s.td}></td>
                    </tr>
                  </tfoot>
               </table>
             </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showAddVolumeModal && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            <h3>Добавить том РД</h3>
            <label style={s.label}>Шифр тома</label>
            <input style={s.input} value={newVolume.shifr} onChange={e => setNewVolume({...newVolume, shifr: e.target.value})} placeholder="Например, АР-01" />
            <label style={s.label}>Наименование</label>
            <input style={s.input} value={newVolume.name} onChange={e => setNewVolume({...newVolume, name: e.target.value})} placeholder="Архитектурные решения..." />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button style={s.btnSecondary} onClick={() => setShowAddVolumeModal(false)}>Отмена</button>
              <button style={s.btnPrimary} onClick={handleAddVolume}>Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {showTenderTaskModal && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            <h3>Сформировать ТЗ на тендер</h3>
            <label style={s.label}>Тема тендера</label>
            <input style={s.input} value={tenderTask.theme} onChange={e => setTenderTask({...tenderTask, theme: e.target.value})} />
            <label style={s.label}>Описание работ</label>
            <textarea style={{...s.input, minHeight: '80px'}} value={tenderTask.description} onChange={e => setTenderTask({...tenderTask, description: e.target.value})} />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button style={s.btnSecondary} onClick={() => setShowTenderTaskModal(false)}>Отмена</button>
              <button style={s.btnPrimary} onClick={handleCreateTenderTask}>Создать</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Simple placeholders for other modals */}
      {showAddTenderModal && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            <h3>Создать тендер</h3>
            <div style={{padding: '20px 0'}}>Форма создания тендера...</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button style={s.btnSecondary} onClick={() => setShowAddTenderModal(false)}>Закрыть</button>
            </div>
          </div>
        </div>
      )}
      
      {showAddContractorModal && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            <h3>Добавить контрагента</h3>
            <div style={{padding: '20px 0'}}>Форма добавления контрагента...</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button style={s.btnSecondary} onClick={() => setShowAddContractorModal(false)}>Закрыть</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
