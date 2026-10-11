import { useEffect, useMemo, useState } from 'react'
import { Sprout, Footprints, Bird, Camera, Flower2, Compass, Wifi, WifiOff, Check, RefreshCw, Leaf, Sun, Clock3 } from 'lucide-react'

type Interest = 'walking' | 'gardening' | 'birdwatching' | 'photography' | 'mindfulness' | 'exploring'
type Mission = { title: string; description: string; steps: string[]; duration_minutes: number; interest: string; safety_note: string; source: 'local-ai' | 'offline-template' }
type HistoryItem = { id: string; title: string; minutes: number; date: string }

const interests: { id: Interest; label: string; icon: typeof Footprints }[] = [
  { id: 'walking', label: 'Walking', icon: Footprints },
  { id: 'gardening', label: 'Gardening', icon: Sprout },
  { id: 'birdwatching', label: 'Birdwatching', icon: Bird },
  { id: 'photography', label: 'Nature photos', icon: Camera },
  { id: 'mindfulness', label: 'Mindfulness', icon: Flower2 },
  { id: 'exploring', label: 'Exploring', icon: Compass },
]
const fallback: Record<Interest, Mission> = {
  walking: { title: 'Notice-and-Walk', description: 'Take an easy walk and pay attention to details you usually pass by.', steps: ['Choose a familiar, safe route.', 'Notice five different shapes, textures, or colors.', 'Pause somewhere safe and name one thing you enjoyed.'], duration_minutes: 20, interest: 'walking', safety_note: 'Choose a safe, accessible place and follow local conditions.', source: 'offline-template' },
  gardening: { title: 'Tiny Garden Task', description: 'Spend a little time caring for a plant or learning about a green space.', steps: ['Check a plant or garden bed.', 'Water if needed, or simply observe.', 'Notice one change you might make next time.'], duration_minutes: 20, interest: 'gardening', safety_note: 'Avoid touching unknown plants and respect private property.', source: 'offline-template' },
  birdwatching: { title: 'Three-Minute Bird Watch', description: 'Observe birds from a respectful distance without disturbing them.', steps: ['Find a safe place to stand or sit.', 'Watch quietly and notice colors, calls, or movement.', 'If no birds appear, observe other signs of nature.'], duration_minutes: 20, interest: 'birdwatching', safety_note: 'Keep wildlife at a distance and never feed wild animals.', source: 'offline-template' },
  photography: { title: 'Five Nature Details', description: 'Make a tiny photo walk focused on details rather than distance.', steps: ['Choose a safe outdoor spot.', 'Photograph natural patterns, leaves, shadows, or textures.', 'Pick a favorite and write one sentence about it.'], duration_minutes: 20, interest: 'photography', safety_note: 'Be aware of traffic and respect other people’s privacy.', source: 'offline-template' },
  mindfulness: { title: 'Outdoor Senses Reset', description: 'Take a gentle pause outdoors and reconnect with your surroundings.', steps: ['Sit or stand somewhere safe.', 'Notice three things you see and two sounds.', 'Take a few comfortable breaths and return when ready.'], duration_minutes: 20, interest: 'mindfulness', safety_note: 'Choose a comfortable place and skip anything that feels unsuitable.', source: 'offline-template' },
  exploring: { title: 'Micro-Explorer', description: 'Explore one nearby public outdoor space with curiosity.', steps: ['Pick a familiar, public area.', 'Find one feature you have not noticed before.', 'Return by a known route and note what surprised you.'], duration_minutes: 20, interest: 'exploring', safety_note: 'Stay in public areas and tell someone if you go somewhere remote.', source: 'offline-template' },
}
const getHistory = (): HistoryItem[] => { try { return JSON.parse(localStorage.getItem('tg-history') || '[]') as HistoryItem[] } catch { return [] } }

