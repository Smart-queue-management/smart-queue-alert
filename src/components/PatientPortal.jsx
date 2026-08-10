import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform
} from 'react-native';
import { useAppContext } from '../context/AppContext';
import { useTranslation } from '../hooks/useTranslation';
import {
  Languages,
  ArrowRight,
  UserCheck,
  Monitor,
  Stethoscope,
  Tv,
  BarChart2,
  CheckCircle2,
  ShieldCheck,
  Hospital
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const languages = [
  { code: 'en', label: 'English' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'hi', label: 'हिन्दी' }
];

export function PatientPortal() {
  const { state, setState } = useAppContext();
  const { t } = useTranslation();

  const handleLanguageChange = (code) => {
    setState(prev => ({ ...prev, language: code }));
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

  const isDesktop = width >= 768;

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        
        {/* 1. Header Bar */}
        <View style={styles.header}>
          <View style={styles.brandGroup}>
            <View style={styles.brandIconWrap}>
              <Hospital size={24} color="#0284c7" />
            </View>
            <View>
              <Text style={styles.brandTitle}>GGH Hospital</Text>
              <Text style={styles.brandSubtitle}>Smart Queue Management</Text>
            </View>
          </View>

          {/* Quick Language Pills */}
          <View style={styles.langPillGroup}>
            <Languages size={18} color="#64748b" style={{ marginRight: 6 }} />
            {languages.map(lang => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.langPill,
                  state.language === lang.code && styles.langPillActive
                ]}
                onPress={() => handleLanguageChange(lang.code)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.langPillText,
                  state.language === lang.code && styles.langPillTextActive
                ]}>
                  {lang.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 2. Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroBadge}>
            <CheckCircle2 size={16} color="#0284c7" style={{ marginRight: 6 }} />
            <Text style={styles.heroBadgeText}>Next-Gen Smart Queue & Smarter Care</Text>
          </View>
          <Text style={styles.heroTitle}>{t.heroTitle || "Skip the Waiting Room"}</Text>
          <Text style={styles.heroSubtitle}>
            {t.heroSubtitle || "Join the hospital queue remotely, track your position live, and arrive when your turn is approaching."}
          </Text>
        </View>

        {/* 3. Primary Action Card — Continue as Patient */}
        <TouchableOpacity
          style={styles.primaryCard}
          onPress={handleContinueAsPatient}
          activeOpacity={0.9}
        >
          <View style={styles.primaryCardInner}>
            <View style={styles.primaryIconWrap}>
              <UserCheck size={32} color="#ffffff" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.primaryCardBadge}>PATIENT PORTAL</Text>
              <Text style={styles.primaryCardTitle}>
                {t.continue || "Continue as Patient"}
              </Text>
              <Text style={styles.primaryCardSubtitle}>
                {t.remoteQueueSubtitle || "Book your queue remotely and arrive on time"}
              </Text>
            </View>

            <View style={styles.primaryArrowWrap}>
              <ArrowRight size={24} color="#ffffff" />
            </View>
          </View>
        </TouchableOpacity>

        {/* 4. Secondary Services Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Hospital Portals & Services</Text>
          <Text style={styles.sectionSub}>Select an operation mode to proceed</Text>
        </View>

        {/* 5. Secondary Services Grid */}
        <View style={[styles.gridContainer, isDesktop ? styles.gridDesktop : styles.gridMobile]}>
          
          {/* Card 1: Kiosk Mode */}
          <TouchableOpacity
            style={styles.secondaryCard}
            onPress={handleContinueAsKiosk}
            activeOpacity={0.8}
          >
            <View style={[styles.secondaryIconBox, { backgroundColor: '#ffedd5' }]}>
              <Monitor size={24} color="#ea580c" />
            </View>
            <View style={styles.secondaryTextWrap}>
              <Text style={styles.secondaryCardTitle}>{t.kioskTitle || "Kiosk Mode"}</Text>
              <Text style={styles.secondaryCardDesc}>{t.kioskDesc || "Generate a token at the hospital"}</Text>
            </View>
            <ArrowRight size={18} color="#94a3b8" />
          </TouchableOpacity>

          {/* Card 2: Staff Dashboard */}
          <TouchableOpacity
            style={styles.secondaryCard}
            onPress={handleContinueAsStaff}
            activeOpacity={0.8}
          >
            <View style={[styles.secondaryIconBox, { backgroundColor: '#dcfce7' }]}>
              <Stethoscope size={24} color="#16a34a" />
            </View>
            <View style={styles.secondaryTextWrap}>
              <Text style={styles.secondaryCardTitle}>{t.staffTitle || "Staff Dashboard"}</Text>
              <Text style={styles.secondaryCardDesc}>{t.staffDesc || "Doctor & reception operations"}</Text>
            </View>
            <ArrowRight size={18} color="#94a3b8" />
          </TouchableOpacity>

          {/* Card 3: Public Display */}
          <TouchableOpacity
            style={styles.secondaryCard}
            onPress={handleContinueAsPublic}
            activeOpacity={0.8}
          >
            <View style={[styles.secondaryIconBox, { backgroundColor: '#e0f2fe' }]}>
              <Tv size={24} color="#0284c7" />
            </View>
            <View style={styles.secondaryTextWrap}>
              <Text style={styles.secondaryCardTitle}>{t.publicTvTitle || "Public Display"}</Text>
              <Text style={styles.secondaryCardDesc}>{t.publicTvDesc || "Hospital queue display"}</Text>
            </View>
            <ArrowRight size={18} color="#94a3b8" />
          </TouchableOpacity>

          {/* Card 4: Operations Overview */}
          <TouchableOpacity
            style={styles.secondaryCard}
            onPress={handleContinueAsOperations}
            activeOpacity={0.8}
          >
            <View style={[styles.secondaryIconBox, { backgroundColor: '#f3e8ff' }]}>
              <BarChart2 size={24} color="#9333ea" />
            </View>
            <View style={styles.secondaryTextWrap}>
              <Text style={styles.secondaryCardTitle}>{t.opsTitle || "Operations Overview"}</Text>
              <Text style={styles.secondaryCardDesc}>{t.opsDesc || "Hospital queue analytics"}</Text>
            </View>
            <ArrowRight size={18} color="#94a3b8" />
          </TouchableOpacity>

        </View>

        {/* 6. Footer */}
        <View style={styles.footer}>
          <ShieldCheck size={16} color="#64748b" style={{ marginRight: 6 }} />
          <Text style={styles.footerText}>
            Smart Queue System • Secure & Multilingual Healthcare Queue Management
          </Text>
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 36,
    flexWrap: 'wrap',
    gap: 16,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  langPillGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  langPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  langPillActive: {
    backgroundColor: '#0284c7',
  },
  langPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  langPillTextActive: {
    color: '#ffffff',
  },
  heroSection: {
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 12,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  heroBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0369a1',
  },
  heroTitle: {
    fontSize: Platform.OS === 'web' ? 36 : 28,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 600,
    lineHeight: 24,
  },
  primaryCard: {
    backgroundColor: '#0284c7',
    borderRadius: 20,
    padding: 24,
    marginBottom: 36,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  primaryCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  primaryIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCardBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#bae6fd',
    letterSpacing: 1,
    marginBottom: 4,
  },
  primaryCardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  primaryCardSubtitle: {
    fontSize: 14,
    color: '#e0f2fe',
  },
  primaryArrowWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 13,
    color: '#64748b',
  },
  gridContainer: {
    gap: 16,
    marginBottom: 40,
  },
  gridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridMobile: {
    flexDirection: 'column',
  },
  secondaryCard: {
    flex: 1,
    minWidth: 260,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  secondaryIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  secondaryTextWrap: {
    flex: 1,
  },
  secondaryCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  secondaryCardDesc: {
    fontSize: 12,
    color: '#64748b',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  footerText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
});