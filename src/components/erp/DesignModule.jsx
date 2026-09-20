import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, ShieldAlert, Users, FolderOpen, FileCheck, Layers, FileSignature } from 'lucide-react';

const DesignModule = () => {
  const [role, setRole] = useState('client'); // 'client' (Заказчик) or 'designer' (Генпроектировщик)
  const [activeSubTab, setActiveSubTab] = useState('stage_p'); // 'ird', 'stage_p', 'rd'

  // --- ИРД State (Полный перечень по ГрК РФ ст. 48) ---
  const [irdDocs, setIrdDocs] = useState([
    { id: 1, name: 'Градостроительный план земельного участка (ГПЗУ)', status: 'approved', uploadedBy: 'client' },
    { id: 2, name: 'Правоустанавливающие документы на земельный участок', status: 'approved', uploadedBy: 'client' },
    { id: 3, name: 'Результаты инженерно-геодезических изысканий (ИГДИ)', status: 'approved', uploadedBy: 'designer' },
    { id: 4, name: 'Результаты инженерно-геологических изысканий (ИГИ)', status: 'approved', uploadedBy: 'designer' },
    { id: 5, name: 'Результаты инженерно-экологических изысканий (ИЭИ)', status: 'approved', uploadedBy: 'designer' },
    { id: 6, name: 'Технические условия на водоснабжение и водоотведение (ВК)', status: 'missing', uploadedBy: null },
    { id: 7, name: 'Технические условия на электроснабжение (ЭОМ)', status: 'missing', uploadedBy: null },
    { id: 8, name: 'Технические условия на теплоснабжение (ОВ)', status: 'missing', uploadedBy: null },
    { id: 9, name: 'Задание на проектирование', status: 'approved', uploadedBy: 'client' }
  ]);
  const [tzStatus, setTzStatus] = useState('approved'); 

  // --- Стадия П State (Полный перечень по ПП РФ №87) ---
  const [stagePDocs, setStagePDocs] = useState([
    { id: 1, section: 'Раздел 1', title: 'Пояснительная записка (ПЗ)', status: 'approved_for_expertise', ai_check: 'passed' },
    { id: 2, section: 'Раздел 2', title: 'Схема планировочной организации земельного участка (ПЗУ)', status: 'approved_for_expertise', ai_check: 'passed' },
    { id: 3, section: 'Раздел 3', title: 'Архитектурные решения (АР)', status: 'uploaded', ai_check: 'failed_tz_mismatch' },
    { id: 4, section: 'Раздел 4', title: 'Конструктивные и объемно-планировочные решения (КР)', status: 'uploaded', ai_check: 'pending' },
    { id: 5, section: 'Раздел 5.1', title: 'Система электроснабжения (ЭОМ)', status: 'missing', ai_check: null },
    { id: 6, section: 'Раздел 5.2', title: 'Система водоснабжения (ВК)', status: 'missing', ai_check: null },
    { id: 7, section: 'Раздел 5.3', title: 'Система водоотведения (ВК)', status: 'missing', ai_check: null },
    { id: 8, section: 'Раздел 5.4', title: 'Отопление, вентиляция и кондиционирование воздуха (ОВ)', status: 'missing', ai_check: null },
    { id: 9, section: 'Раздел 5.5', title: 'Сети связи (СС)', status: 'missing', ai_check: null },
    { id: 10, section: 'Раздел 5.6', title: 'Система газоснабжения', status: 'not_required', ai_check: null },
    { id: 11, section: 'Раздел 6', title: 'Проект организации строительства (ПОС)', status: 'missing', ai_check: null },
    { id: 12, section: 'Раздел 7', title: 'Мероприятия по охране окружающей среды (ООС)', status: 'missing', ai_check: null },
    { id: 13, section: 'Раздел 8', title: 'Мероприятия по обеспечению пожарной безопасности (ПБ)', status: 'missing', ai_check: null },
    { id: 14, section: 'Раздел 9', title: 'Мероприятия по обеспечению доступа инвалидов (ОДИ)', status: 'missing', ai_check: null },
    { id: 15, section: 'Раздел 10', title: 'Требования к обеспечению безопасной эксплуатации (ТБЭ)', status: 'missing', ai_check: null },
    { id: 16, section: 'Раздел 11', title: 'Смета на строительство (СМ)', status: 'missing', ai_check: null },
    { id: 17, section: 'Раздел 12', title: 'Иная документация (ГОЧС, ЭЭ и др.)', status: 'missing', ai_check: null }
  ]);

  // --- РД State (ГОСТ Р 21.101-2020) ---
  const [rdStructure, setRdStructure] = useState([
    { id: 'GP', name: 'ГП - Генеральный план', sheetsCount: 5, uploadedCount: 0 },
    { id: 'AR', name: 'АР - Архитектурные решения', sheetsCount: 45, uploadedCount: 12 },
    { id: 'KZh', name: 'КЖ - Конструкции железобетонные', sheetsCount: 120, uploadedCount: 120 },
    { id: 'KM', name: 'КМ - Конструкции металлические', sheetsCount: 15, uploadedCount: 0 },
    { id: 'EOM', name: 'ЭОМ - Силовое электрооборудование', sheetsCount: 30, uploadedCount: 0 },
    { id: 'VK', name: 'ВК - Водоснабжение и канализация', sheetsCount: 25, uploadedCount: 0 },
    { id: 'OV', name: 'ОВ - Отопление и вентиляция', sheetsCount: 35, uploadedCount: 0 },
    { id: 'SS', name: 'СС - Сети связи', sheetsCount: 20, uploadedCount: 0 },
    { id: 'A', name: 'А - Автоматизация', sheetsCount: 18, uploadedCount: 0 }
  ]);
  const [activeRdSection, setActiveRdSection] = useState('AR');

  const renderRoleToggle = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'var(--bg-color)', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', alignSelf: 'flex-start' }}>
      <Users size={18} color="var(--text-muted)" />
      <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Текущая роль:</span>
      <select 
        value={role} 
        onChange={(e) => setRole(e.target.value)}
        style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--primary-color)', backgroundColor: 'var(--bg-panel)', color: 'var(--text-color)', fontWeight: 'bold', outline: 'none', cursor: 'pointer' }}
      >
        <option value="client">Заказчик</option>
        <option value="designer">Генпроектировщик</option>
      </select>
    </div>
  );

  const renderSubTabs = () => (
    <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px' }}>
      <button onClick={() => setActiveSubTab('ird')} style={{ ...subTabStyle(activeSubTab === 'ird') }}>
        <FolderOpen size={16} /> 1. ИРД и ТЗ
      </button>
      <button onClick={() => setActiveSubTab('stage_p')} style={{ ...subTabStyle(activeSubTab === 'stage_p') }}>
        <Layers size={16} /> 2. Стадия П (ПП РФ №87)
      </button>
      <button onClick={() => setActiveSubTab('rd')} style={{ ...subTabStyle(activeSubTab === 'rd') }}>
        <FileCheck size={16} /> 3. Рабочая документация
      </button>
    </div>
  );

  const subTabStyle = (isActive) => ({
    display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', border: 'none', 
    backgroundColor: isActive ? 'var(--primary-color)' : 'transparent',
    color: isActive ? 'white' : 'var(--text-color)',
    borderRadius: '4px', cursor: 'pointer', fontWeight: isActive ? 'bold' : 'normal',
    transition: 'all 0.2s'
  });

  // ========== SUB-TAB 1: ИРД ==========
  const renderIrd = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ padding: '20px', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h4 style={{ margin: 0 }}>Исходно-разрешительная документация (согл. ГрК РФ)</h4>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Загружается Заказчиком и Изыскателями</span>
          </div>
          <button style={{ padding: '8px 16px', display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            <Upload size={16} /> Прикрепить документ
          </button>
        </div>
        
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {irdDocs.map(doc => (
              <tr key={doc.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px 0', width: '30px' }}><FileText size={18} color={doc.status === 'missing' ? 'var(--text-muted)' : 'var(--primary-color)'}/></td>
                <td style={{ padding: '12px 10px', color: doc.status === 'missing' ? 'var(--text-muted)' : 'var(--text-color)' }}>{doc.name}</td>
                <td style={{ padding: '12px', width: '150px' }}>
                  {doc.status === 'missing' ? (
                    <span style={{ color: '#e74c3c', fontSize: '12px' }}>Отсутствует</span>
                  ) : (
                    <span style={{ color: '#27ae60', fontSize: '12px', display: 'flex', gap: '4px', alignItems: 'center' }}><CheckCircle2 size={14}/> Загружено</span>
                  )}
                </td>
                <td style={{ padding: '12px', width: '150px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  {doc.uploadedBy === 'client' && 'Заказчик'}
                  {doc.uploadedBy === 'designer' && 'Генпроектировщик'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ========== SUB-TAB 2: Стадия П ==========
  const renderStageP = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h4>Разделы проектной документации (Стадия П)</h4>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Строгое соответствие Постановлению Правительства РФ №87</span>
        </div>
        {role === 'designer' && (
          <button style={{ padding: '8px 16px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', gap: '8px' }}>
            <Upload size={16} /> Выгрузить раздел П
          </button>
        )}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid var(--border-color)' }}>
        <thead>
          <tr style={{ backgroundColor: 'var(--bg-panel)', textAlign: 'left', fontSize: '13px', color: 'var(--text-muted)' }}>
            <th style={{ padding: '12px' }}>Раздел</th>
            <th style={{ padding: '12px' }}>Наименование (согл. ПП РФ №87)</th>
            <th style={{ padding: '12px' }}>Проверка ИИ (ТЗ и ИРД)</th>
            <th style={{ padding: '12px' }}>Статус Заказчика</th>
            <th style={{ padding: '12px' }}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {stagePDocs.map(doc => (
            <tr key={doc.id} style={{ borderTop: '1px solid var(--border-color)', opacity: doc.status === 'not_required' ? 0.5 : 1 }}>
              <td style={{ padding: '12px', fontWeight: 'bold' }}>{doc.section}</td>
              <td style={{ padding: '12px', color: doc.status === 'missing' ? 'var(--text-muted)' : 'inherit' }}>{doc.title}</td>
              <td style={{ padding: '12px' }}>
                {doc.ai_check === 'passed' && <span style={{ color: '#27ae60', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={14}/> Норма</span>}
                {doc.ai_check === 'pending' && <span style={{ color: '#f39c12', fontSize: '12px' }}>ИИ анализирует...</span>}
                {doc.ai_check === 'failed_tz_mismatch' && <span style={{ color: '#e74c3c', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><ShieldAlert size={14}/> Отклонения от ТЗ</span>}
                {doc.status === 'missing' && <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Нет данных</span>}
              </td>
              <td style={{ padding: '12px' }}>
                {doc.status === 'approved_for_expertise' && <span style={{ color: '#27ae60', fontWeight: 'bold', fontSize: '12px' }}>В ЭКСПЕРТИЗУ</span>}
                {doc.status === 'missing' && <span style={{ color: '#e74c3c', fontSize: '12px' }}>Не загружен</span>}
                {doc.status === 'not_required' && <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Не требуется</span>}
                {doc.status === 'uploaded' && <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Ожидает</span>}
              </td>
              <td style={{ padding: '12px' }}>
                {role === 'client' && doc.status === 'uploaded' && (
                  <button style={{ padding: '4px 10px', fontSize: '12px', backgroundColor: 'transparent', border: '1px solid #27ae60', color: '#27ae60', borderRadius: '4px', cursor: 'pointer' }}>
                    В экспертизу
                  </button>
                )}
                {role === 'designer' && doc.status === 'missing' && (
                  <button style={{ padding: '4px 10px', fontSize: '12px', backgroundColor: 'transparent', border: '1px dashed var(--primary-color)', color: 'var(--primary-color)', borderRadius: '4px', cursor: 'pointer' }}>
                    Загрузить
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // ========== SUB-TAB 3: Рабочая документация ==========
  const renderRD = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Вводные от заказчика */}
      <div style={{ padding: '16px', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1 }}>
          <h5 style={{ margin: '0 0 8px 0' }}>Частные ТЗ (ЧТЗ)</h5>
          {role === 'client' ? (
            <button style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', gap: '6px', alignItems: 'center' }}><Upload size={14}/> Прикрепить ЧТЗ</button>
          ) : (
            <span style={{ fontSize: '13px', color: 'var(--primary-color)' }}>Прикреплено 4 документа</span>
          )}
        </div>
        <div style={{ flex: 1, borderLeft: '1px solid var(--border-color)', paddingLeft: '20px' }}>
          <h5 style={{ margin: '0 0 8px 0' }}>Вендор-лист (Оборудование)</h5>
          {role === 'client' ? (
            <button style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', gap: '6px', alignItems: 'center' }}><Upload size={14}/> Прикрепить Вендор-лист</button>
          ) : (
            <span style={{ fontSize: '13px', color: 'var(--primary-color)' }}>Материалы согласованы</span>
          )}
        </div>
        {role === 'designer' && (
          <div style={{ flex: 1, borderLeft: '1px solid var(--border-color)', paddingLeft: '20px' }}>
            <h5 style={{ margin: '0 0 8px 0' }}>Состав проекта</h5>
            <button style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', gap: '6px', alignItems: 'center', backgroundColor: '#f39c12', color: 'white', border: 'none', borderRadius: '4px' }}>
              <FileText size={14}/> Сформировать ведомость
            </button>
          </div>
        )}
      </div>

      {/* Интеллектуальный блок разделов РД */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        
        {/* Вертикальные табы (Состав проекта) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '320px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Состав проекта</div>
            {role === 'designer' && (
              <button style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', gap: '4px', alignItems: 'center', backgroundColor: '#f39c12', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                <FileText size={12}/> Ред. состав
              </button>
            )}
          </div>
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
              <span style={{ fontSize: '11px', padding: '2px 6px', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '10px' }}>
                {sec.uploadedCount}/{sec.sheetsCount} листов
              </span>
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
              <button style={{ padding: '8px 16px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', display: 'flex', gap: '8px', cursor: 'pointer' }}>
                <Upload size={16}/> Умная загрузка листов (PDF)
              </button>
            )}
          </div>
          
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', padding: '12px', backgroundColor: 'rgba(16, 163, 127, 0.1)', border: '1px dashed var(--primary-color)', borderRadius: '6px' }}>
            <strong>💡 AI-Ассистент:</strong> Вы можете загрузить единый многостраничный PDF-файл раздела. Я автоматически распознаю угловые штампы, разобью его на листы и сопоставлю с таблицей ведомости ниже.
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', backgroundColor: 'var(--bg-panel)', boxShadow: '0 0 0 1px var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', backgroundColor: 'rgba(0,0,0,0.02)' }}>
                <th style={{ padding: '12px 10px', width: '80px' }}>Лист</th>
                <th style={{ padding: '12px 10px' }}>Наименование по ведомости</th>
                <th style={{ padding: '12px 10px' }}>Файл чертежа / ИИ-статус</th>
                <th style={{ padding: '12px 10px', width: '100px' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>1</td>
                <td style={{ padding: '12px 10px' }}>Общие данные</td>
                <td style={{ padding: '12px 10px', color: '#27ae60', display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <CheckCircle2 size={14}/> 01-AR_Sheet_1.pdf
                </td>
                <td style={{ padding: '12px 10px' }}>
                  <a href="#" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 'bold' }}>Смотреть</a>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>2</td>
                <td style={{ padding: '12px 10px' }}>План на отм. 0.000</td>
                <td style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>Файл отсутствует</td>
                <td style={{ padding: '12px 10px' }}>
                  {role === 'designer' && <button style={{ fontSize: '11px', padding: '4px 8px', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: 'transparent', cursor: 'pointer' }}>Загрузить лист</button>}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>3</td>
                <td style={{ padding: '12px 10px' }}>Разрез 1-1</td>
                <td style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>Файл отсутствует</td>
                <td style={{ padding: '12px 10px' }}>
                  {role === 'designer' && <button style={{ fontSize: '11px', padding: '4px 8px', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: 'transparent', cursor: 'pointer' }}>Загрузить лист</button>}
                </td>
              </tr>
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
      
      {renderSubTabs()}

      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
        {activeSubTab === 'ird' && renderIrd()}
        {activeSubTab === 'stage_p' && renderStageP()}
        {activeSubTab === 'rd' && renderRD()}
      </div>
    </div>
  );
};

export default DesignModule;
