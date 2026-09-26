import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import { useApp } from '../context/useApp'
import LoadingSkeleton from '../components/LoadingSkeleton'
import 'leaflet/dist/leaflet.css'

const statusColors = { Launching: '#f4b860', Limited: '#e77965', 'Open now': '#1769c2', 'New release': '#6c8fdc', Commercial: '#8c72c8', 'Selling fast': '#d56e9d' }
const galleryImages = [
  'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=85',
]
const mapIcon = (property, selected) => L.divIcon({ className: 'property-map-marker-wrap', html: `<span class="property-map-marker ${selected ? 'selected' : ''}" style="--marker-color: ${statusColors[property.status] || '#1769c2'}"><b>${property.price || 'View'}</b><i></i></span>`, iconSize: selected ? [112, 45] : [92, 34], iconAnchor: selected ? [56, 23] : [46, 17], popupAnchor: [0, -17] })
const getGallery = (property) => {
  const savedImages = (property.media || []).filter((item) => item.type === 'image').map((item) => item.url)
  return [...new Set([...savedImages, property.imageUrl, ...galleryImages])].filter(Boolean).slice(0, 6)
}

function FocusProperty({ propertyId, coordinates }) {
  const map = useMap()
  const firstRender = useRef(true)
  const lastPropertyId = useRef(null)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      lastPropertyId.current = propertyId || null
      return
    }
    if (!propertyId || lastPropertyId.current === propertyId) return
    lastPropertyId.current = propertyId
    map.stop()
    map.panTo(coordinates || [13.06, 80.24], { animate: true, duration: 0.45 })
  }, [map, propertyId, coordinates])
  return null
}

function MapResetControl({ properties }) {
  const map = useMap()
  const reset = () => {
    const points = properties.map((property) => property.coordinates).filter(Boolean)
    if (points.length) map.fitBounds(points, { padding: [35, 35], maxZoom: 12, duration: 0.8 })
  }
  return <button type="button" className="map-reset-control" onClick={reset}>View all <span>⌖</span></button>
}

const readMapViewport = (map) => {
  const bounds = map.getBounds()
  const viewport = {
    north: Number(bounds.getNorth().toFixed(5)),
    south: Number(bounds.getSouth().toFixed(5)),
    east: Number(bounds.getEast().toFixed(5)),
    west: Number(bounds.getWest().toFixed(5)),
    zoom: map.getZoom(),
  }
  return { bounds: viewport, zoom: viewport.zoom, key: `${viewport.north},${viewport.south},${viewport.east},${viewport.west},${viewport.zoom}` }
}

function MapViewportEvents({ onViewportChange }) {
  const map = useMapEvents({
    moveend: (event) => onViewportChange(readMapViewport(event.target)),
    zoomend: (event) => onViewportChange(readMapViewport(event.target)),
  })
  useEffect(() => {
    let active = true
    queueMicrotask(() => { if (active) onViewportChange(readMapViewport(map)) })
    return () => { active = false }
  }, [map, onViewportChange])
  return null
}

const PROPERTY_PAGE_SIZE = 20

