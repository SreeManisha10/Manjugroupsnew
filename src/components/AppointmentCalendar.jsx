import { useMemo, useState } from 'react'

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

export default function AppointmentCalendar({
  meetings,
  selectedDate: selectedDateOverride,
  selectedMeetings: selectedMeetingsOverride,
  visibleDays: visibleDaysOverride,
  visibleMeetingCount: visibleMeetingCountOverride,
  selectCalendarDate: selectCalendarDateOverride,
  todayKey: todayKeyOverride,
  calendarFrom: calendarFromOverride,
  calendarTo: calendarToOverride,
  setCalendarTo: setCalendarToOverride,
  maxCalendarTo: maxCalendarToOverride,
  changeCalendarFrom: changeCalendarFromOverride,
  compact = false,
}) {
  const todayKey = todayKeyOverride || dateKey(new Date())
  const orderedMeetings = useMemo(() => [...meetings].sort(meetingSort), [meetings])
  const nextMeeting = orderedMeetings.find((meeting) => meeting.date >= todayKey) || orderedMeetings[0]
  const initialCalendarStart = new Date(nextMeeting ? parseDateKey(nextMeeting.date) : new Date())
  initialCalendarStart.setDate(initialCalendarStart.getDate() - initialCalendarStart.getDay())
  const [localSelectedDate, setLocalSelectedDate] = useState(() => nextMeeting?.date || todayKey)
  const [localCalendarFrom, setLocalCalendarFrom] = useState(() => dateKey(initialCalendarStart))
  const [localCalendarTo, setLocalCalendarTo] = useState(() => {
    const end = new Date(initialCalendarStart)
    end.setDate(end.getDate() + 6)
    return dateKey(end)
  })
  const selectedDate = selectedDateOverride ?? localSelectedDate
  const calendarFrom = calendarFromOverride ?? localCalendarFrom
  const calendarTo = calendarToOverride ?? localCalendarTo
  const setCalendarTo = setCalendarToOverride || setLocalCalendarTo
  const maxCalendarTo = maxCalendarToOverride ?? addDaysKey(calendarFrom, 6)
  const changeCalendarFrom = changeCalendarFromOverride || ((value) => {
    setLocalCalendarFrom(value)
    if (localCalendarTo > addDaysKey(value, 6)) setLocalCalendarTo(addDaysKey(value, 6))
  })
  const selectCalendarDate = selectCalendarDateOverride || ((date) => setLocalSelectedDate(dateKey(date)))
  const selectedMeetings = selectedMeetingsOverride ?? orderedMeetings.filter((meeting) => meeting.date === selectedDate)
  const calculatedVisibleDays = useMemo(() => {
    const start = parseDateKey(calendarFrom)
    const end = parseDateKey(calendarTo)
    const totalDays = Math.max(1, Math.min(7, Math.round((end - start) / 86400000) + 1))
    return Array.from({ length: totalDays }, (_, index) => {
      const date = new Date(start)
      date.setDate(date.getDate() + index)
      return date
    })
  }, [calendarFrom, calendarTo])
  const visibleDays = visibleDaysOverride ?? calculatedVisibleDays
  const visibleMeetingCount = visibleMeetingCountOverride ?? orderedMeetings.filter((meeting) => visibleDays.some((date) => dateKey(date) === meeting.date)).length
  const startHour = compact ? 9 : 8
  const hourHeight = compact ? 46 : 64
  const hours = Array.from({ length: compact ? 9 : 11 }, (_, index) => index + startHour)
  const getMeetingStyle = (meeting) => {
    const [hour, minute] = (meeting.time || '09:00').split(':').map(Number)
    const top = Math.max(0, ((hour + minute / 60) - startHour) * hourHeight)
    return { top: `${top}px`, height: compact ? '40px' : '66px' }
  }
  const getMeetingClass = (meeting) => `agenda-event-${(meeting.type || 'appointment').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  const dayCount = visibleDays.length

  return <>
    <div className="agenda-date-range"><label>From<input type="date" value={calendarFrom} onChange={(event) => changeCalendarFrom(event.target.value)} /></label><span>to</span><label>To<input type="date" value={calendarTo} min={calendarFrom} max={maxCalendarTo} onChange={(event) => setCalendarTo(event.target.value)} /></label></div>
    <div className={`agenda-week-scroll ${compact ? 'agenda-compact' : ''}`}><div className="agenda-week-grid" style={{ '--agenda-day-count': dayCount, '--agenda-hour-count': hours.length, '--agenda-hour-height': `${hourHeight}px` }}><div className="agenda-time-column">{hours.map((hour) => <span key={hour}>{String(hour).padStart(2, '0')}:00</span>)}</div><div className="agenda-days-column"><div className="agenda-day-headings">{visibleDays.map((date) => { const key = dateKey(date); return <button type="button" className={`${key === selectedDate ? 'active' : ''} ${key === todayKey ? 'today' : ''}`} key={key} onClick={() => selectCalendarDate(date)}><small>{date.toLocaleDateString('en-IN', { weekday: 'short' })}</small><strong>{date.getDate()}</strong></button> })}</div><div className="agenda-time-grid">{hours.map((hour) => <div className="agenda-hour-line" key={hour} />)}{visibleDays.map((date) => { const key = dateKey(date); return <div className="agenda-day-column" key={key}>{orderedMeetings.filter((meeting) => meeting.date === key).map((meeting) => <button type="button" className={`agenda-event ${getMeetingClass(meeting)}`} style={getMeetingStyle(meeting)} key={meeting.id} onClick={() => selectCalendarDate(date)}><b>{meeting.time}</b><strong>{meeting.type}</strong><span>{meeting.lead}</span></button>)}</div> })}</div></div></div></div>
    <div className="agenda-calendar-summary"><span>{visibleMeetingCount} appointment{visibleMeetingCount === 1 ? '' : 's'} in view</span>{selectedMeetings.length > 0 && <b>{selectedMeetings[0].lead}</b>}</div>
    {compact && <div className="agenda-appointment-details">{selectedMeetings.length ? selectedMeetings.map((meeting) => <article className="agenda-appointment-detail" key={meeting.id}><time>{meeting.time}</time><div><strong>{meeting.lead || 'Unassigned buyer'}</strong><span>{[meeting.type, meeting.property, meeting.unit && `Unit ${meeting.unit}`].filter(Boolean).join(' · ')}</span>{meeting.notes && <small>{meeting.notes}</small>}</div></article>) : <p className="agenda-no-appointments">No appointments scheduled for this day.</p>}</div>}
  </>
}
