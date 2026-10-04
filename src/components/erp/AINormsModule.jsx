import React, { useState } from 'react';
import { Send, Bot, User } from 'lucide-react';

export default function AINormsModule() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Здравствуйте! Я — **ИИ-Нормоконтроль**. \nЯ знаю все СНиПы, ГОСТы и ГрК РФ.\n\nЗадайте свой вопрос, например:\n- *Какой минимальный класс бетона для фундамента многоэтажного здания?*\n- *В каком радиусе от детской площадки можно размещать парковку?*',
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const mockResponse = (query) => {
    const q = query.toLowerCase();
    if (q.includes('бетон') || q.includes('фундамент')) {
      return "Согласно **СП 22.13330.2016 (Основания зданий и сооружений)** и **СП 63.13330.2018 (Бетонные и железобетонные конструкции)**, для плитных фундаментов многоэтажных жилых зданий минимальный класс бетона по прочности на сжатие должен быть не ниже **B25** (в агрессивных средах — не ниже B30). Марка по водонепроницаемости — не ниже **W6**.\n\n[Ссылка на СП 63.13330.2018](https://docs.cntd.ru/document/554403082)";
    }
    if (q.includes('парковк') || q.includes('площадк') || q.includes('машино')) {
      return "Согласно **СП 42.13330.2016 (Градостроительство. Планировка и застройка)** (Таблица 10.4):\nРасстояние от открытых автостоянок до детских и спортивных площадок зависит от вместимости парковки:\n- От 1 до 10 машин: **15 метров**\n- От 11 до 50 машин: **25 метров**\n- От 51 до 100 машин: **25 метров**\n- Более 100 машин: **35 метров**\n\nОбратите внимание, что для подземных паркингов (без вытяжной вентиляции на уровне площадок) это расстояние не нормируется.";
    }
    
    return "Я проанализировал нормативную базу (Стройконсультант, Техэксперт). Для точного ответа на ваш запрос мне не хватает вводных данных. Пожалуйста, уточните тип объекта (жилое/общественное/промышленное) или конкретизируйте конструктивный элемент.";
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = { id: Date.now(), sender: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    
    // Имитация работы ИИ
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: mockResponse(userMsg.text)
        }
      ]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-main)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
      {/* Шапка чата */}
      <div style={{ padding: '16px 24px', backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ padding: '8px', backgroundColor: 'rgba(16, 163, 127, 0.1)', borderRadius: '8px' }}>
          <Bot size={24} color="var(--accent-green)" />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px' }}>Ассистент по нормативной базе</h3>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>СП, ГОСТ, СНиП, ГрК РФ (База обновлена: 10.2026)</p>
        </div>
      </div>

      {/* История сообщений */}
      <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ display: 'flex', gap: '16px', flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row' }}>
            <div style={{ 
              width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              backgroundColor: msg.sender === 'ai' ? 'var(--accent-green)' : 'var(--accent-blue)' 
            }}>
              {msg.sender === 'ai' ? <Bot size={18} color="white" /> : <User size={18} color="white" />}
            </div>
            
            <div style={{ 
              maxWidth: '75%',
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: msg.sender === 'ai' ? 'var(--bg-card)' : 'var(--accent-blue)',
              color: msg.sender === 'ai' ? 'var(--text-main)' : 'white',
              border: msg.sender === 'ai' ? '1px solid var(--border-color)' : 'none',
              lineHeight: '1.5'
            }}>
              <div dangerouslySetInnerHTML={{ 
                __html: msg.text
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" style="color: #60A5FA; text-decoration: underline;">$1</a>')
                  .replace(/\n/g, '<br/>') 
              }} />
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--accent-green)' }}>
              <Bot size={18} color="white" />
            </div>
            <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              Ищу информацию в нормативной базе...
            </div>
          </div>
        )}
      </div>

      {/* Ввод */}
      <div style={{ padding: '24px', backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '12px' }}>
        <input 
          type="text" 
          placeholder="Например: какая минимальная ширина эвакуационного коридора?" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          style={{ 
            flex: 1, padding: '14px 16px', borderRadius: '8px', 
            backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', 
            color: 'var(--text-main)', fontSize: '15px' 
          }}
        />
        <button 
          onClick={handleSend}
          disabled={isLoading}
          style={{ 
            padding: '14px 24px', backgroundColor: 'var(--accent-green)', color: 'white', 
            border: 'none', borderRadius: '8px', cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
