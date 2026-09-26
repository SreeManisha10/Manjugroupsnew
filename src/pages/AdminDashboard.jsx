import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip } from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { useApp } from '../context/useApp'
import HouseScene from '../components/HouseScene'
import LoadingSkeleton from '../components/LoadingSkeleton'
import AppointmentCalendar from '../components/AppointmentCalendar'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Tooltip, Legend)

const parseAmount = (amount = '') => {
  const value = Number(String(amount).replace(/[₹,\s]/g, '').replace(/Cr|L/gi, ''))
  return /Cr/i.test(amount) ? value : value / 100
}

export default function AdminDashboard() {
  const { properties, propertiesStatus, workspaceDataStatus, leads, bookings, employees, meetings, loadProperties } = useApp()
  const dashboardLoading = workspaceDataStatus === 'loading'
  useEffect(() => {
    if (propertiesStatus === 'idle') loadProperties({ offset: 0, limit: 20 })
  }, [loadProperties, propertiesStatus])
  const revenue = bookings.reduce((total, booking) => total + parseAmount(booking.amount), 0)
  const employeeForBooking = (booking) => {
    const lead = leads.find((item) => (booking.leadId && item.id === booking.leadId) || (booking.lead && item.name === booking.lead))
    const property = properties.find((item) => (booking.propertyId && item.id === booking.propertyId) || (booking.property && item.name === booking.property))
    const assignedTo = booking.assignedTo || lead?.assignedTo || property?.assignedTo
    return employees.find((employee) => employee.id === assignedTo || employee.name === assignedTo)
  }
  const performance = employees.map((employee) => {
    const employeeLeads = leads.filter((lead) => lead.assignedTo === employee.id)
    const employeeProperties = properties.filter((property) => property.assignedTo === employee.id)
    const employeeBookings = bookings.filter((booking) => employeeForBooking(booking)?.id === employee.id)
    return { ...employee, leads: employeeLeads.length, properties: employeeProperties.length, bookings: employeeBookings.length, revenue: employeeBookings.reduce((total, booking) => total + parseAmount(booking.amount), 0) }
  }).sort((first, second) => second.revenue - first.revenue || second.leads - first.leads)
  const stageNames = ['New', 'Contacted', 'Site Visit', 'Interested', 'Negotiation', 'Booked']
  const stageValues = stageNames.map((stage) => leads.filter((lead) => lead.stage === stage).length)
  const employeeLabels = performance.map((employee) => employee.name.split(' ')[0])
  const employeeRevenue = performance.map((employee) => employee.revenue)
  const featuredProperty = properties.find((property) => property.name === 'Marina House') || properties[0]
  const monthlyRevenue = Array.from({ length: 6 }, (_, index) => {
    const month = new Date()
    month.setDate(1)
    month.setMonth(month.getMonth() - 5 + index)
    const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`
    const value = bookings
      .filter((booking) => booking.createdAt?.slice(0, 7) === key)
      .reduce((total, booking) => total + parseAmount(booking.amount), 0)
    return { label: month.toLocaleDateString('en-IN', { month: 'short' }), value }
  })
  const peakMonth = monthlyRevenue.reduce((peak, month) => month.value > peak.value ? month : peak, monthlyRevenue[0])
  const previousMonthRevenue = monthlyRevenue.at(-2)?.value || 0
  const currentMonthRevenue = monthlyRevenue.at(-1)?.value || 0
  const revenuePercentChange = previousMonthRevenue ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 : null
  const revenueChange = revenuePercentChange === null ? (currentMonthRevenue ? 'New this month' : '0.0%') : `${revenuePercentChange > 0 ? '+' : ''}${revenuePercentChange.toFixed(1)}%`
  const assignedPropertyCount = properties.filter((property) => property.assignedTo).length
  const portfolioCoverage = properties.length ? Math.round((assignedPropertyCount / properties.length) * 100) : 0
  const revenueTrend = { labels: monthlyRevenue.map((month) => month.label), datasets: [{ label: 'Booked revenue', data: monthlyRevenue.map((month) => month.value), borderColor: '#1769c2', backgroundColor: 'rgba(117, 175, 231, .2)', borderWidth: 3, pointBackgroundColor: '#fff', pointBorderColor: '#1769c2', pointBorderWidth: 3, pointRadius: 4, pointHoverRadius: 7, fill: true, tension: .38 }] }
  const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#102f58', padding: 10, displayColors: false, callbacks: { label: (context) => `₹${Number(context.parsed.y || 0).toFixed(2)} Cr booked` } } }, scales: { x: { grid: { display: false }, border: { display: false }, ticks: { color: '#20252b', font: { family: 'DM Sans', size: 9 } } }, y: { beginAtZero: true, grid: { color: '#e8eef5' }, border: { display: false }, ticks: { color: '#20252b', font: { family: 'DM Sans', size: 9 }, callback: (value) => `₹${value} Cr` } } } }
  const pipelineData = { labels: employeeLabels, datasets: [{ label: 'Booked revenue', data: employeeRevenue, backgroundColor: ['#1769c2', '#d48738', '#7897d4', '#c4779b'], borderRadius: 5, borderSkipped: false, barThickness: 16 }] }
  const pipelineOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#163229', padding: 10, displayColors: false, callbacks: { label: (context) => `₹${Number(context.parsed.y || 0).toFixed(2)} Cr booked` } } }, scales: { x: { grid: { display: false }, border: { display: false }, ticks: { color: '#8b9991', font: { family: 'DM Sans', size: 9 } } }, y: { beginAtZero: true, grid: { color: '#edf1ee' }, border: { display: false }, ticks: { color: '#8b9991', font: { family: 'DM Sans', size: 9 } } } } }
  const stageData = { labels: stageNames, datasets: [{ data: stageValues, backgroundColor: ['#dcecff', '#b8d7f4', '#7897d4', '#1769c2', '#d48738', '#9c6cb5'], borderWidth: 0, hoverOffset: 7 }] }
  const stageOptions = { responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { display: false }, tooltip: { backgroundColor: '#163229', padding: 10, displayColors: false, callbacks: { label: (context) => `${context.label}: ${context.parsed} leads` } } } }

  return <div className="page-wrap admin-dashboard-page">
    <div className="page-heading admin-heading"><div><span className="eyebrow">MANJU GROUPS / ADMIN CONTROL ROOM</span><h1>Performance, in full view.</h1><p>Track revenue, team output, and portfolio ownership across the workspace.</p></div><div className="top-actions"><Link className="button secondary" to="/bookings">Review bookings</Link></div></div>
    <section className="dashboard-hero-layout">
      <section className="admin-stat-grid">
        <article><div className="admin-stat-card-head"><span className="eyebrow">Booked revenue</span><b className="admin-stat-trend">{revenueChange}</b></div><strong>{dashboardLoading ? <LoadingSkeleton className="skeleton-metric" /> : `₹${revenue.toFixed(2)} Cr`}</strong><small>{dashboardLoading ? <LoadingSkeleton className="skeleton-caption" /> : `${bookings.length} reservation${bookings.length === 1 ? '' : 's'} recorded`}</small></article>
        <article><div className="admin-stat-card-head"><span className="eyebrow">Team members</span><b className="admin-stat-trend positive">Active team</b></div><strong>{dashboardLoading ? <LoadingSkeleton className="skeleton-metric" /> : employees.length}</strong><small>{dashboardLoading ? <LoadingSkeleton className="skeleton-caption" /> : 'Sales employees in workspace'}</small></article>
        <article><div className="admin-stat-card-head"><span className="eyebrow">Portfolio coverage</span><b className="admin-stat-trend">{propertiesStatus === 'loading' ? <LoadingSkeleton className="skeleton-caption" /> : `${portfolioCoverage}% covered`}</b></div><strong>{propertiesStatus === 'loading' ? <LoadingSkeleton className="skeleton-metric" /> : <>{assignedPropertyCount}<small> / {properties.length}</small></>}</strong><small>{propertiesStatus === 'loading' ? <LoadingSkeleton className="skeleton-caption" /> : 'Properties with an owner'}</small></article>
        <article><div className="admin-stat-card-head"><span className="eyebrow">Conversion focus</span><b className="admin-stat-trend">Pipeline health</b></div><strong>{dashboardLoading ? <LoadingSkeleton className="skeleton-metric" /> : `${leads.length ? Math.round((leads.filter((lead) => ['Interested', 'Negotiation', 'Booked'].includes(lead.stage)).length / leads.length) * 100) : 0}%`}</strong><small>{dashboardLoading ? <LoadingSkeleton className="skeleton-caption" /> : 'Leads at decision stage'}</small></article>
      </section>
      {featuredProperty && <section className="property-showcase">
        <div className="property-showcase-copy"><span className="eyebrow">PORTFOLIO SPOTLIGHT / {featuredProperty.type}</span><h2>{featuredProperty.name}</h2><p>{featuredProperty.location}. Keep the team aligned around the property currently anchoring the portfolio.</p><div className="property-showcase-facts"><span><strong>{featuredProperty.units.length}</strong><small>Units</small></span><span><strong>{featuredProperty.price}</strong><small>Starting from</small></span><span><strong>{featuredProperty.status}</strong><small>Status</small></span></div><Link className="button secondary" to="/properties">Open property <span>↗</span></Link></div>
        <div className="property-showcase-image"><HouseScene /><span className="property-showcase-badge">PORTFOLIO VIEW</span></div>
      </section>}
    </section>
    <section className="admin-chart-grid">
      <article className="admin-surface admin-chart-surface">
        <div className="surface-header">
          <div><span className="eyebrow">REVENUE MOMENTUM</span><h2>Booked revenue by month.</h2><p>Booked value across the last six months</p></div>
          <span className="chart-period-badge">Last 6 months</span>
        </div>
        <div className="admin-chart-large">{dashboardLoading ? <div className="skeleton-chart" aria-label="Loading revenue chart">{Array.from({ length: 5 }, (_, index) => <LoadingSkeleton key={index} />)}</div> : <Line data={revenueTrend} options={chartOptions} />}</div>
        <div className="admin-chart-footer">
          <span><i className="dot mint-dot" />Booked revenue <b>₹{revenue.toFixed(2)} Cr</b></span>
          <span>Peak month <b>{peakMonth.value ? `${peakMonth.label} · ₹${peakMonth.value.toFixed(2)} Cr` : 'No bookings'}</b></span>
        </div>
      </article>
      <article className="admin-surface admin-mix-surface">
        <div className="surface-header"><div><span className="eyebrow">PIPELINE MIX</span><h2>Where attention sits.</h2><p>{leads.length} relationships across the funnel</p></div></div>
        <div className="admin-doughnut-wrap">{dashboardLoading ? <LoadingSkeleton className="skeleton-donut" /> : <Doughnut data={stageData} options={stageOptions} />}<strong>{dashboardLoading ? <LoadingSkeleton className="skeleton-caption" /> : leads.length}<small>Total leads</small></strong></div>
        <div className="admin-stage-legend">{stageNames.map((stage, index) => <span key={stage}><i style={{ background: stageData.datasets[0].backgroundColor[index] }} />{stage}<b>{stageValues[index]}</b></span>)}</div>
      </article>
    </section>
    <section className="admin-surface admin-team-chart"><div className="surface-header"><div><span className="eyebrow">TEAM REVENUE</span><h2>Performance, side by side.</h2><p>Booked value attributed to each sales rep</p></div></div><div className="admin-chart-medium">{dashboardLoading ? <div className="skeleton-chart" aria-label="Loading team revenue chart">{Array.from({ length: 5 }, (_, index) => <LoadingSkeleton key={index} />)}</div> : <Bar data={pipelineData} options={pipelineOptions} />}</div><div className="admin-performance-values" aria-label="Employee booking totals">{performance.map((employee) => <div key={employee.id}><span><b>{employee.initials || employee.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</b><strong>{employee.name}</strong></span><strong>₹{employee.revenue.toFixed(2)} Cr</strong><small>{employee.bookings} booking{employee.bookings === 1 ? '' : 's'} · {employee.leads} leads</small></div>)}</div></section>
    <section className="admin-surface agenda-surface admin-appointments-panel"><div className="surface-header"><div><span className="eyebrow">APPOINTMENTS</span><h2>Upcoming appointments.</h2><p>{meetings.length} scheduled touchpoint{meetings.length === 1 ? '' : 's'}</p></div><Link className="text-button" to="/leads">Manage appointments</Link></div><AppointmentCalendar meetings={meetings} compact /></section>
    <section className="admin-surface admin-activity-surface"><div className="surface-header"><div><span className="eyebrow">RECENT BOOKINGS</span><h2>Revenue in motion.</h2></div><Link className="text-button" to="/bookings">View all bookings →</Link></div><div className="admin-booking-head"><span>Buyer</span><span>Property</span><span>Unit</span><span>Value</span><span>Status</span></div>{dashboardLoading ? Array.from({ length: 3 }, (_, row) => <div className="skeleton-data-row" key={row}>{Array.from({ length: 5 }, (_, cell) => <LoadingSkeleton key={cell} />)}</div>) : bookings.slice(0, 5).map((booking) => <div className="admin-booking-row" key={booking.id}><strong>{booking.lead || 'Unassigned buyer'}</strong><span>{booking.property}</span><span>{booking.unit}</span><b>{booking.amount}</b><em>{booking.status}</em></div>)}</section>
  </div>
}
