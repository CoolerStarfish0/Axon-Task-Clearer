"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { auth, googleProvider, firebaseReady } from "./firebase";
import {
  ArrowDownRight, ArrowRight, Bell, BookOpen, CalendarDays, Check,
  CheckCheck, ChevronDown, CircleHelp, ClipboardCheck, Clock3,
  LayoutDashboard, ListTodo, Menu, Plus,
  Search, Settings2, Sparkles, X, Zap, LogIn, LogOut
} from "lucide-react";

type Task = { id: number; title: string; subject: string; due: string; priority: "High" | "Medium" | "Low"; done: boolean };

const initialTasks: Task[] = [
  { id: 1, title: "Finish the photosynthesis worksheet", subject: "Biology", due: "Tomorrow", priority: "High", done: false },
  { id: 2, title: "Revise chapter 4 notes", subject: "History", due: "In 3 days", priority: "Medium", done: false },
  { id: 3, title: "Plan the group presentation", subject: "English", due: "Friday", priority: "Medium", done: false },
  { id: 4, title: "Read pages 42–55", subject: "Geography", due: "Next week", priority: "Low", done: true }
];

const services = [
  { name: "Gmail", detail: "Assignment emails and teacher updates", icon: "M", color: "#EA4335" },
  { name: "Google Calendar", detail: "Tests, events, and due dates", icon: "31", color: "#4285F4" },
  { name: "Google Classroom", detail: "Classwork and announcements", icon: "▣", color: "#0F9D58" },
  { name: "Google Drive", detail: "Documents and study materials", icon: "▲", color: "#F4B400" },
  { name: "Google Tasks", detail: "Keep your task lists in sync", icon: "✓", color: "#4285F4" }
];

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [surveyOpen, setSurveyOpen] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [reminder, setReminder] = useState("Depends on work load");
  const [workStyle, setWorkStyle] = useState("A little every day");
  const [notificationLevel, setNotificationLevel] = useState("Normal reminders");
  const [availableTime, setAvailableTime] = useState("Varies");
  const [priorities, setPriorities] = useState<string[]>(["School assignments", "Tests and exams", "Projects"]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantText, setAssistantText] = useState("");
  const [toast, setToast] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskSubject, setNewTaskSubject] = useState("");
  const [newTaskDue, setNewTaskDue] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<Task["priority"]>("Medium");
  const [todayLabel, setTodayLabel] = useState("TODAY");
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (!firebaseReady || !auth) { setAuthLoading(false); return; }
    return onAuthStateChanged(auth, (currentUser) => { setUser(currentUser); setAuthLoading(false); });
  }, []);

  async function handleGoogleSignIn() {
    if (!auth || !googleProvider) { setAuthError("Firebase is not configured yet. Add the NEXT_PUBLIC_FIREBASE settings to Vercel."); return; }
    setAuthError("");
    try { await signInWithPopup(auth, googleProvider); }
    catch (error) {
      const code = (error as { code?: string }).code;
      setAuthError(code === "auth/popup-closed-by-user" ? "Sign-in was cancelled." : code === "auth/unauthorized-domain" ? "This website domain is not authorized in Firebase yet." : "Google sign-in failed. Please try again.");
    }
  }

  async function handleSignOut() {
    if (!auth) return;
    try { await signOut(auth); setToast("Signed out."); }
    catch { setAuthError("Could not sign out. Please try again."); }
  }

  useEffect(() => {
    setTodayLabel(new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date()).toUpperCase());
    let onboardingComplete = false;
    try {
      const savedTasks = window.localStorage.getItem("ah-tasks");
      const savedPreferences = window.localStorage.getItem("ah-preferences");
      onboardingComplete = window.localStorage.getItem("ah-onboarding-complete") === "true" || Boolean(savedPreferences);
      if (savedTasks) setTasks(JSON.parse(savedTasks) as Task[]);
      if (savedPreferences) {
        const preferences = JSON.parse(savedPreferences) as {
          reminder?: string; workStyle?: string; notificationLevel?: string;
          availableTime?: string; priorities?: string[];
        };
        if (preferences.reminder) setReminder(preferences.reminder);
        if (preferences.workStyle) setWorkStyle(preferences.workStyle);
        if (preferences.notificationLevel) setNotificationLevel(preferences.notificationLevel);
        if (preferences.availableTime) setAvailableTime(preferences.availableTime);
        if (preferences.priorities) setPriorities(preferences.priorities);
      }
    } catch {
      window.localStorage.removeItem("ah-tasks");
      window.localStorage.removeItem("ah-preferences");
    }
    if (!onboardingComplete) setSurveyOpen(true);
    else window.localStorage.setItem("ah-onboarding-complete", "true");
    setDataLoaded(true);
  }, []);

  useEffect(() => {
    if (dataLoaded) window.localStorage.setItem("ah-tasks", JSON.stringify(tasks));
  }, [tasks, dataLoaded]);

  const completed = tasks.filter((task) => task.done).length;
  const pending = tasks.length - completed;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  const sortedTasks = useMemo(
    () => [...tasks]
      .filter((task) => !searchQuery.trim() || `${task.title} ${task.subject} ${task.due}`.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => Number(a.done) - Number(b.done)),
    [tasks, searchQuery]
  );

  function toggleTask(id: number) {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, done: !task.done } : task));
  }

  function finishSurvey() {
    window.localStorage.setItem("ah-preferences", JSON.stringify({ reminder, workStyle, notificationLevel, availableTime, priorities }));
    window.localStorage.setItem("ah-onboarding-complete", "true");
    setSurveyOpen(false);
    setToast("Your preferences have been saved.");
    window.setTimeout(() => setToast(""), 2800);
  }

  function addTask() {
    const title = newTaskTitle.trim();
    if (!title) return;
    const task: Task = {
      id: Date.now(), title, subject: newTaskSubject.trim() || "General",
      due: newTaskDue.trim() || "No date set", priority: newTaskPriority, done: false
    };
    setTasks((current) => [task, ...current]);
    setNewTaskTitle(""); setNewTaskSubject(""); setNewTaskDue("");
    setNewTaskPriority("Medium"); setAddTaskOpen(false);
    setToast("Task added."); window.setTimeout(() => setToast(""), 2500);
  }

  function requestHelp() {
    if (!assistantText.trim()) return;
    setToast("AI actions will be available once the assistant is connected.");
    setAssistantText("");
    setAssistantOpen(false);
    window.setTimeout(() => setToast(""), 3500);
  }

  return (
    <main className="app-shell">
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><ClipboardCheck size={21} strokeWidth={2.5} /></div>
          <span>assignment<span className="brand-light">helper</span></span>
          <button className="icon-button sidebar-close" aria-label="Close menu" onClick={() => setMenuOpen(false)}><X size={19} /></button>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          <a className="nav-item active" href="#dashboard" onClick={() => setMenuOpen(false)}><LayoutDashboard size={18} />Dashboard</a>
          <a className="nav-item" href="#tasks" onClick={() => setMenuOpen(false)}><ListTodo size={18} />My tasks<span className="nav-count">{pending}</span></a>
          <a className="nav-item" href="#calendar" onClick={() => setMenuOpen(false)}><CalendarDays size={18} />Upcoming</a>
          <button className="nav-item" onClick={() => { setNotificationsOpen(true); setMenuOpen(false); }}><Bell size={18} />Notifications<span className="notification-dot" /></button>
          <button className="nav-item" onClick={() => { setAssistantOpen(true); setMenuOpen(false); }}><Sparkles size={18} />AI assistant</button>
        </nav>
        <div className="sidebar-bottom">
          <div className="workspace-label">YOUR SERVICES</div>
          <div className="service-mini"><span className="service-dot gmail-dot" />Gmail <span className="not-connected">Not connected</span></div>
          <div className="service-mini"><span className="service-dot calendar-dot" />Calendar <span className="not-connected">Not connected</span></div>
          <button className="nav-item settings-link" onClick={() => setToast("Settings will be available in a future update.")}><Settings2 size={18} />Settings</button>
          <div className="profile-card"><div className="avatar">{user?.photoURL ? <img src={user.photoURL} alt="" /> : (user?.displayName || "AH").slice(0,2).toUpperCase()}</div><div><strong>{user?.displayName || "Your workspace"}</strong><small>{user ? user.email : "Not signed in"}</small></div>{user ? <button className="profile-action" title="Sign out" aria-label="Sign out" onClick={handleSignOut}><LogOut size={16}/></button> : <button className="profile-action" title="Sign in with Google" aria-label="Sign in with Google" onClick={handleGoogleSignIn}><LogIn size={16}/></button>}</div>
        </div>
      </aside>

      {menuOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}

      <section className="main-panel" id="dashboard">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu" aria-label="Open menu" onClick={() => setMenuOpen(true)}><Menu size={21} /></button>
            <div className="breadcrumb">Workspace <span>/</span> <strong>Dashboard</strong></div>
          </div>
          <div className="topbar-actions">
            <div className="search-box"><Search size={16} /><input aria-label="Search tasks" placeholder="Search tasks..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} /></div>
            <button className="icon-button notification-button" aria-label="Open notifications" onClick={() => setNotificationsOpen(true)}><Bell size={19} /><i /></button>
            {user ? <div className="avatar top-avatar">{user.photoURL ? <img src={user.photoURL} alt="" /> : (user.displayName || "AH").slice(0,2).toUpperCase()}</div> : <button className="button google-signin" onClick={handleGoogleSignIn} disabled={authLoading}><LogIn size={15}/>{authLoading ? "Loading..." : "Sign in"}</button>}
          </div>
        </header>

        <div className="page-content">
          {authError && <div className="auth-error" role="alert">{authError}<button onClick={() => setAuthError("")} aria-label="Dismiss"><X size={15}/></button></div>}
          {!firebaseReady && <div className="auth-config-notice">Google sign-in is awaiting Firebase configuration.</div>}
          <section className="welcome-row">
            <div><div className="eyebrow">{todayLabel}</div><h1>Good morning <span className="wave">✦</span></h1><p>Here&apos;s what&apos;s happening with your workload today.</p></div>
            <button className="button button-secondary preferences-button" onClick={() => setSurveyOpen(true)}><Settings2 size={16} /> Preferences</button>
          </section>

          <section className="stats-grid" aria-label="Task overview">
            <article className="stat-card"><div className="stat-top"><span>Pending tasks</span><span className="stat-icon blue-icon"><ListTodo size={18} /></span></div><div className="stat-number">{pending}<span className="stat-caption"> tasks</span></div><div className="stat-foot"><span className="stat-neutral"><ArrowDownRight size={14} /> Your open workload</span></div></article>
            <article className="stat-card"><div className="stat-top"><span>Completed</span><span className="stat-icon green-icon"><CheckCheck size={18} /></span></div><div className="stat-number">{completed}<span className="stat-caption"> tasks</span></div><div className="stat-foot"><span className="stat-positive">{progress}%</span><span> of your list complete</span></div></article>
            <article className="stat-card"><div className="stat-top"><span>Coming up</span><span className="stat-icon amber-icon"><Clock3 size={18} /></span></div><div className="stat-number">{tasks.filter((task) => !task.done && task.due !== "Next week").length}<span className="stat-caption"> soon</span></div><div className="stat-foot"><span>Keep an eye on your deadlines</span></div></article>
          </section>

          <section className="content-grid">
            <div className="primary-column">
              <article className="panel task-panel" id="tasks">
                <div className="panel-heading"><div><h2>Your tasks</h2><p>A little progress adds up.</p></div><button className="text-button" onClick={() => setSearchQuery("")}>Clear search <ArrowRight size={15} /></button></div>
                <div className="task-list">
                  {sortedTasks.length === 0 && <div className="empty-notifications"><strong>No matching tasks</strong><span>Try another search term or add a new task.</span></div>}
                  {sortedTasks.map((task) => <div className={`task-row ${task.done ? "task-done" : ""}`} key={task.id}>
                    <button className={`task-check ${task.done ? "checked" : ""}`} aria-label={task.done ? "Mark incomplete" : "Mark complete"} onClick={() => toggleTask(task.id)}>{task.done && <Check size={14} />}</button>
                    <div className="task-main"><strong>{task.title}</strong><span>{task.subject} <i /> Due {task.due}</span></div>
                    <span className={`priority priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
                  </div>)}
                </div>
                <button className="add-task-button" onClick={() => setAddTaskOpen(true)}><Plus size={16} /> Add a task</button>
              </article>

              <article className="panel integrations-panel" id="calendar">
                <div className="panel-heading"><div><h2>Connect your services</h2><p>Bring your schoolwork into one place.</p></div><span className="integration-count">0 of 5 connected</span></div>
                <div className="integration-grid">
                  {services.map((service) => <div className="integration-item" key={service.name}><div className="integration-logo" style={{ color: service.color }}>{service.icon}</div><div className="integration-copy"><strong>{service.name}</strong><span>{service.detail}</span></div><span className="connect-status">Soon</span></div>)}
                </div>
              </article>
            </div>

            <aside className="right-column">
              <article className="ai-card">
                <div className="ai-card-glow" />
                <div className="ai-card-top"><div className="ai-sparkle"><Sparkles size={19} /></div><span>YOUR AI ASSISTANT</span></div>
                <h2>A hand with your workload?</h2><p>Ask for help planning, understanding, or getting started on a task.</p>
                <button className="button ai-button" onClick={() => setAssistantOpen(true)}>Ask your assistant <ArrowRight size={16} /></button>
                <div className="ai-card-foot"><Zap size={13} /> Helpful support, with you in control</div>
              </article>

              <article className="panel progress-panel">
                <div className="panel-heading"><div><h2>Your progress</h2><p>Small steps matter.</p></div></div>
                <div className="progress-ring-wrap"><div className="progress-ring" style={{ background: `conic-gradient(#3978ed ${progress * 3.6}deg, #edf2f8 0deg)` }}><div className="progress-inner"><strong>{progress}%</strong><span>complete</span></div></div></div>
                <div className="progress-legend"><span><i className="legend-blue" />Completed <strong>{completed}</strong></span><span><i className="legend-grey" />Remaining <strong>{pending}</strong></span></div>
              </article>

              <article className="tip-card"><div className="tip-icon"><BookOpen size={17} /></div><div><strong>A little tip</strong><p>Breaking a big assignment into smaller steps can make it feel much more manageable.</p></div></article>
            </aside>
          </section>

          <footer className="page-footer"><span>Assignment Helper</span><span>Made to make busy days feel simpler.</span><button onClick={() => setToast("Help centre coming soon.")}><CircleHelp size={14} /> Help</button></footer>
        </div>
      </section>

      {addTaskOpen && <div className="modal-backdrop"><section className="survey-modal task-modal" role="dialog" aria-modal="true" aria-labelledby="add-task-title">
        <div className="survey-header"><div className="brand-mark"><Plus size={20} /></div><button className="icon-button" aria-label="Close add task" onClick={() => setAddTaskOpen(false)}><X size={19} /></button></div>
        <div className="eyebrow">YOUR WORKSPACE</div><h2 id="add-task-title">Add a task</h2><p className="survey-intro">Keep track of something you need to get done.</p>
        <div className="survey-field"><label htmlFor="new-task-title">Task name</label><input id="new-task-title" value={newTaskTitle} onChange={(event) => setNewTaskTitle(event.target.value)} placeholder="e.g. Finish science worksheet" /></div>
        <div className="survey-field"><label htmlFor="new-task-subject">Subject</label><input id="new-task-subject" value={newTaskSubject} onChange={(event) => setNewTaskSubject(event.target.value)} placeholder="e.g. Biology" /></div>
        <div className="survey-field"><label htmlFor="new-task-due">Due date or reminder</label><input id="new-task-due" value={newTaskDue} onChange={(event) => setNewTaskDue(event.target.value)} placeholder="e.g. Friday or 25 Nov" /></div>
        <div className="survey-field"><label htmlFor="new-task-priority">Priority</label><select id="new-task-priority" value={newTaskPriority} onChange={(event) => setNewTaskPriority(event.target.value as Task["priority"])}><option>High</option><option>Medium</option><option>Low</option></select></div>
        <div className="survey-actions"><button className="button button-secondary" onClick={() => setAddTaskOpen(false)}>Cancel</button><button className="button button-primary" disabled={!newTaskTitle.trim()} onClick={addTask}>Add task <ArrowRight size={16} /></button></div>
      </section></div>}

      {surveyOpen && <div className="modal-backdrop"><section className="survey-modal" role="dialog" aria-modal="true" aria-labelledby="survey-title">
        <div className="survey-header"><div className="brand-mark"><ClipboardCheck size={20} /></div><button className="icon-button" aria-label="Close survey" onClick={() => setSurveyOpen(false)}><X size={19} /></button></div>
        <div className="survey-progress"><span /></div>
        <div className="eyebrow">A QUICK PERSONAL SETUP</div><h2 id="survey-title">Let&apos;s make this work for you.</h2><p className="survey-intro">A few preferences help Assignment Helper plan reminders around your routine. You can change these any time.</p>
        <div className="survey-field"><label>When would you like to be reminded about tasks?</label><div className="choice-grid">{["3 days before due date", "Week before due date", "Depends on work load"].map((option) => <button key={option} className={`choice ${reminder === option ? "choice-selected" : ""}`} onClick={() => setReminder(option)}><span className="choice-radio">{reminder === option && <i />}</span>{option}</button>)}</div></div>
        <div className="survey-field"><label htmlFor="work-style">How do you prefer to work?</label><select id="work-style" value={workStyle} onChange={(event) => setWorkStyle(event.target.value)}><option>A little every day</option><option>Finish everything early</option><option>Work closer to deadlines</option><option>Depends on the assignment</option></select></div>
        <div className="survey-field"><label htmlFor="notifications">How many notifications would you like?</label><select id="notifications" value={notificationLevel} onChange={(event) => setNotificationLevel(event.target.value)}><option>Only important updates</option><option>Normal reminders</option><option>Frequent reminders</option></select></div>
        <div className="survey-field"><label htmlFor="available-time">When are you usually available?</label><select id="available-time" value={availableTime} onChange={(event) => setAvailableTime(event.target.value)}><option>Morning</option><option>Afternoon</option><option>Evening</option><option>Varies</option></select></div>
        <div className="survey-field"><label>What should Assignment Helper prioritize?</label><div className="choice-grid">{["School assignments", "Tests and exams", "Projects", "Everything equally"].map((item) => <button key={item} type="button" className={`choice ${priorities.includes(item) ? "choice-selected" : ""}`} onClick={() => setPriorities((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item])}><span className="choice-radio">{priorities.includes(item) && <i />}</span>{item}</button>)}</div></div>
        <div className="survey-actions"><button className="button button-secondary" onClick={() => setSurveyOpen(false)}>Maybe later</button><button className="button button-primary" onClick={finishSurvey}>Save preferences <ArrowRight size={16} /></button></div>
      </section></div>}

      {notificationsOpen && <div className="drawer-backdrop" onClick={() => setNotificationsOpen(false)}><section className="notification-drawer" role="dialog" aria-modal="true" aria-label="Notifications" onClick={(event) => event.stopPropagation()}><div className="drawer-heading"><div><h2>Notifications</h2><p>You&apos;re all caught up.</p></div><button className="icon-button" aria-label="Close notifications" onClick={() => setNotificationsOpen(false)}><X size={19} /></button></div><div className="empty-notifications"><div><Bell size={23} /></div><strong>No new notifications</strong><span>When something important changes, you&apos;ll see it here.</span></div></section></div>}

      {assistantOpen && <div className="drawer-backdrop" onClick={() => setAssistantOpen(false)}><section className="assistant-drawer" role="dialog" aria-modal="true" aria-label="AI assistant" onClick={(event) => event.stopPropagation()}><div className="drawer-heading"><div><h2><Sparkles size={19} /> AI assistant</h2><p>What would you like a hand with?</p></div><button className="icon-button" aria-label="Close assistant" onClick={() => setAssistantOpen(false)}><X size={19} /></button></div><div className="assistant-welcome"><div className="assistant-icon"><Sparkles size={22} /></div><strong>Let&apos;s tackle it together.</strong><p>I can help break down an assignment, explain a topic, plan your week, or prepare a draft for you to review.</p></div><label className="assistant-label" htmlFor="assistant-request">Your request</label><textarea id="assistant-request" value={assistantText} onChange={(event) => setAssistantText(event.target.value)} placeholder="e.g. Help me plan my history project..." rows={4} /><button className="button button-primary assistant-submit" onClick={requestHelp}>Ask for help <ArrowRight size={16} /></button><p className="assistant-note">The AI connection is not set up yet. Your request won&apos;t be sent anywhere.</p></section></div>}

      {toast && <div className="toast-message"><Check size={16} />{toast}</div>}
    </main>
  );
}