export default function Properties() {
  const { account, employees, properties, mapProperties, leads, bookings, loadProperties, loadPropertiesInBounds, createProperty, updateProperty: updatePropertyRecord, assignProperty, createLead, createBooking } = useApp()
  const [selectedId, setSelectedId] = useState(properties[0]?.id)
  const [propertiesLoading, setPropertiesLoading] = useState(true)
  const [mapPropertiesLoading, setMapPropertiesLoading] = useState(false)
  const [propertiesError, setPropertiesError] = useState(false)
  const [propertyPagination, setPropertyPagination] = useState({ offset: 0, limit: PROPERTY_PAGE_SIZE, total: null, hasMore: false })
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('All types')
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [showSelectedCard, setShowSelectedCard] = useState(true)
  const [detailImageIndex, setDetailImageIndex] = useState(0)
  const [expandedDetails, setExpandedDetails] = useState(false)
  const [propertyOpen, setPropertyOpen] = useState(false)
  const [editingProperty, setEditingProperty] = useState(null)
  const [leadProperty, setLeadProperty] = useState(null)
  const [bookingProperty, setBookingProperty] = useState(null)
  const emptyPropertyForm = { name: '', location: '', type: 'Residential', status: 'Launching', price: '', units: ['A-101'], assignedTo: '', description: '', latitude: '13.06', longitude: '80.24', imageUrl: '', media: [], mediaUrl: '', mediaType: 'image' }
  const [propertyForm, setPropertyForm] = useState(emptyPropertyForm)
  const propertiesLoadingRef = useRef(false)
  const mapViewportRef = useRef(null)
  const initialPropertyPageRequestedRef = useRef(false)
  const indexListRef = useRef(null)
  const requestedPropertyPagesRef = useRef(new Set())
  const loadPropertyPage = useCallback(async ({ offset = 0, append = false } = {}) => {
    if (append && (propertiesLoadingRef.current || !propertyPagination.hasMore)) return
    const pageKey = String(offset)
    if (requestedPropertyPagesRef.current.has(pageKey)) return
    requestedPropertyPagesRef.current.add(pageKey)
    propertiesLoadingRef.current = true
    setPropertiesLoading(true)
    setPropertiesError(false)
    const result = await loadProperties({ offset, limit: PROPERTY_PAGE_SIZE, append })
    if (result.stale) return
    propertiesLoadingRef.current = false
    setPropertiesLoading(false)
    setPropertiesError(Boolean(result.error))
    if (result.error) requestedPropertyPagesRef.current.delete(pageKey)
    else setPropertyPagination({ offset: result.offset, limit: result.limit, total: result.total, hasMore: result.hasMore })
  }, [loadProperties, propertyPagination.hasMore])
  const updateMapViewport = useCallback((nextViewport) => {
    if (mapViewportRef.current?.key === nextViewport.key) return
    mapViewportRef.current = nextViewport
    setMapPropertiesLoading(true)
    loadPropertiesInBounds({ bounds: nextViewport.bounds, zoom: nextViewport.zoom }).finally(() => {
      if (mapViewportRef.current?.key === nextViewport.key) setMapPropertiesLoading(false)
    })
    if (!initialPropertyPageRequestedRef.current) {
      initialPropertyPageRequestedRef.current = true
      loadPropertyPage({ offset: 0 })
    }
  }, [loadPropertiesInBounds, loadPropertyPage])
  const retryProperties = () => {
    const retryAppend = propertiesError && properties.length > 0
    loadPropertyPage({ offset: retryAppend ? properties.length : 0, append: retryAppend })
  }
  const availableProperties = useMemo(() => [...new Map([...properties, ...mapProperties].map((property) => [property.id, property])).values()], [properties, mapProperties])
  const activeProperty = availableProperties.find((property) => property.id === selectedId) || availableProperties[0]
  const types = ['All types', ...new Set(availableProperties.map((property) => property.type))]
  const statuses = ['All statuses', ...new Set(availableProperties.map((property) => property.status))]
  const filteredProperties = useMemo(() => properties.filter((property) => {
    const text = `${property.name} ${property.location} ${property.type}`.toLowerCase()
    return text.includes(query.toLowerCase()) && (typeFilter === 'All types' || property.type === typeFilter) && (statusFilter === 'All statuses' || property.status === statusFilter)
  }), [properties, query, typeFilter, statusFilter])
  const filteredMapProperties = useMemo(() => mapProperties.filter((property) => {
    const text = `${property.name} ${property.location} ${property.type}`.toLowerCase()
    return text.includes(query.toLowerCase()) && (typeFilter === 'All types' || property.type === typeFilter) && (statusFilter === 'All statuses' || property.status === statusFilter)
  }), [mapProperties, query, typeFilter, statusFilter])
  const visibleResults = filteredProperties
  const handleIndexScroll = (event) => {
    const element = event.currentTarget
    if (element.scrollHeight - element.scrollTop - element.clientHeight < 120) {
      loadPropertyPage({ offset: properties.length, append: true })
    }
  }
  const updateProperty = (key, value) => setPropertyForm((current) => ({ ...current, [key]: value }))
  const selectProperty = (property) => { setSelectedId(property.id); setShowSelectedCard(true); setDetailImageIndex(0); setExpandedDetails(false) }
  const activeGallery = activeProperty ? getGallery(activeProperty) : []
  const moveDetailImage = (direction) => setDetailImageIndex((current) => (current + direction + activeGallery.length) % activeGallery.length)
  const saveProperty = (event) => {
    event.preventDefault()
    const fallbackImage = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85'
    const firstImage = propertyForm.media.find((item) => item.type === 'image')?.url || propertyForm.imageUrl || fallbackImage
    const propertyChanges = { ...propertyForm, units: propertyForm.units.filter(Boolean), imageUrl: firstImage, coordinates: [Number(propertyForm.latitude) || 13.06, Number(propertyForm.longitude) || 80.24] }
    if (editingProperty) {
      updatePropertyRecord(editingProperty.id, propertyChanges)
      setSelectedId(editingProperty.id)
    } else {
      createProperty(propertyChanges)
    }
    setPropertyOpen(false)
    setEditingProperty(null)
    setPropertyForm(emptyPropertyForm)
  }
  const openPropertyEditor = (property) => {
    if (account?.role !== 'admin') return
    setExpandedDetails(false)
    setEditingProperty(property)
    setPropertyForm({
      name: property.name || '',
      location: property.location || '',
      type: property.type || 'Residential',
      status: property.status || 'Launching',
      price: property.price || '',
      units: property.units?.length ? property.units : ['A-101'],
      assignedTo: property.assignedTo || '',
      description: property.description || '',
      latitude: String(property.coordinates?.[0] || 13.06),
      longitude: String(property.coordinates?.[1] || 80.24),
      imageUrl: property.imageUrl || '',
      media: property.media?.length ? property.media : (property.imageUrl ? [{ type: 'image', url: property.imageUrl }] : []),
      mediaUrl: '',
      mediaType: 'image'
    })
    setPropertyOpen(true)
  }

  return <div className="page-wrap map-first-page">
    <div className="page-heading"><div><span className="eyebrow">MANJU GROUPS / LIVE PORTFOLIO</span><h1>Properties on the ground.</h1><p>Explore {propertyPagination.total ?? properties.length} locations, compare the collection, and act on the property in front of you.</p></div><div className="top-actions">{account?.role === 'admin' && <button className="button primary" type="button" onClick={() => { setEditingProperty(null); setPropertyOpen(true) }}>Create property <span>+</span></button>}</div></div>
    <section className="map-explorer">
      <div className="map-stage">
        <MapContainer center={[13.04, 80.24]} zoom={11} scrollWheelZoom className="portfolio-map"><MapViewportEvents onViewportChange={updateMapViewport} /><FocusProperty propertyId={selectedId} coordinates={availableProperties.find((property) => property.id === selectedId)?.coordinates} /><MapResetControl properties={filteredMapProperties} /><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><MarkerClusterGroup chunkedLoading animate={false} showCoverageOnHover={false} spiderfyOnMaxZoom={false} zoomToBoundsOnClick maxClusterRadius={48} disableClusteringAtZoom={14}>{filteredMapProperties.map((property) => <Marker key={property.id} position={property.coordinates || [13.06, 80.24]} icon={mapIcon(property, property.id === activeProperty?.id)} eventHandlers={{ click: (event) => { event.originalEvent?.stopPropagation(); selectProperty(property) } }}><Popup className="property-popup"><div className="popup-card"><img src={property.imageUrl} alt={property.name} /><div><span className="popup-type">{property.status}</span><strong>{property.name}</strong><small>{property.location}</small><b>{property.price} · {property.units?.length || 0} units</b></div></div></Popup></Marker>)}</MarkerClusterGroup></MapContainer>
        {mapPropertiesLoading && <div className="map-fetch-overlay" role="status"><span className="workspace-loading-spinner" />Updating map coverage</div>}
        <div className="map-overlay-top"><div className="map-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the portfolio map..." aria-label="Search the portfolio map" />{query && <button type="button" onClick={() => setQuery('')} aria-label="Clear map search">×</button>}</div><div className="map-overlay-actions"><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} aria-label="Filter by property type">{types.map((type) => <option key={type}>{type}</option>)}</select><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by property status">{statuses.map((status) => <option key={status}>{status}</option>)}</select></div></div>
        {activeProperty && !expandedDetails && showSelectedCard && <div className="selected-property-card"><button type="button" className="detail-close" onClick={() => setShowSelectedCard(false)} aria-label="Close selected property preview">×</button><div className="peek-gallery"><img src={activeGallery[detailImageIndex]} alt={`${activeProperty.name} view ${detailImageIndex + 1}`} /><span>{String(detailImageIndex + 1).padStart(2, '0')} / {String(activeGallery.length).padStart(2, '0')}</span><button type="button" className="peek-arrow peek-prev" onClick={() => moveDetailImage(-1)} aria-label="Previous property image">‹</button><button type="button" className="peek-arrow peek-next" onClick={() => moveDetailImage(1)} aria-label="Next property image">›</button><div className="peek-thumbs">{activeGallery.map((image, index) => <button type="button" className={index === detailImageIndex ? 'active' : ''} key={image} onClick={() => setDetailImageIndex(index)} aria-label={`View image ${index + 1}`}><img src={image} alt="" /></button>)}</div></div><div className="peek-content"><div className="peek-topline"><span>{activeProperty.type}</span><b style={{ '--status-color': statusColors[activeProperty.status] || '#0f8d6c' }}><i />{activeProperty.status}</b></div><h2>{activeProperty.name}</h2><p className="peek-location">{activeProperty.location} · Chennai</p>{account?.role === 'admin' && <label className="property-assignment">Assigned employee<select value={activeProperty.assignedTo || ''} onChange={(event) => assignProperty(activeProperty.id, event.target.value)}><option value="">Unassigned</option>{employees.map((employee) => <option value={employee.id} key={employee.id}>{employee.name}</option>)}</select></label>}<div className="peek-facts"><span><strong>{activeProperty.price}</strong><small>Guide price</small></span><span><strong>{activeProperty.units.length}</strong><small>Units available</small></span><span><strong>{leads.filter((lead) => lead.property === activeProperty.name).length}</strong><small>Connected leads</small></span></div><div className="peek-actions"><button type="button" className="peek-details-button" onClick={() => setExpandedDetails(true)}>View details <span>↗</span></button>{account?.role === 'admin' && <button type="button" className="peek-edit-button" onClick={() => openPropertyEditor(activeProperty)}>Edit property</button>}<button type="button" onClick={() => setLeadProperty(activeProperty)}>Add lead <span>+</span></button><button type="button" onClick={() => setBookingProperty(activeProperty)}>Book a unit <span>→</span></button></div></div></div>}
        {activeProperty && expandedDetails && createPortal(<ExpandedPropertyDetails property={activeProperty} leads={leads} bookings={bookings} imageIndex={detailImageIndex} canEdit={account?.role === 'admin'} onClose={() => setExpandedDetails(false)} onEdit={openPropertyEditor} onAddLead={() => { setExpandedDetails(false); setLeadProperty(activeProperty) }} onBook={() => { setExpandedDetails(false); setBookingProperty(activeProperty) }} />, document.body)}
      </div>
      <aside className="property-index">
        <div className="index-header"><div><span className="eyebrow">PROPERTY INDEX</span><h2>Find your next move</h2></div><span>{filteredProperties.length}</span></div>
        <div className="index-filters">
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>{types.map((type) => <option key={type}>{type}</option>)}</select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select>
        </div>
        <div ref={indexListRef} className="index-list" onScroll={handleIndexScroll}>
          {visibleResults.length ? visibleResults.map((property) => <div className={`index-property ${property.id === activeProperty?.id ? 'selected' : ''}`} key={property.id}>
            <button type="button" className="index-property-main" onClick={() => selectProperty(property)}><img src={property.imageUrl} alt="" /><span><strong>{property.name}</strong><small>{property.location}</small><em>{property.status} · {property.units.length} units</em></span></button>
            <button type="button" className="index-property-open" onClick={() => selectProperty(property)} aria-label={`Open details for ${property.name}`}>↗</button>
          </div>) : <div className="empty-line">
            {propertiesLoading ? 'Loading properties...' : propertiesError ? <>No property data available. <button type="button" className="text-button" onClick={retryProperties}>Retry</button></> : properties.length ? 'No properties match this map view.' : 'No properties available.'}
          </div>}
        </div>
        {propertiesLoading && properties.length > 0 && <div className="property-index-loading" role="status" aria-label="Loading more properties"><LoadingSkeleton className="skeleton-line" /><LoadingSkeleton className="skeleton-line short" /></div>}
        {!propertiesLoading && propertyPagination.hasMore && <div className="empty-line">Scroll to load more</div>}
      </aside>
    </section>
    {propertyOpen && <PropertyModal form={propertyForm} update={updateProperty} employees={employees} editing={Boolean(editingProperty)} onClose={() => { setPropertyOpen(false); setEditingProperty(null) }} onSubmit={saveProperty} />}
    {leadProperty && <LeadModal property={leadProperty} onClose={() => setLeadProperty(null)} onSave={(lead) => { createLead(lead); setLeadProperty(null) }} />}
    {bookingProperty && <BookingModal property={bookingProperty} leads={leads} onClose={() => setBookingProperty(null)} onSave={(booking) => { createBooking(booking); setBookingProperty(null) }} />}
  </div>
}

