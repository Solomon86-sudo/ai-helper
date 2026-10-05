import React, { useState } from 'react';
import { Upload, Calendar, ChevronRight, ChevronDown, BarChart2, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

const MOCK_TASKS = [
  { uid: '1', id: '1', name: 'ЖК Астра (Фаза 1)', wbs: '1', start: '2026-01-10', finish: '2027-12-30', percent: '15', outlineLevel: 1, isSummary: true, physicalPct: 12, costPct: 15, executor: '', cost: 450000000 },
  { uid: '2', id: '2', name: 'Подготовительные работы', wbs: '1.1', start: '2026-01-10', finish: '2026-03-15', percent: '100', outlineLevel: 2, isSummary: true, physicalPct: 100, costPct: 100, executor: 'ООО СтройМонтаж', cost: 12500000 },
  { uid: '3', id: '3', name: 'Ограждение стройплощадки', wbs: '1.1.1', start: '2026-01-10', finish: '2026-01-20', percent: '100', outlineLevel: 3, isSummary: false, physicalPct: 100, costPct: 100, executor: 'ООО СтройМонтаж', cost: 3200000 },
  { uid: '4', id: '4', name: 'Мобилизация бытового городка', wbs: '1.1.2', start: '2026-01-21', finish: '2026-03-15', percent: '100', outlineLevel: 3, isSummary: false, physicalPct: 100, costPct: 100, executor: 'ООО СтройМонтаж', cost: 9300000 },
  { uid: '5', id: '5', name: 'Земляные работы (Котлован)', wbs: '1.2', start: '2026-03-16', finish: '2026-05-20', percent: '80', outlineLevel: 2, isSummary: true, physicalPct: 85, costPct: 75, executor: 'ООО ГеоТех', cost: 38000000 },
  { uid: '6', id: '6', name: 'Разработка грунта', wbs: '1.2.1', start: '2026-03-16', finish: '2026-04-30', percent: '100', outlineLevel: 3, isSummary: false, physicalPct: 100, costPct: 100, executor: 'ООО ГеоТех', cost: 25000000 },
  { uid: '7', id: '7', name: 'Устройство шпунтового ограждения', wbs: '1.2.2', start: '2026-05-01', finish: '2026-05-20', percent: '40', outlineLevel: 3, isSummary: false, physicalPct: 50, costPct: 40, executor: 'ООО ГеоТех', cost: 13000000 },
  { uid: '8', id: '8', name: 'Монолитные работы', wbs: '1.3', start: '2026-05-21', finish: '2026-11-30', percent: '0', outlineLevel: 2, isSummary: true, physicalPct: 0, costPct: 0, executor: 'Не назначен', cost: 185000000 },
  { uid: '9', id: '9', name: 'Фундаментная плита', wbs: '1.3.1', start: '2026-05-21', finish: '2026-06-15', percent: '0', outlineLevel: 3, isSummary: false, physicalPct: 0, costPct: 0, executor: 'Не назначен', cost: 42000000 },
  { uid: '10', id: '10', name: 'Стены и пилоны -1 этажа', wbs: '1.3.2', start: '2026-06-16', finish: '2026-07-05', percent: '0', outlineLevel: 3, isSummary: false, physicalPct: 0, costPct: 0, executor: 'Не назначен', cost: 31000000 },
];

export default function ScheduleModule() {
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [expanded, setExpanded] = useState(new Set(['1', '2', '5', '8'])); // UID
  const [isImporting, setIsImporting] = useState(false);

  const toggleExpand = (uid) => {
    const next = new Set(expanded);
    if (next.has(uid)) next.delete(uid);
    else next.add(uid);
    setExpanded(next);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");
        
        const tasksNode = xmlDoc.getElementsByTagName("Tasks")[0];
        if (!tasksNode) {
          alert("Неверный формат. Пожалуйста, сохраните файл в MS Project как XML-документ.");
          setIsImporting(false);
          return;
        }

        // Extract resources map (UID -> Name)
        const resourceMap = {};
        const resourcesNode = xmlDoc.getElementsByTagName("Resources")[0];
        if (resourcesNode) {
          Array.from(resourcesNode.getElementsByTagName("Resource")).forEach(res => {
            const uid = res.getElementsByTagName("UID")[0]?.textContent;
            const name = res.getElementsByTagName("Name")[0]?.textContent;
            if (uid && name) resourceMap[uid] = name;
          });
        }

        // Extract assignments (Task UID -> Resource UIDs)
        const taskAssignments = {};
        const assignmentsNode = xmlDoc.getElementsByTagName("Assignments")[0];
        if (assignmentsNode) {
          Array.from(assignmentsNode.getElementsByTagName("Assignment")).forEach(a => {
            const taskUID = a.getElementsByTagName("TaskUID")[0]?.textContent;
            const resUID = a.getElementsByTagName("ResourceUID")[0]?.textContent;
            if (taskUID && resUID && resourceMap[resUID]) {
              if (!taskAssignments[taskUID]) taskAssignments[taskUID] = [];
              if (!taskAssignments[taskUID].includes(resourceMap[resUID])) {
                taskAssignments[taskUID].push(resourceMap[resUID]);
              }
            }
          });
        }

        const rawTasks = Array.from(tasksNode.getElementsByTagName("Task")).map(task => {
          const getText = (tag) => task.getElementsByTagName(tag)[0]?.textContent || '';
          const uid = getText("UID");
          return {
            uid,
            id: getText("ID"),
            name: getText("Name"),
            wbs: getText("WBS"),
            start: getText("Start") ? getText("Start").split('T')[0] : '',
            finish: getText("Finish") ? getText("Finish").split('T')[0] : '',
            percent: getText("PercentComplete") || "0",
            outlineLevel: parseInt(getText("OutlineLevel") || "1", 10),
            isSummary: getText("Summary") === "1",
            physicalPct: parseInt(getText("PercentComplete") || "0", 10),
            costPct: 0,
            executor: taskAssignments[uid] ? taskAssignments[uid].join(', ') : '',
            cost: parseFloat(getText("Cost") || getText("FixedCost") || "0"),
          };
        }).filter(t => t.name && t.wbs && parseInt(t.id) > 0);

        rawTasks.sort((a, b) => parseInt(a.id) - parseInt(b.id));
        
        // Auto-expand top 2 levels
        const newExpanded = new Set();
        rawTasks.forEach(t => {
          if (t.isSummary && t.outlineLevel <= 2) newExpanded.add(t.uid);
        });

        setTasks(rawTasks);
        setExpanded(newExpanded);
      } catch (err) {
        console.error(err);
        alert("Ошибка при чтении XML. Убедитесь, что это корректный экспорт из MS Project.");
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  // Render logic for WBS hierarchy visibility
  const isVisible = (task, index, allTasks) => {
    if (task.outlineLevel === 1) return true;
    
    // Check if all parents are expanded
    let currentLevel = task.outlineLevel;
    for (let i = index - 1; i >= 0; i--) {
      const prev = allTasks[i];
      if (prev.outlineLevel < currentLevel) {
        if (!expanded.has(prev.uid)) return false;
        currentLevel = prev.outlineLevel;
      }
      if (currentLevel === 1) break;
    }
    return true;
  };

  const getStatusColor = (percent) => {
    if (percent === 100) return '#10b981'; // Green
    if (percent > 0) return '#3b82f6'; // Blue
    return '#6b7280'; // Gray
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
      
      {/* Header Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', padding: '16px', backgroundColor: 'var(--bg-panel)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={24} color="#3b82f6" />
            График реализации проекта (СМР)
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
            Структура декомпозиции работ (WBS). Загрузите график из MS Project (.xml) для синхронизации.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label style={{
            padding: '8px 16px', backgroundColor: '#059669', color: 'white', borderRadius: '6px',
            fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
          }}>
            {isImporting ? <div style={{width:14, height:14, border:'2px solid white', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 1s linear infinite'}} /> : <Upload size={16} />}
            Импорт XML MS Project
            <input type="file" accept=".xml" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {/* Instruction Box */}
      <div style={{ padding: '12px 16px', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <Info size={20} color="#3b82f6" style={{ marginTop: '2px' }} />
        <div style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: '1.5' }}>
          <strong style={{ color: '#3b82f6' }}>Конвертация из MS Project:</strong> В самом MS Project нажмите <i>Файл → Сохранить как → Тип файла: XML-документ (*.xml)</i>. 
          Система автоматически извлечет WBS (коды декомпозиции), связи, длительности и процент выполнения. <br/>
          <strong style={{ color: '#10b981' }}>Архитектура данных ERP:</strong> В отличие от MS Project, наша ERP разделяет <b>Физический объем (Physical %)</b> — прогресс на стройплощадке, и <b>Освоение денег (Cost %)</b> — оплаченные КС-2. При импорте % из MSP записывается как Физический прогресс.
        </div>
      </div>

      {/* Table Container */}
      <div style={{ flex: 1, backgroundColor: 'var(--bg-panel)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ overflowX: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left', minWidth: '1100px' }}>
            <thead style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-color)' }}>
              <tr>
                <th style={{ padding: '12px 16px', width: '60px' }}>WBS</th>
                <th style={{ padding: '12px 16px' }}>Наименование задачи</th>
                <th style={{ padding: '12px 16px', width: '150px' }}>Исполнитель</th>
                <th style={{ padding: '12px 16px', width: '110px' }}>Начало</th>
                <th style={{ padding: '12px 16px', width: '110px' }}>Окончание</th>
                <th style={{ padding: '12px 16px', width: '120px', textAlign: 'right' }}>Стоимость, ₽</th>
                <th style={{ padding: '12px 16px', width: '140px' }}>Физический % (СМР)</th>
                <th style={{ padding: '12px 16px', width: '140px' }}>Освоение % (КС-2)</th>
                <th style={{ padding: '12px 16px', width: '100px' }}>Статус</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, index) => {
                if (!isVisible(task, index, tasks)) return null;

                const paddingLeft = `${(task.outlineLevel - 1) * 24 + 16}px`;
                const isLate = task.percent < 100 && new Date(task.finish) < new Date(); // Mock check for late tasks

                return (
                  <tr key={task.uid} style={{ 
                    borderBottom: '1px solid var(--border-color)', 
                    backgroundColor: task.isSummary ? 'rgba(255,255,255,0.02)' : 'transparent',
                    fontWeight: task.isSummary ? 'bold' : 'normal',
                    color: task.isSummary ? 'var(--text-main)' : 'var(--text-muted)'
                  }}>
                    <td style={{ padding: '10px 16px' }}>{task.wbs}</td>
                    
                    <td style={{ padding: '10px 16px', paddingLeft, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {task.isSummary ? (
                        <div onClick={() => toggleExpand(task.uid)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px' }}>
                          {expanded.has(task.uid) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </div>
                      ) : <div style={{ width: '16px' }} />}
                      {task.name}
                    </td>

                    <td style={{ padding: '10px 16px', fontSize: '12px', color: task.executor === 'Не назначен' ? '#f59e0b' : 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {task.isSummary ? (
                          <span>{task.executor || '—'}</span>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <select 
                              value={task.executor || ''}
                              onChange={(e) => {
                                const newTasks = [...tasks];
                                newTasks[index].executor = e.target.value;
                                setTasks(newTasks);
                              }}
                              style={{ 
                                padding: '4px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-main)', 
                                color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '11px', flex: 1 
                              }}
                            >
                              <option value="">Не назначен</option>
                              <option value="ООО СпецСтрой">ООО СпецСтрой</option>
                              <option value="ИП Подрядчиков">ИП Подрядчиков</option>
                              <option value="ООО ГК ПИК">ООО ГК ПИК</option>
                              <option value="Иван (Админ)">Иван (Админ)</option>
                            </select>
                          </div>
                        )}
                        {!task.isSummary && task.executor && (
                          <button 
                            onClick={() => {
                              alert(`✅ Задача "${task.name}" отправлена на email подрядчику: ${task.executor}`);
                              // В реальной ERP здесь будет POST запрос на бэкенд
                            }}
                            style={{ padding: '2px 6px', fontSize: '10px', backgroundColor: 'var(--accent-blue)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            Уведомить
                          </button>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: '10px 16px' }}>{task.start}</td>
                    <td style={{ padding: '10px 16px', color: isLate ? '#ef4444' : 'inherit' }}>{task.finish}</td>
                    
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'monospace', fontSize: '12px' }}>
                      {task.cost > 0 ? new Intl.NumberFormat('ru-RU').format(task.cost) : '—'}
                    </td>
                    
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '60px', height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${task.physicalPct}%`, backgroundColor: getStatusColor(task.physicalPct) }} />
                        </div>
                        <span style={{ fontSize: '11px', width: '30px' }}>{task.physicalPct}%</span>
                      </div>
                    </td>

                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '60px', height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${task.costPct}%`, backgroundColor: '#f59e0b' }} />
                        </div>
                        <span style={{ fontSize: '11px', width: '30px', color: '#fbbf24' }}>{task.costPct}%</span>
                      </div>
                    </td>

                    <td style={{ padding: '10px 16px' }}>
                      {task.percent == 100 ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '11px' }}><CheckCircle2 size={12}/> Завершено</span>
                      ) : isLate ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '11px' }}><AlertTriangle size={12}/> Отставание</span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#3b82f6', fontSize: '11px' }}><BarChart2 size={12}/> В работе</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    График не загружен. Загрузите файл XML из MS Project.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
