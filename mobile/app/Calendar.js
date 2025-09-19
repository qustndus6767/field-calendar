import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet } from "react-native";
import { useAtom } from "jotai";
import { eventsAtom, selectedDateAtom } from "./index";
import { FontAwesome } from "@expo/vector-icons";

/**
 * 월별 달력 그리드(6주치) 생성
 */
function getMonthMatrix(year, month) {
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = startDay;

  const matrix = [];
  let week = [];

  const prevMonthLastDate = new Date(year, month, 0).getDate();
  for (let i = prevDays - 1; i >= 0; i--) {
    week.push({ day: prevMonthLastDate - i, type: "prev" });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    week.push({ day: d, type: "current" });
    if (week.length === 7) {
      matrix.push(week);
      week = [];
    }
  }

  let nextDay = 1;
  while (week.length > 0 && week.length < 7) {
    week.push({ day: nextDay++, type: "next" });
  }
  if (week.length === 7) matrix.push(week);

  // 항상 6주 유지
  while (matrix.length < 6) {
    const row = [];
    for (let i = 0; i < 7; i++) row.push({ day: nextDay++, type: "next" });
    matrix.push(row);
  }

  return matrix;
}

function formatDateKey(date) {
  return date.toLocaleDateString("en-CA");  // YYYY-MM-DD
}

export default function Calendar() {
  const [events] = useAtom(eventsAtom);
  const [selectedDate, setSelectedDate] = useAtom(selectedDateAtom);

  const [cursor, setCursor] = useState(() => {
    const d = new Date(selectedDate);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const [openEvent, setOpenEvent] = useState(null);

  const monthMatrix = useMemo(
    () => getMonthMatrix(cursor.year, cursor.month),
    [cursor]
  );

  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach((ev) => {
      map[ev.date] = map[ev.date] || [];
      map[ev.date].push(ev);
    });
    return map;
  }, [events]);

  function prevMonth() {
    setCursor(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
    );
  }

  function nextMonth() {
    setCursor(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
    );
  }

  function clickDay(cell) {
    let year = cursor.year;
    let month = cursor.month;
    if (cell.type === "prev") {
      if (month === 0) {
        year -= 1;
        month = 11;
      } else month -= 1;
    } else if (cell.type === "next") {
      if (month === 11) {
        year += 1;
        month = 0;
      } else month += 1;
    }
    const dateStr = formatDateKey(new Date(year, month, cell.day));
    setSelectedDate(dateStr);
  }

  const selectedEvents = eventsByDate[selectedDate] || [];

  return (
    <View style={styles.container}>
      {/* 달력 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={prevMonth}>
          <FontAwesome name="chevron-left" size={15} />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {cursor.year}년 {cursor.month + 1}월
        </Text>
        <TouchableOpacity onPress={nextMonth}>
          <FontAwesome name="chevron-right" size={15} />
        </TouchableOpacity>
      </View>

      {/* 요일 */}
      <View style={styles.weekdays}>
        {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
          <Text key={d} style={styles.weekday}>
            {d}
          </Text>
        ))}
      </View>

      {/* 달력 그리드 */}
      {monthMatrix.map((week, i) => (
        <View style={styles.week} key={i}>
          {week.map((cell, j) => {
            let y = cursor.year,
              m = cursor.month;
            if (cell.type === "prev") {
              if (m === 0) {
                y--;
                m = 11;
              } else m--;
            }
            if (cell.type === "next") {
              if (m === 11) {
                y++;
                m = 0;
              } else m++;
            }
            const dateKey = formatDateKey(new Date(y, m, cell.day));
            const evs = eventsByDate[dateKey] || [];
            const isSelected = selectedDate === dateKey;

            return (
              <TouchableOpacity
                key={j}
                style={[
                  styles.cell,
                  cell.type !== "current" && styles.cellDim,
                  isSelected && styles.cellSelected,
                ]}
                onPress={() => clickDay(cell)}
              >
                <Text>{cell.day}</Text>
                <View style={styles.dots}>
                  {evs.slice(0, 3).map((e) => (
                    <View key={e.id} style={styles.dot} />
                  ))}
                  {evs.length > 3 && (
                    <Text style={styles.more}>+{evs.length - 3}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      {/* 선택된 날짜 일정 목록 */}
      <ScrollView style={styles.sidebar}>
        <Text style={styles.sidebarTitle}>선택된 날짜</Text>
        <Text style={styles.selDate}>{selectedDate}</Text>

        <Text style={styles.sidebarTitle}>
          일정 목록 ({selectedEvents.length})
        </Text>
        {selectedEvents.length === 0 && (
          <Text style={styles.empty}>일정이 없습니다.</Text>
        )}
        {selectedEvents.map((ev) => (
          <TouchableOpacity
            key={ev.id}
            style={styles.eventItem}
            onPress={() => setOpenEvent(ev)}
          >
            <FontAwesome name="circle" size={10} />
            <Text style={styles.eventTitle}>{ev.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 이벤트 상세 모달 */}
      <Modal visible={!!openEvent} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setOpenEvent(null)}>
              <Text>✕</Text>
            </TouchableOpacity>
            {openEvent && (
              <>
                <Text style={styles.modalTitle}>{openEvent.title}</Text>
                <Text>{openEvent.date}</Text>
                <Text>{openEvent.details}</Text>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  header: { 
    flexDirection: "row", 
    justifyContent: "center", 
    alignItems: "center",
    gap: 20,
    marginBottom: 20  

  },
  monthTitle: { 
    fontSize: 18, 
    fontWeight: "bold"
  },
  weekdays: { 
    flexDirection: "row", 
    justifyContent: "space-around", 
    marginVertical: 10 
  },
  weekday: { 
    width: 30, 
    textAlign: "center" 
  },
  week: { 
    flexDirection: "row", 
    justifyContent: "space-around" 
  },
  cell: { 
    flex: 1, 
    alignItems: "center", 
    padding: 8 
  },
  cellDim: { 
    opacity: 0.3 
  },
  cellSelected: { 
    backgroundColor: "#cde", 
    borderRadius: 6 
  },
  dots: { 
    flexDirection: "row", 
    alignItems:"center",
    marginTop: 2 
  },
  dot: { 
    width: 6, 
    height: 6, 
    borderRadius: 3, 
    backgroundColor: "blue", 
    marginHorizontal: 1 
  },
  more: { 
    fontSize: 10, 
    color: "#555" 
  },
  sidebar: { 
    marginTop: 10 
  },
  sidebarTitle: { 
    fontSize: 16, 
    fontWeight: "bold", 
    marginTop: 10 
  },
  selDate: { 
    fontSize: 14, 
    marginVertical: 5 
  },
  empty: { 
    fontSize: 12, 
    color: "#999" 
  },
  eventItem: { 
    paddingVertical: 5, 
    flexDirection: "row", 
    alignItems: "center" 
  },
  eventTitle: { 
    marginLeft: 10 
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: { 
    backgroundColor: "#fff", 
    padding: 10, 
    paddingBottom: 20, 
    borderRadius: 8, 
    width: "80%" 
  },
  closeBtn: { alignSelf: "flex-end" },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
});
