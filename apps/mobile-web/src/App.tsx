import { useState, useEffect, useCallback } from 'react'
import { supabase, signIn, signOut, getComplaints, getDashboardStats } from './supabase'
import type { UserSession, Complaint } from './supabase'

// ─── STYLES ──────────────────────────────────────────────────────────────────
const s = {
  // Layout
  screen: { display:'flex', flexDirection:'column' as const, minHeight:'100dvh', background:'#f5f6fa' },
  header: { background:'#1a3d7c', color:'#fff', padding:'12px 16px', display:'flex', alignItems:'center', gap:12, minHeight:56 },
  headerTitle: { fontSize:17, fontWeight:700 },
  headerSub: { fontSize:12, opacity:0.8, marginTop:1 },
  body: { flex:1, overflowY:'auto' as const, padding:16 },
  bottomNav: { background:'#fff', borderTop:'1px solid #e2e8f0', display:'flex' },
  navBtn: (active:boolean) => ({ flex:1, padding:'8px 4px', display:'flex', flexDirection:'column' as const, alignItems:'center', gap:3, border:'none', background:'none', color: active ? '#1a3d7c' : '#6b7280', fontSize:10, fontWeight: active ? 700 : 400 }),

  // Cards
  card: { background:'#fff', borderRadius:12, border:'1px solid #e2e8f0', padding:14, marginBottom:12 },
  cardTitle: { fontSize:13, fontWeight:600, color:'#1a3d7c', marginBottom:8 },

  // Stats grid
  statsGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 },
  statCard: (color:string) => ({ background:color, borderRadius:10, padding:'12px 14px' }),
  statNum: { fontSize:26, fontWeight:800, color:'#1a3d7c', lineHeight:1 },
  statLabel: { fontSize:11, color:'#6b7280', marginTop:3 },

  // Form
  formGroup: { marginBottom:14 },
  label: { fontSize:13, fontWeight:500, display:'block', marginBottom:5, color:'#374151' },
  input: { width:'100%', border:'1.5px solid #e2e8f0', borderRadius:8, padding:'11px 12px', fontSize:14, background:'#fff', transition:'border-color 0.15s' },
  textarea: { width:'100%', border:'1.5px solid #e2e8f0', borderRadius:8, padding:'11px 12px', fontSize:14, background:'#fff', resize:'none' as const, minHeight:80 },

  // Buttons
  btnPrimary: { background:'#1a3d7c', color:'#fff', border:'none', borderRadius:8, padding:'13px 20px', fontSize:15, fontWeight:600, width:'100%', cursor:'pointer' },
  btnSecondary: { background:'#fff', color:'#1a3d7c', border:'1.5px solid #1a3d7c', borderRadius:8, padding:'11px 20px', fontSize:14, fontWeight:600, width:'100%', cursor:'pointer' },
  btnSmall: (bg:string,color:string) => ({ background:bg, color, border:'none', borderRadius:6, padding:'7px 14px', fontSize:12, fontWeight:600, cursor:'pointer' }),

  // Complaint item
  complaintItem: { background:'#fff', borderRadius:10, border:'1px solid #e2e8f0', padding:14, marginBottom:10 },
  compNum: { fontSize:12, fontFamily:'monospace', fontWeight:600, color:'#1a3d7c' },
  compName: { fontSize:15, fontWeight:600, marginTop:3 },
  compNature: { fontSize:13, color:'#6b7280', marginTop:2 },

  // Status chip
  statusChip: (status:string) => {
    const cfg: Record<string, [string,string]> = {
      open:        ['#dbeafe','#2563eb'],
      assigned:    ['#fef3c7','#d97706'],
      in_progress: ['#ffedd5','#ea580c'],
      closed:      ['#dcfce7','#16a34a'],
      rejected:    ['#fee2e2','#dc2626'],
    }
    const [bg, fg] = cfg[status] ?? ['#f3f4f6','#6b7280']
    return { display:'inline-flex', alignItems:'center', gap:4, background:bg, color:fg, borderRadius:12, padding:'3px 10px', fontSize:11, fontWeight:600 }
  },

  // Error / info
  errorBox: { background:'#fee2e2', border:'1px solid #fecaca', borderRadius:8, padding:'10px 12px', fontSize:13, color:'#dc2626', marginBottom:12 },
  infoBox: { background:'#f0f4ff', borderRadius:8, padding:'10px 12px', fontSize:13, color:'#1a3d7c', marginBottom:12 },

  // Login screen
  loginHero: { background:'#1a3d7c', padding:'40px 24px 32px', textAlign:'center' as const },
  loginCard: { background:'#fff', flex:1, borderRadius:'20px 20px 0 0', marginTop:-20, padding:'28px 20px', position:'relative' as const },
}

