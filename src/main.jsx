import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Home, FileText, BarChart3, Settings, Plus, Pencil, Trash2, Clock3,
  ClipboardList, Search, X, Check, SlidersHorizontal,
  Send, History, Eye, EyeOff, Keyboard, MapPin, Users, Shield,
  Zap, AlertCircle, CheckCircle, ArrowLeft, Grid, List, Filter
} from 'lucide-react';
import './styles.css';

// --- ШАБЛОНЫ КЛАВИАТУРЫ ---
const KEYBOARD_TEMPLATES = {
  quick: [
    { id: 'mp', label: 'МП', command: '/mp {id}', text: 'Приветствую, сейчас попробую вам помочь.' },
    { id: 'dok', label: 'ДОК', command: '/dok {id}', text: 'Приветствую, документы.' },
    { id: 'mpz', label: 'МПЗ', command: '/mpz {id}', text: 'Приветствую, место пребывания.' },
    { id: 'ev', label: 'ЭВ', command: '/ev {id}', text: 'Приветствую, эвакуация.' },
    { id: 'ut', label: 'УТ', command: '/ut {id}', text: 'Приветствую, уточните ваш вопрос.' },
    { id: 'offtop', label: 'ОФФТОП', command: '/offtop {id}', text: 'Приветствую, не оффтопьте.' },
    { id: 'sev', label: 'СЭВ', command: '/sev {id}', text: 'Приветствую, слежу.' },
    { id: 'gr', label: 'ГР', command: '/gr {id}', text: 'Приветствую, грубость.' },
    { id: 'nak', label: 'НАК', command: '/nak {id}', text: 'Приветствую, наказание.' },
    { id: 'info', label: 'ИНФА', command: '/info {id}', text: 'Приветствую, информация.' },
    { id: 'usl', label: 'УСЛ', command: '/usl {id}', text: 'Приветствую, не предоставляем данную услугу.' },
    { id: 'ntp', label: 'НТП', command: '/ntp {id}', text: 'Приветствую, не телепортируем, воспользуйтесь такси.' },
    { id: 'nesogl', label: 'НЕСОГЛ', command: '/nesogl {id}', text: 'Приветствую, несогласие.' },
    { id: 'rp', label: 'РП', command: '/rp {id}', text: 'Приветствую, ролевая игра.' },
    { id: 'teh', label: 'ТЕХ', command: '/teh {id}', text: 'Приветствую, техническая проблема.' },
    { id: 'da', label: 'ДА', command: '/da {id}', text: 'Приветствую, да.' },
    { id: 'net', label: 'НЕТ', command: '/net {id}', text: 'Приветствую, нет.' },
    { id: 'ne_v_seti', label: 'НЕ В СЕТИ', command: '/nevseti {id}', text: 'Приветствую, игрок не в сети.' }
  ],
  admin: [
    { id: 'otvet', label: 'Ответить на репорт', command: '/reply {id}', text: 'Приветствую, ответ на репорт.' },
    { id: 'nakazat', label: 'Наказать игрока', command: '/punish {id}', text: 'Приветствую, наказание выписано.' },
    { id: 'sledit', label: 'Следить', command: '/watch {id}', text: 'Приветствую, слежу за игроком.' },
    { id: 'komanda', label: 'Быстрая команда', command: '/cmd {id}', text: 'Приветствую, команда выполнена.' },
    { id: 'spawn', label: 'Точка спавна', command: '/spawn {id}', text: 'Приветствую, точка спавна установлена.' },
    { id: 'chitat', label: 'Читать', command: '/read {id}', text: 'Приветствую, читаю.' },
    { id: 'tp_sobe', label: 'ТП к себе', command: '/tp {id}', text: 'Приветствую, телепортация.' },
    { id: 'stat', label: 'Статистика', command: '/stats {id}', text: 'Приветствую, статистика игрока.' },
    { id: 'adm_form', label: 'ADM форма', command: '/admform {id}', text: 'Приветствую, заполните форму.' }
  ],
  teleport: [
    { id: 'public', label: 'Общественные места', command: '/tp_public {id}', text: 'Приветствую, телепорт в общественные места.' },
    { id: 'vokzal', label: 'Вокзалы', command: '/tp_vokzal {id}', text: 'Приветствую, телепорт на вокзал.' },
    { id: 'autosalon', label: 'Автосалоны', command: '/tp_auto {id}', text: 'Приветствую, телепорт в автосалон.' },
    { id: 'gos', label: 'Гос. организации', command: '/tp_gos {id}', text: 'Приветствую, телепорт в гос. организацию.' },
    { id: 'krim', label: 'Криминальные организации', command: '/tp_krim {id}', text: 'Приветствую, телепорт в криминальную организацию.' },
    { id: 'work', label: 'Работы', command: '/tp_work {id}', text: 'Приветствую, телепорт на работу.' },
    { id: 'razvlecheniya', label: 'Развлечения', command: '/tp_razv {id}', text: 'Приветствую, телепорт в развлекательное место.' },
    { id: 'transport', label: 'Транспортные узлы', command: '/tp_transport {id}', text: 'Приветствую, телепорт в транспортный узел.' }
  ],
  famwar: [
    { id: 'famwar_level', label: 'Уровень', command: '/fw_level {id}', text: 'Ваш уровень: {id}' },
    { id: 'famwar_stats', label: 'Статистика', command: '/fw_stats {id}', text: 'Статистика FamWar' }
  ]
};

