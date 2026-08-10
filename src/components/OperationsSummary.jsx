import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions
} from "react-native";
import { useAppContext } from "../context/AppContext";
import { ArrowLeft, Users, Clock, Stethoscope, RefreshCw, BarChart2, CheckCircle } from "lucide-react-native";

export function OperationsSummary() {
  const { state, setState } = useAppContext();
  const [time, setTime] = useState(new Date());

  const windowWidth = Dimensions.get("window").width;
  const isMobile = windowWidth < 768;

  // Keep live time clock updated
  useEffect(() => {
    const clockTimer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(clockTimer);
  }, []);

  const handleExit = () => {
    setState(prev => ({ ...prev, currentView: "portal" }));
  };

  // Metrics calculations
  const totalTokensToday = state.tokens || [];
  const totalPatients = totalTokensToday.length;
  const waitingPatients = totalTokensToday.filter(t => t.status === "waiting").length;
  const inConsultationPatients = totalTokensToday.filter(t => t.status === "in_consultation" || t.status === "called").length;
  const completedPatients = totalTokensToday.filter(t => t.status === "completed").length;

  const activeDepartments = state.departments || [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.exitBtn} onPress={handleExit}>
          <ArrowLeft size={20} color="#1e293b" />
          <Text style={styles.exitText}>Exit Summary</Text>
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <BarChart2 size={24} color="#2563eb" style={{ marginRight: 8 }} />
          <Text style={styles.headerTitle}>Hospital Operations Dashboard</Text>
        </View>

        <View style={styles.clockContainer}>
          <Clock size={16} color="#64748b" style={{ marginRight: 6 }} />
          <Text style={styles.clockText}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Metric Cards Grid */}
        <View style={[styles.metricsRow, isMobile && styles.columnLayout]}>
          <View style={[styles.metricCard, { borderLeftColor: '#2563eb' }]}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>Total Patients Today</Text>
              <Users size={20} color="#2563eb" />
            </View>
            <Text style={styles.metricVal}>{totalPatients}</Text>
          </View>

          <View style={[styles.metricCard, { borderLeftColor: '#f59e0b' }]}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>Waiting in Queue</Text>
              <Clock size={20} color="#f59e0b" />
            </View>
            <Text style={styles.metricVal}>{waitingPatients}</Text>
          </View>

          <View style={[styles.metricCard, { borderLeftColor: '#ea580c' }]}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>In Consultation</Text>
              <Stethoscope size={20} color="#ea580c" />
            </View>
            <Text style={styles.metricVal}>{inConsultationPatients}</Text>
          </View>

          <View style={[styles.metricCard, { borderLeftColor: '#16a34a' }]}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>Completed Visits</Text>
              <CheckCircle size={20} color="#16a34a" />
            </View>
            <Text style={styles.metricVal}>{completedPatients}</Text>
          </View>
        </View>

        {/* Department Breakdown Section */}
        <Text style={styles.sectionTitle}>Clinics & Diagnostic Center Status</Text>

        <View style={styles.tableCard}>
          <View style={[styles.tableRow, styles.tableHeaderRow]}>
            <Text style={[styles.tableCol, styles.colDept, { fontWeight: 'bold' }]}>Department / Clinic</Text>
            <Text style={[styles.tableCol, styles.colStatus, { fontWeight: 'bold' }]}>Status</Text>
            <Text style={[styles.tableCol, styles.colServing, { fontWeight: 'bold' }]}>Now Serving</Text>
            <Text style={[styles.tableCol, styles.colWaiting, { fontWeight: 'bold' }]}>Waiting Count</Text>
            <Text style={[styles.tableCol, styles.colWaitTime, { fontWeight: 'bold' }]}>Est. Wait Time</Text>
          </View>

          {activeDepartments.map(dept => {
            // Calculate wait statistics
            const deptTokens = totalTokensToday.filter(t => {
              const activeVisit = (t.visits || []).find(v => v.department_id === dept.id && (v.status === 'waiting' || v.status === 'called' || v.status === 'in_consultation'));
              return activeVisit !== undefined;
            });

            const servingToken = deptTokens.find(t => {
              const v = (t.visits || []).find(v => v.department_id === dept.id);
              return v && (v.status === 'called' || v.status === 'in_consultation');
            });

            const countWaiting = deptTokens.filter(t => {
              const v = (t.visits || []).find(v => v.department_id === dept.id);
              return v && v.status === 'waiting';
            }).length;

            const avgWait = dept.average_wait_time || 15;
            const estWait = countWaiting * avgWait;

            return (
              <View key={dept.id} style={styles.tableRow}>
                <View style={styles.colDept}>
                  <Text style={styles.deptNameText}>{dept.name}</Text>
                  <Text style={styles.deptTypeText}>{dept.type === 'diagnostic' ? '🧪 Diagnostic' : '🏥 Clinic'}</Text>
                </View>
                
                <View style={styles.colStatus}>
                  <View style={[styles.statusBadge, dept.status === 'active' ? styles.bgActive : styles.bgInactive]}>
                    <Text style={[styles.statusBadgeText, dept.status === 'active' ? styles.textActive : styles.textInactive]}>
                      {dept.status === 'active' ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.tableCol, styles.colServing]}>{servingToken ? servingToken.id : '--'}</Text>
                <Text style={[styles.tableCol, styles.colWaiting]}>{countWaiting} patients</Text>
                <Text style={[styles.tableCol, styles.colWaitTime, { color: estWait > 30 ? '#dc2626' : '#1e293b', fontWeight: 'bold' }]}>
                  {estWait} mins
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    height: 70,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  exitBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  exitText: {
    color: "#1e293b",
    fontWeight: "bold",
    marginLeft: 6,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "bold",
  },
  clockContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  clockText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "bold",
  },
  scrollContent: {
    padding: 20,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 24,
  },
  columnLayout: {
    flexDirection: "column",
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderLeftWidth: 4,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  metricLabel: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "600",
  },
  metricVal: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0f172a",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 12,
  },
  tableCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  tableHeaderRow: {
    backgroundColor: "#f8fafc",
  },
  tableCol: {
    fontSize: 14,
    color: "#1e293b",
  },
  colDept: {
    flex: 2,
  },
  colStatus: {
    flex: 1,
  },
  colServing: {
    flex: 1,
  },
  colWaiting: {
    flex: 1,
  },
  colWaitTime: {
    flex: 1,
  },
  deptNameText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0f172a",
  },
  deptTypeText: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  bgActive: {
    backgroundColor: "#ecfdf5",
  },
  bgInactive: {
    backgroundColor: "#fef2f2",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  textActive: {
    color: "#10b981",
  },
  textInactive: {
    color: "#ef4444",
  },
});
