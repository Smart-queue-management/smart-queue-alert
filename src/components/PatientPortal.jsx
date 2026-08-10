import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions
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
  Shield
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

      {/* Main Card — ONLY 2 ENTRY POINTS: Patient and Staff */}
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

          {/* 1. Primary Entry Point — Continue as Patient */}
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

          {/* 2. Secondary Entry Point — Staff Dashboard */}
          <Button
            onPress={handleContinueAsStaff}
            style={[styles.continueBtn, { backgroundColor: '#059669', shadowColor: '#059669' }]}
          >
            <View style={styles.btnContent}>
              <Stethoscope size={20} color="#ffffff" style={{ marginRight: 12 }} />
              <Text style={[styles.btnText, isLarge && { fontSize: 20 }]}>
                {t.continueStaff || "Staff Dashboard"}
              </Text>
              <ArrowRight size={20} color="#ffffff" style={{ marginLeft: 12 }} />
            </View>
          </Button>
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
  footer: { marginTop: 'auto', paddingTop: 40, paddingBottom: 24, alignItems: 'center' },
  footerContent: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: '#e0f2fe', marginBottom: 12, shadowColor: '#0ea5e9', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  footerTitle: { fontSize: 15, fontWeight: '600', color: '#0369a1' },
  footerSub: { fontSize: 12, color: '#64748b', textAlign: 'center' }
});