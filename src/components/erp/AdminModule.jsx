import React, { useState } from 'react';
import { Users, UserPlus, Shield, Mail, Building, Key, CheckCircle2, X } from 'lucide-react';

const AdminModule = () => {
  const [users, setUsers] = useState([
    { id: 1, name: 'Иванов Иван Иванович', email: 'ivanov@client.ru', org: 'ООО "Девелопер Групп"', role: 'admin', roleName: 'Администратор системы', status: 'active' },
    { id: 2, name: 'Петров Петр Сергеевич', email: 'petrov@client.ru', org: 'ООО "Девелопер Групп"', role: 'client_gip', roleName: 'Заказчик (ГИП)', status: 'active' },
    { id: 3, name: 'Смирнова Анна', email: 'smirnova@project.ru', org: 'ООО "ГенПроектСтрой"', role: 'designer', roleName: 'Генпроектировщик', status: 'pending' },
    { id: 4, name: 'Сидоров Алексей', email: 'sidorov@contractor.ru', org: 'ООО "Монолит-Строй"', role: 'contractor', roleName: 'Генподрядчик', status: 'active' },
    { id: 5, name: 'Инвестор Групп', email: 'invest@fund.ru', org: 'АО "ИнвестФонд"', role: 'viewer', roleName: 'Наблюдатель (Только чтение)', status: 'active' }
  ]);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    org: '',
    role: 'client_gip'
  });

  const getRoleBadge = (role) => {
    switch(role) {
      case 'admin': return { bg: '#8e44ad', text: 'white' };
      case 'client_gip': return { bg: '#2980b9', text: 'white' };
      case 'designer': return { bg: '#f39c12', text: 'white' };
      case 'contractor': return { bg: '#d35400', text: 'white' };
      case 'viewer': return { bg: '#bdc3c7', text: '#2c3e50' };
      default: return { bg: '#95a5a6', text: 'white' };
    }
  };

  const handleInputChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    let roleName = '';
    if (formData.role === 'admin') roleName = 'Администратор системы';
    if (formData.role === 'client_gip') roleName = 'Заказчик (ГИП)';
    if (formData.role === 'client_pto') roleName = 'Заказчик (ПТО)';
    if (formData.role === 'designer') roleName = 'Генпроектировщик';
    if (formData.role === 'contractor') roleName = 'Генподрядчик';
    if (formData.role === 'viewer') roleName = 'Наблюдатель (Только чтение)';

    const newUser = {
      id: Date.now(),
      name: formData.name,
      email: formData.email,
      org: formData.org,
      role: formData.role,
      roleName: roleName,
      status: 'pending' // pending until they accept invitation
    };

    setUsers([...users, newUser]);
    setShowForm(false);
    setFormData({ name: '', email: '', org: '', role: 'client_gip' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Управление доступом</h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>Администрирование пользователей проекта, ролей и прав доступа</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '4px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
        >
          <UserPlus size={18} />
          Пригласить участника
        </button>
      </div>

      {showForm && (
        <div style={{ padding: '24px', backgroundColor: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--primary-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', position: 'relative' }}>
          <button 
            onClick={() => setShowForm(false)}
            style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
          
          <h4 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={18} /> Приглашение нового пользователя
          </h4>
          
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>ФИО</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-panel)', color: 'var(--text-color)' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>Email (Логин)</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-panel)', color: 'var(--text-color)' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>Организация</label>
              <input type="text" name="org" value={formData.org} onChange={handleInputChange} required placeholder='Например: ООО "Проект-М"' style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-panel)', color: 'var(--text-color)' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>Роль в системе (Права доступа)</label>
              <select name="role" value={formData.role} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-panel)', color: 'var(--text-color)' }}>
                <option value="admin">Администратор системы (Полный доступ)</option>
                <option value="client_gip">Заказчик - ГИП (Утверждение ИРД, ТЗ, РД)</option>
                <option value="client_pto">Заказчик - ПТО (Проверка КС-2, Актов)</option>
                <option value="designer">Генпроектировщик (Загрузка ПД и РД)</option>
                <option value="contractor">Генподрядчик (Формирование КС-2, Журналов)</option>
                <option value="viewer">Наблюдатель (Только чтение / Дашборды)</option>
              </select>
            </div>
            
            <div style={{ gridColumn: 'span 2', padding: '12px', backgroundColor: 'rgba(16, 163, 127, 0.1)', border: '1px dashed var(--primary-color)', borderRadius: '4px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <strong>Информация:</strong> На указанный Email будет отправлена ссылка для активации аккаунта и установки пароля. До тех пор статус пользователя будет "Ожидает активации".
            </div>

            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '4px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                <Mail size={16} />
                Отправить приглашение
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'var(--bg-color)', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 0 0 1px var(--border-color)' }}>
        <thead>
          <tr style={{ backgroundColor: 'var(--bg-panel)', textAlign: 'left', fontSize: '13px', color: 'var(--text-muted)' }}>
            <th style={{ padding: '16px' }}>Пользователь</th>
            <th style={{ padding: '16px' }}>Организация</th>
            <th style={{ padding: '16px' }}>Роль и Права доступа</th>
            <th style={{ padding: '16px' }}>Статус</th>
            <th style={{ padding: '16px', textAlign: 'right' }}>Управление</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => {
            const badge = getRoleBadge(user.role);
            return (
              <tr key={user.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--bg-panel)', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid var(--border-color)' }}>
                      <Users size={16} color="var(--text-muted)" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{user.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                    <Building size={14} color="var(--text-muted)" /> {user.org}
                  </div>
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{ 
                    backgroundColor: badge.bg, color: badge.text, 
                    padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold',
                    display: 'inline-flex', alignItems: 'center', gap: '4px'
                  }}>
                    <Shield size={12} /> {user.roleName}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>
                  {user.status === 'active' ? (
                    <span style={{ color: '#27ae60', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                      <CheckCircle2 size={14}/> Активен
                    </span>
                  ) : (
                    <span style={{ color: '#f39c12', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                      <Mail size={14}/> Ожидает активации
                    </span>
                  )}
                </td>
                <td style={{ padding: '16px', textAlign: 'right' }}>
                  <button style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-color)' }}>
                    Настройки
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

    </div>
  );
};

export default AdminModule;
