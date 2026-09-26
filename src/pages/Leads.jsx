import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../context/useApp'
import LoadingSkeleton from '../components/LoadingSkeleton'

const stages = ['New', 'Contacted', 'Site Visit', 'Interested', 'Negotiation', 'Booked', 'Not Interested']

function ChatIcon({ name }) {
  const paths = {
    message: <><path d="M5 5.5h10a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H9l-3.5 2v-2H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2Z" /><path d="M7 9.5h6M7 12h4" /></>,
    camera: <><path d="M4 7.5h3l1-1.5h4l1 1.5h3a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1Z" /><circle cx="10" cy="11.5" r="2.5" /></>,
    file: <><path d="M6 2.5h5l3 3v12H6a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1Z" /><path d="M11 2.5v3h3M7.5 10h5M7.5 13h5" /></>,
    paperclip: <path d="m13.5 6.5-5.8 5.8a2.25 2.25 0 0 0 3.2 3.2l6-6a3.75 3.75 0 1 0-5.3-5.3l-6.2 6.2a5.25 5.25 0 0 0 7.4 7.4l5.1-5.1" />,
    download: <><path d="M10 3v9M6.5 9.5 10 13l3.5-3.5M4 16.5h12" /></>,
    send: <path d="m3 3 14 7-14 7 3.5-7L3 3Zm3.5 7h10" />,
    close: <><path d="m6 6 8 8M14 6l-8 8" /></>
  }[name]

  return <svg className="ui-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths}</svg>
}

