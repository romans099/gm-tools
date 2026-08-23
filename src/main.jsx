import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Home, FileText, BarChart3, Settings, Plus, Pencil, Trash2, Clock3,
  ClipboardList, Search, ChevronRight, Sparkles, X, Check, SlidersHorizontal,
  Command, Send, Copy, History, Mic, Eye, EyeOff
} from 'lucide-react';
import './styles.css';

const initialTemplates = [
  { id: 1, name: 'пр', command: '/pm {id}', text: 'Приветствую, слежу.', category: 'Администрация', uses: 0 },
  { id: 2, name: 'инв', command: '/inv {id}', text: 'Инвентарь.', category: 'Администрация', uses: 0 },
  { id: 3, name: 'кик', command: '/kick {id}', text: 'Причина: нарушение правил.', category: 'Модерация', uses: 0 },
  { id: 4, name: 'мут', command: '/mute {id}', text: 'Причина: флуд. Срок: 10 минут.', category: 'Модерация', uses: 0 },
  { id: 5, name: 'бан', command: '/ban {id}', text: 'Причина: читы. Срок: навсегда.', category: 'Модерация', uses: 0 }
];

function App() {
  const [tab, setTab] = useState('home');
  const [enabled, setEnabled] = useState(false);
  const [startedAt, setStartedAt] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [templates, setTemplates] = useState(() => {
    try { return JSON.parse(localStorage.getItem('gm_templates')) || initialTemplates; } catch { return initialTemplates; }
  });
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');
  const [overlayMode, setOverlayMode] = useState(false);
  const [overlayInput, setOverlayInput] = useState('');
  const [lastPlayerId, setLastPlayerId] = useState(null);
  const [commandHistory, setCommandHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('command_history')) || []; } catch { return []; }
  });
  const [showHistory, setShowHistory] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => localStorage.setItem('gm_templates', JSON.stringify(templates)), [templates]);
  useEffect(() => localStorage.setItem('command_history', JSON.stringify(commandHistory)), [commandHistory]);

  useEffect(() => {
    if (!enabled) { setStartedAt(null); return; }
    const start = startedAt || Date.now();
    if (!startedAt) setStartedAt(start);
    const t = setInterval(() => setSeconds(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(t);
  }, [enabled, startedAt]);

  // Обработка команд с ID
  const processCommand = (input) => {
    if (!input || !input.trim()) {
      showNotification('⚠️ Введите команду', 'error');
      return null;
    }

    const trimmed = input.trim();
    let cmdName = '';
    let playerId = null;

    // Поддержка разных форматов: "пр 1", "пр1", "пр id1"
    const patterns = [
      /^(\w+)\s+(\d+)$/,     // пр 1
      /^(\w+)(\d+)$/,        // пр1
      /^(\w+)\s+id(\d+)$/,   // пр id1
      /^(\w+)\s+игрок(\d+)$/ // пр игрок1
    ];

    let matched = false;
    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match) {
        cmdName = match[1].toLowerCase();
        playerId = match[2];
        matched = true;
        break;
      }
    }

    // Если не подошло — пробуем просто разбить по пробелу
    if (!matched) {
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 2) {
        cmdName = parts[0].toLowerCase();
        const possibleId = parts[1].replace(/[^0-9]/g, '');
        if (possibleId) playerId = possibleId;
      } else {
        cmdName = parts[0].toLowerCase();
        // Если только команда — берём последний ID
        if (lastPlayerId) {
          playerId = lastPlayerId;
          showNotification(`ℹ️ Использую последний ID: ${playerId}`, 'info');
        } else {
          showNotification('⚠️ Укажите ID игрока (например: пр 1)', 'error');
          return null;
        }
      }
    }

    // Проверяем, что ID — число
    if (playerId && !/^\d+$/.test(playerId)) {
      showNotification('⚠️ ID должен быть числом!', 'error');
      return null;
    }

    // Ищем шаблон
    const template = templates.find(t => t.name.toLowerCase() === cmdName);
    if (!template) {
      showNotification(`❌ Команда "${cmdName}" не найдена`, 'error');
      return null;
    }

    if (!playerId) {
      showNotification('⚠️ Укажите ID игрока', 'error');
      return null;
    }

    // Подставляем ID
    const commandText = template.command.replace(/\{id\}/g, playerId);
    const messageText = template.text.replace(/\{id\}/g, playerId);
    const fullMessage = `${commandText} ${messageText}`;

    // Сохраняем последний ID
    setLastPlayerId(playerId);

    // Увеличиваем счётчик использования
    setTemplates(ts => ts.map(t =>
      t.id === template.id ? { ...t, uses: t.uses + 1 } : t
    ));

    // Сохраняем в историю
    const historyEntry = {
      id: Date.now(),
      input: trimmed,
      result: fullMessage,
      template: template.name,
      playerId: playerId,
      timestamp: new Date().toISOString()
    };
    setCommandHistory(prev => [historyEntry, ...prev].slice(0, 50));

    // Копируем в буфер обмена
    navigator.clipboard.writeText(fullMessage).then(() => {
      showNotification(`✅ Готово: ${fullMessage}`, 'success');
    }).catch(() => {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = fullMessage;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showNotification(`✅ Готово: ${fullMessage}`, 'success');
    });

    return { fullMessage, commandText, messageText, playerId };
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const filtered = useMemo(() => templates.filter(x =>
    `${x.name} ${x.command} ${x.text}`.toLowerCase().includes(query.toLowerCase())
  ), [templates, query]);

  const saveTemplate = (data) => {
    if (editing) {
      setTemplates(ts => ts.map(t => t.id === editing.id ? { ...editing, ...data } : t));
    } else {
      setTemplates(ts => [{ ...data, id: Date.now(), uses: 0 }, ...ts]);
    }
    setShowModal(false);
    setEditing(null);
    showNotification('✅ Шаблон сохранён!', 'success');
  };

  const deleteTemplate = (id) => {
    if (confirm('Удалить шаблон?')) {
      setTemplates(ts => ts.filter(t => t.id !== id));
      showNotification('🗑️ Шаблон удалён', 'info');
    }
  };

  const useTemplate = (id) => {
    const template = templates.find(t => t.id === id);
    if (template) {
      setTemplates(ts => ts.map(t => t.id === id ? { ...t, uses: t.uses + 1 } : t));
      // Если есть последний ID — подставляем его
      if (lastPlayerId) {
        const result = processCommand(`${template.name} ${lastPlayerId}`);
        if (result) {
          showNotification(`✅ Использован шаблон: ${result.fullMessage}`, 'success');
        }
      } else {
        showNotification(`ℹ️ Шаблон "${template.name}" готов. Укажите ID.`, 'info');
        setOverlayInput(`${template.name} `);
        if (!overlayMode) setOverlayMode(true);
      }
    }
  };

  // Горячая клавиша Ctrl+Shift+G для вызова оверлея
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'G') {
        e.preventDefault();
        setOverlayMode(prev => !prev);
        if (!overlayMode) {
          setTimeout(() => {
            const input = document.getElementById('overlay-input');
            if (input) input.focus();
          }, 100);
        }
      }
      // Escape — закрыть оверлей
      if (e.key === 'Escape' && overlayMode) {
        setOverlayMode(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [overlayMode]);

  const handleOverlaySubmit = (e) => {
    e.preventDefault();
    if (overlayInput.trim()) {
      processCommand(overlayInput);
      setOverlayInput('');
      // Не закрываем оверлей, чтобы можно было вводить дальше
    }
  };

  return (
    <div className="app-shell">
      <div className="phone">
        <header className="topbar">
          <div>
            <div className="eyebrow">GM TOOLS</div>
            <div className="brand">Админ-помощник</div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button className="icon-btn" onClick={() => setOverlayMode(!overlayMode)} title="Оверлей (Ctrl+Shift+G)">
              {overlayMode ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
            <button className="icon-btn" onClick={() => setShowHistory(!showHistory)} title="История">
              <History size={19} />
            </button>
          </div>
        </header>

        <main className="content">
          {tab === 'home' && (
            <HomeScreen
              enabled={enabled}
              setEnabled={setEnabled}
              seconds={seconds}
              templates={filtered}
              query={query}
              setQuery={setQuery}
              onAdd={() => { setEditing(null); setShowModal(true); }}
              onEdit={(t) => { setEditing(t); setShowModal(true); }}
              onDelete={deleteTemplate}
              onUse={useTemplate}
              lastPlayerId={lastPlayerId}
              showHistory={showHistory}
              commandHistory={commandHistory}
              processCommand={processCommand}
            />
          )}
          {tab === 'templates' && (
            <TemplatesScreen
              templates={filtered}
              query={query}
              setQuery={setQuery}
              onAdd={() => { setEditing(null); setShowModal(true); }}
              onEdit={(t) => { setEditing(t); setShowModal(true); }}
              onDelete={deleteTemplate}
              onUse={useTemplate}
            />
          )}
          {tab === 'stats' && <StatsScreen templates={templates} seconds={seconds} />}
          {tab === 'settings' && <SettingsScreen enabled={enabled} setEnabled={setEnabled} />}
        </main>

        <nav className="bottom-nav">
          {[
            ['home', 'Главная', Home],
            ['templates', 'Шаблоны', FileText],
            ['stats', 'Статистика', BarChart3],
            ['settings', 'Настройки', Settings]
          ].map(([id, label, Icon]) => (
            <button key={id} className={tab === id ? 'nav-item active' : 'nav-item'} onClick={() => setTab(id)}>
              <Icon size={19} /><span>{label}</span>
            </button>
          ))}
        </nav>

        {showModal && (
          <TemplateModal
            editing={editing}
            onClose={() => { setShowModal(false); setEditing(null); }}
            onSave={saveTemplate}
          />
        )}

        {notification && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        )}
      </div>

      {/* Оверлей поверх всего */}
      {overlayMode && (
        <div className="overlay-mode" onClick={(e) => {
          if (e.target === e.currentTarget) setOverlayMode(false);
        }}>
          <div className="overlay-header">
            <span>⚡ GM Tools</span>
            <button onClick={() => setOverlayMode(false)}>✕</button>
          </div>
          <form onSubmit={handleOverlaySubmit}>
            <input
              id="overlay-input"
              type="text"
              value={overlayInput}
              onChange={(e) => setOverlayInput(e.target.value)}
              placeholder={`Введите команду (например: пр ${lastPlayerId || '1'})`}
              autoFocus
              className="overlay-input-field"
            />
            <div className="overlay-actions">
              <button type="submit"><Send size={18} /> Отправить</button>
              {lastPlayerId && (
                <span className="overlay-last-id">Последний ID: {lastPlayerId}</span>
              )}
            </div>
          </form>
          <div className="overlay-hint">
            <small>Ctrl+Shift+G — открыть/закрыть • Escape — закрыть</small>
          </div>
        </div>
      )}
    </div>
  );
}

