import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function AgentAudit() {
  const [status, setStatus] = useState('idle'); // idle, scanning, result
  
  const handleUpload = () => {
    setStatus('scanning');
    setTimeout(() => {
      setStatus('result');
    }, 3000);
  };

  return (
    <div className="audit-container">
      {status === 'idle' && (
        <div className="upload-zone" onClick={handleUpload}>
          <UploadCloud className="icon" size={48} />
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Загрузите проектную документацию</h3>
            <p>Поддерживаемые форматы: PDF, DWG (до 50 МБ)</p>
          </div>
          <button className="btn-primary" style={{ marginTop: '16px' }}>Выбрать файл</button>
        </div>
      )}

      {status === 'scanning' && (
        <div className="ocr-progress">
          <div className="spinner">
            <FileText size={48} />
          </div>
          <h3>Анализ документа...</h3>
          <p style={{ color: 'var(--text-muted)' }}>Распознавание чертежей и штампов (OCR). Сверка с нормами.</p>
        </div>
      )}

      {status === 'result' && (
        <div className="audit-results">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.25rem' }}>Отчет об аудите документации</h3>
            <button className="btn-primary" onClick={() => setStatus('idle')}>Новый аудит</button>
          </div>
          
          <table className="audit-table">
            <thead>
              <tr>
                <th>Сущность / Параметр</th>
                <th>Ожидание (ТЗ/Норма)</th>
                <th>Факт в документе</th>
                <th>Статус</th>
                <th>Комментарий</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Отступ от красной линии</td>
                <td>5 м (ПЗЗ)</td>
                <td>5 м</td>
                <td><span className="status-badge success"><CheckCircle size={14}/> Соответствует</span></td>
                <td>Нарушений не выявлено</td>
              </tr>
              <tr>
                <td>Высота здания</td>
                <td>Не более 15 м (АГО)</td>
                <td>16.5 м</td>
                <td><span className="status-badge error"><XCircle size={14}/> Нарушение</span></td>
                <td>Превышение габаритов по согласованному АГО. Требуется корректировка.</td>
              </tr>
              <tr>
                <td>Точка подключения ВК</td>
                <td>Согласно ТУ Водоканала (Колодец К-1)</td>
                <td>Колодец К-2</td>
                <td><span className="status-badge warning"><AlertTriangle size={14}/> Требует уточнения</span></td>
                <td>Несовпадение с ТУ. Необходимо пересогласование с РСО.</td>
              </tr>
            </tbody>
          </table>
          <p style={{ marginTop: '24px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            * Обратите внимание: ИИ-аудит носит рекомендательный характер и не заменяет официальную экспертизу проектной документации.
          </p>
        </div>
      )}
    </div>
  );
}
