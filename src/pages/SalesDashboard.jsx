import { useEffect, useMemo, useState } from 'react'
import { CategoryScale, Chart as ChartJS, Filler, LinearScale, LineElement, PointElement, Tooltip } from 'chart.js'
import { Line } from 'react-chartjs-2'
import { Link } from 'react-router-dom'
import { useApp } from '../context/useApp'
import AppointmentCalendar from '../components/AppointmentCalendar'
import HouseScene from '../components/HouseScene'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

const stages = ['New', 'Contacted', 'Site Visit', 'Interested', 'Negotiation', 'Booked']
const parseAmount = (amount = '') => {
	const value = Number(String(amount).replace(/[₹,\s]/g, '').replace(/Cr|L/gi, ''))
	return /Cr/i.test(amount) ? value : value / 100
}
const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const parseDateKey = (value) => {
	const [year, month, day] = value.split('-').map(Number)
	return new Date(year, month - 1, day)
}
const addDaysKey = (value, days) => {
	const date = parseDateKey(value)
	date.setDate(date.getDate() + days)
	return dateKey(date)
}
const meetingSort = (first, second) => `${first.date} ${first.time || ''}`.localeCompare(`${second.date} ${second.time || ''}`)
const formatChartDate = (value) => (value instanceof Date ? value : parseDateKey(value)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

export default function SalesDashboard() {
	const { account, properties, propertiesStatus, workspaceDataStatus, leadsStatus, leads, bookings, meetings, loadProperties } = useApp()
	useEffect(() => {
		if (propertiesStatus === 'idle') loadProperties({ offset: 0, limit: 20 })
	}, [loadProperties, propertiesStatus])
	const todayKey = dateKey(new Date())
	const dashboardMonth = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
	const orderedMeetings = useMemo(() => [...meetings].sort(meetingSort), [meetings])
	const nextMeeting = orderedMeetings.find((meeting) => meeting.date >= todayKey) || orderedMeetings[0]
	const [selectedDate, setSelectedDate] = useState(() => nextMeeting?.date || todayKey)
	const initialCalendarStart = new Date(nextMeeting ? parseDateKey(nextMeeting.date) : new Date())
	initialCalendarStart.setDate(initialCalendarStart.getDate() - initialCalendarStart.getDay())
	const [calendarFrom, setCalendarFrom] = useState(() => dateKey(initialCalendarStart))
	const [calendarTo, setCalendarTo] = useState(() => { const end = new Date(initialCalendarStart); end.setDate(end.getDate() + 6); return dateKey(end) })
	const maxCalendarTo = addDaysKey(calendarFrom, 6)
	const changeCalendarFrom = (value) => {
		setCalendarFrom(value)
		if (calendarTo > addDaysKey(value, 6)) setCalendarTo(addDaysKey(value, 6))
	}
	const [analyticsFrom, setAnalyticsFrom] = useState(() => {
		const date = new Date()
		return dateKey(new Date(date.getFullYear(), date.getMonth(), 1))
	})
	const [analyticsTo, setAnalyticsTo] = useState(todayKey)
	const selectedMeetings = orderedMeetings.filter((meeting) => meeting.date === selectedDate)
	const visibleDays = useMemo(() => {
		const start = parseDateKey(calendarFrom)
		const end = parseDateKey(calendarTo)
		const totalDays = Math.max(1, Math.min(7, Math.round((end - start) / 86400000) + 1))
		return Array.from({ length: totalDays }, (_, index) => { const date = new Date(start); date.setDate(date.getDate() + index); return date })
	}, [calendarFrom, calendarTo])
	const visibleMeetingCount = orderedMeetings.filter((meeting) => visibleDays.some((date) => dateKey(date) === meeting.date)).length
	const selectCalendarDate = (date) => {
		setSelectedDate(dateKey(date))
	}
	const analyticsLeads = useMemo(() => leads.filter((lead) => !lead.createdAt || (lead.createdAt.slice(0, 10) >= analyticsFrom && lead.createdAt.slice(0, 10) <= analyticsTo)), [leads, analyticsFrom, analyticsTo])
	const analyticsBookings = useMemo(() => bookings.filter((booking) => {
		const createdDate = booking.createdAt?.slice(0, 10) || todayKey
		return createdDate >= analyticsFrom && createdDate <= analyticsTo
	}), [bookings, analyticsFrom, analyticsTo, todayKey])
	const stageCounts = useMemo(() => stages.reduce((result, stage) => ({ ...result, [stage]: analyticsLeads.filter((lead) => lead.stage === stage).length }), {}), [analyticsLeads])
	const availableUnits = properties.reduce((total, property) => total + property.units.length, 0)
	const bookedValue = bookings.reduce((total, booking) => total + parseAmount(booking.amount), 0)
	const featuredProperty = properties.find((property) => property.name === 'Marina House') || properties[0]
	const analyticsTimeline = useMemo(() => {
		const start = parseDateKey(analyticsFrom)
		const end = parseDateKey(analyticsTo)
		const totalDays = Math.max(1, Math.round((end - start) / 86400000) + 1)
		const buckets = Array.from({ length: 6 }, (_, index) => ({
			label: formatChartDate(new Date(start.getTime() + Math.round((totalDays - 1) * index / 5) * 86400000)),
			interested: 0,
			booked: 0
		}))
		const bucketFor = (value) => Math.min(5, Math.floor((Math.max(0, Math.round((parseDateKey(value) - start) / 86400000)) / totalDays) * 6))
		analyticsLeads.filter((lead) => lead.stage === 'Interested').forEach((lead) => { buckets[bucketFor(lead.createdAt?.slice(0, 10) || todayKey)].interested += 1 })
		analyticsBookings.forEach((booking) => { buckets[bucketFor(booking.createdAt?.slice(0, 10) || todayKey)].booked += 1 })
		return buckets.reduce((result, bucket) => {
			const previous = result[result.length - 1]
			result.push({ label: bucket.label, interested: bucket.interested + (previous?.interested || 0), booked: bucket.booked + (previous?.booked || 0) })
			return result
		}, [])
	}, [analyticsFrom, analyticsTo, analyticsLeads, analyticsBookings, todayKey])
	const chartData = { labels: analyticsTimeline.map((point) => point.label), datasets: [{ label: 'Interested', data: analyticsTimeline.map((point) => point.interested), borderColor: '#0c8063', backgroundColor: 'rgba(130, 205, 181, .18)', borderWidth: 2.7, pointBackgroundColor: '#fff', pointBorderColor: '#0c8063', pointBorderWidth: 3, pointRadius: 3, pointHoverRadius: 6, fill: true, tension: .35 }, { label: 'Booked', data: analyticsTimeline.map((point) => point.booked), borderColor: '#d48738', backgroundColor: 'transparent', borderWidth: 2.4, pointBackgroundColor: '#fff', pointBorderColor: '#d48738', pointBorderWidth: 3, pointRadius: 3, pointHoverRadius: 6, fill: false, tension: .35 }] }
	const chartOptions = { responsive: true, maintainAspectRatio: false, animation: { duration: 900 }, interaction: { mode: 'index', intersect: false }, plugins: { legend: { display: false }, tooltip: { displayColors: true, backgroundColor: '#163229', padding: 10, titleFont: { family: 'DM Sans', size: 10 }, bodyFont: { family: 'DM Sans', size: 10 }, callbacks: { label: (context) => `${context.dataset.label}: ${context.parsed.y} ${context.dataset.label === 'Booked' ? 'reservations' : 'leads'}`, afterBody: (contexts) => `Cumulative through ${contexts[0]?.label || ''}` } } }, scales: { x: { grid: { display: false }, border: { display: false }, ticks: { color: '#a0aaa5', font: { family: 'DM Sans', size: 9 }, maxRotation: 0 } }, y: { beginAtZero: true, suggestedMax: 5, ticks: { precision: 0, stepSize: 1, color: '#a0aaa5', font: { family: 'DM Sans', size: 9 } }, grid: { color: '#edf1ee' }, border: { display: false } } } }

	return <div className={`sales-dashboard ${workspaceDataStatus === 'loading' ? 'sales-dashboard-loading' : ''} ${propertiesStatus === 'loading' ? 'sales-inventory-loading' : ''} ${leadsStatus === 'loading' ? 'sales-leads-loading' : ''}`}>
		<header className="sales-dashboard-header"><div><span className="eyebrow">MANJU GROUPS / SALES DESK</span><h1>Your portfolio, in motion.</h1><p>{dashboardMonth} · Chennai portfolio · {leads.length} buyer relationships in play</p></div><div className="sales-header-actions"><span className="live-indicator"><i />Live workspace</span><Link className="button secondary" to="/leads">Lead desk</Link>{account?.role === 'admin' && <Link className="button primary" to="/properties">New property <span>+</span></Link>}</div></header>
		<section className="dashboard-hero-layout"><section className="sales-stat-ribbon"><article className="sales-metric mint"><i className="metric-glyph" /><span className="eyebrow">Active leads</span><strong>{leads.length}</strong><small>Across the pipeline</small><b className="metric-trend">Live</b></article><article className="sales-metric sky"><i className="metric-glyph" /><span className="eyebrow">Available inventory</span><strong>{availableUnits}</strong><small>{properties.length} mapped properties</small><b className="metric-trend">Live</b></article><article className="sales-metric peach"><i className="metric-glyph" /><span className="eyebrow">Booked value</span><strong>₹{bookedValue.toFixed(2)} Cr</strong><small>{bookings.length} reservation{bookings.length === 1 ? '' : 's'}</small><b className="metric-trend">Live</b></article><article className="sales-metric lilac"><i className="metric-glyph" /><span className="eyebrow">Conversion focus</span><strong>{leads.length ? Math.round(((stageCounts.Interested + stageCounts.Negotiation + stageCounts.Booked) / leads.length) * 100) : 0}%</strong><small>Leads at decision stage</small><b className="metric-trend">Live</b></article></section>{featuredProperty && <section className="property-showcase"><div className="property-showcase-copy"><span className="eyebrow">FEATURED PROPERTY / {featuredProperty.type}</span><h2>{featuredProperty.name}</h2><p>{featuredProperty.location}. A closer look at the home currently drawing the most attention.</p><div className="property-showcase-facts"><span><strong>{featuredProperty.units.length}</strong><small>Open units</small></span><span><strong>{featuredProperty.price}</strong><small>Starting from</small></span><span><strong>{featuredProperty.status}</strong><small>Availability</small></span></div><Link className="button secondary" to="/properties">Explore property <span>↗</span></Link></div><div className="property-showcase-image"><HouseScene /><span className="property-showcase-badge">MANJU EDIT</span></div></section>}</section>
		<section className="sales-primary-grid"><article className="sales-surface sales-chart-card"><div className="surface-header"><div><span className="eyebrow">SALES ANALYTICS</span><h2>Momentum is building.</h2><p>Qualified conversations by stage</p></div><div className="chart-date-range"><label>From<input type="date" value={analyticsFrom} max={analyticsTo} onChange={(event) => setAnalyticsFrom(event.target.value)} /></label><label>To<input type="date" value={analyticsTo} min={analyticsFrom} max={todayKey} onChange={(event) => setAnalyticsTo(event.target.value)} /></label></div></div><div className="sales-chart"><Line data={chartData} options={chartOptions} /></div><div className="analytics-footer"><span><i className="dot mint-dot" />Interested <b>{stageCounts.Interested}</b></span><span><i className="dot gold-dot" />Negotiating <b>{stageCounts.Negotiation}</b></span><span><i className="dot blue-dot" />Site visits <b>{stageCounts['Site Visit']}</b></span><span className="analytics-range-note">{analyticsFrom} to {analyticsTo}</span></div></article><article className="sales-surface agenda-surface"><div className="surface-header"><div><span className="eyebrow">UP NEXT</span><h2>Appointments</h2><p>{orderedMeetings.length} scheduled touchpoint{orderedMeetings.length === 1 ? '' : 's'}</p></div><Link className="text-button" to="/leads">Manage</Link></div><AppointmentCalendar meetings={orderedMeetings} selectedDate={selectedDate} selectedMeetings={selectedMeetings} visibleDays={visibleDays} visibleMeetingCount={visibleMeetingCount} selectCalendarDate={selectCalendarDate} todayKey={todayKey} calendarFrom={calendarFrom} calendarTo={calendarTo} setCalendarTo={setCalendarTo} maxCalendarTo={maxCalendarTo} changeCalendarFrom={changeCalendarFrom} compact /></article></section>
		<section className="sales-surface listings-surface"><div className="surface-header"><div><span className="eyebrow">ACTIVE LISTINGS</span><h2>Properties in motion.</h2><p>Inventory, demand, and status at a glance.</p></div><Link className="text-button" to="/properties">View all properties →</Link></div><div className="listing-head"><span>Property</span><span>Type</span><span>Open units</span><span>Leads</span><span>Status</span></div>{properties.slice(0, 5).map((property) => <div className="listing-line" key={property.id}><div className="listing-name"><img src={property.imageUrl} alt="" /><span><strong>{property.name}</strong><small>{property.location}</small></span></div><span>{property.type}</span><b>{property.units.length}</b><span>{leads.filter((lead) => lead.property === property.name).length}</span><span className="listing-pill"><i />{property.status}</span></div>)}</section>
	</div>
}
