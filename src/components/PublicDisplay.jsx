import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform
} from "react-native";
import { useAppContext } from "../context/AppContext";
import { Volume2, VolumeX, ArrowLeft, Tv, Clock } from "lucide-react-native";

export function PublicDisplay() {
  const { state, setState } = useAppContext();
  const [time, setTime] = useState(new Date());
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Track already spoken token-status pairs to avoid duplication
  const spokenTokensRef = useRef(new Set());

  // Dimensions for grid columns
  const windowWidth = Dimensions.get("window").width;
  const isLargeScreen = windowWidth >= 900;

  // Keep live time clock updated
  useEffect(() => {
    const clockTimer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Text-To-Speech announcement trigger
  useEffect(() => {
    if (!soundEnabled) return;

    // Search for any active token in 'called' status
    const calledTokens = (state.tokens || []).filter(t => t.status === 'called');

    calledTokens.forEach(token => {
      const key = `${token.id}_called`;
      // Announce only if not announced yet in this session
      if (!spokenTokensRef.current.has(key)) {
        spokenTokensRef.current.add(key);

        const room = token.room_counter || 'Room 101';
        const tokenIdClean = token.id.split('-').pop() || token.id;
        const text = `Token number ${tokenIdClean}, please proceed to ${room}`;

        try {
          if (Platform.OS === 'web') {
            if ('speechSynthesis' in window) {
              window.speechSynthesis.cancel();
              const utterance = new SpeechSynthesisUtterance(text);
              utterance.lang = 'en-US';
              window.speechSynthesis.speak(utterance);
            }
          } else {
            const Speech = require('expo-speech');
            Speech.stop();
            Speech.speak(text, { language: 'en-US' });
          }
        } catch (err) {
          console.log("TTS Announcement execution blocked or failed", err);
        }
      }
    });
  }, [soundEnabled, state.tokens]);

  const handleExit = () => {
    setState(prev => ({ ...prev, currentView: "portal" }));
  };

  // Group active queue entries by department
  const activeDepartments = state.departments || [];
  
  return (
    <View style={styles.container}>
      {/* 1. Header Area */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.exitBtn} onPress={handleExit}>
          <ArrowLeft size={24} color="#fff" />
          <Text style={styles.exitText}>Exit TV Mode</Text>
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Tv size={28} color="#38bdf8" style={{ marginRight: 10 }} />
          <Text style={styles.headerTitle}>GGH QUEUE WAITING DISPLAY</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={[styles.soundToggleBtn, !soundEnabled && styles.soundDisabled]}
            onPress={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? <Volume2 size={24} color="#fff" /> : <VolumeX size={24} color="#cbd5e1" />}
          </TouchableOpacity>
          
          <View style={styles.clockContainer}>
            <Clock size={20} color="#38bdf8" style={{ marginRight: 6 }} />
            <Text style={styles.clockText}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</Text>
          </View>
        </View>
      </View>

      {/* 2. Grid Columns of Departments */}
      <ScrollView 
        contentContainerStyle={[
          styles.gridContainer, 
          isLargeScreen ? styles.rowLayout : styles.columnLayout
        ]}
      >
        {activeDepartments.map(dept => {
          // Find tokens currently active or waiting in this specific department using visits
          const deptTokens = (state.tokens || []).filter(t => {
            // Find active visit for this department
            const activeVisit = (t.visits || []).find(v => v.department_id === dept.id && (v.status === 'waiting' || v.status === 'called'));
            return activeVisit !== undefined;
          });

          // Sort by emergency/priority and timestamp (same as Staff Dashboard queue sorting)
          const priorityMap = { emergency: 1, disabled: 2, common: 3 };
          deptTokens.sort((a, b) => {
            const isAEmergency = a.type?.toLowerCase() === 'emergency' || a.primaryDepartment?.toLowerCase() === 'emergency';
            const isBEmergency = b.type?.toLowerCase() === 'emergency' || b.primaryDepartment?.toLowerCase() === 'emergency';
            if (isAEmergency && !isBEmergency) return -1;
            if (!isAEmergency && isBEmergency) return 1;
            const pA = priorityMap[a.type] || 3;
            const pB = priorityMap[b.type] || 3;
            if (pA !== pB) return pA - pB;
            return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          });

          // Extract now serving and upcoming list
          const nowServingToken = deptTokens.find(t => {
            const v = (t.visits || []).find(v => v.department_id === dept.id);
            return v && v.status === 'called';
          });
          const waitingList = deptTokens.filter(t => t.id !== nowServingToken?.id).slice(0, 5);

          return (
            <View key={dept.id} style={[styles.deptColumn, !isLargeScreen && { width: '100%' }]}>
              {/* Dept Header */}
              <View style={styles.deptHeader}>
                <Text style={styles.deptHeaderText} numberOfLines={1}>{dept.name.toUpperCase()}</Text>
              </View>

              {/* Now Serving Card */}
              <View style={[styles.servingCard, nowServingToken && styles.servingCardActive]}>
                <Text style={styles.servingLabel}>NOW SERVING</Text>
                {nowServingToken ? (
                  <>
                    <Text style={styles.servingTokenId}>{nowServingToken.id}</Text>
                    <View style={styles.roomBadge}>
                      <Text style={styles.roomText}>
                        {nowServingToken.room_counter || 'Room 101'}
                      </Text>
                    </View>
                  </>
                ) : (
                  <Text style={styles.noServingText}>--</Text>
                )}
              </View>

              {/* Upcoming Queue List */}
              <View style={styles.upcomingContainer}>
                <Text style={styles.upcomingHeader}>NEXT IN LINE</Text>
                {waitingList.length > 0 ? (
                  waitingList.map((t, idx) => (
                    <View key={t.id} style={styles.upcomingRow}>
                      <Text style={styles.upcomingIdx}>{idx + 1}</Text>
                      <Text style={styles.upcomingToken}>{t.id}</Text>
                      <Text style={styles.upcomingType}>
                        {t.type === 'emergency' ? '🔴 EME' : t.type === 'disabled' ? '🔵 ACC' : '⚪ GEN'}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No waiting patients</Text>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a", // Dark professional background
  },
  header: {
    height: 70,
    backgroundColor: "#1e293b",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#334155",
  },
  exitBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#475569",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  exitText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 6,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  soundToggleBtn: {
    backgroundColor: "#0ea5e9",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  soundDisabled: {
    backgroundColor: "#334155",
  },
  clockContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  clockText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  gridContainer: {
    padding: 16,
    gap: 16,
  },
  rowLayout: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  columnLayout: {
    flexDirection: "column",
  },
  deptColumn: {
    width: 280,
    backgroundColor: "#1e293b",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  deptHeader: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    alignItems: "center",
  },
  deptHeaderText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  servingCard: {
    backgroundColor: "#334155",
    padding: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  servingCardActive: {
    backgroundColor: "#15803d", // Green when serving
  },
  servingLabel: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 4,
  },
  servingTokenId: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 1,
  },
  roomBadge: {
    backgroundColor: "#ffffff22",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginTop: 8,
  },
  roomText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },
  noServingText: {
    color: "#94a3b8",
    fontSize: 24,
    fontWeight: "800",
  },
  upcomingContainer: {
    padding: 16,
  },
  upcomingHeader: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 8,
  },
  upcomingRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#334155",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
  upcomingIdx: {
    color: "#94a3b8",
    fontWeight: "bold",
    width: 20,
  },
  upcomingToken: {
    color: "#fff",
    fontWeight: "bold",
    flex: 1,
  },
  upcomingType: {
    fontSize: 11,
    fontWeight: "bold",
  },
  emptyText: {
    color: "#64748b",
    textAlign: "center",
    fontStyle: "italic",
    paddingVertical: 8,
  },
});
