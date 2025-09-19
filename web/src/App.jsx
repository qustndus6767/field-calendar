import React, { useEffect } from "react";
import { atom, useAtom } from "jotai";
import Calendar from "./Calendar";
import "./App.css";
import "./styles.css";

// Atom 정의
export const eventsAtom = atom([]);
export const selectedDateAtom = atom(new Date().toISOString().slice(0, 10));

export default function App() {
  const [events, setEvents] = useAtom(eventsAtom);
  // 처음 로딩 시 public/events.json 불러오기
  useEffect(() => {
  const saved = localStorage.getItem("events_v1");
  if (saved && saved !== "[]") {
    setEvents(JSON.parse(saved));
  } else {
    fetch("/events.json")
      .then((res) => res.json())
      .then((data) => {
        setEvents(data);
      })
      .catch((err) => console.error("JSON 로드 실패:", err));
  }
}, [setEvents]);
  // 변경된 events를 localStorage에 저장
  useEffect(() => {
    try {
      localStorage.setItem("events_v1", JSON.stringify(events));
    } catch (e) {}
  }, [events]);

  return (
    <div className="app-root">
      <header className="header">
        <h1>외근 근무 일정 달력</h1>
        <p className="subtitle">
          년/월/일 표기, 일정 표시, 날짜 클릭 시 상세 보기
        </p>
      </header>

      <main className="main">
        <Calendar />
      </main>

      <footer className="footer"></footer>
    </div>
  );
}
