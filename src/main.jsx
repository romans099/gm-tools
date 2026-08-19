import React, {useEffect, useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {
  Home, FileText, BarChart3, Settings, Plus, Pencil, Trash2, Clock3,
  ClipboardList, Search, ChevronRight, Sparkles, X, Check, SlidersHorizontal
} from 'lucide-react';
import './styles.css';

const initialTemplates = [
  {id: 1, name:'собес', command:'/recruit', text:'Приветствую, пройти собеседование в организацию?', category:'Другое', uses:0},
  {id: 2, name:'инвентарь', command:'/inv', text:'Приветствую, инвентарь.', category:'Другое', uses:0},
  {id: 3, name:'почта', command:'/mail', text:'Приветствую, на почте.', category:'Другое', uses:0}
];

function App(){
  const [tab,setTab]=useState('home');
  const [enabled,setEnabled]=useState(false);
  const [startedAt,setStartedAt]=useState(null);
  const [seconds,setSeconds]=useState(0);
  const [templates,setTemplates]=useState(()=>{
    try{return JSON.parse(localStorage.getItem('gm_templates'))||initialTemplates}catch{return initialTemplates}
  });
  const [showModal,setShowModal]=useState(false);
  const [editing,setEditing]=useState(null);
  const [query,setQuery]=useState('');

  useEffect(()=>localStorage.setItem('gm_templates',JSON.stringify(templates)),[templates]);
  useEffect(()=>{
    if(!enabled){setStartedAt(null); return;}
    const start=startedAt||Date.now();
    if(!startedAt)setStartedAt(start);
    const t=setInterval(()=>setSeconds(Math.floor((Date.now()-start)/1000)),1000);
    return ()=>clearInterval(t);
  },[enabled,startedAt]);

  const filtered=useMemo(()=>templates.filter(x =>
    `${x.name} ${x.command} ${x.text}`.toLowerCase().includes(query.toLowerCase())
  ),[templates,query]);

  const saveTemplate=(data)=>{
    if(editing){
      setTemplates(ts=>ts.map(t=>t.id===editing.id?{...editing,...data}:t));
    }else{
      setTemplates(ts=>[{...data,id:Date.now(),uses:0},...ts]);
    }
    setShowModal(false); setEditing(null);
  };

  const useTemplate=(id)=>{
    setTemplates(ts=>ts.map(t=>t.id===id?{...t,uses:t.uses+1}:t));
  };

  return <div className="app-shell">
    <div className="phone">
      <header className="topbar">
        <div>
          <div className="eyebrow">GM TOOLS</div>
          <div className="brand">Админ-помощник</div>
        </div>
        <button className="icon-btn"><Search size={19}/></button>
      </header>

      <main className="content">
        {tab==='home' && <HomeScreen
          enabled={enabled} setEnabled={setEnabled} seconds={seconds}
          templates={filtered} query={query} setQuery={setQuery}
          onAdd={()=>{setEditing(null);setShowModal(true)}}
          onEdit={(t)=>{setEditing(t);setShowModal(true)}}
          onDelete={(id)=>setTemplates(ts=>ts.filter(t=>t.id!==id))}
          onUse={useTemplate}
        />}
        {tab==='templates' && <TemplatesScreen
          templates={filtered} query={query} setQuery={setQuery}
          onAdd={()=>{setEditing(null);setShowModal(true)}}
          onEdit={(t)=>{setEditing(t);setShowModal(true)}}
          onDelete={(id)=>setTemplates(ts=>ts.filter(t=>t.id!==id))}
          onUse={useTemplate}
        />}
        {tab==='stats' && <StatsScreen templates={templates} seconds={seconds}/>}
        {tab==='settings' && <SettingsScreen enabled={enabled} setEnabled={setEnabled}/>}
      </main>

      <nav className="bottom-nav">
        {[
          ['home','Главная',Home],['templates','Шаблоны',FileText],
          ['stats','Статистика',BarChart3],['settings','Настройки',Settings]
        ].map(([id,label,Icon])=>
          <button key={id} className={tab===id?'nav-item active':'nav-item'} onClick={()=>setTab(id)}>
            <Icon size={19}/><span>{label}</span>
          </button>
        )}
      </nav>

      {showModal && <TemplateModal editing={editing} onClose={()=>{setShowModal(false);setEditing(null)}} onSave={saveTemplate}/>}
    </div>
  </div>
}

function HomeScreen({enabled,setEnabled,seconds,templates,query,setQuery,onAdd,onEdit,onDelete,onUse}){
  return <section>
    <div className="hero-card">
      <div className="small-muted">Привет,</div>
      <div className="profile">Aslan_Magomedov</div>
      <div className="tool-row">
        <div>
          <div className="tool-title">Тулс</div>
          <div className={enabled?'status on':'status'}>{enabled?'Включено':'Выключено'}</div>
        </div>
        <button className={enabled?'switch on':'switch'} onClick={()=>setEnabled(v=>!v)}><span/></button>
      </div>
    </div>

    <div className="stats-grid">
      <div className="stat-card"><Clock3 size={20}/><b>{fmt(seconds)}</b><small>Время сегодня</small></div>
      <div className="stat-card green"><ClipboardList size={20}/><b>0</b><small>Репорты сегодня</small></div>
    </div>

    <div className="section-head">
      <h2>Шаблоны</h2><button className="add-btn" onClick={onAdd}><Plus size={15}/> ДОБАВИТЬ</button>
    </div>
    <SearchBox value={query} onChange={setQuery}/>
    <TemplateList templates={templates} onEdit={onEdit} onDelete={onDelete} onUse={onUse}/>
  </section>
}

function TemplatesScreen(p){
  return <section>
    <div className="page-title"><div><div className="eyebrow">GM TOOLS</div><h1>Шаблоны</h1></div><button className="round-add" onClick={p.onAdd}><Plus/></button></div>
    <SearchBox value={p.query} onChange={p.setQuery}/>
    <TemplateList {...p}/>
  </section>
}

function TemplateList({templates,onEdit,onDelete,onUse}){
  if(!templates.length) return <div className="empty">Ничего не найдено</div>;
  return <div className="template-list">{templates.map(t=>
    <article className="template-card" key={t.id}>
      <div className="template-top">
        <div>
          <div className="template-name">{t.name}</div>
          <div className="template-text">{t.text}</div>
          <div className="template-command">{t.command}</div>
        </div>
        <div className="actions">
          <button className="mini purple" onClick={()=>onEdit(t)}><Pencil size={15}/></button>
          <button className="mini red" onClick={()=>onDelete(t.id)}><Trash2 size={15}/></button>
        </div>
      </div>
      <div className="template-bottom">
        <span className="pill">Репорт ответ</span>
        <button className="use-btn" onClick={()=>onUse(t.id)}><Check size={13}/> ИСПОЛЬЗОВАТЬ</button>
      </div>
    </article>
  )}</div>
}

function StatsScreen({templates,seconds}){
  const total=templates.reduce((a,b)=>a+b.uses,0);
  return <section>
    <div className="page-title"><div><div className="eyebrow">GM TOOLS</div><h1>Статистика</h1></div><BarChart3/></div>
    <div className="stats-grid big">
      <div className="stat-card"><Clock3/><b>{fmt(seconds)}</b><small>Сессия</small></div>
      <div className="stat-card green"><ClipboardList/><b>{total}</b><small>Использований</small></div>
    </div>
    <div className="panel">
      <div className="panel-title">Популярные шаблоны</div>
      {templates.slice().sort((a,b)=>b.uses-a.uses).map(t=><div className="rank" key={t.id}><span>{t.name}</span><b>{t.uses}</b></div>)}
    </div>
  </section>
}

function SettingsScreen({enabled,setEnabled}){
  const [sound,setSound]=useState(true), [auto,setAuto]=useState(false);
  return <section>
    <div className="page-title"><div><div className="eyebrow">GM TOOLS</div><h1>Настройки</h1></div><SlidersHorizontal/></div>
    <div className="panel settings">
      <Setting title="Тулс" desc="Включить помощник" value={enabled} setValue={setEnabled}/>
      <Setting title="Звуки" desc="Звуковой сигнал при действии" value={sound} setValue={setSound}/>
      <Setting title="Автофокус" desc="Автоматически открывать поле ввода" value={auto} setValue={setAuto}/>
    </div>
    <div className="panel">
      <div className="panel-title">Сведения</div>
      <div className="info-row"><span>Версия</span><b>0.1.0</b></div>
      <div className="info-row"><span>Режим</span><b>Локальный</b></div>
    </div>
  </section>
}

function Setting({title,desc,value,setValue}){
  return <div className="setting-row"><div><b>{title}</b><small>{desc}</small></div><button className={value?'switch on':'switch'} onClick={()=>setValue(v=>!v)}><span/></button></div>
}

function SearchBox({value,onChange}){
  return <div className="search"><Search size={16}/><input value={value} onChange={e=>onChange(e.target.value)} placeholder="Поиск шаблона..."/>{value&&<button onClick={()=>onChange('')}><X size={15}/></button>}</div>
}

function TemplateModal({editing,onClose,onSave}){
  const [name,setName]=useState(editing?.name||'');
  const [command,setCommand]=useState(editing?.command||'');
  const [text,setText]=useState(editing?.text||'');
  const [category,setCategory]=useState(editing?.category||'Другое');
  return <div className="modal-backdrop"><div className="modal">
    <div className="modal-head"><div><div className="eyebrow">ШАБЛОН</div><h2>{editing?'Редактировать':'Добавить шаблон'}</h2></div><button onClick={onClose}><X/></button></div>
    <label>Название шаблона<input value={name} onChange={e=>setName(e.target.value)} placeholder="Например: собес"/></label>
    <label>Команда <span>[Trigger]</span><input value={command} onChange={e=>setCommand(e.target.value)} placeholder="/recruit"/></label>
    <label>Текст сообщения<textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Введите текст или оставьте пустым..."/></label>
    <label>Категория<select value={category} onChange={e=>setCategory(e.target.value)}><option>Другое</option><option>Репорт ответ</option><option>Администрация</option><option>Информация</option></select></label>
    <div className="modal-actions"><button className="ghost" onClick={onClose}>ОТМЕНА</button><button className="primary" disabled={!name.trim()} onClick={()=>onSave({name,command,text,category})}>СОХРАНИТЬ</button></div>
  </div></div>
}

function fmt(s){const h=String(Math.floor(s/3600)).padStart(2,'0'),m=String(Math.floor(s%3600/60)).padStart(2,'0'),sec=String(s%60).padStart(2,'0');return `${h}:${m}:${sec}`}

createRoot(document.getElementById('root')).render(<App/>);