// ─── STATUS LABEL ─────────────────────────────────────────────────────────────
const statusLabel = (s: string) => ({ open:'Open', assigned:'Assigned', in_progress:'In Progress', closed:'Closed', rejected:'Rejected' }[s] ?? s)
const roleLabel = (r: string) => ({ back_office:'Back Office', call_centre:'Call Centre', line_man:'Line Man', top_management:'Top Management' }[r] ?? r)
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'2-digit',year:'numeric'}) : '—'
const fmtDT = (d: string | null) => d ? new Date(d).toLocaleString('en-IN',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}) : '—'

// ─── ICON COMPONENTS ──────────────────────────────────────────────────────────
const Icon = ({ name }: { name: string }) => {
  const icons: Record<string,string> = {
    home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    file: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    settings: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    plus: 'M12 4v16m8-8H4',
    check: 'M5 13l4 4L19 7',
    inbox: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4m16 0l-4-4m-8 4l4-4',
    assigned: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    bar: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    back: 'M10 19l-7-7m0 0l7-7m-7 7h18',
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {(icons[name] || '').split(' M').filter(Boolean).map((d, i) => (
        <path key={i} d={(i === 0 ? '' : 'M') + d} />
      ))}
    </svg>
  )
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (s: UserSession) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError('Enter email and password'); return }
    setLoading(true); setError('')
    try {
      const session = await signIn(email.trim(), password)
      onLogin(session)
    } catch (err: unknown) {
      setError((err as Error).message || 'Login failed')
    } finally { setLoading(false) }
  }

  const fill = (e: string, p: string) => { setEmail(e); setPassword(p) }

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100dvh' }}>
      <div style={s.loginHero}>
        <div style={{ fontSize:36 }}>⚡</div>
        <div style={{ color:'#fff', fontSize:22, fontWeight:800, marginTop:8 }}>SUNR Circle</div>
        <div style={{ color:'rgba(255,255,255,0.8)', fontSize:13, marginTop:4 }}>Complaint Management System</div>
      </div>

      <div style={s.loginCard}>
        <div style={{ fontSize:20, fontWeight:700, marginBottom:20 }}>Sign In</div>

        {error && <div style={s.errorBox}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div style={s.formGroup}>
            <label style={s.label}>Email Address</label>
            <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="user@sunrcircle.in" autoComplete="email" />
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>Password</label>
            <div style={{ position:'relative' }}>
              <input style={{...s.input, paddingRight:44}} type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
              <button type="button" onClick={() => setShowPw(p => !p)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', color:'#6b7280', border:'none', cursor:'pointer', fontSize:12 }}>{showPw ? 'Hide' : 'Show'}</button>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{...s.btnPrimary, opacity: loading ? 0.7 : 1, marginTop:4}}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Quick fill buttons */}
        <div style={{ marginTop:20, paddingTop:16, borderTop:'1px solid #e2e8f0' }}>
          <div style={{ fontSize:12, color:'#6b7280', marginBottom:10, textAlign:'center' }}>Quick Demo Login</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {[
              ['Back Office', 'admin@sunrcircle.in', 'Admin@Sunr2024'],
              ['Top Mgmt', 'manager@sunrcircle.in', 'Manager@Sunr2024'],
              ['Call Centre', 'callcentre@sunrcircle.in', 'CallCentre@Sunr2024'],
              ['Line Man', 'lineman@sunrcircle.in', 'LineMen@Sunr2024'],
            ].map(([label, e, p]) => (
              <button key={label} type="button" onClick={() => fill(e, p)} style={{ background:'#f0f4ff', color:'#1a3d7c', border:'1px solid #c7d8ff', borderRadius:8, padding:'8px 6px', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ fontSize:11, color:'#9ca3af', textAlign:'center', marginTop:8 }}>Tap a role to fill credentials, then Sign In</div>
        </div>
      </div>
    </div>
  )
}

// ─── COMPLAINT ITEM ───────────────────────────────────────────────────────────
function ComplaintItem({ c, onTap }: { c: Complaint; onTap: () => void }) {
  return (
    <div style={s.complaintItem} onClick={onTap}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <span style={s.compNum}>{c.complaint_number ?? c.raw_complaint_number}</span>
        <span style={s.statusChip(c.status)}>{statusLabel(c.status)}</span>
      </div>
      <div style={s.compName}>{c.consumer_name}</div>
      <div style={s.compNature}>{c.nature_of_complaint.length > 60 ? c.nature_of_complaint.slice(0, 60) + '…' : c.nature_of_complaint}</div>
      <div style={{ fontSize:11, color:'#adb5bd', marginTop:6 }}>{fmtDT(c.created_at)}</div>
    </div>
  )
}

// ─── COMPLAINT DETAIL ─────────────────────────────────────────────────────────
function ComplaintDetail({ c, onBack, session, onRefresh }: { c: Complaint; onBack: () => void; session: UserSession; onRefresh: () => void }) {
  const [updating, setUpdating] = useState(false)
  const [remarks, setRemarks] = useState('')
  const [err, setErr] = useState('')
  const [success, setSuccess] = useState('')

  const canUpdate = session.role === 'line_man' && c.assigned_to === session.id && !['closed','rejected'].includes(c.status)
  const canAccept = session.role === 'line_man' && c.status === 'open'

  const nextStatus = () => {
    if (c.status === 'assigned') return 'in_progress'
    if (c.status === 'in_progress') return 'closed'
    return null
  }

  const doUpdate = async (newStatus: string) => {
    setUpdating(true); setErr(''); setSuccess('')
    try {
      const updates: Record<string, string | null> = { status: newStatus, attend_remarks: remarks || null }
      if (newStatus === 'in_progress') updates.in_progress_at = new Date().toISOString()
      if (newStatus === 'closed' || newStatus === 'rejected') updates.closed_at = new Date().toISOString()
      await supabase.from('complaints').update(updates).eq('id', c.id)
      setSuccess(`Status updated to ${statusLabel(newStatus)}!`)
      setTimeout(() => { onRefresh(); onBack() }, 1200)
    } catch { setErr('Update failed') } finally { setUpdating(false) }
  }

  const doAccept = async () => {
    setUpdating(true); setErr('')
    try {
      await supabase.from('complaints').update({ assigned_to: session.id, status: 'assigned', assigned_at: new Date().toISOString() }).eq('id', c.id)
      setSuccess('Complaint accepted!')
      setTimeout(() => { onRefresh(); onBack() }, 1200)
    } catch { setErr('Accept failed') } finally { setUpdating(false) }
  }

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div style={{ display:'flex', gap:8, marginBottom:8 }}>
      <span style={{ fontSize:12, color:'#6b7280', width:100, flexShrink:0 }}>{label}</span>
      <span style={{ fontSize:13, fontWeight:500, flex:1 }}>{value}</span>
    </div>
  )

  return (
    <div style={s.screen}>
      <div style={s.header}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:'#fff', cursor:'pointer', padding:4 }}><Icon name="back" /></button>
        <div>
          <div style={s.headerTitle}>{c.complaint_number ?? c.raw_complaint_number}</div>
          <div style={s.headerSub}>{c.consumer_name}</div>
        </div>
        <span style={{ ...s.statusChip(c.status), marginLeft:'auto', fontSize:11 }}>{statusLabel(c.status)}</span>
      </div>

      <div style={{...s.body, padding:14}}>
        {err && <div style={s.errorBox}>{err}</div>}
        {success && <div style={{ ...s.errorBox, background:'#dcfce7', border:'1px solid #bbf7d0', color:'#16a34a' }}>{success}</div>}

        <div style={s.card}>
          <div style={s.cardTitle}>Consumer Details</div>
          <Row label="Name" value={c.consumer_name} />
          <Row label="Mobile" value={c.consumer_mobile} />
        </div>

        <div style={s.card}>
          <div style={s.cardTitle}>Complaint Details</div>
          <Row label="Nature" value={c.nature_of_complaint} />
          {c.complaint_remarks && <Row label="Remarks" value={c.complaint_remarks} />}
          <Row label="Sub Division" value={(c.sub_division as { name: string } | null)?.name ?? '—'} />
        </div>

        <div style={s.card}>
          <div style={s.cardTitle}>Timeline</div>
          <Row label="Created" value={fmtDT(c.created_at)} />
          <Row label="Assigned" value={fmtDate(c.assigned_at)} />
          <Row label="In Progress" value={fmtDate(c.in_progress_at)} />
          <Row label="Closed" value={fmtDate(c.closed_at)} />
        </div>

        {c.attend_remarks && (
          <div style={s.card}>
            <div style={s.cardTitle}>Attend Remarks</div>
            <div style={{ fontSize:13, color:'#374151', fontStyle:'italic' }}>{c.attend_remarks}</div>
          </div>
        )}

        {/* Line Man actions */}
        {canAccept && (
          <button style={s.btnPrimary} disabled={updating} onClick={doAccept}>
            {updating ? 'Processing...' : '✓ Accept Complaint'}
          </button>
        )}

        {canUpdate && nextStatus() && (
          <div style={s.card}>
            <div style={s.cardTitle}>Update Status</div>
            <div style={s.formGroup}>
              <label style={s.label}>Remarks</label>
              <textarea style={s.textarea} value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Enter attend remarks..." />
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button style={{...s.btnPrimary, flex:1}} disabled={updating} onClick={() => doUpdate(nextStatus()!)}>
                {updating ? '...' : nextStatus() === 'in_progress' ? 'Start Work' : 'Close Complaint'}
              </button>
              <button style={{...s.btnSecondary, flex:1, padding:'11px 12px', borderColor:'#dc2626', color:'#dc2626'}} disabled={updating} onClick={() => doUpdate('rejected')}>
                Reject
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── CALL CENTRE SCREENS ──────────────────────────────────────────────────────
function CCDashboard({ session, onLogout }: { session: UserSession; onLogout: () => void }) {
  const [tab, setTab] = useState<'home'|'history'|'search'|'settings'>('home')
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [searchQ, setSearchQ] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await getComplaints()
    setComplaints(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (selectedComplaint) return <ComplaintDetail c={selectedComplaint} onBack={() => setSelectedComplaint(null)} session={session} onRefresh={load} />
  if (showCreate) return <CreateComplaintScreen session={session} onBack={() => { setShowCreate(false); load() }} />

  const filtered = tab === 'search' && searchQ
    ? complaints.filter(c => c.consumer_name.toLowerCase().includes(searchQ.toLowerCase()) || c.raw_complaint_number.toLowerCase().includes(searchQ.toLowerCase()) || c.consumer_mobile.includes(searchQ))
    : complaints

  const renderHome = () => (
    <div style={s.body}>
      <div style={{ fontSize:17, fontWeight:600, marginBottom:4 }}>Welcome, {session.fullName}</div>
      <div style={{ fontSize:13, color:'#6b7280', marginBottom:16 }}>Call Centre Agent</div>

      <button style={s.btnPrimary} onClick={() => setShowCreate(true)}>+ Create New Complaint</button>
      <div style={{ height:12 }} />

      <div style={s.infoBox}>Tap a complaint to view details</div>

      {loading ? (
        [1,2,3].map(i => <div key={i} style={{ ...s.complaintItem, height:80, background:'#f3f4f6', border:'none' }} />)
      ) : (
        complaints.slice(0, 5).map(c => <ComplaintItem key={c.id} c={c} onTap={() => setSelectedComplaint(c)} />)
      )}
    </div>
  )

  const renderHistory = () => (
    <div style={s.body}>
      <div style={{ fontSize:16, fontWeight:600, marginBottom:12 }}>Complaint History</div>
      {loading ? <div style={{ textAlign:'center', color:'#6b7280', padding:32 }}>Loading...</div>
        : complaints.length === 0 ? <div style={{ textAlign:'center', color:'#6b7280', padding:32 }}>No complaints found</div>
        : complaints.map(c => <ComplaintItem key={c.id} c={c} onTap={() => setSelectedComplaint(c)} />)}
    </div>
  )

  const renderSearch = () => (
    <div style={s.body}>
      <input style={{...s.input, marginBottom:12}} placeholder="Search by name, number or mobile..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
      {searchQ === '' ? (
        <div style={{ textAlign:'center', color:'#6b7280', padding:32 }}>Enter search term above</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', color:'#6b7280', padding:32 }}>No results</div>
      ) : filtered.map(c => <ComplaintItem key={c.id} c={c} onTap={() => setSelectedComplaint(c)} />)}
    </div>
  )

  const renderSettings = () => (
    <div style={s.body}>
      <div style={s.card}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:48, height:48, borderRadius:24, background:'#1a3d7c', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:18, fontWeight:700 }}>
            {session.fullName.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight:600 }}>{session.fullName}</div>
            <div style={{ fontSize:12, color:'#6b7280' }}>{session.email}</div>
            <div style={{ fontSize:11, background:'#e8eeff', color:'#1a3d7c', display:'inline-block', padding:'2px 8px', borderRadius:10, marginTop:3 }}>{roleLabel(session.role)}</div>
          </div>
        </div>
      </div>
      <button style={{ ...s.btnSecondary, borderColor:'#dc2626', color:'#dc2626', marginTop:8 }} onClick={onLogout}>Sign Out</button>
    </div>
  )

  return (
    <div style={s.screen}>
      <div style={s.header}><div><div style={s.headerTitle}>SUNR Circle</div><div style={s.headerSub}>Call Centre</div></div></div>
      {tab === 'home' ? renderHome() : tab === 'history' ? renderHistory() : tab === 'search' ? renderSearch() : renderSettings()}
      <nav style={s.bottomNav}>
        {([['home','Home','home'],['history','History','file'],['search','Search','search'],['settings','Settings','settings']] as const).map(([id, label, icon]) => (
          <button key={id} style={s.navBtn(tab === id)} onClick={() => setTab(id)}>
            <Icon name={icon} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

// ─── CREATE COMPLAINT ─────────────────────────────────────────────────────────
function CreateComplaintScreen({ session, onBack }: { session: UserSession; onBack: () => void }) {
  const [form, setForm] = useState({ consumerName:'', consumerMobile:'', nature:'', remarks:'', rawNumber:'' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.consumerName || !form.consumerMobile || !form.nature || !form.rawNumber) { setError('All required fields must be filled'); return }
    if (!/^[6-9][0-9]{9}$/.test(form.consumerMobile)) { setError('Enter a valid 10-digit Indian mobile number'); return }
    setLoading(true); setError('')
    try {
      const profile = await supabase.from('users').select('organization_id,sub_division_id').eq('id', session.id).single()
      if (!profile.data) throw new Error('Profile not found')
      await supabase.from('complaints').insert({
        organization_id: profile.data.organization_id,
        sub_division_id: profile.data.sub_division_id,
        raw_complaint_number: form.rawNumber.toUpperCase().trim(),
        consumer_name: form.consumerName.trim(),
        consumer_mobile: form.consumerMobile.trim(),
        nature_of_complaint: form.nature.trim(),
        complaint_remarks: form.remarks.trim() || null,
        created_by: session.id,
        status: 'open',
      })
      setSuccess(true)
      setTimeout(onBack, 1500)
    } catch (err: unknown) {
      const msg = (err as Error).message
      if (msg.includes('unique') || msg.includes('duplicate')) setError('Complaint number already exists for this Sub Division')
      else setError(msg)
    } finally { setLoading(false) }
  }

  return (
    <div style={s.screen}>
      <div style={s.header}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:'#fff', cursor:'pointer', padding:4 }}><Icon name="back" /></button>
        <div style={s.headerTitle}>New Complaint</div>
      </div>
      <div style={{...s.body}}>
        {success ? (
          <div style={{ textAlign:'center', padding:40 }}>
            <div style={{ fontSize:48 }}>✅</div>
            <div style={{ fontSize:18, fontWeight:600, marginTop:16 }}>Complaint Created!</div>
          </div>
        ) : (
          <form onSubmit={submit}>
            {error && <div style={s.errorBox}>{error}</div>}
            {[
              { key:'consumerName', label:'Consumer Name *', type:'text', placeholder:'e.g. Ramesh Patel' },
              { key:'consumerMobile', label:'Consumer Mobile *', type:'tel', placeholder:'10-digit mobile number' },
              { key:'rawNumber', label:'Complaint Reference No. *', type:'text', placeholder:'e.g. FC12345' },
              { key:'nature', label:'Nature of Complaint *', type:'text', placeholder:'e.g. No Power Supply' },
              { key:'remarks', label:'Remarks (optional)', type:'text', placeholder:'Additional details...' },
            ].map(f => (
              <div key={f.key} style={s.formGroup}>
                <label style={s.label}>{f.label}</label>
                {f.key === 'nature' || f.key === 'remarks' ? (
                  <textarea style={s.textarea} placeholder={f.placeholder} value={(form as Record<string,string>)[f.key]} onChange={e => set(f.key, e.target.value)} />
                ) : (
                  <input style={s.input} type={f.type} placeholder={f.placeholder} value={(form as Record<string,string>)[f.key]} onChange={e => set(f.key, e.target.value)} maxLength={f.key==='consumerMobile'?10:undefined} />
                )}
              </div>
            ))}
            <button type="submit" disabled={loading} style={{...s.btnPrimary, opacity:loading?0.7:1}}>
              {loading ? 'Creating...' : 'Create Complaint'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// ─── LINE MAN SCREENS ─────────────────────────────────────────────────────────
function LMDashboard({ session, onLogout }: { session: UserSession; onLogout: () => void }) {
  const [tab, setTab] = useState<'home'|'open'|'assigned'|'settings'>('home')
  const [openC, setOpenC] = useState<Complaint[]>([])
  const [assignedC, setAssignedC] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Complaint | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [o, a] = await Promise.all([
      getComplaints({ status: 'open' }),
      getComplaints({ assignedTo: session.id }),
    ])
    setOpenC(o); setAssignedC(a); setLoading(false)
  }, [session.id])

  useEffect(() => { load() }, [load])

  if (selected) return <ComplaintDetail c={selected} onBack={() => setSelected(null)} session={session} onRefresh={load} />

  const renderHome = () => (
    <div style={s.body}>
      <div style={{ fontSize:17, fontWeight:600, marginBottom:4 }}>Welcome, {session.fullName}</div>
      <div style={{ fontSize:13, color:'#6b7280', marginBottom:16 }}>Line Man</div>

      <div style={s.statsGrid}>
        <div style={s.statCard('#dbeafe')}>
          <div style={{...s.statNum, color:'#2563eb'}}>{openC.length}</div>
          <div style={s.statLabel}>Open Complaints</div>
        </div>
        <div style={s.statCard('#dcfce7')}>
          <div style={{...s.statNum, color:'#16a34a'}}>{assignedC.filter(c => c.status === 'in_progress').length}</div>
          <div style={s.statLabel}>In Progress</div>
        </div>
      </div>

      <div style={{ fontSize:14, fontWeight:600, marginBottom:10 }}>My Assigned Complaints</div>
      {loading ? <div style={{ textAlign:'center', color:'#6b7280', padding:24 }}>Loading...</div>
        : assignedC.length === 0 ? <div style={{ ...s.infoBox, textAlign:'center' }}>No assigned complaints</div>
        : assignedC.map(c => <ComplaintItem key={c.id} c={c} onTap={() => setSelected(c)} />)}
    </div>
  )

  return (
    <div style={s.screen}>
      <div style={s.header}><div><div style={s.headerTitle}>SUNR Circle</div><div style={s.headerSub}>Line Man</div></div></div>

      {tab === 'home' ? renderHome() : tab === 'open' ? (
        <div style={s.body}>
          <div style={{ fontSize:16, fontWeight:600, marginBottom:12 }}>Open Complaints</div>
          {loading ? <div style={{ textAlign:'center', color:'#6b7280', padding:24 }}>Loading...</div>
            : openC.length === 0 ? <div style={{ ...s.infoBox, textAlign:'center' }}>No open complaints</div>
            : openC.map(c => <ComplaintItem key={c.id} c={c} onTap={() => setSelected(c)} />)}
        </div>
      ) : tab === 'assigned' ? (
        <div style={s.body}>
          <div style={{ fontSize:16, fontWeight:600, marginBottom:12 }}>My Assigned Complaints</div>
          {loading ? <div style={{ textAlign:'center', color:'#6b7280', padding:24 }}>Loading...</div>
            : assignedC.length === 0 ? <div style={{ ...s.infoBox, textAlign:'center' }}>No assigned complaints</div>
            : assignedC.map(c => <ComplaintItem key={c.id} c={c} onTap={() => setSelected(c)} />)}
        </div>
      ) : (
        <div style={s.body}>
          <div style={s.card}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:48, height:48, borderRadius:24, background:'#1a3d7c', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:18, fontWeight:700 }}>{session.fullName.charAt(0)}</div>
              <div>
                <div style={{ fontWeight:600 }}>{session.fullName}</div>
                <div style={{ fontSize:12, color:'#6b7280' }}>{session.email}</div>
                <div style={{ fontSize:11, background:'#e8eeff', color:'#1a3d7c', display:'inline-block', padding:'2px 8px', borderRadius:10, marginTop:3 }}>Line Man</div>
              </div>
            </div>
          </div>
          <button style={{ ...s.btnSecondary, borderColor:'#dc2626', color:'#dc2626', marginTop:8 }} onClick={onLogout}>Sign Out</button>
        </div>
      )}

      <nav style={s.bottomNav}>
        {([['home','Home','home'],['open','Open','inbox'],['assigned','Assigned','assigned'],['settings','Settings','settings']] as const).map(([id, label, icon]) => (
          <button key={id} style={s.navBtn(tab === id)} onClick={() => setTab(id)}>
            <Icon name={icon} />
            <span style={{ fontSize:9 }}>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

// ─── TOP MANAGEMENT SCREEN ────────────────────────────────────────────────────
function TMDashboard({ session, onLogout }: { session: UserSession; onLogout: () => void }) {
  const [tab, setTab] = useState<'home'|'complaints'|'stats'|'settings'>('home')
  const [stats, setStats] = useState({ total:0, open:0, assigned:0, inProgress:0, closed:0 })
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [selected, setSelected] = useState<Complaint | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const [s, c] = await Promise.all([
      getDashboardStats(session.organizationId),
      getComplaints(),
    ])
    setStats(s); setComplaints(c); setLoading(false)
  }, [session.organizationId])

  useEffect(() => { load() }, [load])

  if (selected) return <ComplaintDetail c={selected} onBack={() => setSelected(null)} session={session} onRefresh={load} />

  const StatCard = ({ label, value, bg, color }: { label: string; value: number; bg: string; color: string }) => (
    <div style={s.statCard(bg)}>
      <div style={{...s.statNum, color}}>{value}</div>
      <div style={s.statLabel}>{label}</div>
    </div>
  )

  return (
    <div style={s.screen}>
      <div style={s.header}><div><div style={s.headerTitle}>SUNR Circle</div><div style={s.headerSub}>Top Management</div></div></div>

      {tab === 'home' ? (
        <div style={s.body}>
          <div style={{ fontSize:16, fontWeight:600, marginBottom:14 }}>Overview</div>
          {loading ? <div style={{ textAlign:'center', color:'#6b7280', padding:24 }}>Loading...</div> : (
            <>
              <div style={{ ...s.statsGrid, gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
                <StatCard label="Total" value={stats.total} bg="#e8eeff" color="#1a3d7c" />
                <StatCard label="Open" value={stats.open} bg="#dbeafe" color="#2563eb" />
                <StatCard label="Assigned" value={stats.assigned} bg="#fef3c7" color="#d97706" />
              </div>
              <div style={{ ...s.statsGrid, gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <StatCard label="In Progress" value={stats.inProgress} bg="#ffedd5" color="#ea580c" />
                <StatCard label="Closed" value={stats.closed} bg="#dcfce7" color="#16a34a" />
              </div>
              <div style={{ fontSize:14, fontWeight:600, marginBottom:10, marginTop:4 }}>Recent Complaints</div>
              {complaints.slice(0, 3).map(c => <ComplaintItem key={c.id} c={c} onTap={() => setSelected(c)} />)}
            </>
          )}
        </div>
      ) : tab === 'complaints' ? (
        <div style={s.body}>
          <div style={{ fontSize:16, fontWeight:600, marginBottom:12 }}>All Complaints</div>
          {loading ? <div style={{ textAlign:'center', color:'#6b7280', padding:24 }}>Loading...</div>
            : complaints.map(c => <ComplaintItem key={c.id} c={c} onTap={() => setSelected(c)} />)}
        </div>
      ) : tab === 'stats' ? (
        <div style={s.body}>
          <div style={{ fontSize:16, fontWeight:600, marginBottom:14 }}>Statistics</div>
          {[
            ['Open', stats.open, stats.total, '#2563eb'],
            ['Assigned', stats.assigned, stats.total, '#d97706'],
            ['In Progress', stats.inProgress, stats.total, '#ea580c'],
            ['Closed', stats.closed, stats.total, '#16a34a'],
          ].map(([label, val, total, color]) => {
            const pct = (total as number) > 0 ? Math.round((val as number) / (total as number) * 100) : 0
            return (
              <div key={String(label)} style={{ marginBottom:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:13, fontWeight:500 }}>{label}</span>
                  <span style={{ fontSize:13, color:'#6b7280' }}>{val} ({pct}%)</span>
                </div>
                <div style={{ height:10, background:'#e2e8f0', borderRadius:5, overflow:'hidden' }}>
                  <div style={{ height:'100%', background:String(color), borderRadius:5, width:`${pct}%`, transition:'width 0.5s' }} />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={s.body}>
          <div style={s.card}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:48, height:48, borderRadius:24, background:'#1a3d7c', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:18, fontWeight:700 }}>{session.fullName.charAt(0)}</div>
              <div>
                <div style={{ fontWeight:600 }}>{session.fullName}</div>
                <div style={{ fontSize:12, color:'#6b7280' }}>{session.email}</div>
                <div style={{ fontSize:11, background:'#e8eeff', color:'#1a3d7c', display:'inline-block', padding:'2px 8px', borderRadius:10, marginTop:3 }}>Top Management</div>
              </div>
            </div>
          </div>
          <button style={{ ...s.btnSecondary, borderColor:'#dc2626', color:'#dc2626', marginTop:8 }} onClick={onLogout}>Sign Out</button>
        </div>
      )}

      <nav style={s.bottomNav}>
        {([['home','Home','home'],['complaints','Complaints','file'],['stats','Stats','bar'],['settings','Settings','settings']] as const).map(([id, label, icon]) => (
          <button key={id} style={s.navBtn(tab === id)} onClick={() => setTab(id)}>
            <Icon name={icon} />
            <span style={{ fontSize:9 }}>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

// ─── BACK OFFICE / REDIRECT ───────────────────────────────────────────────────
function BackOfficeBanner({ onLogout }: { session: UserSession; onLogout: () => void }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100dvh', background:'#f5f6fa' }}>
      <div style={s.header}><div><div style={s.headerTitle}>SUNR Circle</div><div style={s.headerSub}>Admin Panel</div></div></div>
      <div style={{ flex:1, padding:24, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center' }}>
        <div style={{ fontSize:48 }}>💻</div>
        <div style={{ fontSize:18, fontWeight:700, marginTop:16 }}>Back Office Role</div>
        <div style={{ fontSize:14, color:'#6b7280', marginTop:8, lineHeight:1.6 }}>
          The Back Office role is designed for the web Admin Panel.<br />Please open the Admin Panel:
        </div>
        <div style={{ marginTop:20, background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, padding:16, width:'100%' }}>
          <div style={{ fontSize:13, color:'#6b7280', marginBottom:8 }}>Admin Panel URL</div>
          <div style={{ fontSize:14, fontWeight:600, color:'#1a3d7c', wordBreak:'break-all' }}>admin-pi-blue.vercel.app</div>
        </div>
        <button style={{ ...s.btnSecondary, marginTop:20, borderColor:'#dc2626', color:'#dc2626' }} onClick={onLogout}>Sign Out</button>
      </div>
    </div>
  )
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState<UserSession | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (s?.user) {
        const { data: profile } = await supabase.from('users').select('role,organization_id,sub_division_id,full_name').eq('id', s.user.id).single()
        if (profile) {
          setSession({ id: s.user.id, email: s.user.email!, role: profile.role, fullName: profile.full_name, organizationId: profile.organization_id, subDivisionId: profile.sub_division_id })
        }
      }
      setChecking(false)
    })
  }, [])

  const handleLogout = async () => { await signOut(); setSession(null) }

  if (checking) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100dvh', flexDirection:'column', gap:12 }}>
      <div style={{ fontSize:32 }}>⚡</div>
      <div style={{ color:'#1a3d7c', fontWeight:600 }}>SUNR Circle</div>
      <div style={{ color:'#6b7280', fontSize:13 }}>Loading...</div>
    </div>
  )

  if (!session) return <LoginScreen onLogin={setSession} />
  if (session.role === 'call_centre') return <CCDashboard session={session} onLogout={handleLogout} />
  if (session.role === 'line_man') return <LMDashboard session={session} onLogout={handleLogout} />
  if (session.role === 'top_management') return <TMDashboard session={session} onLogout={handleLogout} />
  return <BackOfficeBanner session={session} onLogout={handleLogout} />
}
