import React, { useState, useEffect } from 'react';
import { Send, Bot, User, Settings, AlertCircle, Check } from 'lucide-react';

export default function AINormsModule() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Здравствуйте! Я — **ИИ-Нормоконтроль**. \nЯ знаю СНиПы, ГОСТы и ГрК РФ. \n\nЗадайте свой строительный вопрос, и я найду для вас нормативы.',
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Управление API ключом
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isKeySaved, setIsKeySaved] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('groq_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    } else {
      setShowSettings(true); // Показываем настройки, если ключа нет
    }
  }, []);

  const saveKey = (key) => {
    setApiKey(key);
    localStorage.setItem('groq_api_key', key);
    setIsKeySaved(true);
    setTimeout(() => setIsKeySaved(false), 2000);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    if (!apiKey) {
      setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: '⚠️ Для работы ИИ требуется ввести API-ключ Groq в настройках (иконка шестеренки).' }]);
      setShowSettings(true);
      return;
    }

    const userMsg = { id: Date.now(), sender: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Формируем историю для API
      const apiMessages = [
        { 
          role: 'system', 
          content: 'Ты - эксперт по строительным нормам РФ (СП, ГОСТ, СНиП, ГрК РФ). Отвечай профессионально, кратко, ссылайся на конкретные пункты документов. Отвечай только на русском языке. Используй разметку Markdown.'
        }
      ];
      
      messages.forEach(msg => {
        if (msg.id !== 1) { // Пропускаем приветствие
          apiMessages.push({
            role: msg.sender === 'ai' ? 'assistant' : 'user',
            content: msg.text
          });
        }
      });
      apiMessages.push({ role: 'user', content: userMsg.text });

      // 1. Сначала запрашиваем список ВСЕХ актуальных моделей у Groq, чтобы не гадать
      const modelsRes = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      
      if (!modelsRes.ok) {
        throw new Error('Ошибка ключа или нет доступа к списку моделей');
      }
      
      const modelsData = await modelsRes.json();
      const availableModels = modelsData.data.map(m => m.id);
      
      // Ищем самую умную модель из доступных (предпочтение Llama 70b)
      const selectedModel = availableModels.find(m => m.includes('70b')) 
                         || availableModels.find(m => m.includes('llama')) 
                         || availableModels[0];
                         
      if (!selectedModel) {
        throw new Error('Groq не вернул доступных моделей для вашего ключа');
      }

      // 2. Отправляем запрос в найденную актуальную модель
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: apiMessages,
          temperature: 0.2,
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'Ошибка генерации ответа');
      }

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: data.choices[0].message.content
        }
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: `❌ Ошибка запроса: ${error.message}.`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-main)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
      
      {/* Шапка чата */}
      <div style={{ padding: '12px 24px', backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px', backgroundColor: 'rgba(16, 163, 127, 0.1)', borderRadius: '8px' }}>
            <Bot size={20} color="var(--accent-green)" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px' }}>Ассистент по нормативной базе (ИИ)</h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Генерация через Groq (Llama-3 70B)</p>
          </div>
        </div>
        
        <button 
          onClick={() => setShowSettings(!showSettings)}
          style={{ background: 'none', border: 'none', color: showSettings ? 'var(--accent-blue)' : 'var(--text-muted)', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Settings size={18} />
          <span style={{ fontSize: '13px' }}>Настройки API</span>
        </button>
      </div>

      {/* Панель настроек (выдвигается) */}
      {showSettings && (
        <div style={{ padding: '16px 24px', backgroundColor: 'rgba(59, 130, 246, 0.05)', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Groq API Key (сохраняется в браузере)</label>
            <input 
              type="password" 
              value={apiKey}
              onChange={(e) => saveKey(e.target.value)}
              placeholder="gsk_..."
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}
            />
          </div>
          <div style={{ width: '120px', display: 'flex', alignItems: 'flex-end', paddingBottom: '4px' }}>
            {isKeySaved ? (
              <span style={{ color: 'var(--accent-green)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={14} /> Сохранено
              </span>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}>Получить ключ</a>
              </span>
            )}
          </div>
        </div>
      )}

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
              maxWidth: '85%',
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: msg.sender === 'ai' ? 'var(--bg-card)' : 'var(--accent-blue)',
              color: msg.sender === 'ai' ? 'var(--text-main)' : 'white',
              border: msg.sender === 'ai' ? '1px solid var(--border-color)' : 'none',
              lineHeight: '1.5',
              fontSize: '14px'
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
              <span className="typing-indicator">Анализирую нормативы...</span>
            </div>
          </div>
        )}
      </div>

      {/* Ввод */}
      <div style={{ padding: '16px 24px', backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '12px' }}>
        <input 
          type="text" 
          placeholder="Какой норматив вас интересует?" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          style={{ 
            flex: 1, padding: '12px 16px', borderRadius: '8px', 
            backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', 
            color: 'var(--text-main)', fontSize: '14px' 
          }}
        />
        <button 
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          style={{ 
            padding: '12px 20px', backgroundColor: 'var(--accent-green)', color: 'white', 
            border: 'none', borderRadius: '8px', cursor: (isLoading || !input.trim()) ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (isLoading || !input.trim()) ? 0.7 : 1
          }}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
