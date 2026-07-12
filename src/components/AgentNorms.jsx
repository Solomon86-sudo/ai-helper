import React, { useState, useEffect } from 'react';
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

  // Пинг для пробуждения бэкенда (т.к. Render засыпает через 15 минут)
  useEffect(() => {
    fetch('/api/chat', { method: 'OPTIONS' }).catch(() => {});
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = { id: Date.now(), sender: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });
      if (!response.ok) {
        throw new Error('API Error');
      }
      
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
          text: '⏳ Ошибка соединения. Если вы не пользовались сервисом более 15 минут, бесплатный сервер ушёл в "спящий режим". Он уже просыпается! **Подождите 30-40 секунд и отправьте ваш запрос ещё раз.**',
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
            <div dangerouslySetInnerHTML={{ 
              __html: msg.text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #60A5FA; text-decoration: underline;">$1</a>')
                .replace(/\n/g, '<br/>') 
            }} />
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