// --- ОСНОВНОЙ КОМПОНЕНТ ---
function App() {
  const [tab, setTab] = useState('home');
  const [enabled, setEnabled] = useState(false);
  const [startedAt, setStartedAt] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [templates, setTemplates] = useState(() => {
    try { return JSON.parse(localStorage.getItem('gm_templates')) || []; } catch { return []; }
  });
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');
  const [overlayMode, setOverlayMode] = useState(false);
  const [overlayInput, setOverlayInput] = useState('');
  const [lastPlayerId, setLastPlayerId] = useState(() => {
    try { return localStorage.getItem('last_player_id') || null; } catch { return null; }
  });
  const [commandHistory, setCommandHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('command_history')) || []; } catch { return []; }
  });
  const [showHistory, setShowHistory] = useState(false);
  const [notification, setNotification] = useState(null);
  const [hasOverlayPermission, setHasOverlayPermission] = useState(false);
  const [isMinimalOverlay, setIsMinimalOverlay] = useState(false);
  const [keyboardMode, setKeyboardMode] = useState('quick'); // quick, admin, teleport, famwar
  const [showKeyboard, setShowKeyboard] = useState(false);

  // ... (все хуки из предыдущей версии)

  // Добавление шаблона из клавиатуры
  const addTemplateFromKeyboard = (template) => {
    const newTemplate = {
      id: Date.now(),
      name: template.id,
      command: template.command,
      text: template.text,
      category: 'Клавиатура',
      uses: 0
    };
    setTemplates(prev => [newTemplate, ...prev]);
    showNotification(`✅ Добавлен шаблон: ${template.label}`, 'success');
  };

  // Использование шаблона из клавиатуры
  const useKeyboardTemplate = (template) => {
    if (lastPlayerId) {
      const result = processCommand(`${template.id} ${lastPlayerId}`);
      if (result) {
        showNotification(`✅ Использован: ${template.label}`, 'success');
      }
    } else {
      setOverlayInput(`${template.id} `);
      if (!overlayMode && hasOverlayPermission) setOverlayMode(true);
      showNotification(`ℹ️ Введите ID игрока для ${template.label}`, 'info');
    }
  };

  // ... (остальные функции из предыдущей версии)

  return (
    <div className="app-shell">
      <div className="phone">
        <header className="topbar">
          <div>
            <div className="eyebrow">GM TOOLS</div>
            <div className="brand">Админ-помощник</div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button 
              className={`icon-btn ${showKeyboard ? 'active' : ''}`} 
              onClick={() => setShowKeyboard(!showKeyboard)}
              title="Клавиатура"
            >
              <Keyboard size={19} />
            </button>
            <button 
              className={`icon-btn ${overlayMode ? 'active' : ''}`} 
              onClick={() => {
                if (hasOverlayPermission) {
                  setOverlayMode(!overlayMode);
                } else {
                  requestOverlayPermission();
                }
              }} 
              title="Оверлей"
            >
              {overlayMode ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
            <button className="icon-btn" onClick={() => setShowHistory(!showHistory)} title="История">
              <History size={19} />
            </button>
          </div>
        </header>

        <main className="content">
          {/* ... (пермишены из предыдущей версии) */}

          {showKeyboard ? (
            <KeyboardScreen 
              keyboardMode={keyboardMode}
              setKeyboardMode={setKeyboardMode}
              templates={KEYBOARD_TEMPLATES}
              onUse={useKeyboardTemplate}
              onAdd={addTemplateFromKeyboard}
              lastPlayerId={lastPlayerId}
            />
          ) : (
            <>
              {tab === 'home' && (
                <HomeScreen
                  enabled={enabled}
                  setEnabled={setEnabled}
                  seconds={seconds}
                  templates={templates}
                  query={query}
                  setQuery={setQuery}
                  onAdd={() => { setEditing(null); setShowModal(true); }}
                  onEdit={(t) => { setEditing(t); setShowModal(true); }}
                  onDelete={(id) => {
                    if (confirm('Удалить шаблон?')) {
                      setTemplates(ts => ts.filter(t => t.id !== id));
                      showNotification('🗑️ Шаблон удалён', 'info');
                    }
                  }}
                  onUse={(id) => {
                    const template = templates.find(t => t.id === id);
                    if (template) {
                      if (lastPlayerId) {
                        processCommand(`${template.name} ${lastPlayerId}`);
                      } else {
                        setOverlayInput(`${template.name} `);
                        if (!overlayMode && hasOverlayPermission) setOverlayMode(true);
                        showNotification(`ℹ️ Введите ID для ${template.name}`, 'info');
                      }
                    }
                  }}
                  lastPlayerId={lastPlayerId}
                  showHistory={showHistory}
                  commandHistory={commandHistory}
                  processCommand={processCommand}
                />
              )}
              {tab === 'templates' && (
                <TemplatesScreen
                  templates={templates}
                  query={query}
                  setQuery={setQuery}
                  onAdd={() => { setEditing(null); setShowModal(true); }}
                  onEdit={(t) => { setEditing(t); setShowModal(true); }}
                  onDelete={(id) => {
                    if (confirm('Удалить шаблон?')) {
                      setTemplates(ts => ts.filter(t => t.id !== id));
                      showNotification('🗑️ Шаблон удалён', 'info');
                    }
                  }}
                  onUse={(id) => {
                    const template = templates.find(t => t.id === id);
                    if (template) {
                      if (lastPlayerId) {
                        processCommand(`${template.name} ${lastPlayerId}`);
                      } else {
                        setOverlayInput(`${template.name} `);
                        if (!overlayMode && hasOverlayPermission) setOverlayMode(true);
                        showNotification(`ℹ️ Введите ID для ${template.name}`, 'info');
                      }
                    }
                  }}
                />
              )}
              {tab === 'stats' && <StatsScreen templates={templates} seconds={seconds} />}
              {tab === 'settings' && (
                <SettingsScreen 
                  enabled={enabled} 
                  setEnabled={setEnabled}
                  hasOverlayPermission={hasOverlayPermission}
                  requestOverlayPermission={requestOverlayPermission}
                  isMinimalOverlay={isMinimalOverlay}
                  setIsMinimalOverlay={setIsMinimalOverlay}
                />
              )}
            </>
          )}
        </main>

        {!showKeyboard && (
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
        )}

        {/* ... (модалки и оверлей из предыдущей версии) */}
      </div>
    </div>
  );
}