export default function Leads() {
  const { account, employees, leads, leadsStatus, refreshLeads, properties, createLead, updateLead, updateLeadStage, assignLead, createMeeting, getLeadConversation, getLeadBrief, createLeadMessage, createLeadCall, uploadFile } = useApp()
  const [open, setOpen] = useState(false)
  const [editingLead, setEditingLead] = useState(null)
  const [query, setQuery] = useState('')
  const [propertyFilter, setPropertyFilter] = useState('All properties')
  const [stageFilter, setStageFilter] = useState('All stages')
  const [selectedLeadId, setSelectedLeadId] = useState(null)
  const [chatMessages, setChatMessages] = useState({})
  const [serverMessages, setServerMessages] = useState({})
  const [conversationStatus, setConversationStatus] = useState({})
  const [serverCalls, setServerCalls] = useState({})
  const [callsLoaded, setCallsLoaded] = useState({})
  const [serverBriefs, setServerBriefs] = useState({})
  const [briefStatus, setBriefStatus] = useState({})
  const [briefRetry, setBriefRetry] = useState(0)
  const [conversationRetry, setConversationRetry] = useState(0)
  const [chatDraft, setChatDraft] = useState('')
  const [attachedFiles, setAttachedFiles] = useState([])
  const [showMediaPicker, setShowMediaPicker] = useState(false)
  const [activeCall, setActiveCall] = useState(null)
  const [callNote, setCallNote] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(8)
  const [chatOpen, setChatOpen] = useState(false)
  const [meetingOpen, setMeetingOpen] = useState(false)
  const [meetingForm, setMeetingForm] = useState({ date: '', time: '10:00', type: 'Site visit', notes: '' })
  const fileInputRef = useRef(null)
  const employeeIndex = useMemo(() => new Map(employees.map((employee) => [employee.id, employee])), [employees])

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    property: properties[0]?.name || '',
    unit: properties[0]?.units?.[0] || '',
    stage: 'New',
    askingPrice: '',
    budget: ''
  })

  const filteredLeads = useMemo(() => leads.filter((lead) => {
    const matchesQuery = `${lead.name} ${lead.email} ${lead.phone || ''} ${lead.property} ${lead.unit || ''}`.toLowerCase().includes(query.toLowerCase())
    const matchesProperty = propertyFilter === 'All properties' || lead.property === propertyFilter
    const matchesStage = stageFilter === 'All stages' || lead.stage === stageFilter
    return matchesQuery && matchesProperty && matchesStage
  }), [leads, query, propertyFilter, stageFilter])

  const selectedLead = leads.find((lead) => lead.id === selectedLeadId) || filteredLeads[0] || leads[0] || null
  const selectedLeadKey = selectedLead?.id
  const propertyIndex = useMemo(() => new Map(properties.map((property) => [property.name, property])), [properties])
  const selectedProperty = selectedLead ? propertyIndex.get(selectedLead.property) : null
  useEffect(() => {
    if (!chatOpen || !selectedLeadKey) return undefined
    let active = true
    getLeadConversation(selectedLeadKey).then((conversation) => {
      if (!active) return
      if (conversation === null) {
        setConversationStatus((current) => ({ ...current, [selectedLeadKey]: 'error' }))
        return
      }
      setServerMessages((current) => ({ ...current, [selectedLeadKey]: conversation.messages }))
      setServerCalls((current) => ({ ...current, [selectedLeadKey]: conversation.calls }))
      setConversationStatus((current) => ({ ...current, [selectedLeadKey]: 'success' }))
      setCallsLoaded((current) => ({ ...current, [selectedLeadKey]: true }))
    })
    return () => { active = false }
  }, [chatOpen, selectedLeadKey, getLeadConversation, conversationRetry])
  useEffect(() => {
    if (!selectedLeadKey) return undefined
    let active = true
    getLeadBrief(selectedLeadKey).then((brief) => {
      if (!active) return
      if (brief === null) {
        setBriefStatus((current) => ({ ...current, [selectedLeadKey]: 'error' }))
        return
      }
      setServerBriefs((current) => ({ ...current, [selectedLeadKey]: brief }))
      setBriefStatus((current) => ({ ...current, [selectedLeadKey]: 'success' }))
    })
    return () => { active = false }
  }, [selectedLeadKey, getLeadBrief, briefRetry])
  const pageCount = Math.max(1, Math.ceil(filteredLeads.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const paginatedLeads = filteredLeads.slice((safePage - 1) * pageSize, safePage * pageSize)

  const chatThread = useMemo(() => {
    if (!selectedLead) return []
    const history = conversationStatus[selectedLead.id] === 'success' ? serverMessages[selectedLead.id] || [] : []
    const persistedMessages = (history || []).map((message) => {
      const files = message.files || message.attachments || []
      return {
        ...message,
        sender: message.sender === 'agent' ? 'agent' : 'lead',
        text: message.text || message.body || '',
        time: message.time || (message.createdAt ? new Date(message.createdAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : ''),
        files: files.map((file) => ({ ...file, url: file.url || file.path, isImage: file.isImage ?? (file.type === 'image' || /\.(png|jpe?g|gif|webp)$/i.test(file.name || file.url || '')) }))
      }
    })
    const persistedCalls = (callsLoaded[selectedLead.id] ? serverCalls[selectedLead.id] || [] : []).map((call) => ({
      sender: 'agent',
      isCallLog: true,
      text: `Phone call completed with ${selectedLead.name} (${call.phone || selectedLead.phone || 'lead'}).${call.notes ? ` Call notes: "${call.notes}".` : ' Follow-up recorded.'}`,
      time: call.time || (call.createdAt ? new Date(call.createdAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : 'Call logged'),
      createdAt: call.createdAt
    }))
    return [...persistedMessages, ...persistedCalls, ...(chatMessages[selectedLead.id] || [])]
  }, [selectedLead, chatMessages, serverMessages, serverCalls, conversationStatus, callsLoaded])

  const propertyOptions = ['All properties', ...properties.map((property) => property.name)]
  const stageOptions = ['All stages', ...stages]

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const resetPage = () => setPage(1)
  const updateMeeting = (key, value) => setMeetingForm((current) => ({ ...current, [key]: value }))

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return
    const newAttachments = files.map((file) => ({
      name: file.name,
      size: (file.size / 1024).toFixed(0) + ' KB',
      isImage: file.type.startsWith('image/'),
      file,
      url: URL.createObjectURL(file)
    }))
    setAttachedFiles((current) => [...current, ...newAttachments])
    event.target.value = ''
  }

  const handleAttachPropertyPhoto = (imageUrl, label) => {
    if (attachedFiles.some((f) => f.url === imageUrl)) return
    setAttachedFiles((current) => [
      ...current,
      {
        name: label || `${selectedProperty?.name || 'Property'} Photo.jpg`,
        url: imageUrl,
        isImage: true,
        size: 'Portfolio'
      }
    ])
  }

  const sendMessage = async (event) => {
    event.preventDefault()
    const message = chatDraft.trim()
    if ((!message && !attachedFiles.length) || !selectedLead) return
    const localMessage = {
      id: crypto.randomUUID(),
      sender: 'agent',
      text: message,
      files: attachedFiles.length ? [...attachedFiles] : undefined,
      time: 'Just now',
      createdAt: new Date().toISOString()
    }
    setChatMessages((current) => ({
      ...current,
      [selectedLead.id]: [...(current[selectedLead.id] || []), localMessage],
    }))
    const uploadedFiles = await Promise.all(attachedFiles.map(async (file) => {
      if (file.file) {
        const result = await uploadFile(file.file)
        const savedFile = result?.file || result
        return savedFile?.url ? { name: savedFile.name || file.name, url: savedFile.url, type: file.isImage ? 'image' : 'file', isImage: file.isImage } : null
      }
      return file.url && !file.url.startsWith('blob:') ? { name: file.name, url: file.url, type: file.isImage ? 'image' : 'file' } : null
    }))
    const saved = await createLeadMessage(selectedLead.id, { sender: 'agent', text: message, attachments: uploadedFiles.filter(Boolean) })
    if (saved) setChatMessages((current) => ({
      ...current,
      [selectedLead.id]: (current[selectedLead.id] || []).map((item) => item.id === localMessage.id ? { ...localMessage, ...saved, files: saved.attachments || uploadedFiles.filter(Boolean) } : item)
    }))
    setChatDraft('')
    setAttachedFiles([])
    setShowMediaPicker(false)
  }

  const handleStartCall = (lead) => {
    setActiveCall({ ...lead, startedAt: new Date().toISOString() })
    setCallNote('')
  }

  const handleEndCall = async () => {
    if (!activeCall) return
    const endedAt = new Date().toISOString()
    const noteText = callNote.trim() ? ` Call notes: "${callNote.trim()}".` : ' Follow-up recorded.'
    setChatMessages((current) => ({
      ...current,
      [activeCall.id]: [
        ...(current[activeCall.id] || []),
        {
          sender: 'agent',
          text: `Phone call completed with ${activeCall.name} (${activeCall.phone || 'lead'}).${noteText}`,
          time: 'Just now',
          isCallLog: true
        }
      ]
    }))
    await createLeadCall(activeCall.id, { phone: activeCall.phone, notes: callNote.trim(), startedAt: activeCall.startedAt, endedAt })
    setActiveCall(null)
    setCallNote('')
  }

  const scheduleMeeting = (event) => {
    event.preventDefault()
    if (!selectedLead || !meetingForm.date) return
    createMeeting({
      ...meetingForm,
      leadId: selectedLead.id,
      lead: selectedLead.name,
      property: selectedLead.property,
      unit: selectedLead.unit || ''
    })
    setMeetingOpen(false)
    setMeetingForm({ date: '', time: '10:00', type: 'Site visit', notes: '' })
  }

  const submit = (event) => {
    event.preventDefault()
    if (!form.property) return
    const linkedProperty = properties.find((property) => property.name === form.property)
    const leadChanges = {
      ...form,
      postedPrice: linkedProperty?.price || 'To confirm',
      askingPrice: form.askingPrice || form.budget || 'To confirm',
      budget: form.askingPrice || form.budget || 'Budget to confirm'
    }
    if (editingLead) {
      updateLead(editingLead.id, leadChanges)
      setSelectedLeadId(editingLead.id)
    } else {
      createLead(leadChanges)
    }
    setOpen(false)
    setEditingLead(null)
    setForm({
      name: '',
      email: '',
      phone: '',
      property: properties[0]?.name || '',
      unit: properties[0]?.units?.[0] || '',
      stage: 'New',
      askingPrice: '',
      budget: ''
    })
  }

  return <div className="page-wrap lead-page">
    <div className="page-heading">
      <div>
        <span className="eyebrow">CONNECTED TO PROPERTIES</span>

    {leadsStatus === 'error' && <div className="empty-line" role="alert">Could not load leads from the API. <button type="button" className="text-button" onClick={refreshLeads}>Retry</button></div>}
        <h1>Leads</h1>
        <p>Manage buyer conversations connected to each property opportunity.</p>
      </div>
      <button className="button primary" type="button" onClick={() => { setEditingLead(null); setOpen(true) }} disabled={!properties.length}>
        Add lead <span>+</span>
      </button>
    </div>

    {!properties.length ? (
      <section className="empty-hero compact">
        <div className="empty-mark">✦</div>
        <h2>Create a property before adding leads.</h2>
        <p>That keeps every relationship anchored to a live property and a clear sales path.</p>
      </section>
    ) : (
      <section className="lead-management-layout">
        <div className="panel lead-list-panel">
          <div className="lead-toolbar">
            <div className="search-box">
              <span>⌕</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search leads, phone, unit, property..." aria-label="Search leads" />
            </div>
            <select value={propertyFilter} onChange={(event) => { setPropertyFilter(event.target.value); resetPage() }} aria-label="Filter by property">
              {propertyOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
            <select value={stageFilter} onChange={(event) => { setStageFilter(event.target.value); resetPage() }} aria-label="Filter by stage">
              {stageOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </div>

          <div className="lead-table-scroll">
            <div className="lead-list-header">
              <span>Lead</span>
              <span>Mobile</span>
              <span>Unit</span>
              <span>Stage</span>
              <span>Posted price</span>
              <span>Asking price</span>
            </div>

            {leadsStatus === 'loading' ? (
              <div className="lead-list lead-list-skeleton" aria-label="Loading leads">
                {Array.from({ length: 6 }, (_, row) => <div className="lead-row skeleton-lead-row" key={row}>{Array.from({ length: 6 }, (_, cell) => <LoadingSkeleton key={cell} />)}</div>)}
              </div>
            ) : filteredLeads.length ? (
              <div className="lead-list">
              {paginatedLeads.map((lead) => (
                <div
                  role="button"
                  tabIndex={0}
                  key={lead.id}
                  className={`lead-row ${selectedLead?.id === lead.id ? 'selected' : ''}`}
                  onClick={() => setSelectedLeadId(lead.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      setSelectedLeadId(lead.id)
                    }
                  }}
                >
                  <div className="lead-person">
                    <span className="avatar">{lead.initials}</span>
                    <div>
                      <strong>{lead.name}</strong>
                      <small>{lead.email}</small>
                    </div>
                  </div>

                  <div className="lead-mobile">
                    <strong>{lead.phone || 'No mobile'}</strong>
                  </div>

                  <div className="lead-unit">
                    <strong>{lead.unit ? `Unit ${lead.unit}` : 'Any unit'}</strong>
                    <small>{propertyIndex.get(lead.property)?.name || lead.property}</small>
                  </div>

                  <div className="lead-stage-wrap" onClick={(event) => event.stopPropagation()}>
                    <select
                      className={`status stage-${lead.stage.toLowerCase().replace(/\s+/g, '-')} lead-row-status-select`}
                      value={lead.stage}
                      onChange={(event) => {
                        updateLeadStage(lead.id, event.target.value)
                        setSelectedLeadId(lead.id)
                      }}
                      aria-label={`Change stage for ${lead.name}`}
                    >
                      {stages.map((stage) => (
                        <option key={stage} value={stage}>{stage}</option>
                      ))}
                    </select>
                  </div>

                  <div className="lead-price">
                    <strong>{lead.postedPrice || propertyIndex.get(lead.property)?.price || 'To confirm'}</strong>
                  </div>

                  <div className="lead-price asking-price">
                    <strong>{lead.askingPrice || lead.budget || 'To confirm'}</strong>
                  </div>
                </div>
              ))}
              </div>
            ) : (
              <div className="empty-line">{leadsStatus === 'loading' ? 'Loading leads...' : leadsStatus === 'error' ? 'The lead list is unavailable.' : 'No leads match the current search or filters.'}</div>
            )}
          </div>
          {filteredLeads.length > 0 && <div className="lead-pagination">
            <span>Showing {((safePage - 1) * pageSize) + 1}-{Math.min(safePage * pageSize, filteredLeads.length)} of {filteredLeads.length}</span>
            <div className="pagination-controls">
              <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); resetPage() }} aria-label="Leads per page">
                <option value="8">8 / page</option>
                <option value="12">12 / page</option>
                <option value="24">24 / page</option>
              </select>
              <button type="button" className="pagination-button" disabled={safePage === 1} onClick={() => setPage((current) => current - 1)} aria-label="Previous page">‹</button>
              <strong>{safePage} / {pageCount}</strong>
              <button type="button" className="pagination-button" disabled={safePage === pageCount} onClick={() => setPage((current) => current + 1)} aria-label="Next page">›</button>
            </div>
          </div>}
        </div>

        <aside className="panel lead-detail-panel">
          {selectedLead ? (
            <>
              <div className="lead-detail-header">
                <div className="avatar large">{selectedLead.initials}</div>
                <div>
                  <span className="eyebrow">Lead desk</span>
                  <h2>{selectedLead.name}</h2>
                </div>
                <button
                  type="button"
                  className="lead-edit-button"
                  onClick={() => {
                    setEditingLead(selectedLead)
                    setForm({
                      name: selectedLead.name || '',
                      email: selectedLead.email || '',
                      phone: selectedLead.phone || '',
                      property: selectedLead.property || properties[0]?.name || '',
                      unit: selectedLead.unit || '',
                      stage: selectedLead.stage || 'New',
                      askingPrice: selectedLead.askingPrice || selectedLead.budget || '',
                      budget: selectedLead.budget || ''
                    })
                    setOpen(true)
                  }}
                >
                  Edit lead
                </button>
              </div>

              <div className="lead-contact-strip">
                <div className="lead-contact-cards">
                  <div className="contact-card">
                    <span className="contact-label">Mobile</span>
                    <strong className="contact-value">{selectedLead.phone || 'No mobile added'}</strong>
                  </div>
                  <div className="contact-card">
                    <span className="contact-label">Interested unit</span>
                    <strong className="contact-value highlight">{selectedLead.unit ? `Unit ${selectedLead.unit}` : 'Any unit'}</strong>
                  </div>
                  <div className="contact-card">
                    <span className="contact-label">Email</span>
                    <strong className="contact-value">{selectedLead.email}</strong>
                  </div>
                  <div className="contact-card">
                    <span className="contact-label">Assigned employee</span>
                    {account?.role === 'admin' ? <select className="contact-assignment" value={selectedLead.assignedTo || ''} onChange={(event) => assignLead(selectedLead.id, event.target.value)}><option value="">Unassigned</option>{employees.map((employee) => <option value={employee.id} key={employee.id}>{employee.name}</option>)}</select> : <strong className="contact-value">{employeeIndex.get(selectedLead.assignedTo)?.name || 'Unassigned'}</strong>}
                  </div>
                </div>

                <div className="lead-quick-actions">
                  <a
                    href={selectedLead.phone ? `tel:${selectedLead.phone.replace(/[^\d+]/g, '')}` : undefined}
                    className={`lead-action-btn call-action ${!selectedLead.phone ? 'disabled' : ''}`}
                    onClick={(event) => {
                      if (!selectedLead.phone) {
                        event.preventDefault()
                        return
                      }
                      handleStartCall(selectedLead)
                    }}
                    title={selectedLead.phone ? `Call ${selectedLead.phone}` : 'No phone number available'}
                  >
                    <span className="action-icon">📞</span>
                    <span>Call {selectedLead.name.split(' ')[0]}</span>
                  </a>
                  <a
                    href={`mailto:${selectedLead.email}`}
                    className="lead-action-btn email-action"
                    title={`Email ${selectedLead.email}`}
                  >
                    <span className="action-icon">✉</span>
                    <span>Email</span>
                  </a>
                  <button type="button" className="lead-action-btn meeting-action" onClick={() => setMeetingOpen(true)} title={`Schedule a meeting with ${selectedLead.name}`}>
                    <span>Schedule meeting</span>
                  </button>
                </div>
              </div>

              {activeCall && (
                <div className="active-call-bar">
                  <div className="call-info">
                    <span className="call-pulse" />
                    <div>
                      <strong>Calling {activeCall.name}</strong>
                      <small>{activeCall.phone} · In conversation</small>
                    </div>
                  </div>
                  <div className="call-note-row">
                    <input
                      value={callNote}
                      onChange={(event) => setCallNote(event.target.value)}
                      placeholder="Add quick notes from call (e.g. wants unit floor plan, site visit)..."
                      aria-label="Call notes"
                    />
                    <button
                      type="button"
                      className="end-call-btn"
                      onClick={handleEndCall}
                    >
                      End & Log <span>✓</span>
                    </button>
                  </div>
                </div>
              )}

              {meetingOpen && <MeetingModal lead={selectedLead} form={meetingForm} update={updateMeeting} onClose={() => setMeetingOpen(false)} onSubmit={scheduleMeeting} />}

              <div className="lead-ai-summary">
                <div className="ai-summary-topline">
                  <span className="ai-label">AI brief</span>
                  <span className="ai-spark">✦</span>
                </div>
                <p>{briefStatus[selectedLead.id] === 'success' ? serverBriefs[selectedLead.id] : briefStatus[selectedLead.id] === 'error' ? 'Could not load the AI brief.' : 'Loading AI brief...'}</p>
                {briefStatus[selectedLead.id] === 'error' && <button type="button" className="text-button" onClick={() => { setBriefStatus((current) => ({ ...current, [selectedLead.id]: 'loading' })); setBriefRetry((current) => current + 1) }}>Retry brief</button>}
              </div>

              <button type="button" className="chat-launcher" onClick={() => setChatOpen(true)} aria-label={`Open conversation with ${selectedLead.name}`}>
                <span className="chat-launcher-icon"><ChatIcon name="message" /></span>
                <span>Open conversation</span>
                <b>{chatThread.length}</b>
              </button>

              {chatOpen && <div className="chat-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setChatOpen(false) }}>
                <section className="lead-chat-panel chat-modal" role="dialog" aria-modal="true" aria-label={`Conversation with ${selectedLead.name}`}>
                <div className="chat-header">
                  <div>
                    <span className="eyebrow">Conversation</span>
                    <strong>{selectedLead.property}{selectedLead.unit ? ` · Unit ${selectedLead.unit}` : ''}</strong>
                  </div>
                  <div className="chat-header-actions">
                    <button type="button" className="chat-close-button" onClick={() => setChatOpen(false)} aria-label="Close conversation"><ChatIcon name="close" /></button>
                    {selectedProperty?.imageUrl && (
                      <button
                        type="button"
                        className={`composer-tool-btn ${showMediaPicker ? 'active' : ''}`}
                        onClick={() => setShowMediaPicker((curr) => !curr)}
                        title="Share property media & photos"
                      >
                        <ChatIcon name="camera" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="chat-thread">
                  {chatThread.length ? chatThread.map((message, index) => (
                    <div
                      key={`${message.sender}-${index}`}
                      className={`chat-bubble ${message.isCallLog ? 'call-log' : message.sender === 'lead' ? 'lead' : 'agent'}`}
                    >
                      <small>{message.time}</small>
                      <p>{message.text}</p>
                      {message.files && message.files.length > 0 && (
                        <div className="chat-attachments-grid">
                          {message.files.map((file, fileIndex) => (
                            file.isImage ? (
                              <a
                                key={fileIndex}
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="chat-photo-card"
                                title="Click to view photo"
                              >
                                <img src={file.url} alt={file.name} />
                                <span className="photo-label"><ChatIcon name="camera" /> {file.name}</span>
                              </a>
                            ) : (
                              <div key={fileIndex} className="chat-file-card">
                                <span className="file-icon"><ChatIcon name="file" /></span>
                                <div className="file-info">
                                  <strong>{file.name}</strong>
                                  <small>{file.size || 'Document'}</small>
                                </div>
                                <a href={file.url} download={file.name} className="file-download-btn" title="Download attachment"><ChatIcon name="download" /></a>
                              </div>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  )) : <div className="chat-empty-state">{conversationStatus[selectedLead.id] === 'error' ? <>Could not load this conversation. <button type="button" className="text-button" onClick={() => { setConversationStatus((current) => ({ ...current, [selectedLead.id]: 'loading' })); setConversationRetry((current) => current + 1) }}>Retry</button></> : conversationStatus[selectedLead.id] === 'success' ? 'No messages yet.' : 'Loading conversation...'}</div>}
                </div>

                {showMediaPicker && selectedProperty && (
                  <div className="property-media-picker">
                    <div className="media-picker-header">
                      <span>Click to attach property photo</span>
                      <button type="button" className="attachment-remove-btn" onClick={() => setShowMediaPicker(false)} aria-label="Close media picker"><ChatIcon name="close" /></button>
                    </div>
                    <div className="media-picker-list">
                      <button
                        type="button"
                        className="media-picker-thumb"
                        onClick={() => handleAttachPropertyPhoto(selectedProperty.imageUrl, `${selectedProperty.name} - Exterior`)}
                        title="Attach Main Photo"
                      >
                        <img src={selectedProperty.imageUrl} alt="" />
                        <span className="media-picker-label">Exterior</span>
                      </button>
                      <button
                        type="button"
                        className="media-picker-thumb"
                        onClick={() => handleAttachPropertyPhoto('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=85', `${selectedProperty.name} - Floorplan`)}
                        title="Attach Floor Plan"
                      >
                        <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=85" alt="" />
                        <span className="media-picker-label">Floorplan</span>
                      </button>
                      <button
                        type="button"
                        className="media-picker-thumb"
                        onClick={() => handleAttachPropertyPhoto('https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=85', `${selectedProperty.name} - Living View`)}
                        title="Attach Living Space"
                      >
                        <img src="https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=85" alt="" />
                        <span className="media-picker-label">Interior</span>
                      </button>
                    </div>
                  </div>
                )}

                {attachedFiles.length > 0 && (
                  <div className="composer-attachments">
                    {attachedFiles.map((file, idx) => (
                      <div key={idx} className="composer-attachment-chip">
                        {file.isImage ? (
                          <img src={file.url} alt={file.name} className="attachment-preview-img" />
                        ) : (
                          <span className="attachment-doc-icon"><ChatIcon name="file" /></span>
                        )}
                        <span className="attachment-name">{file.name}</span>
                        <button
                          type="button"
                          className="attachment-remove-btn"
                          onClick={() => setAttachedFiles((files) => files.filter((_, i) => i !== idx))}
                          aria-label="Remove attachment"
                        >
                          <ChatIcon name="close" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <form className="chat-composer" onSubmit={sendMessage}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    style={{ display: 'none' }}
                  />
                  <div className="composer-tools">
                    <button
                      type="button"
                      className="composer-tool-btn"
                      onClick={() => fileInputRef.current?.click()}
                      title="Attach photo or document"
                      aria-label="Attach files"
                    >
                      <ChatIcon name="paperclip" />
                    </button>
                    {selectedProperty?.imageUrl && (
                      <button
                        type="button"
                        className={`composer-tool-btn ${showMediaPicker ? 'active' : ''}`}
                        onClick={() => setShowMediaPicker((curr) => !curr)}
                        title="Pick property photos"
                        aria-label="Pick property photos"
                      >
                        <ChatIcon name="camera" />
                      </button>
                    )}
                  </div>
                  <input
                    value={chatDraft}
                    onChange={(event) => setChatDraft(event.target.value)}
                    placeholder={attachedFiles.length ? "Add an optional message..." : "Write a reply or attach media..."}
                    aria-label={`Message ${selectedLead.name}`}
                  />
                  <button
                    type="submit"
                    className="chat-send"
                    disabled={!chatDraft.trim() && !attachedFiles.length}
                    aria-label="Send message"
                  >
                    <ChatIcon name="send" />
                  </button>
                </form>
                </section>
              </div>}

            </>
          ) : (
            <div className="empty-line">No lead selected.</div>
          )}
        </aside>
      </section>
    )}

    {open && <LeadModal form={form} update={update} properties={properties} editing={Boolean(editingLead)} onClose={() => { setOpen(false); setEditingLead(null) }} onSubmit={submit} />}
  </div>
}

function MeetingModal({ lead, form, update, onClose, onSubmit }) {
  return <div className="modal-backdrop">
    <form className="modal meeting-modal" onSubmit={onSubmit}>
      <div className="modal-heading">
        <div>
          <span className="eyebrow">{lead.property}{lead.unit ? ` / UNIT ${lead.unit}` : ''}</span>
          <h2>Schedule a meeting</h2>
          <p className="modal-intro">Set the next buyer touchpoint for {lead.name}.</p>
        </div>
        <button className="close-button" type="button" onClick={onClose} aria-label="Close schedule meeting modal">×</button>
      </div>
      <div className="form-grid">
        <label>Date<input required type="date" value={form.date} onChange={(event) => update('date', event.target.value)} /></label>
        <label>Time<input required type="time" value={form.time} onChange={(event) => update('time', event.target.value)} /></label>
      </div>
      <label>Meeting type<select value={form.type} onChange={(event) => update('type', event.target.value)}><option>Site visit</option><option>Buyer call</option><option>Video meeting</option><option>Negotiation</option></select></label>
      <label>Notes <small>optional</small><textarea rows="3" value={form.notes} onChange={(event) => update('notes', event.target.value)} placeholder="What should be covered?" /></label>
      <div className="modal-footer"><button className="button secondary" type="button" onClick={onClose}>Cancel</button><button className="button primary" type="submit">Schedule meeting <span>→</span></button></div>
    </form>
  </div>
}

function LeadModal({ form, update, properties, editing, onClose, onSubmit }) {
  const currentProperty = properties.find((p) => p.name === form.property) || properties[0]
  const availableUnits = currentProperty?.units || []

  return <div className="modal-backdrop">
    <form className="modal" onSubmit={onSubmit}>
      <div className="modal-heading">
        <div>
          <span className="eyebrow">{editing ? 'LEAD DETAILS' : 'NEW RELATIONSHIP'}</span>
          <h2>{editing ? 'Edit lead' : 'Add a lead'}</h2>
          <p className="modal-intro">{editing ? 'Update the buyer details, property, unit, pricing, or sales stage.' : 'Create a buyer conversation tied to a live property and specific unit in your portfolio.'}</p>
        </div>
        <button className="close-button" type="button" onClick={onClose}>×</button>
      </div>

      <div className="form-grid">
        <label>
          Name
          <input required value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="Full name" />
        </label>
        <label>
          Mobile number
          <input required type="tel" value={form.phone} onChange={(event) => update('phone', event.target.value)} placeholder="+91 98401 23456" />
        </label>
      </div>

      <label>
        Email
        <input required type="email" value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="name@email.com" />
      </label>

      <div className="form-grid">
        <label>
          Property
          <select
            required
            value={form.property}
            onChange={(event) => {
              const newPropName = event.target.value
              const targetProp = properties.find((p) => p.name === newPropName)
              update('property', newPropName)
              update('unit', targetProp?.units?.[0] || '')
            }}
          >
            {properties.map((property) => (
              <option key={property.id} value={property.name}>{property.name}</option>
            ))}
          </select>
        </label>
        <label>
          Interested unit
          <select
            value={form.unit || ''}
            onChange={(event) => update('unit', event.target.value)}
          >
            <option value="">Any available unit</option>
            {availableUnits.map((unit) => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="form-grid">
        <label>
          Stage
          <select value={form.stage} onChange={(event) => update('stage', event.target.value)}>
            {stages.map((stage) => (
              <option key={stage} value={stage}>{stage}</option>
            ))}
          </select>
        </label>
        <label>
          Asking price
          <input value={form.askingPrice} onChange={(event) => update('askingPrice', event.target.value)} placeholder="₹1.2 Cr" />
        </label>
      </div>

      <div className="modal-footer">
        <button className="button secondary" type="button" onClick={onClose}>Cancel</button>
        <button className="button primary" type="submit">{editing ? 'Save changes' : 'Create lead'} <span>→</span></button>
      </div>
    </form>
  </div>
}
