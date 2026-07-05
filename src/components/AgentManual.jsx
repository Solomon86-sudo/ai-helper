import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle, Settings, BookOpen } from 'lucide-react';

export default function AgentManual() {
  const [status, setStatus] = useState('idle'); // idle, generating, result
  const [files, setFiles] = useState({
    stageP: false,
    expertise: false,
    passports: false
  });

  const handleUpload = (type) => {
    setFiles(prev => ({ ...prev, [type]: true }));
  };

  const handleGenerate = () => {
    setStatus('generating');
    setTimeout(() => {
      setStatus('result');
    }, 3500);
  };

  const allUploaded = files.stageP && files.expertise && files.passports;

  return (
    <div className="manual-container">
      {status === 'idle' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <p style={{ color: 'var(--text-muted)' }}>
            Для автоматической генерации инструкции по эксплуатации здания (ИЭЗ), загрузите исходную документацию.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div className="glass-card" style={{ textAlign: 'center', cursor: 'pointer', borderColor: files.stageP ? 'var(--accent-green)' : 'var(--border-color)' }} onClick={() => handleUpload('stageP')}>
              {files.stageP ? <CheckCircle color="var(--accent-green)" size={32} style={{ margin: '0 auto 12px' }} /> : <FileText color="var(--accent-blue)" size={32} style={{ margin: '0 auto 12px' }} />}
              <h4>Стадия П</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{files.stageP ? 'Загружено' : 'Нажмите для загрузки'}</p>
            </div>
            
            <div className="glass-card" style={{ textAlign: 'center', cursor: 'pointer', borderColor: files.expertise ? 'var(--accent-green)' : 'var(--border-color)' }} onClick={() => handleUpload('expertise')}>
              {files.expertise ? <CheckCircle color="var(--accent-green)" size={32} style={{ margin: '0 auto 12px' }} /> : <FileText color="var(--accent-blue)" size={32} style={{ margin: '0 auto 12px' }} />}
              <h4>Экспертиза</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{files.expertise ? 'Загружено' : 'Нажмите для загрузки'}</p>
            </div>

            <div className="glass-card" style={{ textAlign: 'center', cursor: 'pointer', borderColor: files.passports ? 'var(--accent-green)' : 'var(--border-color)' }} onClick={() => handleUpload('passports')}>
              {files.passports ? <CheckCircle color="var(--accent-green)" size={32} style={{ margin: '0 auto 12px' }} /> : <Settings color="var(--accent-blue)" size={32} style={{ margin: '0 auto 12px' }} />}
              <h4>Паспорта и инструкции</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Оборудование, сертификаты</p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button 
              className="btn-primary" 
              disabled={!allUploaded}
              onClick={handleGenerate}
            >
              Сгенерировать инструкцию по эксплуатации
            </button>
          </div>
        </div>
      )}

      {status === 'generating' && (
        <div className="ocr-progress">
          <div className="spinner">
            <BookOpen size={48} />
          </div>
          <h3>Сборка инструкции по эксплуатации...</h3>
          <p style={{ color: 'var(--text-muted)' }}>Извлечение ТЭП, гарантийных сроков оборудования и регламентов обслуживания.</p>
        </div>
      )}

      {status === 'result' && (
        <div className="audit-results">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.25rem' }}>Инструкция по эксплуатации сгенерирована</h3>
            <button className="btn-primary" onClick={() => { setStatus('idle'); setFiles({stageP: false, expertise: false, passports: false}); }}>Новая инструкция</button>
          </div>
          
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <FileText size={48} color="var(--accent-green)" />
            <div style={{ flex: 1 }}>
              <h4 style={{ marginBottom: '8px' }}>Инструкция_по_эксплуатации_объекта_V1.pdf</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Сформировано разделов: 12. Включены графики ТО инженерных систем (Вентиляция, ИТП), гарантийные обязательства подрядчиков согласно загруженным паспортам.</p>
            </div>
            <button className="btn-primary" style={{ backgroundColor: 'var(--accent-green)' }}>
              Скачать документ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
