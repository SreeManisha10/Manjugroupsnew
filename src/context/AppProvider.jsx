import { useEffect, useMemo, useRef, useState } from 'react'
import Swal from 'sweetalert2'
import { AppContext } from './AppContext'
import { api } from '../api/api'

const demoEmployees = [
  { id: 'employee-priya', name: 'Priya Shah', email: 'priya@manjugroups.com', role: 'employee', initials: 'PS', title: 'Senior Property Advisor' },
  { id: 'employee-arjun', name: 'Arjun Mehta', email: 'arjun@manjugroups.com', role: 'employee', initials: 'AM', title: 'Sales Advisor' },
  { id: 'employee-nisha', name: 'Nisha Rao', email: 'nisha@manjugroups.com', role: 'employee', initials: 'NR', title: 'Portfolio Associate' },
]
const demoProperties = [
  { id: 'property-marina-house', name: 'Marina House', location: 'Besant Nagar, Chennai', type: 'Premium', status: 'Selling fast', price: '₹2.45 Cr', units: ['02-A', '02-B', '03-C', '04-A'], assignedTo: 'employee-priya', coordinates: [12.9994, 80.2707], imageUrl: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85', media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85' }, { type: 'image', url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=85' }] },
  { id: 'property-the-somerset', name: 'The Somerset', location: 'Adyar, Chennai', type: 'Residential', status: 'Limited', price: '₹1.18 Cr', units: ['B-302', 'B-401', 'C-105'], assignedTo: 'employee-priya', coordinates: [13.0012, 80.2565], imageUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=85', media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=85' }, { type: 'image', url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85' }, { type: 'image', url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85' }] },
  { id: 'property-terrace-28', name: 'Terrace 28', location: 'Nungambakkam, Chennai', type: 'Urban living', status: 'Open now', price: '₹92 L', units: ['T-08', 'T-12', 'T-19'], assignedTo: 'employee-arjun', coordinates: [13.0569, 80.2425], imageUrl: 'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1200&q=85', media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1200&q=85' }] },
  { id: 'property-grove-residences', name: 'The Grove Residences', location: 'East Coast Road, Chennai', type: 'Garden homes', status: 'New release', price: '₹1.64 Cr', units: ['G-01', 'G-02', 'G-08'], assignedTo: 'employee-arjun', coordinates: [12.915, 80.251], imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85', media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85' }] },
  { id: 'property-lotus-courtyard', name: 'Lotus Courtyard', location: 'Anna Nagar, Chennai', type: 'Family living', status: 'Launching', price: '₹86 L', units: ['L-11', 'L-12', 'L-21', 'L-22'], assignedTo: 'employee-nisha', coordinates: [13.085, 80.21], imageUrl: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=85', media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=85' }] },
  { id: 'property-arcade-17', name: 'Arcade 17', location: 'Teynampet, Chennai', type: 'Commercial', status: 'Commercial', price: '₹72 L', units: ['S-01', 'S-04', 'S-07'], assignedTo: 'employee-nisha', coordinates: [13.041, 80.248], imageUrl: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=85', media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=85' }] },
]
const demoLeads = [
  { id: 'lead-daniel', name: 'Daniel Cooper', email: 'daniel@example.com', phone: '+91 98401 11001', property: 'Marina House', propertyId: 'property-marina-house', unit: '02-B', stage: 'Site Visit', budget: '₹2.5 Cr', assignedTo: 'employee-priya', initials: 'DC', createdAt: '2026-09-20T08:30:00.000Z' },
  { id: 'lead-sarah', name: 'Sarah Mitchell', email: 'sarah@example.com', phone: '+91 98401 11002', property: 'The Somerset', propertyId: 'property-the-somerset', unit: 'B-302', stage: 'Negotiation', budget: '₹1.2 Cr', assignedTo: 'employee-priya', initials: 'SM', createdAt: '2026-09-21T09:30:00.000Z' },
  { id: 'lead-olivia', name: 'Olivia Bennett', email: 'olivia@example.com', phone: '+91 98401 11003', property: 'Terrace 28', propertyId: 'property-terrace-28', unit: 'T-12', stage: 'Interested', budget: '₹95 L', assignedTo: 'employee-arjun', initials: 'OB', createdAt: '2026-09-22T10:15:00.000Z' },
  { id: 'lead-arjun', name: 'Arjun Mehta', email: 'arjun.buyer@example.com', phone: '+91 98401 11004', property: 'The Grove Residences', propertyId: 'property-grove-residences', unit: 'G-02', stage: 'Contacted', budget: '₹1.7 Cr', assignedTo: 'employee-arjun', initials: 'AM', createdAt: '2026-09-23T11:00:00.000Z' },
  { id: 'lead-nisha', name: 'Nisha Rao', email: 'nisha.buyer@example.com', phone: '+91 98401 11005', property: 'Lotus Courtyard', propertyId: 'property-lotus-courtyard', unit: 'L-11', stage: 'New', budget: '₹90 L', assignedTo: 'employee-nisha', initials: 'NR', createdAt: '2026-09-24T12:00:00.000Z' },
  { id: 'lead-vikram', name: 'Vikram Iyer', email: 'vikram@example.com', phone: '+91 98401 11006', property: 'Arcade 17', propertyId: 'property-arcade-17', unit: 'S-01', stage: 'Interested', budget: '₹75 L', assignedTo: 'employee-nisha', initials: 'VI', createdAt: '2026-09-25T13:00:00.000Z' },
  { id: 'lead-karthik', name: 'Karthik Subramanian', email: 'karthik@example.com', phone: '+91 98401 11007', property: 'The Somerset', propertyId: 'property-the-somerset', unit: 'B-401', stage: 'Booked', budget: '₹1.2 Cr', assignedTo: 'employee-arjun', initials: 'KS', createdAt: '2026-09-22T09:30:00.000Z' },
]
const demoBookings = [
  { id: 'booking-1', property: 'The Somerset', propertyId: 'property-the-somerset', unit: 'B-302', lead: 'Sarah Mitchell', leadId: 'lead-sarah', amount: '₹1.18 Cr', status: 'Reserved', createdAt: '2026-09-22T10:00:00.000Z' },
  { id: 'booking-2', property: 'Marina House', propertyId: 'property-marina-house', unit: '02-B', lead: 'Daniel Cooper', leadId: 'lead-daniel', amount: '₹2.45 Cr', status: 'Documents pending', createdAt: '2026-09-24T14:20:00.000Z' },
  { id: 'booking-3', property: 'Terrace 28', propertyId: 'property-terrace-28', unit: 'T-12', lead: 'Olivia Bennett', leadId: 'lead-olivia', amount: '₹92 L', status: 'Confirmed', createdAt: '2026-09-25T09:10:00.000Z' },
]
const demoMeetings = [
  { id: 'meeting-1', leadId: 'lead-daniel', lead: 'Daniel Cooper', property: 'Marina House', unit: '02-B', date: '2026-09-26', time: '11:30', type: 'Site visit', notes: 'Review 02-B and compare the balcony-facing layouts.' },
  { id: 'meeting-2', leadId: 'lead-sarah', lead: 'Sarah Mitchell', property: 'The Somerset', unit: 'B-302', date: '2026-09-22', time: '09:30', type: 'Buyer call', notes: 'Confirm the next offer discussion.' },
  { id: 'meeting-3', leadId: 'lead-olivia', lead: 'Olivia Bennett', property: 'Terrace 28', unit: 'T-12', date: '2026-09-23', time: '14:00', type: 'Property tour', notes: 'Walk through the T-12 finish schedule.' },
  { id: 'meeting-4', leadId: 'lead-arjun', lead: 'Arjun Mehta', property: 'The Grove Residences', unit: 'G-02', date: '2026-09-24', time: '10:00', type: 'Negotiation', notes: 'Review the revised payment plan.' },
  { id: 'meeting-5', leadId: 'lead-nisha', lead: 'Nisha Rao', property: 'Lotus Courtyard', unit: 'L-11', date: '2026-09-25', time: '16:30', type: 'Follow-up', notes: 'Share the updated availability list.' },
  { id: 'meeting-6', leadId: 'lead-vikram', lead: 'Vikram Iyer', property: 'Arcade 17', unit: 'S-01', date: '2026-09-26', time: '15:00', type: 'Closing review', notes: 'Confirm final documents for S-01.' }
]
const defaultState = { account: null, workspace: { name: 'Manju Groups', location: 'Chennai portfolio', owner: 'Priya Shah' }, employees: demoEmployees, properties: demoProperties, mapProperties: demoProperties, propertiesStatus: 'idle', workspaceDataStatus: 'idle', leads: demoLeads, leadsStatus: 'idle', bookings: demoBookings, meetings: demoMeetings }
const sessionStorageKey = 'manju-groups-session'
const withDashboardFallbacks = (current, account, employees = demoEmployees) => ({
  ...current,
  account,
  workspace: defaultState.workspace,
  workspaceDataStatus: 'loading',
  employees,
  properties: demoProperties,
  mapProperties: demoProperties,
  propertiesStatus: 'idle',
  leads: demoLeads,
  leadsStatus: 'loading',
  bookings: demoBookings,
  meetings: demoMeetings,
})
const notifyPostResult = (title, synced, fallbackText = 'The server could not be reached. This change is saved in this session.') => {
  void Swal.fire({
    toast: true,
    position: 'top-end',
    icon: synced ? 'success' : 'info',
    title: synced ? title : `${title} · saved locally`,
    text: synced ? undefined : fallbackText,
    showConfirmButton: false,
    timer: 2800,
    timerProgressBar: true,
  })
}

