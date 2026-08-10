import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity
} from 'react-native';
import { useAppContext } from '../context/AppContext';
import { useTranslation } from '../hooks/useTranslation';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Toggle } from './ui/toggle';
import {
  Languages,
  Type,
  CheckCircle,
  Zap,
  QrCode,
  ArrowRight,
  Stethoscope,
  Monitor,
  Tv,
  BarChart2,
  Shield,
  ChevronDown
} from 'lucide-react-native';

const languages = {
  en: 'English',
  hi: 'हिंदी',
  te: 'తెలుగు',
  ta: 'தமிழ்',
  mr: 'मराठी',
  bn: 'বাংলা'
};

const { width } = Dimensions.get('window');

export function PatientPortal() {
  const { state, setState } = useAppContext();
  const { t } = useTranslation();
  const [showOperationalModes, setShowOperationalModes] = React.useState(false);

  const handleLanguageChange = (language) => {
    setState(prev => ({ ...prev, language }));
  };

  const handleAccessibilityToggle = (pressed) => {
    setState(prev => ({ ...prev, accessibilityMode: pressed ? 'high-contrast' : 'normal' }));
  };

  const handleContinueAsPatient = () => {
    setState(prev => ({ ...prev, currentView: 'patient-registration' }));
  };

  const handleContinueAsStaff = () => {
    setState(prev => ({ ...prev, currentView: 'staff-login' }));
  };

  const handleContinueAsKiosk = () => {
    setState(prev => ({ ...prev, currentView: 'kiosk-welcome' }));
  };

  const handleContinueAsPublic = () => {
    setState(prev => ({ ...prev, currentView: 'public-display' }));
  };

  const handleContinueAsOperations = () => {
    setState(prev => ({ ...prev, currentView: 'operations-summary' }));
  };

  const isLarge = state.accessibilityMode === 'high-contrast';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Top Controls Bar */}
      <View style={styles.topBar}>
        <View style={styles.controlGroup}>
          <View style={styles.iconCircle}>
            <Languages size={20} color="#0ea5e9" />
          </View>
          <Select value={state.language} onValueChange={handleLanguageChange}>
            <SelectTrigger style={styles.selectTrigger}>
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(languages).map(([code, name]) => (
                <SelectItem key={code} value={code}>
                  <Text>{name}</Text>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </View>

        <View style={styles.controlGroup}>
          <View style={styles.iconCircle}>
            <Type size={20} color="#0ea5e9" />
          </View>
          <Toggle
            pressed={state.accessibilityMode === 'high-contrast'}
            onPressedChange={handleAccessibilityToggle}
            style={styles.toggle}
          >
            <Text style={{ color: '#0f172a' }}>{isLarge ? t.large : t.normal}</Text>
          </Toggle>
        </View>
      </View>

      {/* Hero Header */}
      <View style={styles.hero}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={[styles.welcomeText, isLarge && { fontSize: 32 }]}>{t.welcome}</Text>
        <Text style={[styles.taglineText, isLarge && { fontSize: 20 }]}>{t.tagline}</Text>
        <Text style={[styles.getStartedText, isLarge && { fontSize: 24 }]}>{t.getStarted}</Text>
      </View>

      {/* Main Card */}
      <Card style={styles.card}>
        <CardContent style={{ gap: 16 }}>
          {/* Note Box */}
          <View style={styles.noteBox}>
            <View style={styles.noteIconBox}>
              <CheckCircle size={16} color="#ffffff" />
            </View>
            <Text style={[styles.noteText, isLarge && { fontSize: 18 }]}>{t.note}</Text>
            <View style={{ position: 'absolute', top: 10, right: 10, opacity: 0.1 }}>
              <Zap size={32} color="#14b8a6" />
            </View>
          </View>

          {/* Sole Primary Action Button — Continue as Patient */}
          <Button
            onPress={handleContinueAsPatient}
            style={[styles.continueBtn, { backgroundColor: '#1d4ed8' }]}
          >
            <View style={styles.btnContent}>
              <QrCode size={20} color="#ffffff" style={{ marginRight: 12 }} />
              <Text style={[styles.btnText, isLarge && { fontSize: 20 }]}>
                {t.lpContinue || "Continue as Patient"}
              </Text>
              <ArrowRight size={20} color="#ffffff" style={{ marginLeft: 12 }} />
            </View>
          </Button>

          {/* Secondary Operational Access */}
          <View style={styles.opSection}>
            <TouchableOpacity
              style={styles.opToggleBtn}
              onPress={() => setShowOperationalModes(!showOperationalModes)}
              activeOpacity={0.7}
            >
              <Text style={styles.opToggleText}>Hospital Staff & Operational Access</Text>
              <ChevronDown
                size={16}
                color="#64748b"
                style={{ transform: [{ rotate: showOperationalModes ? '180deg' : '0deg' }] }}
              />
            </TouchableOpacity>

            {showOperationalModes && (
              <View style={styles.opGrid}>
                <TouchableOpacity
                  style={[styles.opBtn, { borderColor: '#f97316' }]}
                  onPress={handleContinueAsKiosk}
                >
                  <Monitor size={18} color="#ea580c" style={{ marginRight: 8 }} />
                  <Text style={[styles.opBtnText, { color: '#ea580c' }]}>Kiosk Mode</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.opBtn, { borderColor: '#059669' }]}
                  onPress={handleContinueAsStaff}
                >
                  <Stethoscope size={18} color="#059669" style={{ marginRight: 8 }} />
                  <Text style={[styles.opBtnText, { color: '#059669' }]}>Staff / Doctor</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.opBtn, { borderColor: '#0ea5e9' }]}
                  onPress={handleContinueAsPublic}
                >
                  <Tv size={18} color="#0284c7" style={{ marginRight: 8 }} />
                  <Text style={[styles.opBtnText, { color: '#0284c7' }]}>Public TV</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.opBtn, { borderColor: '#7c3aed' }]}
                  onPress={handleContinueAsOperations}
                >
                  <BarChart2 size={18} color="#7c3aed" style={{ marginRight: 8 }} />
                  <Text style={[styles.opBtnText, { color: '#7c3aed' }]}>Operations</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </CardContent>
      </Card>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <Zap size={20} color="#0ea5e9" style={{ marginRight: 8 }} />
          <Text style={[styles.footerTitle, isLarge && { fontSize: 16 }]}>
            Smart Queue Management System
          </Text>
          <Shield size={20} color="#14b8a6" style={{ marginLeft: 8 }} />
        </View>
        <Text style={styles.footerSub}>🚀 Next-Generation Hospital Queue System</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f0fdfa', padding: 24, alignItems: 'center' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 40 },
  controlGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 12, padding: 6, shadowColor: '#0ea5e9', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  iconCircle: { width: 40, height: 40, backgroundColor: '#ffffff', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 8, shadowColor: '#0ea5e9', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  selectTrigger: { borderWidth: 0, backgroundColor: 'transparent', minWidth: 100 },
  toggle: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  hero: { alignItems: 'center', marginBottom: 48, width: '100%' },
  logoContainer: { backgroundColor: '#ffffff', padding: 24, borderRadius: 24, marginBottom: 32, shadowColor: '#0ea5e9', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  logo: { width: 140, height: 140 },
  welcomeText: { fontSize: 32, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: 12, letterSpacing: -0.5 },
  taglineText: { fontSize: 18, color: '#14b8a6', textAlign: 'center', marginBottom: 16, fontWeight: '500' },
  getStartedText: { fontSize: 20, color: '#64748b', textAlign: 'center', fontWeight: '400' },
  card: { width: '100%', maxWidth: 540, backgroundColor: '#ffffff', shadowColor: '#0ea5e9', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 24, elevation: 8, borderRadius: 24, borderWidth: 1, borderColor: '#e0f2fe' },
  noteBox: { flexDirection: 'row', backgroundColor: '#f0fdfa', borderColor: '#ccfbf1', borderWidth: 1, borderRadius: 12, padding: 16, position: 'relative', overflow: 'hidden' },
  noteIconBox: { width: 28, height: 28, backgroundColor: '#14b8a6', borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 16, marginTop: 2 },
  noteText: { flex: 1, fontSize: 16, color: '#0f172a', lineHeight: 24 },
  continueBtn: { paddingVertical: 18, borderRadius: 8, shadowColor: '#1d4ed8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  btnContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', letterSpacing: 0.5 },
  opSection: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16 },
  opToggleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  opToggleText: { fontSize: 13, color: '#64748b', fontWeight: '600', marginRight: 6 },
  opGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12, justifyContent: 'center' },
  opBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, backgroundColor: '#ffffff' },
  opBtnText: { fontSize: 13, fontWeight: '600' },
  footer: { marginTop: 'auto', paddingTop: 40, paddingBottom: 24, alignItems: 'center' },
  footerContent: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: '#e0f2fe', marginBottom: 12, shadowColor: '#0ea5e9', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  footerTitle: { fontSize: 15, fontWeight: '600', color: '#0369a1' },
  footerSub: { fontSize: 12, color: '#64748b', textAlign: 'center' }
});