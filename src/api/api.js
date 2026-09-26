let accessToken = null
const propertiesRequests = new Map()
const propertiesApiBase = 'https://e216c24a-d73b-49c6-acd7-f44778607372.mock.pstmn.io/properties'

async function request(path, options = {}, unwrapData = true) {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(options.body !== undefined && !isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
    body: options.body && typeof options.body !== 'string' && !isFormData ? JSON.stringify(options.body) : options.body,
  })

  if (!response.ok) throw new Error(`API request failed: ${response.status}`)
  if (response.status === 204) return null
  const responseText = await response.text()
  if (!responseText) return null
  const payload = JSON.parse(responseText)
  return unwrapData ? payload?.data ?? payload : payload
}

const get = (path) => request(path)
const post = (path, body) => request(path, { method: 'POST', body })
const patch = (path, body) => request(path, { method: 'PATCH', body })
const getCollection = async (path, collectionName) => {
  const payload = await get(path)
  const items = Array.isArray(payload) ? payload : payload?.[collectionName] ?? payload?.items
  if (!Array.isArray(items)) throw new Error(`Invalid ${collectionName} response: expected an array`)
  return items
}
const leadPath = (id) => `/leads/${encodeURIComponent(id)}`
const leadsApiBase = 'https://e216c24a-d73b-49c6-acd7-f44778607372.mock.pstmn.io/leads'
const asProperty = (payload) => payload?.property || payload
const propertyPayload = ({ name, location, type, status, price, units, assignedTo, description, coordinates, media, imageUrl }) => {
  const body = new FormData()
  const fields = { name, location, type, status, price, units, assignedTo, description, coordinates }
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    body.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
  })
  if (media) {
    const existingMedia = []
    media.forEach((item) => {
      if (item.file) body.append('media', item.file, item.name || item.file.name || 'property-media')
      else if (item.url && !item.url.startsWith('blob:')) existingMedia.push(Object.fromEntries(Object.entries(item).filter(([key]) => key !== 'file')))
    })
    body.append('existingMedia', JSON.stringify(existingMedia))
  }
  if (imageUrl && !imageUrl.startsWith('blob:')) body.append('imageUrl', imageUrl)
  return body
}

export const api = {
  setAccessToken: (token) => { accessToken = token || null },
  getWorkspace: async () => {
    const payload = await get('/workspace')
    const workspace = payload?.workspace || payload
    if (!workspace || typeof workspace !== 'object' || Array.isArray(workspace)) throw new Error('Invalid workspace response: expected an object')
    return workspace
  },
  getEmployees: () => getCollection('/employees', 'employees'),
  getProperties: ({ offset = 0, limit = 20 } = {}) => {
    const url = new URL(propertiesApiBase)
    url.searchParams.set('offset', String(offset))
    url.searchParams.set('limit', String(limit))
    const requestUrl = url.toString()
    if (!propertiesRequests.has(requestUrl)) {
      propertiesRequests.set(requestUrl, request(requestUrl, {}, false).then((response) => {
        const payload = response?.data && !Array.isArray(response.data) ? { ...response, ...response.data } : response
        const items = Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : payload?.properties || payload?.items
        if (!Array.isArray(items)) throw new Error('Invalid properties response: expected an array')
        const pagination = payload?.pagination || payload?.meta || {}
        return {
          items,
          offset: Number(pagination.offset ?? payload?.offset ?? offset),
          limit: Number(pagination.limit ?? payload?.limit ?? limit),
          total: Number.isFinite(Number(pagination.total ?? payload?.total)) ? Number(pagination.total ?? payload?.total) : null,
          hasMore: typeof pagination.hasMore === 'boolean' ? pagination.hasMore : typeof payload?.hasMore === 'boolean' ? payload.hasMore : items.length === limit,
        }
      }).finally(() => { propertiesRequests.delete(requestUrl) }))
    }
    return propertiesRequests.get(requestUrl)
  },
  getPropertiesInBounds: async ({ bounds, zoom } = {}) => {
    const url = new URL(propertiesApiBase)
    if (bounds) {
      url.searchParams.set('north', String(bounds.north))
      url.searchParams.set('south', String(bounds.south))
      url.searchParams.set('east', String(bounds.east))
      url.searchParams.set('west', String(bounds.west))
    }
    if (zoom !== undefined) url.searchParams.set('zoom', String(zoom))
    const response = await request(url.toString(), {}, false)
    const payload = response?.data && !Array.isArray(response.data) ? { ...response, ...response.data } : response
    const items = Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : payload?.properties || payload?.items
    if (!Array.isArray(items)) throw new Error('Invalid map properties response: expected an array')
    return items
  },
  getProperty: async (id) => asProperty(await get(`${propertiesApiBase}/${encodeURIComponent(id)}`)),
  getLeads: () => getCollection(leadsApiBase, 'leads'),
  getBookings: () => getCollection('/bookings', 'bookings'),
  getMeetings: () => getCollection('/meetings', 'meetings'),
  signIn: (credentials) => post('/auth/signin', credentials),
  createAccount: (account) => post('/auth/signup', account),
  createWorkspace: (workspace) => post('/workspace', workspace),
  createProperty: async (property) => asProperty(await post('/properties', propertyPayload(property))),
  updateProperty: async (id, changes) => asProperty(await patch(`/properties/${id}`, propertyPayload(changes))),
  assignProperty: async (id, employeeId) => asProperty(await patch(`/properties/${id}/assignment`, { employeeId })),
  createLead: (lead) => post('/leads', lead),
  updateLead: (id, changes) => patch(`/leads/${id}`, changes),
  assignLead: (id, employeeId) => patch(`/leads/${id}/assignment`, { employeeId }),
  createBooking: (booking) => post('/bookings', booking),
  createMeeting: (meeting) => post('/meetings', meeting),
  getLeadConversation: async (id) => {
    const payload = await get(`${leadsApiBase}/${encodeURIComponent(id)}/conversation`)
    const conversation = payload?.conversation || payload
    const messages = conversation?.messages
    const calls = conversation?.calls ?? []
    if (!Array.isArray(messages) || !Array.isArray(calls)) throw new Error('Invalid conversation response: expected messages and calls arrays')
    return { messages, calls }
  },
  getLeadBrief: async (id) => {
    const payload = await get(`${leadsApiBase}/${encodeURIComponent(id)}/ai-brief`)
    const brief = typeof payload === 'string' ? payload : payload?.brief
    if (typeof brief !== 'string') throw new Error('Invalid AI brief response: expected a brief string')
    return brief
  },
  createLeadMessage: (id, message) => post(`${leadPath(id)}/messages`, message),
  createLeadCall: (id, call) => post(`${leadPath(id)}/calls`, call),
  uploadFile: (file) => {
    const body = new FormData()
    body.append('file', file)
    return request('/uploads', { method: 'POST', body })
  },
  signOut: () => post('/auth/signout', {}),
}