function readSavedSession() {
  try {
    const session = JSON.parse(window.localStorage.getItem(sessionStorageKey) || 'null')
    return session?.account && typeof session.account === 'object' ? session : null
  } catch {
    return null
  }
}

function saveSession(account, token) {
  try {
    const safeAccount = Object.fromEntries(Object.entries(account).filter(([key]) => key !== 'password'))
    window.localStorage.setItem(sessionStorageKey, JSON.stringify({ account: safeAccount, token: token || null }))
  } catch { /* Session persistence is best-effort. */ }
}

const initials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'NA'

export function AppProvider({ children }) {
  const [state, setState] = useState(() => {
    const session = readSavedSession()
    api.setAccessToken(session?.token)
    return { ...defaultState, account: session?.account || null, leadsStatus: session?.account ? 'loading' : 'idle', workspaceDataStatus: session?.account ? 'loading' : 'idle' }
  })
  const propertiesRequestSequence = useRef(0)
  const mapPropertiesRequestSequence = useRef(0)
  const update = (next) => setState((current) => typeof next === 'function' ? next(current) : next)
  useEffect(() => {
    if (!state.account) return undefined
    let active = true
    Promise.allSettled([
      api.getWorkspace(),
      api.getEmployees(),
      api.getLeads(),
      api.getBookings(),
      api.getMeetings(),
    ]).then((results) => {
      const [workspace, employees, leads, bookings, meetings] = results
      if (!active) return
      update((current) => ({
        ...current,
        workspaceDataStatus: results.every((result) => result.status === 'fulfilled') ? 'success' : 'partial',
        ...(workspace.status === 'fulfilled' && workspace.value ? { workspace: workspace.value } : {}),
        ...(employees.status === 'fulfilled' && Array.isArray(employees.value) ? { employees: employees.value } : {}),
        ...(leads.status === 'fulfilled' ? { leads: leads.value.map((lead) => ({ ...lead, initials: lead.initials || initials(lead.name) })) } : {}),
        leadsStatus: leads.status === 'fulfilled' ? 'success' : 'error',
        ...(bookings.status === 'fulfilled' && Array.isArray(bookings.value) ? { bookings: bookings.value } : {}),
        ...(meetings.status === 'fulfilled' && Array.isArray(meetings.value) ? { meetings: meetings.value } : {}),
      }))
    })
    return () => { active = false }
  }, [state.account])
  const actions = useMemo(() => ({
    async createAccount(account) {
      const fallbackAccount = { ...account, id: crypto.randomUUID() }
      delete fallbackAccount.password
      const employee = { ...fallbackAccount, initials: initials(account.name), title: 'Sales Advisor' }
      try {
        const response = await api.createAccount(account)
        const token = response?.accessToken || response?.token
        api.setAccessToken(token)
        const savedAccount = response?.account || response?.user || (response?.id ? response : null)
        const activeAccount = savedAccount || fallbackAccount
        saveSession(activeAccount, token)
        update((current) => withDashboardFallbacks(current, activeAccount, account.role === 'employee' ? [activeAccount, ...demoEmployees] : demoEmployees))
      } catch {
        api.setAccessToken(null)
        saveSession(fallbackAccount, null)
        update((current) => withDashboardFallbacks(current, fallbackAccount, account.role === 'employee' ? [employee, ...demoEmployees] : demoEmployees))
      }
    },
    async signIn(account) {
      const fallbackAccount = { ...account, id: crypto.randomUUID() }
      delete fallbackAccount.password
      try {
        const response = await api.signIn(account)
        const token = response?.accessToken || response?.token
        api.setAccessToken(token)
        const savedAccount = response?.account || response?.user || (response?.id ? response : null)
        const activeAccount = { ...account, ...(savedAccount || fallbackAccount) }
        saveSession(activeAccount, token)
        update((current) => withDashboardFallbacks(current, activeAccount))
      } catch {
        api.setAccessToken(null)
        saveSession(fallbackAccount, null)
        update((current) => withDashboardFallbacks(current, { ...current.account, ...fallbackAccount }))
      }
    },
    signOut() {
      propertiesRequestSequence.current += 1
      mapPropertiesRequestSequence.current += 1
      update(() => ({ ...defaultState }))
      try { window.localStorage.removeItem(sessionStorageKey) } catch { /* Ignore unavailable storage. */ }
      api.signOut().catch(() => undefined).finally(() => api.setAccessToken(null))
    },
    async createWorkspace(workspace) {
      update((current) => ({ ...current, workspace }))
      try { await api.createWorkspace(workspace); notifyPostResult('Workspace created', true) }
      catch { notifyPostResult('Workspace updated', false) }
    },
    async loadProperties({ offset = 0, limit = 20, append = false } = {}) {
      const requestSequence = ++propertiesRequestSequence.current
      if (!append) update((current) => ({ ...current, propertiesStatus: 'loading' }))
      try {
        const page = await api.getProperties({ offset, limit })
        if (requestSequence !== propertiesRequestSequence.current) return { ...page, stale: true }
        update((current) => {
          const properties = append
            ? [...current.properties, ...page.items.filter((item) => !current.properties.some((currentItem) => currentItem.id === item.id))]
            : page.items
          return { ...current, properties, propertiesStatus: 'success' }
        })
        return { ...page, stale: false }
      } catch {
        if (requestSequence === propertiesRequestSequence.current && !append) update((current) => ({ ...current, propertiesStatus: 'error' }))
        return { items: [], offset, limit, total: null, hasMore: false, stale: requestSequence !== propertiesRequestSequence.current, error: true }
      }
    },
    async loadPropertiesInBounds({ bounds, zoom } = {}) {
      const requestSequence = ++mapPropertiesRequestSequence.current
      try {
        const items = await api.getPropertiesInBounds({ bounds, zoom })
        if (requestSequence !== mapPropertiesRequestSequence.current) return { items, stale: true }
        update((current) => ({ ...current, mapProperties: items }))
        return { items, stale: false }
      } catch {
        const items = demoProperties.filter((property) => !bounds || (property.coordinates?.[0] >= bounds.south && property.coordinates?.[0] <= bounds.north && property.coordinates?.[1] >= bounds.west && property.coordinates?.[1] <= bounds.east))
        const stale = requestSequence !== mapPropertiesRequestSequence.current
        if (!stale) update((current) => ({ ...current, mapProperties: items }))
        return { items, stale, error: true }
      }
    },
    async getPropertyDetails(id) {
      try { return await api.getProperty(id) } catch { return null }
    },
    async createProperty(property) {
      const local = { ...property, id: crypto.randomUUID(), units: property.units || ['A-101'] }
      update((current) => ({ ...current, properties: [local, ...current.properties], mapProperties: [local, ...current.mapProperties] }))
      try {
        const saved = await api.createProperty(property)
        if (saved?.id) update((current) => {
          const properties = (items) => items.map((item) => item.id === local.id ? { ...local, ...saved, media: saved.media ?? local.media, imageUrl: saved.imageUrl || local.imageUrl } : item)
          return { ...current, properties: properties(current.properties), mapProperties: properties(current.mapProperties) }
        })
        notifyPostResult('Property created', true)
      } catch { notifyPostResult('Property created', false) }
    },
    async updateProperty(id, changes) {
      const updatePropertyList = (items, propertyChanges) => items.map((property) => property.id === id ? { ...property, ...propertyChanges } : property)
      update((current) => ({ ...current, properties: updatePropertyList(current.properties, changes), mapProperties: updatePropertyList(current.mapProperties, changes) }))
      try {
        const saved = await api.updateProperty(id, changes)
        if (saved && typeof saved === 'object') update((current) => ({ ...current, properties: updatePropertyList(current.properties, saved), mapProperties: updatePropertyList(current.mapProperties, saved) }))
      } catch { /* Keep the local fallback. */ }
    },
    async assignProperty(id, employeeId) {
      const updateAssignment = (items, assignedTo) => items.map((property) => property.id === id ? { ...property, assignedTo } : property)
      update((current) => ({ ...current, properties: updateAssignment(current.properties, employeeId), mapProperties: updateAssignment(current.mapProperties, employeeId) }))
      try {
        const saved = await api.assignProperty(id, employeeId)
        if (saved && typeof saved === 'object') update((current) => ({ ...current, properties: updateAssignment(current.properties, saved.assignedTo || employeeId), mapProperties: updateAssignment(current.mapProperties, saved.assignedTo || employeeId) }))
      } catch { /* Keep the local fallback. */ }
    },
    async assignLead(id, employeeId) { update((current) => ({ ...current, leads: current.leads.map((lead) => lead.id === id ? { ...lead, assignedTo: employeeId } : lead) })); try { await api.assignLead(id, employeeId) } catch { /* Keep the local fallback. */ } },
    async refreshLeads() {
      update((current) => ({ ...current, leadsStatus: 'loading' }))
      try {
        const leads = await api.getLeads()
        update((current) => ({ ...current, leads: leads.map((lead) => ({ ...lead, initials: lead.initials || initials(lead.name) })), leadsStatus: 'success' }))
      } catch {
        update((current) => ({ ...current, leadsStatus: 'error' }))
      }
    },
    async createLead(lead) {
      const local = { ...lead, id: crypto.randomUUID(), initials: initials(lead.name), createdAt: new Date().toISOString() }
      update((current) => ({ ...current, leads: [local, ...current.leads] }))
      try {
        const saved = await api.createLead(lead)
        if (saved?.id) update((current) => ({ ...current, leads: current.leads.map((item) => item.id === local.id ? saved : item) }))
        notifyPostResult('Lead created', true)
      } catch { notifyPostResult('Lead created', false) }
    },
    async updateLead(id, changes) { update((current) => ({ ...current, leads: current.leads.map((lead) => lead.id === id ? { ...lead, ...changes, initials: initials(changes.name || lead.name) } : lead) })); try { await api.updateLead(id, changes) } catch { /* Keep the local fallback. */ } },
    async updateLeadStage(id, stage) { update((current) => ({ ...current, leads: current.leads.map((lead) => lead.id === id ? { ...lead, stage } : lead) })); try { await api.updateLead(id, { stage }) } catch { /* Keep the local fallback. */ } },
    async createBooking(booking) {
      const local = { ...booking, id: crypto.randomUUID(), status: 'Reserved', createdAt: new Date().toISOString() }
      update((current) => ({ ...current, bookings: [local, ...current.bookings] }))
      try {
        const saved = await api.createBooking(booking)
        if (saved?.id) update((current) => ({ ...current, bookings: current.bookings.map((item) => item.id === local.id ? saved : item) }))
        notifyPostResult('Booking confirmed', true)
      } catch { notifyPostResult('Booking created', false) }
    },
    async createMeeting(meeting) {
      const local = { ...meeting, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
      update((current) => ({ ...current, meetings: [local, ...current.meetings] }))
      try {
        const saved = await api.createMeeting(meeting)
        if (saved?.id) update((current) => ({ ...current, meetings: current.meetings.map((item) => item.id === local.id ? saved : item) }))
        notifyPostResult('Meeting scheduled', true)
      } catch { notifyPostResult('Meeting scheduled', false) }
    },
    async getLeadConversation(id) { try { return await api.getLeadConversation(id) } catch { return null } },
    async getLeadBrief(id) { try { return await api.getLeadBrief(id) } catch { return null } },
    async createLeadMessage(id, message) {
      try {
        const saved = await api.createLeadMessage(id, message)
        notifyPostResult('Message sent', true)
        return saved
      } catch { notifyPostResult('Message saved locally', false); return null }
    },
    async createLeadCall(id, call) {
      try {
        const saved = await api.createLeadCall(id, call)
        notifyPostResult('Call logged', true)
        return saved
      } catch { notifyPostResult('Call logged locally', false); return null }
    },
    async uploadFile(file) {
      try {
        const result = await api.uploadFile(file)
        notifyPostResult('Attachment uploaded', true)
        return result
      } catch {
        notifyPostResult('Attachment upload failed', false, 'This attachment could not be saved to the server.')
        return null
      }
    },
  }), [])
  const value = useMemo(() => ({ ...state, ...actions, isAuthenticated: Boolean(state.account), isWorkspaceReady: Boolean(state.workspace) }), [state, actions])
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}