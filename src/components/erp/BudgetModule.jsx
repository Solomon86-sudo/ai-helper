import React, { useState } from 'react';
import { DollarSign, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

const mockBudgetLines = [
  { id: 1, name: 'СМР (Общестрой)', limit: 450000000, paid: 120000000, remaining: 330000000, status: 'ok' },
  { id: 2, name: 'Проектирование', limit: 25000000, paid: 23000000, remaining: 2000000, status: 'warning' },
  { id: 3, name: 'Благоустройство', limit: 45000000, paid: 0, remaining: 45000000, status: 'ok' },
  { id: 4, name: 'Лифтовое оборудование', limit: 80000000, paid: 85000000, remaining: -5000000, status: 'overrun' },
];

export default function BudgetModule() {
  const [activeTab, setActiveTab] = useState('limits');

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Бюджет и Финансы</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ padding: '8px 16px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
            Экспорт Excel
          </button>
          <button style={{ padding: '8px 16px', backgroundColor: 'var(--accent-blue)', color: 'white', border: 'none', borderRadius: '6px' }}>
            + Внести платеж
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('limits')}
          style={{ background: 'none', border: 'none', color: activeTab === 'limits' ? 'var(--accent-blue)' : 'var(--text-muted)', fontWeight: activeTab === 'limits' ? 'bold' : 'normal', cursor: 'pointer', fontSize: '15px' }}
        >
          Банковские лимиты
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          style={{ background: 'none', border: 'none', color: activeTab === 'payments' ? 'var(--accent-blue)' : 'var(--text-muted)', fontWeight: activeTab === 'payments' ? 'bold' : 'normal', cursor: 'pointer', fontSize: '15px' }}
        >
          Реестр оплат (КС-2 / КС-3)
        </button>
      </div>

      {activeTab === 'limits' && (
        <div style={{ flex: 1, backgroundColor: 'var(--bg-main)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)' }}>
              <tr>
                <th style={{ padding: '16px', fontWeight: 500, color: 'var(--text-muted)' }}>Статья затрат</th>
                <th style={{ padding: '16px', fontWeight: 500, color: 'var(--text-muted)' }}>Лимит (План)</th>
                <th style={{ padding: '16px', fontWeight: 500, color: 'var(--text-muted)' }}>Оплачено (Факт)</th>
                <th style={{ padding: '16px', fontWeight: 500, color: 'var(--text-muted)' }}>Остаток</th>
                <th style={{ padding: '16px', fontWeight: 500, color: 'var(--text-muted)' }}>Статус</th>
              </tr>
            </thead>
            <tbody>
              {mockBudgetLines.map((line) => (
                <tr key={line.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px' }}>{line.name}</td>
                  <td style={{ padding: '16px' }}>{formatCurrency(line.limit)}</td>
                  <td style={{ padding: '16px' }}>{formatCurrency(line.paid)}</td>
                  <td style={{ padding: '16px', color: line.remaining < 0 ? '#ef4444' : 'inherit' }}>
                    {formatCurrency(line.remaining)}
                  </td>
                  <td style={{ padding: '16px' }}>
                    {line.status === 'ok' && <span style={{ color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16}/> В норме</span>}
                    {line.status === 'warning' && <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px' }}><AlertTriangle size={16}/> Остаток &lt; 10%</span>}
                    {line.status === 'overrun' && <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}><AlertTriangle size={16}/> Перерасход</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'payments' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          <div style={{ textAlign: 'center' }}>
            <FileText size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
            <p>Реестр оплат пуст.</p>
            <p style={{ fontSize: '13px' }}>Здесь будут отображаться проведенные платежи по формам КС-2 и КС-3.</p>
          </div>
        </div>
      )}
    </div>
  );
}
