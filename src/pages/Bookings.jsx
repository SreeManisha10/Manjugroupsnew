import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/useApp'
import LoadingSkeleton from '../components/LoadingSkeleton'

const parseAmount = (amount = '') => {
  const value = Number(String(amount).replace(/[₹,\s]/g, '').replace(/Cr|L/gi, ''))
  return /Cr/i.test(amount) ? value : value / 100
}

const initials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'NA'
const statusClass = (status = '') => status.toLowerCase().replace(/[^a-z0-9]+/g, '-')

export default function Bookings() {
  const { bookings, properties, leads, employees, account, workspaceDataStatus } = useApp()
  const bookingsLoading = workspaceDataStatus === 'loading'
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All statuses')
  const statuses = ['All statuses', ...new Set(bookings.map((booking) => booking.status).filter(Boolean))]
  const filteredBookings = useMemo(() => bookings.filter((booking) => {
    const searchableText = `${booking.lead || ''} ${booking.property || ''} ${booking.unit || ''}`.toLowerCase()
    return searchableText.includes(query.toLowerCase()) && (status === 'All statuses' || booking.status === status)
  }), [bookings, query, status])
  const totalValue = bookings.reduce((total, booking) => total + parseAmount(booking.amount), 0)
  const convertingProperties = new Set(bookings.map((booking) => booking.property)).size
  const pendingBookings = bookings.filter((booking) => /pending|review/i.test(booking.status || '')).length
  const employeeForBooking = (booking) => {
    const lead = leads.find((item) => item.id === booking.leadId || item.name === booking.lead)
    const property = properties.find((item) => item.id === booking.propertyId || item.name === booking.property)
    return employees.find((employee) => employee.id === (booking.assignedTo || lead?.assignedTo || property?.assignedTo))
  }

  if (account?.role !== 'admin') return <div className="page-wrap"><div className="empty-state"><strong>Admin access required</strong><span>Bookings are available to workspace administrators.</span><Link className="button secondary" to="/dashboard">Return to overview</Link></div></div>

  return <div className="page-wrap bookings-page">
    <div className="page-heading booking-page-heading"><div><span className="eyebrow">MANJU GROUPS / REVENUE CONTROL</span><h1>Reservation ledger.</h1><p>Every conversion, assigned owner, and unit in one clear view.</p></div><Link className="button secondary" to="/dashboard">Admin overview <span>↗</span></Link></div>

    <section className="booking-admin-stats" aria-label="Booking summary">
      <article><span className="eyebrow">Booked portfolio value</span><strong>{bookingsLoading ? <LoadingSkeleton className="skeleton-metric" /> : `₹${totalValue.toFixed(2)} Cr`}</strong><small>{bookingsLoading ? <LoadingSkeleton className="skeleton-caption" /> : `${bookings.length} recorded reservation${bookings.length === 1 ? '' : 's'}`}</small></article>
      <article><span className="eyebrow">Reserved units</span><strong>{bookingsLoading ? <LoadingSkeleton className="skeleton-metric" /> : bookings.length}</strong><small>{bookingsLoading ? <LoadingSkeleton className="skeleton-caption" /> : 'Current reservations in the portfolio'}</small></article>
      <article><span className="eyebrow">Properties converting</span><strong>{bookingsLoading ? <LoadingSkeleton className="skeleton-metric" /> : convertingProperties}</strong><small>{bookingsLoading ? <LoadingSkeleton className="skeleton-caption" /> : 'Listings with at least one reservation'}</small></article>
      <article><span className="eyebrow">Needs attention</span><strong>{bookingsLoading ? <LoadingSkeleton className="skeleton-metric" /> : pendingBookings}</strong><small>{bookingsLoading ? <LoadingSkeleton className="skeleton-caption" /> : 'Pending documents or review'}</small></article>
    </section>

    <section className="booking-ledger" aria-busy={bookingsLoading}>
      <div className="booking-ledger-header">
        <div><span className="eyebrow">RESERVATION REGISTER</span><h2>All bookings</h2><p>Search by buyer, property, or reserved unit.</p></div>
        <div className="booking-filters">
          <label className="booking-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search reservations" aria-label="Search bookings" /></label>
          <label className="booking-status-filter"><span className="sr-only">Filter by status</span><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter bookings by status">{statuses.map((item) => <option key={item}>{item}</option>)}</select></label>
        </div>
      </div>

      <div className="booking-ledger-columns" aria-hidden="true"><span>Buyer</span><span>Property / unit</span><span>Sales owner</span><span>Booked value</span><span>Status</span></div>
      <div className="booking-ledger-list">
        {bookingsLoading ? Array.from({ length: 3 }, (_, row) => <div className="booking-ledger-row booking-ledger-skeleton" key={row}>{Array.from({ length: 5 }, (_, cell) => <LoadingSkeleton key={cell} />)}</div>) : filteredBookings.length ? filteredBookings.map((booking) => {
          const property = properties.find((item) => item.id === booking.propertyId || item.name === booking.property)
          const employee = employeeForBooking(booking)
          const bookingDate = booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date unavailable'
          return <article className="booking-ledger-row" key={booking.id}>
            <div className="booking-buyer"><span className="booking-avatar">{initials(booking.lead)}</span><span><strong>{booking.lead || 'Unassigned buyer'}</strong><small>{bookingDate}</small></span></div>
            <div className="booking-property"><strong>{property?.name || booking.property || 'Property unavailable'}</strong><small>{property?.location || 'Chennai portfolio'} · {booking.unit || 'Unit pending'}</small></div>
            <div className="booking-owner"><span className="booking-owner-avatar">{initials(employee?.name || 'NA')}</span><span>{employee?.name || 'Unassigned'}</span></div>
            <div className="booking-value"><strong>{booking.amount || 'Value pending'}</strong><small>Reservation value</small></div>
            <div><span className={`booking-status-tag status-${statusClass(booking.status)}`}>{booking.status || 'Pending'}</span></div>
          </article>
        }) : <div className="booking-empty"><strong>No reservations found</strong><span>Try a different search or status filter.</span></div>}
      </div>
      <footer className="booking-ledger-footer"><span>Showing {filteredBookings.length} of {bookings.length} reservations</span><span>Values shown in INR</span></footer>
    </section>
  </div>
}