// === КОМПОНЕНТ КЛАВИАТУРЫ ===
function KeyboardScreen({ keyboardMode, setKeyboardMode, templates, onUse, onAdd, lastPlayerId }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFavorites, setShowFavorites] = useState(false);

  const currentTemplates = templates[keyboardMode] || [];
  const filteredTemplates = currentTemplates.filter(t => 
    t.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const modes = [
    { id: 'quick', label: '⚡ Быстрый' },
    { id: 'admin', label: '👑 Админ' },
    { id: 'teleport', label: '📍 Телепорт' },
    { id: 'famwar', label: '⚔️ FamWar' }
  ];

  return (
    <section className="keyboard-section">
      <div className="keyboard-header">
        <h1>⌨️ GM Tools Клавиатура</h1>
        <button className="close-keyboard" onClick={() => setShowKeyboard(false)}>✕</button>
      </div>

      {/* Переключатель режимов */}
      <div className="keyboard-modes">
        {modes.map(m => (
          <button 
            key={m.id}
            className={`mode-btn ${keyboardMode === m.id ? 'active' : ''}`}
            onClick={() => setKeyboardMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Поиск */}
      <div className="keyboard-search">
        <Search size={16} />
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Поиск по клавиатуре..."
        />
        {searchTerm && <button onClick={() => setSearchTerm('')}><X size={15} /></button>}
      </div>

      {/* Сетка кнопок */}
      <div className="keyboard-grid">
        {filteredTemplates.map(t => (
          <div key={t.id} className="keyboard-item">
            <button 
              className="keyboard-btn"
              onClick={() => onUse(t)}
              title={t.text}
            >
              <span className="key-label">{t.label}</span>
              <span className="key-command">{t.command}</span>
            </button>
            <button 
              className="key-add-btn"
              onClick={() => onAdd(t)}
              title="Добавить в шаблоны"
            >
              <Plus size={14} />
            </button>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="empty">Нет шаблонов в этой категории</div>
      )}

      {lastPlayerId && (
        <div className="keyboard-last-id">
          Последний ID: <strong>{lastPlayerId}</strong>
        </div>
      )}
    </section>
  );
}

// ... (остальные компоненты из предыдущей версии)

createRoot(document.getElementById('root')).render(<App />);
