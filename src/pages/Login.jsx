import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/useApp'
import logo from '../assets/download.webp'

const featuredProjects = [
  { name: 'Terrace 28', place: 'Nungambakkam', image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=85', background: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1800&q=90' },
  { name: 'Marina House', place: 'Besant Nagar', image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=700&q=85', background: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1800&q=90' },
  { name: 'The Somerset', place: 'Adyar', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=700&q=85', background: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1800&q=90' },
]

export default function Login() {
  const { account, signIn, createAccount } = useApp()
  const navigate = useNavigate()
  const [mode, setMode] = useState('signin')
  const [loginRole, setLoginRole] = useState('employee')
  const [activeProject, setActiveProject] = useState(0)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee' })
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveProject((current) => (current + 1) % featuredProjects.length)
    }, 4200)
    return () => window.clearInterval(timer)
  }, [])
  const discover = () => document.getElementById('featured-projects')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  const submit = async (event) => {
    event.preventDefault()
    if (mode === 'signup') await createAccount(form)
    else await signIn({ name: account?.name || form.email.split('@')[0], email: form.email, password: form.password, role: loginRole })
    navigate('/dashboard')
  }

  return <main className="auth-page">
    <section className="auth-showcase">
      <div className="showcase-backdrops" aria-hidden="true">{featuredProjects.map((project, index) => <div className={`showcase-backdrop ${activeProject === index ? 'is-visible' : ''}`} style={{ backgroundImage: `url(${project.background})` }} key={project.background} />)}</div>
      <div className="showcase-header"><div className="brand light"><img className="brand-logo" src={logo} alt="Manju Groups" /></div><span className="showcase-label">PRIVATE PROPERTY INTELLIGENCE</span></div>
      <div className="showcase-copy"><span className="eyebrow accent">THE MANJU EDIT / 2026</span><h1>Places with a point of view.</h1><p>One composed workspace for the properties, people, and decisions that shape a portfolio.</p><div className="showcase-rule"><span>Chennai / 13.04° N, 80.27° E</span><span>Est. 1998</span></div></div>
      <div className="featured-projects" id="featured-projects">{featuredProjects.map((project, index) => <button type="button" className={`featured-project project-${index + 1} ${activeProject === index ? 'is-active' : ''}`} key={project.name} onClick={() => setActiveProject(index)} aria-label={`Show ${project.name}`}><img src={project.image} alt={project.name} /><div className="featured-overlay" /><div className="featured-copy"><span>0{index + 1}</span><div><strong>{project.name}</strong><small>{project.place}</small></div></div></button>)}</div>
      <div className="showcase-footer"><span>Curated homes. Considered decisions.</span><button type="button" className="discover-button" onClick={discover}>Discover the collection <b>↓</b></button></div>
    </section>
    <section className="auth-panel"><div className="auth-card"><div className="auth-card-top"><span className="eyebrow">{mode === 'signin' ? 'WELCOME BACK' : 'JOIN THE EDIT'}</span><span className="secure-badge"><i /> Secure access</span></div><div className="auth-heading"><h2>{mode === 'signin' ? 'Enter your workspace.' : 'Make it yours.'}</h2><p>{mode === 'signin' ? 'Your portfolio is waiting exactly where you left it.' : 'Create your account and begin shaping your property workspace.'}</p></div>{mode === 'signin' && <div className="role-toggle" aria-label="Choose workspace login"><button type="button" className={loginRole === 'employee' ? 'active' : ''} onClick={() => setLoginRole('employee')}>Employee</button><button type="button" className={loginRole === 'admin' ? 'active' : ''} onClick={() => setLoginRole('admin')}>Admin</button></div>}<form className="stack-form" onSubmit={submit}>{mode === 'signup' && <label>Full name<input required value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="Priya Shah" /></label>}{mode === 'signup' && <label>Account type<select required value={form.role} onChange={(event) => update('role', event.target.value)}><option value="employee">Employee</option><option value="admin">Admin</option></select></label>}<label>Email address<input required type="email" value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="you@company.com" /></label><label>Password<input required minLength="6" type="password" value={form.password} onChange={(event) => update('password', event.target.value)} placeholder="At least 6 characters" /></label><button className="button primary wide auth-submit" type="submit">{mode === 'signin' ? `Open ${loginRole} workspace` : 'Create account'} <span>↗</span></button></form><div className="auth-switch">{mode === 'signin' ? 'New to Manju Groups?' : 'Already part of the team?'} <button type="button" className="text-button" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>{mode === 'signin' ? 'Create an account' : 'Sign in instead'}</button></div><div className="auth-card-footer"><span>MANJU GROUPS</span><span>Chennai · India</span></div></div></section>
  </main>
}
