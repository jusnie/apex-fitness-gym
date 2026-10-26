import { useState } from 'react'
import { motion, useScroll, useSpring } from 'motion/react'
import {
  ArrowDownToLine, ArrowUpRight, Check, ChevronLeft, ChevronRight,
  CircleCheck, CirclePlay, Dumbbell, Facebook, Github, HeartPulse, LoaderCircle,
  Menu, ShieldCheck, Sparkles, UsersRound, X, Zap,
} from 'lucide-react'
import AuraScene from './components/AuraScene.jsx'
import logo from './assets/apex-logo.jpg'
import gymFloor from './assets/apex-training-floor.jpg'

const APK_FILE = './Apex-Fitness-Gym-v0.1.0-arm64-release.apk'

const featureCards = [
  { icon: Zap, number: '01', title: 'Start. Lift. Log.', text: 'The fast workout flow keeps your active session, sets, rest, and notes exactly where your thumb expects them.' },
  { icon: HeartPulse, number: '02', title: 'Built for your pace', text: 'Choose the grounded Default theme or switch the entire experience to Liquid Glass — marked Beta.' },
  { icon: UsersRound, number: '03', title: 'Train together', text: 'Profiles, challenges, leaderboards, coach/client tools, and cloud foundations support the full Apex community.' },
]

const screens = [
  {
    eyebrow: 'ACTIVE SESSION', title: 'Push / Strength', tag: '01 — Workout flow',
    body: <WorkoutScreen />,
    description: 'A focused log that keeps the next set, completed volume, and rest timer in view.',
  },
  {
    eyebrow: 'LIQUID GLASS · BETA', title: 'Your progress, refined', tag: '02 — Theme system',
    body: <ProgressScreen />,
    description: 'A glossy alternate visual system without losing the black, red, and white Apex DNA.',
  },
  {
    eyebrow: 'APEX COMMUNITY', title: 'Train with a crew', tag: '03 — Social & coaching',
    body: <CommunityScreen />,
    description: 'Share wins, follow a plan, and chase the next rank together — online when you want it, useful offline when you do not.',
  },
]

function WorkoutScreen() {
  return <div className="phone-ui workout-ui">
    <div className="phone-top"><span>9:41</span><span>● ● ●</span></div>
    <p className="kicker">UPPER · WEDNESDAY</p><h3>Push / Strength</h3>
    <div className="session-pill"><span className="pulse-dot" /> LIVE SESSION <b>42:18</b></div>
    <div className="exercise-row"><div><small>01</small><strong>Barbell Bench Press</strong><span>4 sets · 2,240 kg volume</span></div><b>✓</b></div>
    <div className="set-grid"><span>SET</span><span>KG</span><span>REPS</span><span /></div>
    {[['1', '70', '10'], ['2', '75', '8'], ['3', '75', '8']].map(([set, kg, reps]) => <div className="set-grid set" key={set}><span>{set}</span><b>{kg}</b><b>{reps}</b><Check size={15} /></div>)}
    <button className="next-set">LOG NEXT SET <ArrowUpRight size={16} /></button>
    <div className="bottom-tabs"><span>⌂</span><span className="selected">◉</span><span>◫</span><span>◌</span></div>
  </div>
}

function ProgressScreen() {
  return <div className="phone-ui glass-ui">
    <div className="phone-top"><span>9:41</span><span>● ● ●</span></div>
    <div className="glass-head"><p className="kicker">WEEKLY PERFORMANCE</p><h3>Move with intent.</h3></div>
    <div className="glass-score"><small>TRAINING SCORE</small><strong>86<span>/100</span></strong><em>+12% this week</em></div>
    <div className="chart-card"><div className="chart-head"><b>Volume</b><span>Last 7 days</span></div><div className="bars">{[38, 56, 42, 78, 62, 94, 72].map((n, i) => <i key={i} style={{ height: `${n}%` }} />)}</div><div className="week"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div></div>
    <div className="metric-pair"><div><small>WORKOUTS</small><b>04</b></div><div><small>TIME</small><b>3h 42m</b></div></div>
    <div className="bottom-tabs"><span>⌂</span><span>◉</span><span className="selected">◫</span><span>◌</span></div>
  </div>
}