// === КОМПОНЕНТЫ ===

function HomeScreen({ enabled, setEnabled, seconds, templates, query, setQuery, onAdd, onEdit, onDelete, onUse, lastPlayerId, showHistory, commandHistory, processCommand }) {
  const [quickInput, setQuickInput] = useState('');

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    if (quickInput.trim()) {
      processCommand(quickInput);
      setQuickInput('');
    }
  };

  return (
    <section>
      <div className="hero-card">
        <div className="small-muted">Привет,</div>
        <div className="profile">Администратор</div>
        <div className="tool-row">
          <div>
            <div className="tool-title">Тулс</div>
            <div className={enabled ? 'status on' : 'status'}>{enabled ? 'Включено' : 'Выключено'}</div>
          </div>
          <button className={enabled ? 'switch on' : 'switch'} onClick={() => setEnabled(v => !v)}><span /></button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><Clock3 size={20} /><b>{formatTime(seconds)}</b><small>Время сегодня</small></div>
        <div className="stat-card green"><ClipboardList size={20} /><b>{templates.reduce((a, b) => a + b.uses, 0)}</b><small>Всего использований</small></div>
      </div>

      {/* Быстрый ввод команд */}
      <div className="quick-input">
        <form onSubmit={handleQuickSubmit}>
          <input
            type="text"
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            placeholder={`Быстрый ввод (например: пр ${lastPlayerId || '1'})`}
          />
          <button type="submit"><Send size={16} /></button>
        </form>
        {lastPlayerId && (
          <div className="quick-hint">Последний ID: {lastPlayerId}</div>
        )}
      </div>

      <div className="section-head">
        <h2>Шаблоны</h2>
        <button className="add-btn" onClick={onAdd}><Plus size={15} /> ДОБАВИТЬ</button>
      </div>
      <SearchBox value={query} onChange={setQuery} />
      <TemplateList templates={templates} onEdit={onEdit} onDelete={onDelete} onUse={onUse} />

      {showHistory && commandHistory.length > 0 && (
        <div className="history-panel">
          <div className="panel-title">📜 История команд</div>
          {commandHistory.slice(0, 10).map((item, index) => (
            <div key={index} className="history-item" onClick={() => {
              navigator.clipboard.writeText(item.result);
            }}>
              <div className="history-input">{item.input}</div>
              <div className="history-result">{item.result}</div>
              <div className="history-time">{new Date(item.timestamp).toLocaleTimeString()}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function TemplatesScreen({ templates, query, setQuery, onAdd, onEdit, onDelete, onUse }) {
  return (
    <section>
      <div className="page-title">
        <div><div className="eyebrow">GM TOOLS</div><h1>Шаблоны</h1></div>
        <button className="round-add" onClick={onAdd}><Plus /></button>
      </div>
      <SearchBox value={query} onChange={setQuery} />
      <TemplateList templates={templates} onEdit={onEdit} onDelete={onDelete} onUse={onUse} />
    </section>
  );
}

function TemplateList({ templates, onEdit, onDelete, onUse }) {
  if (!templates.length) return <div className="empty">Ничего не найдено</div>;
  return (
    <div className="template-list">
      {templates.map(t => (
        <article className="template-card" key={t.id}>
          <div className="template-top">
            <div>
              <div className="template-name">{t.name}</div>
              <div className="template-command">{t.command} {t.text}</div>
            </div>
            <div className="actions">
              <button className="mini purple" onClick={() => onEdit(t)}><Pencil size={15} /></button>
              <button className="mini red" onClick={() => onDelete(t.id)}><Trash2 size={15} /></button>
            </div>
          </div>
          <div className="template-bottom">
            <span className="pill">{t.category || 'Без категории'} • Использований: {t.uses || 0}</span>
            <button className="use-btn" onClick={() => onUse(t.id)}><Check size={13} /> ИСПОЛЬЗОВАТЬ</button>
          </div>
        </article>
      ))}
    </div>
  );
}

function StatsScreen({ templates, seconds }) {
  const total = templates.reduce((a, b) => a + b.uses, 0);
  return (
    <section>
      <div className="page-title"><div><div className="eyebrow">GM TOOLS</div><h1>Статистика</h1></div><BarChart3 /></div>
      <div className="stats-grid big">
        <div className="stat-card"><Clock3 /><b>{formatTime(seconds)}</b><small>Сессия</small></div>
        <div className="stat-card green"><ClipboardList /><b>{total}</b><small>Использований</small></div>
      </div>
      <div className="panel">
        <div className="panel-title">🏆 Популярные шаблоны</div>
        {templates.slice().sort((a, b) => b.uses - a.uses).map(t => (
          <div className="rank" key={t.id}><span>{t.name}</span><b>{t.uses}</b></div>
        ))}
        {templates.length === 0 && <div className="empty">Нет данных</div>}
      </div>
    </section>
  );
}

function SettingsScreen({ enabled, setEnabled }) {
  const [sound, setSound] = useState(true);
  const [autoFocus, setAutoFocus] = useState(true);
  const [keepHistory, setKeepHistory] = useState(true);

  return (
    <section>
      <div className="page-title"><div><div className="eyebrow">GM TOOLS</div><h1>Настройки</h1></div><SlidersHorizontal /></div>
      <div className="panel settings">
        <Setting title="Тулс" desc="Включить помощник" value={enabled} setValue={setEnabled} />
        <Setting title="Звуки" desc="Звуковой сигнал при действии" value={sound} setValue={setSound} />
        <Setting title="Автофокус" desc="Автоматически открывать поле ввода" value={autoFocus} setValue={setAutoFocus} />
        <Setting title="История" desc="Сохранять историю команд" value={keepHistory} setValue={setKeepHistory} />
      </div>
      <div className="panel">
        <div className="panel-title">Сведения</div>
        <div className="info-row"><span>Версия</span><b>2.0.0</b></div>
        <div className="info-row"><span>Режим</span><b>Оверлей + Шаблоны</b></div>
        <div className="info-row"><span>Горячая клавиша</span><b>Ctrl+Shift+G</b></div>
      </div>
      <div className="panel" style={{ borderColor: '#3a1d2b' }}>
        <div className="panel-title" style={{ color: '#ff6275' }}>Очистка данных</div>
        <button className="danger-btn" onClick={() => {
          if (confirm('Очистить все данные?')) {
            localStorage.clear();
            location.reload();
          }
        }}>🗑️ Очистить все данные</button>
      </div>
    </section>
  );
}

function Setting({ title, desc, value, setValue }) {
  return (
    <div className="setting-row">
      <div><b>{title}</b><small>{desc}</small></div>
      <button className={value ? 'switch on' : 'switch'} onClick={() => setValue(v => !v)}><span /></button>
    </div>
  );
}

function SearchBox({ value, onChange }) {
  return (
    <div className="search">
      <Search size={16} />
      <input value={value} onChange={e => onChange(e.target.value)} placeholder="Поиск шаблона..." />
      {value && <button onClick={() => onChange('')}><X size={15} /></button>}
    </div>
  );
}

function TemplateModal({ editing, onClose, onSave }) {
  const [name, setName] = useState(editing?.name || '');
  const [command, setCommand] = useState(editing?.command || '/pm {id}');
  const [text, setText] = useState(editing?.text || '');
  const [category, setCategory] = useState(editing?.category || 'Другое');

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-head">
          <div><div className="eyebrow">ШАБЛОН</div><h2>{editing ? 'Редактировать' : 'Добавить шаблон'}</h2></div>
          <button onClick={onClose}><X /></button>
        </div>
        <label>
          Название (команда)
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Например: пр" />
        </label>
        <label>
          Команда <span>[используйте {id} для ID игрока]</span>
          <input value={command} onChange={e => setCommand(e.target.value)} placeholder="/pm {id}" />
        </label>
        <label>
          Текст сообщения <span>[используйте {id} для ID игрока]</span>
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Приветствую, слежу." rows="3" />
        </label>
        <label>
          Категория
          <select value={category} onChange={e => setCategory(e.target.value)}>
            <option>Администрация</option>
            <option>Модерация</option>
            <option>Информация</option>
            <option>Другое</option>
          </select>
        </label>
        <div className="modal-actions">
          <button className="ghost" onClick={onClose}>ОТМЕНА</button>
          <button className="primary" disabled={!name.trim() || !command.trim()} onClick={() => onSave({ name, command, text, category })}>
            СОХРАНИТЬ
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds) {
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const m = String(Math.floor(seconds % 3600 / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

createRoot(document.getElementById('root')).render(<App />);
