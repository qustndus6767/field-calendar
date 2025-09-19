import React, { useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import { atom, useAtom } from "jotai";
import AsyncStorage from "@react-native-async-storage/async-storage";

import eventsData from "../assets/events.json";
import Calendar from "./Calendar";

export const eventsAtom = atom(async () => {
  try {
    const raw = await AsyncStorage.getItem("events_v1");
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return eventsData;
});
export const selectedDateAtom = atom(new Date().toISOString().slice(0, 10));

export default function App() {
  const [events, setEvents] = useAtom(eventsAtom);
  // persist
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem("events_v1", JSON.stringify(events));
      } catch (e) {}
    })();
  }, [events]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>외근 근무 일정 달력</Text>
        <Text style={styles.subtitle}>
          년/월/일 표기, 일정 표시, 날짜 클릭 시 상세 보기
        </Text>

        <Calendar />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: 50
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 10,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#555",
    marginBottom: 20,
  },
});