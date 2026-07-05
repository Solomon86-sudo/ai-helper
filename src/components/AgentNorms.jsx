import React, { useState } from 'react';
import { Send, Bot, User } from 'lucide-react';

export default function AgentNorms() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Здравствуйте. Я — ИИ-эксперт в сфере градостроительства (ПЗЗ, ГрК РФ, СНиП) Санкт-Петербурга и Ленинградской области.\nУкажите ваш вопрос, функциональное назначение объекта или территориальную зону.',
    }
  ]);
  const [input, setInput] = useState('');

  const API_BASE = import.meta.env.VITE_API_URL || '';

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = { id: Date.now(), sender: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    
    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });
      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: data.reply,
          source: data.source
        }
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: 'Ошибка соединения с API.',
        }
      ]);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-history">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-bubble ${msg.sender}`}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '4px', alignItems: 'center' }}>
              {msg.sender === 'ai' ? <Bot size={16} /> : <User size={16} />}
              <span style={{ fontWeight: 600, fontSize: '0.875rem', opacity: 0.8 }}>
                {msg.sender === 'ai' ? 'ИИ-Нормоконтроль' : 'Вы'}
              </span>
            </div>
            <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
            {msg.source && <div className="source-tag">{msg.source}</div>}
          </div>
        ))}
      </div>
      <div className="chat-input-area">
        <input 
          type="text" 
          placeholder="Введите ваш вопрос или номер документа..." 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button className="btn-primary" onClick={handleSend}>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
