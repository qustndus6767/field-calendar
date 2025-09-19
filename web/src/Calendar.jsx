import React, { useMemo, useState } from 'react'
import { useAtom } from 'jotai'
import { eventsAtom, selectedDateAtom } from './App'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight, faCircleDot, faCircle, faCalendar } from "@fortawesome/free-solid-svg-icons";

/**
 * 월별 달력 그리드(6주치) 생성
 */
function getMonthMatrix(year, month) {
  const first = new Date(year, month, 1)              
  const startDay = first.getDay()                     
  const daysInMonth = new Date(year, month + 1, 0).getDate() 
  const prevDays = startDay                           

  const matrix = []
  let week = []

  const prevMonthLastDate = new Date(year, month, 0).getDate()
  for (let i = prevDays - 1; i >= 0; i--) {
    const d = prevMonthLastDate - i
    week.push({ day: d, type: 'prev' })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    week.push({ day: d, type: 'current' })
    if (week.length === 7) { matrix.push(week); week = [] }
  }

  let nextDay = 1
  while (week.length > 0 && week.length < 7) {
    week.push({ day: nextDay++, type: 'next' })
  }
  if (week.length === 7) matrix.push(week)

  while (matrix.length < 6) {
    const row = []
    for (let i = 0; i < 7; i++) row.push({ day: nextDay++, type: 'next' })
    matrix.push(row)
  }

  return matrix
}
function formatDateKey(date) {
  return date.toLocaleDateString("en-CA"); 
}
export default function Calendar() {
  const [events] = useAtom(eventsAtom)
  const [selectedDate, setSelectedDate] = useAtom(selectedDateAtom)

  const [cursor, setCursor] = useState(() => {
    const d = new Date(selectedDate)
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  const [openEvent, setOpenEvent] = useState(null)

  const monthMatrix = useMemo(
    () => getMonthMatrix(cursor.year, cursor.month),
    [cursor]
  )

  const eventsByDate = useMemo(() => {
    const map = {}
    events.forEach(ev => {
      map[ev.date] = map[ev.date] || []
      map[ev.date].push(ev)
    })
    return map
  }, [events])

  function prevMonth() {
    setCursor(({ year, month }) => {
      if (month === 0) return { year: year - 1, month: 11 }
      return { year, month: month - 1 }
    })
  }

  function nextMonth() {
    setCursor(({ year, month }) => {
      if (month === 11) return { year: year + 1, month: 0 }
      return { year, month: month + 1 }
    })
  }

  function clickDay(cell) {
    let year = cursor.year
    let month = cursor.month
    if (cell.type === 'prev') {
      if (month === 0) { year -= 1; month = 11 } else month -= 1
    } else if (cell.type === 'next') {
      if (month === 11) { year += 1; month = 0 } else month += 1
    }
    const dateStr = formatDateKey(new Date(year, month, cell.day));
    setSelectedDate(dateStr);
  }

  const selectedEvents = eventsByDate[selectedDate] || []

  return (
    <div className="calendar-wrapper">
      {/* 달력 헤더 */}
      <div className="calendar">
        <div className="cal-header">
            <button onClick={prevMonth} aria-label="prev">
                <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <div className="month-title">{cursor.year}년 {cursor.month + 1}월</div>
            <button onClick={nextMonth} aria-label="next">
                <FontAwesomeIcon icon={faChevronRight} />
            </button>
        </div>

        {/* 요일 헤더 */}
        <div className="weekdays">
          {['일','월','화','수','목','금','토'].map(d => (
            <div key={d} className="wd">{d}</div>
          ))}
        </div>

        {/* 달력 날짜 그리드 */}
        <div className="grid">
          {monthMatrix.map((week, i) => (
            <div className="week" key={i}>
              {week.map((cell, j) => {
                // 셀에 해당하는 실제 날짜 계산
                const cellDate = (() => {
                  let y = cursor.year, m = cursor.month
                  if (cell.type === 'prev') { if (m === 0) { y--; m = 11 } else m-- }
                  if (cell.type === 'next') { if (m === 11) { y++; m = 0 } else m++ }
                  return new Date(y, m, cell.day)
                })()
                const dateKey = formatDateKey(cellDate);
                const evs = eventsByDate[dateKey] || []
                const isSelected = selectedDate === dateKey

                return (
                  <button
                    key={j}
                    className={`cell ${cell.type} ${isSelected ? 'selected' : ''}`}
                    onClick={() => clickDay(cell)}
                  >
                    <div className="day-num">{cell.day}</div>

                    {/* 일정 점 표시 */}
                    <div className="dots">
                      {evs.slice(0,3).map(e => (
                        <span key={e.id} className="dot" title={e.title}></span>
                      ))}
                      {evs.length > 3 && <span className="more">+{evs.length - 3}</span>}
                    </div>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 오른쪽 사이드바: 선택한 날짜 일정 목록 */}
      <aside className="sidebar">
        <h3>선택된 날짜</h3>
        <div className="sel-date">{selectedDate}</div>

        <h3>일정 목록 ({selectedEvents.length})</h3>
        <ul className="event-list">
          {selectedEvents.length === 0 && (
            <li className="empty">일정이 없습니다.</li>
          )}
          {selectedEvents.map(ev => (
            <li key={ev.id} className="event-item" onClick={() => setOpenEvent(ev)}>
              <FontAwesomeIcon icon={faCircleDot} /> <strong>{ev.title}</strong>
              <div className="ev-preview">
                {ev.details.slice(0, 60)}{ev.details.length > 60 ? '...' : ''}
              </div>
            </li>
          ))}
        </ul>

        {/* 이벤트 상세 모달 */}
        {openEvent && (
          <div className="event-modal" role="dialog">
            <div className="modal-content">
              <button className="close" onClick={() => setOpenEvent(null)}>✕</button>
              <h3>{openEvent.title}</h3>
              <p className="modal-date">
                <FontAwesomeIcon icon={faCalendar} />
                <span>{openEvent.date}</span></p>
              <p className="modal-details">
                <FontAwesomeIcon icon={faCircle} />
                <span>{openEvent.details}</span></p>
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}