function CommunityScreen() {
  return <div className="phone-ui community-ui">
    <div className="phone-top"><span>9:41</span><span>● ● ●</span></div>
    <p className="kicker">OCTOBER CHALLENGE</p><h3>Consistency League</h3>
    <div className="challenge-card"><span>WEEK 03</span><strong>08 <small>workouts</small></strong><div className="progress-line"><i /></div><em>2 sessions to rank up</em></div>
    <div className="rank-head"><b>LEADERBOARD</b><span>THIS WEEK</span></div>
    {[['01', 'Mika S.', '12,840'], ['02', 'You', '11,260'], ['03', 'Liam R.', '10,920']].map(([rank, name, score]) => <div className={`rank-row ${name === 'You' ? 'you' : ''}`} key={rank}><b>{rank}</b><i>{name.charAt(0)}</i><span>{name}</span><strong>{score}</strong></div>)}
    <div className="coach-note"><span>COACH TIP</span><p>Keep your tempo controlled today.</p></div>
    <div className="bottom-tabs"><span>⌂</span><span>◉</span><span>◫</span><span className="selected">◌</span></div>
  </div>
}

function Reveal({ children, className = '', delay = 0 }) {
  return <motion.div className={className} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.22 }} transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>
}

function DownloadButton({ className = '', label = 'Download for Android', compact = false }) {
  const [status, setStatus] = useState('idle')
  const isBusy = status === 'checking' || status === 'starting'

  const downloadAndroid = async () => {
    if (isBusy) return
    setStatus('checking')

    try {
      // Check that the published APK is reachable before asking the browser to download it.
      const response = await fetch(APK_FILE, { method: 'HEAD', cache: 'no-store' })
      if (!response.ok) throw new Error(`APK check failed: ${response.status}`)

      setStatus('starting')
      window.setTimeout(() => {
        const anchor = document.createElement('a')
        anchor.href = APK_FILE
        anchor.download = 'Apex-Fitness-Gym-v0.1.0-arm64-release.apk'
        document.body.appendChild(anchor)
        anchor.click()
        anchor.remove()
        setStatus('started')
        window.setTimeout(() => setStatus('idle'), 2600)
      }, 360)
    } catch {
      setStatus('error')
      window.setTimeout(() => setStatus('idle'), 3400)
    }
  }

  const icon = isBusy
    ? <LoaderCircle className="download-spinner" size={compact ? 16 : 18} />
    : status === 'started'
      ? <CircleCheck size={compact ? 16 : 18} />
      : <ArrowDownToLine size={compact ? 16 : 18} />
  const copy = status === 'checking' ? 'Checking Android APK…'
    : status === 'starting' ? 'Starting download…'
      : status === 'started' ? 'Android download started'
        : status === 'error' ? 'APK temporarily unavailable'
          : label

  return <button type="button" className={`${className} download-button`} data-download-status={status} onClick={downloadAndroid} disabled={isBusy} aria-live="polite">{icon}<span>{copy}</span></button>
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeScreen, setActiveScreen] = useState(0)
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28 })
  const currentScreen = screens[activeScreen]
  const goScreen = (direction) => setActiveScreen((n) => (n + direction + screens.length) % screens.length)

  return <main>
    <motion.div className="scroll-line" style={{ scaleX }} />
    <nav className="top-nav">
      <a className="brand" href="#top" aria-label="Apex Fitness Gym home"><img src={logo} alt="Apex Fitness Gym" /><span>APEX <b>FITNESS</b></span></a>
      <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
        <a onClick={() => setMenuOpen(false)} href="#experience">Experience</a>
        <a onClick={() => setMenuOpen(false)} href="#screens">Screens</a>
        <a onClick={() => setMenuOpen(false)} href="#updates">Updates</a>
        <a onClick={() => setMenuOpen(false)} href="#about">About</a>
      </div>
      <DownloadButton className="nav-download" compact label="Android download" />
      <button className="menu-button" aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
    </nav>

    <section className="hero" id="top">
      <div className="hero-photo" style={{ backgroundImage: `linear-gradient(90deg, #070707 2%, rgba(7,7,7,.86) 35%, rgba(7,7,7,.16) 100%), url(${gymFloor})` }} />
      <AuraScene />
      <div className="grid-overlay" />
      <div className="hero-content">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75 }} className="eyebrow"><span /> APEX FITNESS GYM · ANDROID</motion.div>
        <motion.h1 initial={{ opacity: 0, y: 45 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}>TRAIN<br /><i>WITH</i> INTENT.</motion.h1>
        <motion.p initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>A gym tracker designed around the work: fast logging, clear progress, and a community built to move forward.</motion.p>
        <motion.div className="hero-actions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}>
          <DownloadButton className="button primary" label="Download for Android · v0.1.0" />
          <a className="button ghost" href="#screens"><CirclePlay size={18} /> Explore the app</a>
        </motion.div>
      </div>
      <div className="hero-meta"><span>V0.1.0</span><span>ARM64</span><span>MIN SDK 24</span></div>
      <a className="scroll-cue" href="#experience"><span>SCROLL TO TRAIN</span><i /></a>
    </section>

    <section className="intro section-shell" id="experience">
      <Reveal className="section-kicker"><span>01</span> MADE FOR THE TRAINING FLOOR</Reveal>
      <div className="intro-grid"><Reveal><h2>Less tap.<br />More <i>training.</i></h2></Reveal><Reveal delay={0.12}><p className="large-copy">Apex is made to disappear when the set starts. Record the work quickly, see what matters, and return to the bar.</p><div className="inline-stat"><strong>OFFLINE FIRST</strong><span>Your training data stays useful without a signal. Sync when you are ready.</span></div></Reveal></div>
      <div className="feature-grid">{featureCards.map(({ icon: Icon, number, title, text }, index) => <Reveal key={title} delay={index * 0.08} className="feature-card"><div className="feature-top"><Icon size={23} /><span>{number}</span></div><h3>{title}</h3><p>{text}</p><span className="line-arrow">↗</span></Reveal>)}</div>
    </section>

    <section className="screens-section" id="screens">
      <div className="section-shell">
        <Reveal className="section-kicker light"><span>02</span> THE APEX EXPERIENCE</Reveal>
        <Reveal><div className="screens-heading"><h2>Every rep has<br />a <i>place.</i></h2><p>Three views from the system, each tuned for the moment in front of you.</p></div></Reveal>
        <div className="screen-stage">
          <motion.div className="phone-wrap" key={activeScreen} initial={{ opacity: 0, x: 52, rotate: 3 }} animate={{ opacity: 1, x: 0, rotate: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}><div className="phone-frame"><div className="dynamic-island" />{currentScreen.body}</div></motion.div>
          <div className="screen-copy"><motion.div key={`copy-${activeScreen}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}><span className="screen-eyebrow">{currentScreen.eyebrow}</span><h3>{currentScreen.title}</h3><p>{currentScreen.description}</p><span className="screen-tag">{currentScreen.tag}</span></motion.div><div className="screen-controls"><button aria-label="Previous screen" onClick={() => goScreen(-1)}><ChevronLeft /></button><div>{screens.map((_, index) => <button key={index} aria-label={`Show screen ${index + 1}`} className={`screen-dot ${index === activeScreen ? 'active' : ''}`} onClick={() => setActiveScreen(index)} />)}</div><button aria-label="Next screen" onClick={() => goScreen(1)}><ChevronRight /></button></div></div>
        </div>
      </div>
    </section>

    <section className="download-band section-shell">
      <Reveal className="download-card"><div className="download-mark"><Dumbbell size={30} /></div><div><span>READY WHEN YOU ARE</span><h2>Make the next<br /><i>rep count.</i></h2></div><div className="download-end"><DownloadButton className="button primary" label="Download for Android" /><p>Android · ARM64 · 46 MB<br />The APK is checked before the download begins.</p><div className="ios-availability"><button type="button" className="button ios-progress" disabled><span>iOS · In progress</span></button><span>iOS will be available soon.</span></div></div></Reveal>
    </section>

    <section className="updates section-shell" id="updates">
      <Reveal className="section-kicker"><span>03</span> UPDATE HISTORY</Reveal>
      <div className="updates-layout"><Reveal><h2>Built in public.<br /><i>Improved</i> with purpose.</h2><p className="large-copy">Every release has a job. Browse what changed, what was fixed, and what is already in motion.</p></Reveal><div className="changelog-list"><Reveal delay={0.08} className="release release-current"><div className="release-version"><span>LIVE NOW</span><h3>v0.1.0</h3><time>October 2026</time></div><div className="release-detail"><h4>Foundation release</h4><ul><li><Check /> Apex Fitness Gym visual identity: black, red, white, and the new square launcher logo.</li><li><Check /> Default and Liquid Glass <em>Beta</em> themes applied across the app.</li><li><Check /> Faster Lyfta-inspired workout flow for routines, live sets, rest, and history.</li><li><Check /> New member profile experience and Apex gym background on account creation.</li><li><Check /> Offline-first tracking with optional cloud-sync foundations.</li><li><Check /> Social profiles, sharing, challenges, leaderboards, and coach/client foundations.</li><li><Check /> Android muscle-map widget hardened with safer bitmap handling and selective updates to prevent home-screen crashes.</li><li><Check /> About information updated for Gym Owner Gian Pokling and Developer Juanie Cuenca.</li></ul></div></Reveal><Reveal delay={0.16} className="release"><div className="release-version"><span>NEXT UP</span><h3>v0.1.1</h3><time>In planning</time></div><div className="release-detail"><h4>Next on the rack</h4><ul><li><Sparkles /> More refinement for coach/client collaboration.</li><li><Sparkles /> Broader device testing and a signed production release path.</li><li><Sparkles /> Continued tuning for the Liquid Glass Beta experience.</li></ul></div></Reveal></div></div>
    </section>

    <section className="about" id="about"><div className="about-texture" /><div className="section-shell about-layout"><Reveal><div className="section-kicker light"><span>04</span> THE PEOPLE BEHIND APEX</div><h2>Built for a stronger<br /><i>community.</i></h2></Reveal><Reveal delay={0.12} className="people"><div className="person"><span>GYM OWNER</span><h3>Gian Pokling</h3><a href="https://www.facebook.com/apexfitnessgym" target="_blank" rel="noreferrer"><Facebook size={17} /> Apex Fitness Gym <ArrowUpRight size={15} /></a></div><div className="person"><span>DEVELOPER</span><h3>Juanie Cuenca</h3><p>Crafting the digital training floor for Apex.</p></div><div className="person legal"><ShieldCheck size={22} /><p>Based on GymMane by InlitX. Distributed under GPLv3; exercise artwork retains its credited licensing.</p></div></Reveal></div></section>

    <footer><div className="section-shell footer-inner"><a className="brand" href="#top"><img src={logo} alt="" /><span>APEX <b>FITNESS</b></span></a><p>TRAIN WITH INTENT. © 2026 APEX FITNESS GYM.</p><div className="footer-links"><a href="https://www.facebook.com/apexfitnessgym" target="_blank" rel="noreferrer">Facebook</a><DownloadButton className="footer-download" compact label="Android APK" /><a href="https://github.com/jusnie/apex-fitness-gym" target="_blank" rel="noreferrer"><Github size={15} /> Source code</a></div></div></footer>
  </main>
}

export default App