function ExpandedPropertyDetails({ property: propertySummary, leads, bookings, imageIndex, canEdit, onClose, onEdit, onAddLead, onBook }) {
  const { getPropertyDetails } = useApp()
  const [propertyDetails, setPropertyDetails] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(true)
  const [detailsError, setDetailsError] = useState(false)
  const detailsRequestRef = useRef(0)
  const property = propertyDetails ? { ...propertySummary, ...propertyDetails } : propertySummary
  const retryDetails = () => {
    const requestId = ++detailsRequestRef.current
    setDetailsLoading(true)
    setDetailsError(false)
    getPropertyDetails(propertySummary.id).then((details) => {
      if (requestId !== detailsRequestRef.current) return
      if (details) setPropertyDetails(details)
      else setDetailsError(true)
      setDetailsLoading(false)
    })
  }
  useEffect(() => {
    let active = true
    const requestId = ++detailsRequestRef.current
    getPropertyDetails(propertySummary.id).then((details) => {
      if (!active || requestId !== detailsRequestRef.current) return
      if (details) setPropertyDetails(details)
      else setDetailsError(true)
      setDetailsLoading(false)
    })
    return () => { active = false; detailsRequestRef.current += 1 }
  }, [getPropertyDetails, propertySummary.id])
  const propertyLeads = leads.filter((lead) => lead.property === property.name)
  const propertyBookings = bookings.filter((booking) => booking.property === property.name)
  const nextUnit = property.units?.[0] || 'TBC'
    const [mediaIndex, setMediaIndex] = useState(imageIndex)
    const gallery = getGallery(property)
    const savedVideos = (property.media || []).filter((item) => item.type === 'video').map((item) => ({ type: 'video', src: item.url, poster: gallery[0] }))
    const media = [...gallery.map((image) => ({ type: 'image', src: image })), ...savedVideos]
    const activeMedia = media[mediaIndex % media.length]
    const moveMedia = (direction) => setMediaIndex((current) => (current + direction + media.length) % media.length)
    if (detailsLoading) return <div className="expanded-property-modal"><div className="expanded-property-sheet"><div className="expanded-header"><div><span className="eyebrow">PROPERTY BRIEF / SALES VIEW</span><h2>{property.name}</h2><p>{property.location} · Chennai · {property.type}</p></div><button type="button" className="detail-close" onClick={onClose} aria-label="Close expanded property details">×</button></div><div className="expanded-property-loading" role="status" aria-label="Loading property details"><LoadingSkeleton className="detail-media-skeleton" /><div className="detail-copy-skeleton"><LoadingSkeleton className="skeleton-line short" /><LoadingSkeleton className="skeleton-line" /><LoadingSkeleton className="skeleton-line" /><LoadingSkeleton className="skeleton-line short" /></div></div></div></div>
    if (detailsError) return <div className="expanded-property-modal"><div className="expanded-property-sheet"><div className="expanded-header"><div><span className="eyebrow">PROPERTY BRIEF / SALES VIEW</span><h2>{property.name}</h2><p>{property.location} · Chennai · {property.type}</p></div><button type="button" className="detail-close" onClick={onClose} aria-label="Close expanded property details">×</button></div><div className="empty-line" role="alert">Could not load property details. <button type="button" className="button secondary" onClick={retryDetails}>Retry</button></div></div></div>
    return <div className="expanded-property-modal"><div className="expanded-property-sheet"><div className="expanded-header"><div><span className="eyebrow">PROPERTY BRIEF / SALES VIEW</span><h2>{property.name}</h2><p>{property.location} · Chennai · {property.type}</p></div><button type="button" className="detail-close" onClick={onClose} aria-label="Close expanded property details">×</button></div><div className="expanded-body"><div className="expanded-gallery">{activeMedia.type === 'video' ? <video src={activeMedia.src} poster={activeMedia.poster} controls playsInline aria-label={`${property.name} property video`} /> : <img src={activeMedia.src} alt={`${property.name} view ${mediaIndex + 1}`} />}<span className="media-type-label">{activeMedia.type === 'video' ? 'VIDEO TOUR' : `${String(mediaIndex + 1).padStart(2, '0')} / ${String(media.length).padStart(2, '0')}`}</span><button type="button" className="peek-arrow peek-prev" onClick={() => moveMedia(-1)} aria-label="Previous property media">‹</button><button type="button" className="peek-arrow peek-next" onClick={() => moveMedia(1)} aria-label="Next property media">›</button><div className="peek-thumbs">{media.map((item, index) => <button type="button" className={index === mediaIndex ? 'active' : ''} key={`${item.type}-${item.src}`} onClick={() => setMediaIndex(index)} aria-label={`View ${item.type} ${index + 1}`}>{item.type === 'video' ? <span className="video-thumb">▶</span> : <img src={item.src} alt="" />}</button>)}</div></div><div className="expanded-info"><div className="expanded-status" style={{ '--status-color': statusColors[property.status] || '#0f8d6c' }}><i /> {property.status}</div><p className="expanded-description">A {property.type.toLowerCase()} opportunity with a clear conversation starter for your next customer meeting, in {property.location}.</p><div className="expanded-facts"><div><span>Guide price</span><strong>{property.price}</strong></div><div><span>Next available</span><strong>{nextUnit}</strong></div><div><span>Available units</span><strong>{property.units.length}</strong></div></div><div className="expanded-profile-grid"><div><span>Location</span><strong>{property.location}</strong></div><div><span>Property type</span><strong>{property.type}</strong></div><div><span>Unit mix</span><strong>{property.units.slice(0, 3).join(' · ')}</strong></div><div><span>Connected leads</span><strong>{propertyLeads.length}</strong></div></div><div className="expanded-sales-grid"><div><span>Interested leads</span><strong>{propertyLeads.length}</strong><small>{propertyLeads[0]?.name || 'No lead attached yet'}</small></div><div><span>Reservations</span><strong>{propertyBookings.length}</strong><small>{propertyBookings[0]?.unit || 'No reservation yet'}</small></div></div><div className="expanded-actions">{canEdit && <button type="button" className="button secondary" onClick={() => onEdit(property)}>Edit property</button>}<button type="button" className="button secondary" onClick={onAddLead}>Add lead <span>+</span></button><button type="button" className="button primary" onClick={onBook}>Book a unit <span>→</span></button></div></div></div></div></div>
}

  function LegacyPropertyModal({ form, update, editing, onClose, onSubmit }) {
    const modalRef = useRef(null)
    useEffect(() => { modalRef.current?.scrollTo(0, 0) }, [editing])
    return <div className="modal-backdrop"><form ref={modalRef} className="modal property-create-modal" onSubmit={onSubmit}><div className="modal-heading"><div><span className="eyebrow">{editing ? 'PORTFOLIO / EDIT LISTING' : 'PORTFOLIO / NEW LISTING'}</span><h2>{editing ? 'Edit property' : 'Create a property'}</h2><p className="modal-intro">{editing ? 'Correct the listing details, pricing, availability, or map location.' : 'Add the information your team needs to find, qualify, and present this property.'}</p></div><button className="close-button" type="button" onClick={onClose} aria-label="Close property modal">×</button></div><div className="form-section-label">Property basics</div><label>Property name<input required value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="The Willow Crest" /></label><div className="form-grid"><label>Location<input required value={form.location} onChange={(event) => update('location', event.target.value)} placeholder="Adyar, Chennai" /></label><label>Property type<select value={form.type} onChange={(event) => update('type', event.target.value)}><option>Residential</option><option>Premium</option><option>Commercial</option><option>Urban living</option><option>Garden homes</option><option>Workplace</option><option>Family living</option></select></label></div><div className="form-grid"><label>Listing status<select value={form.status} onChange={(event) => update('status', event.target.value)}><option>Launching</option><option>Limited</option><option>Open now</option><option>New release</option><option>Selling fast</option><option>Commercial</option></select></label><label>Starting price<input required value={form.price} onChange={(event) => update('price', event.target.value)} placeholder="₹85L" /></label></div><label>Property description <small>optional</small><textarea value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="A short note about the opportunity, setting, or customer fit." rows="3" /></label><div className="form-section-label">Availability and map</div><div className="form-grid"><label>Available units <small>comma separated</small><input required value={form.unitsText} onChange={(event) => update('unitsText', event.target.value)} placeholder="A-101, A-102" /></label><label>Photo URL <small>optional</small><input value={form.imageUrl} onChange={(event) => update('imageUrl', event.target.value)} placeholder="https://images.unsplash.com/..." /></label></div><div className="form-grid"><label>Latitude<input required type="number" step="any" value={form.latitude} onChange={(event) => update('latitude', event.target.value)} placeholder="13.06" /></label><label>Longitude<input required type="number" step="any" value={form.longitude} onChange={(event) => update('longitude', event.target.value)} placeholder="80.24" /></label></div><p className="form-hint">Use decimal coordinates to place the property accurately on the portfolio map.</p><div className="modal-footer"><button className="button secondary" type="button" onClick={onClose}>Cancel</button><button className="button primary" type="submit">{editing ? 'Save changes' : 'Create property'} <span>→</span></button></div></form></div>
}

