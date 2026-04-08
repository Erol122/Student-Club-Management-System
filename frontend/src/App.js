import React, { useState } from 'react';
import './App.css';

const App = () => {
  const [view, setView] = useState('dashboard'); 
  const [showSettings, setShowSettings] = useState(false);
  const [accentColor, setAccentColor] = useState('#003366');
  const [glassBlur, setGlassBlur] = useState(20);
  const [showSchedule, setShowSchedule] = useState(false);
const [showAttendance, setShowAttendance] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Home', icon: '🎨' },
    { id: 'grading', label: 'Grades', icon: '📜' },
    { id: 'help', label: 'Help Hub', icon: '✨' },
    { id: 'finance', label: 'Finance', icon: '💎' }
  ];

  return (
    <div className="canvas" style={{ '--accent': accentColor, '--blur': `${glassBlur}px` }}>
      {/* ovo su one pozadinske orbs da bude jace nas ono */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>

      <div className="glass-wrapper">
        {/* sidebar */}
        <aside className="ultra-sidebar">
          <div className="brand" onClick={() => setView('dashboard')} style={{cursor: 'pointer'}}>
            <div className="ius-logo">IUS</div>
            <span>Sarajevo</span>
          </div>
          <nav>
            {menuItems.map(item => (
              <div 
                key={item.id}
                className={`nav-pill ${view === item.id ? 'active' : ''}`}
                onClick={() => setView(item.id)}
              >
                <span className="icon">{item.icon}</span>
                {item.label}
              </div>
            ))}
          </nav>
          <div className="user-profile" onClick={() => setShowSettings(true)}>
            <div className="avatar">👤</div>
            <div className="user-info">
              <p>Demo Student</p>
              <span>Settings ⚙️</span>
            </div>
          </div>
        </aside>

        {/* ovdje je sve ostalo */}
        <main className="main-stage">
          
     {/* dashboard*/}
{view === 'dashboard' && (
  <div className="view-fade-in dashboard-wrapper">
    {/* malo sam poboljsala ovaj styling ovdje da bolje izgleda vidjecemo hocu li jos mijenjati */}
    <div className="connected-card hero-card">
      <div className="hero-info">
        <span className="badge-light">Current Semester: Spring 2026</span>
        <h1 className="hero-title">Welcome back, <br/><strong>Demo Student</strong></h1>
        <div className="quick-stats-row">
          <div className="mini-pill clickable" onClick={() => setShowSchedule(true)}>
            📅 Schedule
          </div>
          <div className="mini-pill clickable" onClick={() => setShowAttendance(true)}>
            ✅ Attendance
          </div>
        </div>
      </div>
      <div className="hero-icon-large">
        <span className="animated-hat">🎓</span>
      </div>
    </div>

    {/* ovo je help hub */}
    <div className="hub-grid">
      <a href="https://virtualtour.ius.edu.ba/en" target="_blank" rel="noreferrer" className="hub-card interactive-card">
        <div className="card-icon">📍</div>
        <div className="card-text">
          <h3>Campus Map</h3>
          <p>Explore the online tour of the campus!</p>
        </div>
      </a>

      <a href="https://www.ius.edu.ba/en/dormitories" target="_blank" rel="noreferrer" className="hub-card interactive-card">
        <div className="card-icon">🏡</div>
        <div className="card-text">
          <h3>Accommodation</h3>
          <p>Check availability and details for on-campus housing</p>
        </div>
      </a>

      <a href="https://library.ius.edu.ba/" target="_blank" rel="noreferrer" className="hub-card interactive-card">
        <div className="card-icon">📚</div>
        <div className="card-text">
          <h3>IUS Library</h3>
          <p>Learn about the IUS library!</p>
        </div>
      </a>
    </div>


    {/* raspored da bude pop up i sladak i fin i dobar */}
{showSchedule && (
  <div className="modal-overlay animate-fade" onClick={() => setShowSchedule(false)}>
    <div className="modal-bubbly" onClick={e => e.stopPropagation()}>
      <div className="modal-header-soft">
        <div className="header-icon-title">
          <span className="modal-emoji">🗓️</span>
          <h3>Weekly Schedule</h3>
        </div>
        <button className="close-circle-btn" onClick={() => setShowSchedule(false)}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div className="schedule-bubbly-grid">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, i) => (
          <div className="day-column" key={i}>
            <span className="day-label">{day}</span>
            <div className="day-slots">
              {i % 2 === 0 ? (
                <>
                  <div className="bubbly-slot pink">Developing the Interactive Web<br/><span>09:00</span></div>
                  <div className="bubbly-slot purple">English Literature<br/><span>13:00</span></div>
                </>
              ) : (
                <div className="bubbly-slot blue">Computer Architecture<br/><span>11:00</span></div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)}

{/* ovo je za prisustvo */}
{showAttendance && (
  <div className="modal-overlay animate-fade" onClick={() => setShowAttendance(false)}>
    <div className="modal-bubbly attendance-width" onClick={e => e.stopPropagation()}>
      <div className="modal-header-soft">
        <div className="header-icon-title">
          <span className="modal-emoji">✅</span>
          <h3>Attendance Tracker</h3>
        </div>
        <button className="close-circle-btn" onClick={() => setShowAttendance(false)}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div className="attendance-bubbly-list">
        {[
          { name: "Developing the Interactive Web", per: 100, color: "#ff85a2" },
          { name: "Computer Architecture", per: 92, color: "#74b9ff" },
          { name: "English Literature", per: 85, color: "#a29bfe" }
        ].map((item, i) => (
          <div className="att-bubbly-card" key={i} style={{"--item-color": item.color}}>
            <div className="att-info">
              <strong>{item.name}</strong>
              <span>{item.per}% Participation</span>
            </div>
            <div className="att-progress-bg">
              <div className="att-progress-fill" style={{ width: `${item.per}%` }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)}
  </div>
)}



         {/* za ocjene */}
{view === 'grading' && (
  <div className="view-fade-in academia-container">
    <header className="academia-header-soft">
      <div className="header-left">
        <button className="back-btn-cute" onClick={() => setView('dashboard')}>
          <span>✨</span> Back to Hub
        </button>
        <h1 className="soft-title">Grades 📜</h1>
      </div>
      <div className="stats-cloud">
        <div className="cloud-pill"><span>GPA</span> <strong>3.92</strong></div>
        <div className="cloud-pill"><span>year</span> <strong>2026</strong></div>
      </div>
    </header>

    <div className="soft-course-grid">
      {[
        { name: "Developing the Interactive Web", code: "CS413", grade: "A", progress: 95, color: "#ff85a2", icon: "🎨", mood: "Program Elective" },
        { name: "Computer Architecture", code: "CS304", grade: "A-", progress: 91, color: "#74b9ff", icon: "🌐", mood: "Program Elective" },
        { name: "Software Engineering", code: "CS308", grade: "A", progress: 98, color: "#a29bfe", icon: "💻", mood: "Program Elective" },
        { name: "English Literature", code: "ENG102", grade: "B+", progress: 84, color: "#55efc4", icon: "✍️", mood: "Free Elective" }
      ].map((course, idx) => (
        <div className="soft-card" key={idx} style={{"--course-color": course.color}}>
          <div className="card-top">
            <div className="mood-badge">{course.mood}</div>
            <div className="grade-circle">{course.grade}</div>
          </div>
          
          <div className="course-main">
            <div className="course-icon-bg">{course.icon}</div>
            <div className="course-details">
              <h4>{course.name}</h4>
              <span>{course.code}</span>
            </div>
          </div>

          <div className="progress-section">
            <div className="progress-label">
              <span>Mastery</span>
              <strong>{course.progress}%</strong>
            </div>
            <div className="soft-progress-bar">
              <div className="soft-progress-fill" style={{ width: `${course.progress}%` }}></div>
            </div>
          </div>

          <div className="soft-card-actions">
            <button className="soft-action-btn">Syllabus</button>
            <button className="soft-action-btn primary">All Grades</button>
          </div>
        </div>
      ))}
    </div>
  </div>
)}

         {/* ovo je help hub ponovo */}
{view === 'help' && (
  <div className="view-fade-in concierge-container">
    <header className="concierge-header">
      <div className="header-left">
        <button className="back-btn-minimal" onClick={() => setView('dashboard')}>← Dashboard</button>
        <h1 className="connected-title">IUS Help Hub</h1>
      </div>
      <p className="concierge-subtitle">Select a contact method or chat with our digital assistant.</p>
    </header>

    {/* za kontakt opcije */}
    <div className="contact-ribbon">
      <div className="contact-method" onClick={() => alert("Calling +387 33 957 175...")}>
        <span className="method-icon">📞</span>
        <div className="method-text"><strong>Call Us</strong><span>+387 33 957 175</span></div>
      </div>
      <div className="contact-method" onClick={() => alert("Opening Email Client...")}>
        <span className="method-icon">✉️</span>
        <div className="method-text"><strong>Email</strong><span>info@ius.edu.ba</span></div>
      </div>
      <div className="contact-method" onClick={() => alert("Campus Map: Building A, Ground Floor")}>
        <span className="method-icon">📍</span>
        <div className="method-text"><strong>Visit</strong><span>Build A, Ground Floor, Office G.24</span></div>
      </div>
    </div>

    {/*  chat interface al ne radi trenutno nista samo za estetiku */}
    <div className="premium-chat-box">
      <div className="chat-header-status">
        <span className="status-indicator pulse"></span>
        <span>Assistant is Online</span>
      </div>
      
      <div className="chat-body-area">
        <div className="msg bot-msg">
          Hello! I'm your IUS digital assistant. How can I help you with your campus life today?
        </div>
        <div className="msg user-msg">
          I need to check my scholarship status for next semester.
        </div>
        <div className="msg bot-msg">
          I can help with that! Please provide your Student ID or check the Treasury tab for live updates.
        </div>
      </div>

      <div className="chat-footer-input">
        <div className="input-wrapper">
          <input type="text" placeholder="Describe your issue..." className="premium-input" />
          <button className="ultra-send-btn" onClick={() => alert("Message Sent!")}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
)}

         {/* finance */}
{view === 'finance' && (
  <div className="view-fade-in academia-container">
    <header className="academia-header">
      <div className="header-left">
        <button className="back-btn-minimal" onClick={() => setView('dashboard')}>← Dashboard</button>
        <h1 className="connected-title">Student Accounts & Finance</h1>
      </div>
      <div className="stats-pill-row">
        <div className="glass-stat"><span>Currency</span><strong>BAM (KM)</strong></div>
      </div>
    </header>

    <div className="treasury-grid-layout">
      {/* ova kao debit kartica*/}
      <div className="wallet-glass-card" style={{ background: `linear-gradient(135deg, ${accentColor} 0%, #1a1a1a 100%)` }}>
        <div className="card-top-row">
          <span className="chip-icon">📟</span>
          <div className="scholarship-tag">Depending on your outstanding debts, some options may be limited.</div>
        </div>
        <div className="wallet-balance-section">
          <span className="wallet-label">Total Amount Due</span>
          <h2 className="wallet-amount">1200,00 KM</h2>
          <p style={{fontSize: '0.8rem', opacity: 0.8}}>*Includes Scholarship Fees</p>
        </div>
        <div className="card-footer-info">
          <div className="student-meta">
            <span>Account Holder: </span>
            <strong> Demo Student</strong>
          </div>
          <div className="id-meta">
            <span>Student ID: </span>
            <strong> 2026-IUS-042</strong>
          </div>
        </div>
      </div>

      {/* recent payments */}
      <div className="transaction-ledger">
        <h3 style={{ marginBottom: '20px' }}>Payment History</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {[
            { title: "March Scholarship Fee", amount: "600 KM", status: "Unpaid", date: "Mar 15" },
            { title: "February Scholarship Fee", amount: "600 KM", status: "Unpaid", date: "Mar 01" },
            { title: "January Scholarship Fee", amount: "600 KM", status: "Paid", date: "Feb 10" },
            { title: "December Scholarship Fee", amount: "600 KM", status: "Paid", date: "Jan 25" }
          ].map((tx, i) => (
            <div className="ledger-item" key={i}>
              <div className="ledger-icon" style={{background: tx.status === 'Paid' ? '#e8f8f0' : '#fff5f5'}}>
                {tx.status === 'Paid' ? '✅' : '💸'}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>{tx.title}</p>
                <span style={{ fontSize: '0.75rem', color: '#888' }}>{tx.date}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem', color: tx.status === 'Paid' ? '#2ecc71' : '#e74c3c' }}>
                  {tx.amount}
                </p>
                <span className={tx.status === 'Paid' ? "status-paid" : "status-pending"}>
                  {tx.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* sidebar ponovo */}
      <div className="info-mini-card warning">
        <div style={{ fontSize: '1.5rem', marginBottom: '10px' }}>⚠️</div>
        <h4>Action Required</h4>
        <p style={{ fontSize: '0.8rem', color: '#666' }}>You have <b>1200,00 KM</b> in pending fees. Please settle these to avoid registration holds.</p>
        <button className="apply-btn" style={{ width: '100%', marginTop: '10px' }}>Okay</button>
      </div>
    </div>
  </div>
)}
        </main>
      </div>

    {/* themes */}
{showSettings && (
  <div className="settings-overlay animate-fade">
    <div className="settings-window theme-gallery-window">
      <header className="settings-header">
        <div className="header-text">
          <h2>Campus Styles</h2>
          <p>Pick a theme!</p>
        </div>
        <button className="close-circle-btn" onClick={() => setShowSettings(false)}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </header>

      <div className="settings-body gallery-grid">
        {[
          { name: 'Lapis', color: '#003366', blur: 20, icon: '🏛️', desc: 'Classic & Professional' },
          { name: 'Amethyst', color: '#6c5ce7', blur: 25, icon: '🔮', desc: 'Modern & Creative' },
          { name: 'Emerald', color: '#00b894', blur: 15, icon: '🌲', desc: 'Clean & Focused' },
          { name: 'Ruby', color: '#d63031', blur: 20, icon: '🏮', desc: 'Bold & Energetic' },
          { name: 'Gold', color: '#f39c12', blur: 30, icon: '☀️', desc: 'Warm & Friendly' },
          { name: 'Diamond', color: '#74b9ff', blur: 40, icon: '❄️', desc: 'Light & Airy' }
        ].map((theme) => (
          <div 
            key={theme.name}
            className={`theme-card ${accentColor === theme.color ? 'active' : ''}`}
            onClick={() => {
              setAccentColor(theme.color);
              setGlassBlur(theme.blur);
            }}
          >
            <div className="theme-preview" style={{ backgroundColor: theme.color }}>
              <span style={{fontSize: '1.5rem'}}>{theme.icon}</span>
            </div>
            <div className="theme-info">
              <h4>{theme.name}</h4>
              <p>{theme.desc}</p>
            </div>
            {accentColor === theme.color && <div className="check-badge">✓</div>}
          </div>
        ))}
      </div>

      <footer className="settings-footer">
        <button className="apply-btn-premium" onClick={() => setShowSettings(false)}>Apply Aesthetics</button>
      </footer>
    </div>
  </div>
)}
    </div>
  );
};


export default App;