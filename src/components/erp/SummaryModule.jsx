import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Wallet, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

const budgetData = [
  { name: 'Янв', plan: 400, fact: 240 },
  { name: 'Фев', plan: 300, fact: 139 },
  { name: 'Мар', plan: 200, fact: 980 },
  { name: 'Апр', plan: 278, fact: 390 },
  { name: 'Май', plan: 189, fact: 480 },
  { name: 'Июн', plan: 239, fact: 380 },
];

const tenderData = [
  { name: 'Завершены', value: 400, color: '#10b981' }, // green
  { name: 'В процессе', value: 300, color: '#3b82f6' }, // blue
  { name: 'Сбор КП', value: 300, color: '#f59e0b' }, // yellow
  { name: 'Отменены', value: 200, color: '#ef4444' }, // red
];

export default function SummaryModule() {
  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h2 style={{ margin: '0 0 8px 0' }}>Сводная аналитика проекта</h2>
      
      {/* Ключевые показатели (KPI Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        
        <div style={{ backgroundColor: 'var(--bg-main)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>Освоение бюджета</span>
            <div style={{ padding: '8px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>
              <Wallet size={20} color="var(--accent-blue)" />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>45.2%</div>
          <div style={{ fontSize: '12px', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={14} /> +2.4% за месяц
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-main)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>Отставание графика</span>
            <div style={{ padding: '8px', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px' }}>
              <AlertTriangle size={20} color="#f59e0b" />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>14 дней</div>
          <div style={{ fontSize: '12px', color: '#f59e0b' }}>Критический путь под угрозой</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-main)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>Принято томов РД</span>
            <div style={{ padding: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>
              <CheckCircle2 size={20} color="var(--accent-green)" />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>12 / 45</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Осталось 33 тома</div>
        </div>

      </div>

      {/* Графики */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginTop: '16px' }}>
        
        {/* График бюджета */}
        <div style={{ backgroundColor: 'var(--bg-main)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', minHeight: '350px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '16px' }}>Динамика оплат (План/Факт), млн ₽</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={budgetData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text-muted)" />
              <YAxis stroke="var(--text-muted)" />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--text-main)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }}/>
              <Bar dataKey="plan" name="План" fill="var(--bg-card)" stroke="var(--border-color)" strokeWidth={1} />
              <Bar dataKey="fact" name="Факт (КС-2)" fill="var(--accent-blue)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Статус тендеров (Pie) */}
        <div style={{ backgroundColor: 'var(--bg-main)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', minHeight: '350px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '16px' }}>Статусы тендеров</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={tenderData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {tenderData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <RechartsTooltip 
                contentStyle={{ backgroundColor: 'var(--bg-card)', border: 'none', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--text-main)' }}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}