void LegacyPropertyModal

function PropertyModal({ form, update, employees, editing, onClose, onSubmit }) {
  const modalRef = useRef(null)
  const mediaInputRef = useRef(null)
  const [unitDraft, setUnitDraft] = useState('')
  useEffect(() => { modalRef.current?.scrollTo(0, 0) }, [editing])
  const addUnit = () => {
    const unit = unitDraft.trim()
    if (!unit || form.units.includes(unit)) return
    update('units', [...form.units, unit])
    setUnitDraft('')
  }
  const removeUnit = (unit) => update('units', form.units.filter((item) => item !== unit))
  const addMediaFiles = (event) => {
    const files = Array.from(event.target.files || [])
    const newMedia = files
      .filter((file) => file.type.startsWith('image/') || file.type.startsWith('video/'))
      .filter((file) => !form.media.some((item) => item.name === file.name && item.size === file.size))
      .map((file) => ({ type: file.type.startsWith('video/') ? 'video' : 'image', url: URL.createObjectURL(file), name: file.name, size: file.size, file }))
    if (newMedia.length) update('media', [...form.media, ...newMedia])
    event.target.value = ''
  }
  const removeMedia = (mediaItem) => update('media', form.media.filter((item) => item !== mediaItem))
  const handleUnitKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      addUnit()
    }
  }
  return <div className="modal-backdrop"><form ref={modalRef} className="modal property-create-modal" onSubmit={onSubmit}>
    <div className="modal-heading"><div><span className="eyebrow">{editing ? 'PORTFOLIO / EDIT LISTING' : 'PORTFOLIO / NEW LISTING'}</span><h2>{editing ? 'Edit property' : 'Create a property'}</h2><p className="modal-intro">{editing ? 'Correct the listing details, pricing, availability, or map location.' : 'Add the information your team needs to find, qualify, and present this property.'}</p></div><button className="close-button" type="button" onClick={onClose} aria-label="Close property modal">×</button></div>
    <div className="form-section-label">Property basics</div>
    <label>Property name<input required value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="The Willow Crest" /></label>
    <div className="form-grid"><label>Location<input required value={form.location} onChange={(event) => update('location', event.target.value)} placeholder="Adyar, Chennai" /></label><label>Property type<select value={form.type} onChange={(event) => update('type', event.target.value)}><option>Residential</option><option>Premium</option><option>Commercial</option><option>Urban living</option><option>Garden homes</option><option>Workplace</option><option>Family living</option></select></label></div>
    <div className="form-grid"><label>Listing status<select value={form.status} onChange={(event) => update('status', event.target.value)}><option>Launching</option><option>Limited</option><option>Open now</option><option>New release</option><option>Selling fast</option><option>Commercial</option></select></label><label>Starting price<input required value={form.price} onChange={(event) => update('price', event.target.value)} placeholder="₹85L" /></label></div>
    <label>Property description <small>optional</small><textarea value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="A short note about the opportunity, setting, or customer fit." rows="3" /></label>
    <label>Assigned sales rep<select value={form.assignedTo} onChange={(event) => update('assignedTo', event.target.value)}><option value="">Unassigned</option>{employees.map((employee) => <option value={employee.id} key={employee.id}>{employee.name} · {employee.title}</option>)}</select></label>
    <div className="form-section-label">Availability and media</div>
    <div className="tag-editor"><label>Available units <small>Add one at a time</small><div className="tag-input-row"><input value={unitDraft} onChange={(event) => setUnitDraft(event.target.value)} onKeyDown={handleUnitKeyDown} placeholder="A-101" /><button type="button" className="button secondary" onClick={addUnit}>Add unit <span>+</span></button></div></label><div className="tag-list">{form.units.map((unit) => <span className="input-tag" key={unit}>{unit}<button type="button" onClick={() => removeUnit(unit)} aria-label={`Remove unit ${unit}`}>×</button></span>)}</div></div>
    <div className="media-editor"><label>Add property media <small>Select as many image or video files as you need</small><div className="media-upload-row"><input ref={mediaInputRef} className="media-file-input" type="file" accept="image/*,video/*" multiple onChange={addMediaFiles} /><button type="button" className="button secondary" onClick={() => mediaInputRef.current?.click()}>Choose files <span>+</span></button><span className="media-upload-hint">Images and videos</span></div></label><div className="media-list">{form.media.length ? form.media.map((item) => <div className="media-item" key={`${item.type}-${item.url}`}><span className="media-kind">{item.type}</span><span title={item.name || item.url}>{item.name || item.url}</span><button type="button" onClick={() => removeMedia(item)} aria-label={`Remove ${item.name || item.type}`}>×</button></div>) : <p className="form-hint">Upload images for the gallery or a video tour. The first image becomes the portfolio cover.</p>}</div></div>
    <div className="form-section-label">Map location</div><div className="form-grid"><label>Latitude<input required type="number" step="any" value={form.latitude} onChange={(event) => update('latitude', event.target.value)} placeholder="13.06" /></label><label>Longitude<input required type="number" step="any" value={form.longitude} onChange={(event) => update('longitude', event.target.value)} placeholder="80.24" /></label></div><p className="form-hint">Use decimal coordinates to place the property accurately on the portfolio map.</p>
    <div className="modal-footer"><button className="button secondary" type="button" onClick={onClose}>Cancel</button><button className="button primary" type="submit">{editing ? 'Save changes' : 'Create property'} <span>→</span></button></div>
  </form></div>
}
function LeadModal({ property, onClose, onSave }) { const [form, setForm] = useState({ name: '', email: '', phone: '', unit: property.units?.[0] || '', budget: '', property: property.name, stage: 'New' }); const update = (key, value) => setForm((current) => ({ ...current, [key]: value })); return <div className="modal-backdrop"><form className="modal" onSubmit={(event) => { event.preventDefault(); onSave(form) }}><div className="modal-heading"><div><span className="eyebrow">{property.name}</span><h2>Add a lead</h2></div><button className="close-button" type="button" onClick={onClose}>×</button></div><div className="form-grid"><label>Name<input required value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="Full name" /></label><label>Mobile number<input required type="tel" value={form.phone} onChange={(event) => update('phone', event.target.value)} placeholder="+91 98401 23456" /></label></div><label>Email<input required type="email" value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="name@email.com" /></label><div className="form-grid"><label>Unit<select value={form.unit} onChange={(event) => update('unit', event.target.value)}><option value="">Any available unit</option>{property.units?.map((unit) => <option key={unit}>{unit}</option>)}</select></label><label>Budget<input value={form.budget} onChange={(event) => update('budget', event.target.value)} placeholder="₹75L" /></label></div><div className="modal-footer"><button className="button secondary" type="button" onClick={onClose}>Cancel</button><button className="button primary" type="submit">Create lead <span>→</span></button></div></form></div> }
function BookingModal({ property, leads, onClose, onSave }) { const propertyLeads = leads.filter((lead) => lead.property === property.name); const [leadId, setLeadId] = useState(propertyLeads[0]?.id || ''); const [unit, setUnit] = useState(property.units?.[0] || ''); return <div className="modal-backdrop"><form className="modal" onSubmit={(event) => { event.preventDefault(); onSave({ property: property.name, propertyId: property.id, lead: propertyLeads.find((item) => item.id === leadId)?.name, leadId, unit, amount: property.price }) }}><div className="modal-heading"><div><span className="eyebrow">{property.name}</span><h2>Book a unit</h2></div><button className="close-button" type="button" onClick={onClose}>×</button></div>{propertyLeads.length ? <><label>Lead<select required value={leadId} onChange={(event) => setLeadId(event.target.value)}>{propertyLeads.map((lead) => <option key={lead.id} value={lead.id}>{lead.name}</option>)}</select></label><label>Unit<select required value={unit} onChange={(event) => setUnit(event.target.value)}>{property.units.map((item) => <option key={item}>{item}</option>)}</select></label><div className="modal-footer"><button className="button secondary" type="button" onClick={onClose}>Cancel</button><button className="button primary" type="submit">Confirm booking <span>→</span></button></div></> : <><div className="empty-line">Add a lead to this property before booking a unit.</div><div className="modal-footer"><button className="button secondary" type="button" onClick={onClose}>Close</button></div></>}</form></div> }