export default function App() {
  const [interest, setInterest] = useState<Interest>('walking')
  const [minutes, setMinutes] = useState(20)
  const [energy, setEnergy] = useState('medium')
  const [mission, setMission] = useState<Mission>(fallback.walking)
  const [history, setHistory] = useState<HistoryItem[]>(getHistory)
  const [loading, setLoading] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)
  const [notice, setNotice] = useState('')
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false)
    window.addEventListener('online', on); window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  useEffect(() => { localStorage.setItem('tg-history', JSON.stringify(history)) }, [history])
  const totalMinutes = useMemo(() => history.reduce((n, item) => n + item.minutes, 0), [history])
  const generate = async () => {
    setLoading(true); setNotice('')
    const localFallback = { ...fallback[interest], duration_minutes: minutes }
    try {
      const controller = new AbortController()
      const timer = window.setTimeout(() => controller.abort(), 27000)
      const response = await fetch('http://127.0.0.1:8000/api/missions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutes, interest, energy }), signal: controller.signal
      })
      window.clearTimeout(timer)
      if (!response.ok) throw new Error('API unavailable')
      const data = await response.json() as Mission
      setMission(data)
      setNotice(data.source === 'local-ai' ? 'Made with your local AI model.' : 'Using the built-in offline mission library.')
    } catch {
      setMission(localFallback)
      setNotice('Offline mode: using a built-in mission. Start outdoors whenever you’re ready.')
    } finally { setLoading(false) }
  }
  const complete = () => {
    const item = { id: crypto.randomUUID?.() ?? String(Date.now()), title: mission.title, minutes: mission.duration_minutes, date: new Date().toISOString() }
    setHistory(prev => [item, ...prev].slice(0, 50))
    setNotice('Mission logged locally. Nice work getting outside!')
  }
  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="#"><span className="brand-mark"><Sprout size={19}/></span> touchgrass<span className="brand-ai">AI</span></a><div className={`connection ${online ? 'connected' : 'disconnected'}`}>{online ? <Wifi size={15}/> : <WifiOff size={15}/>} {online ? 'Network available' : 'Offline'}</div></header>
    <main>
      <section className="hero"><div className="eyebrow"><span className="pulse"/> YOUR LITTLE NUDGE TO GO OUTSIDE</div><h1>Less scrolling.<br/><em>More growing.</em></h1><p className="hero-copy">A little fresh air can change your whole day. Get a tiny outdoor mission, then put your phone away and go live it.</p><div className="hero-tags"><span><Leaf size={14}/> Open-source AI</span><span><WifiOff size={14}/> Offline-friendly</span><span><Sun size={14}/> Real-world first</span></div></section>
      <div className="content-grid">
        <section className="panel planner"><div className="section-head"><div><span className="kicker">01 / MAKE IT YOURS</span><h2>What feels good today?</h2></div><div className="round-icon"><Sprout size={20}/></div></div>
          <label className="field-label">I feel like…</label><div className="interest-grid">{interests.map(({id,label,icon:Icon}) => <button key={id} className={`interest ${interest===id?'selected':''}`} onClick={()=>setInterest(id)}><Icon size={18}/><span>{label}</span></button>)}</div>
          <div className="field-row"><div className="field-label">Time you have</div><div className="time-value"><Clock3 size={15}/>{minutes} min</div></div><input aria-label="Available minutes" className="range" type="range" min="10" max="60" step="10" value={minutes} onChange={e=>setMinutes(Number(e.target.value))}/><div className="range-labels"><span>10 min</span><span>60 min</span></div>
          <label className="field-label energy-label">Energy level</label><div className="energy-options">{[['low','Gentle'],['medium','Steady'],['high','Adventurous']].map(([v,l])=><button key={v} className={energy===v?'energy active':'energy'} onClick={()=>setEnergy(v)}>{l}</button>)}</div>
          <button className="primary-btn" onClick={generate} disabled={loading}>{loading?<><RefreshCw className="spin" size={17}/> Finding your mission…</>:<><Sprout size={17}/> Find my outdoor mission <span>↗</span></>}</button>
          <p className="privacy-note"><WifiOff size={14}/> No account. Your activity history stays in this browser.</p>
        </section>
        <section className="mission-panel"><div className="mission-top"><span className="kicker light">02 / YOUR OUTDOOR MOMENT</span><span className="mission-badge"><span/> READY WHEN YOU ARE</span></div><div className="mission-art"><div className="sun-disc"/><div className="hill hill-back"/><div className="hill hill-front"/><div className="art-plant"><Sprout size={82} strokeWidth={1.15}/></div></div>
          <div className="mission-content"><div className="mission-meta"><span><Clock3 size={14}/>{mission.duration_minutes} minutes</span><span>✳ {mission.interest}</span></div><h2>{mission.title}</h2><p>{mission.description}</p><div className="step-list">{mission.steps.map((step,i)=><div className="step" key={i}><span>{String(i+1).padStart(2,'0')}</span><p>{step}</p></div>)}</div><div className="safety"><Sun size={15}/><span>{mission.safety_note}</span></div>{notice&&<div className="notice" role="status">{notice}</div>}<button className="complete-btn" onClick={complete}><Check size={17}/> I did it — log my fresh air</button><button className="another-btn" onClick={generate} disabled={loading}><RefreshCw size={14}/> Give me another idea</button><div className="source-note">MISSION SOURCE: {mission.source === 'local-ai' ? 'LOCAL OPEN-WEIGHT MODEL' : 'BUILT-IN OFFLINE LIBRARY'}</div></div>
        </section>
      </div>
      <section className="stats-row"><div className="stat"><span className="stat-icon"><Sun size={18}/></span><div><strong>{totalMinutes}</strong><span>minutes outdoors logged</span></div></div><div className="stat"><span className="stat-icon"><Check size={18}/></span><div><strong>{history.length}</strong><span>missions completed</span></div></div><div className="stat"><span className="stat-icon"><Leaf size={18}/></span><div><strong>{history.length ? 'Growing' : 'Start small'}</strong><span>every little bit counts</span></div></div></section>
      {history.length>0&&<section className="history"><div className="section-head"><div><span className="kicker">YOUR JOURNAL</span><h2>Little moments, collected.</h2></div><button className="clear-btn" onClick={()=>{if(confirm('Clear your local mission history?'))setHistory([])}}>Clear history</button></div><div className="history-list">{history.slice(0,5).map(item=><div className="history-item" key={item.id}><span className="history-check"><Check size={15}/></span><span className="history-title">{item.title}<small>{new Date(item.date).toLocaleDateString()}</small></span><strong>{item.minutes} min</strong></div>)}</div></section>}
      <footer><span><Sprout size={16}/> touchgrass<span className="brand-ai">AI</span></span><p>Made for the world beyond your screen.</p><span className="footer-dot">GROW AT YOUR OWN PACE</span></footer>
    </main>
  </div>
}