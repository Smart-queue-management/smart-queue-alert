import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions } from 'react-native';
import { useAppContext } from '../context/AppContext';
import { useTranslation } from '../hooks/useTranslation';
import { supabase } from '../services/supabaseClient';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { 
    Hospital, 
    ArrowLeft, 
    ArrowRight, 
    QrCode, 
    Accessibility, 
    Activity, 
    Flame, 
    CheckCircle2, 
    Stethoscope, 
    Heart, 
    Bone, 
    Shield, 
    Pill, 
    Pocket 
} from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';

const { width } = Dimensions.get('window');

export function KioskFlow() {
    const { state, setState } = useAppContext();
    const { t } = useTranslation();
    const [kioskStep, setKioskStep] = useState('welcome'); // welcome, service, department, confirm, token
    const [selectedService, setSelectedService] = useState('common'); // common, emergency, disabled
    const [selectedDept, setSelectedDept] = useState(null);
    const [generatedToken, setGeneratedToken] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [timer, setTimer] = useState(15);
    const timerRef = useRef(null);

    // Animation for welcome button
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (kioskStep === 'welcome') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(scaleAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
                    Animated.timing(scaleAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
                ])
            ).start();
        } else {
            scaleAnim.setValue(1);
        }
    }, [kioskStep]);

    // Timer for auto-return on Token Screen
    useEffect(() => {
        if (kioskStep === 'token') {
            setTimer(15);
            timerRef.current = setInterval(() => {
                setTimer((prev) => {
                    if (prev <= 1) {
                        handleReset();
                        return 15;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [kioskStep]);

    const handleReset = () => {
        setKioskStep('welcome');
        setSelectedService('common');
        setSelectedDept(null);
        setGeneratedToken(null);
        setLoading(false);
        setErrorMessage(null);
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const handleStart = () => {
        setErrorMessage(null);
        setKioskStep('service');
    };

    const handleSelectService = (service) => {
        setErrorMessage(null);
        setSelectedService(service);
        // If Emergency is selected, default to Emergency department directly for quick confirmation
        if (service === 'emergency') {
            const emergencyDept = state.departments.find(d => d.name.toLowerCase() === 'emergency' || d.id === 'emergency') || { name: 'Emergency' };
            setSelectedDept(emergencyDept);
            setKioskStep('confirm');
        } else {
            setKioskStep('department');
        }
    };

    const handleSelectDept = (dept) => {
        setErrorMessage(null);
        setSelectedDept(dept);
        setKioskStep('confirm');
    };

    const handleGenerateToken = async () => {
        setLoading(true);
        setErrorMessage(null);
        const now = new Date();
        const scheduledTime = now;
        
        // Calculate incremental token number locally
        const typeTokens = state.tokens.filter(t => t.type === selectedService);
        const tokenNumber = String(typeTokens.length + 1).padStart(3, '0');
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
        
        const prefix = selectedService === 'emergency' ? 'EME' : selectedService === 'disabled' ? 'ACE' : 'GEN';
        const tokenId = `${prefix}-${timeStr}-${tokenNumber}`;
        const patientId = `PAT-KIOSK-${dateStr}-${tokenNumber}`;
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // Fetch dynamic queue position and wait estimation
        const departmentTokens = state.tokens.filter(t => t.primaryDepartment === selectedDept.name && t.status === 'waiting');
        const position = departmentTokens.length + 1;
        const waitTime = position * (selectedDept.averageWaitTime || 15);

        const newToken = {
            id: tokenId,
            type: selectedService,
            primaryDepartment: selectedDept.name,
            timestamp: now,
            scheduledTime: scheduledTime,
            patient: {
                name: 'Kiosk Walk-in Patient',
                email: '',
                phone: '',
                age: 0,
                gender: 'unspecified',
                patientId: patientId
            },
            status: 'waiting',
            priority: selectedService === 'emergency' ? 1 : selectedService === 'disabled' ? 2 : 3,
            qrCode: tokenId,
            validUntil: endOfDay,
            createdAt: now,
            estimatedWaitTime: waitTime,
            positionInQueue: position,
            booking_type: 'kiosk',
            visits: [{
                id: `visit-kiosk-${Date.now()}`,
                department_id: selectedDept.id || 'gen_med',
                department: selectedDept.name,
                status: 'waiting',
                sequence_order: 1,
                room_counter: null,
                doctorName: null,
                notes: null,
                timestamp: now
            }],
            prescriptions: [],
            labTests: [],
            departmentAccess: [selectedDept.name]
        };

        try {
            // Save to database
            const { error } = await supabase.from('queue').insert([{
                token_id: tokenId,
                patient_name: newToken.patient.name,
                department: newToken.primaryDepartment,
                status: 'waiting',
                booking_type: 'kiosk',
                patient_phone: '',
                patient_age: 0,
                patient_gender: 'unspecified',
                token_data: newToken
            }]);

            if (error) throw error;

            // Insert into queue_visits relation
            const { error: visitError } = await supabase.from('queue_visits').insert([{
                token_id: tokenId,
                department_id: selectedDept.id || 'gen_med',
                doctor_id: null,
                status: 'waiting',
                sequence_order: 1
            }]);

            if (visitError) throw visitError;

            // Update app context optimistically
            setState(prev => ({
                ...prev,
                tokens: [...prev.tokens, newToken]
            }));

            setGeneratedToken(newToken);
            setKioskStep('token');
        } catch (error) {
            console.error('Kiosk Token Generation Error:', error);
            setErrorMessage("Unable to generate your token. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const getDeptIcon = (deptName) => {
        const name = deptName.toLowerCase();
        if (name.includes('medicine')) return <Stethoscope size={36} color="#2563eb" />;
        if (name.includes('cardio')) return <Heart size={36} color="#ef4444" />;
        if (name.includes('ortho')) return <Bone size={36} color="#eab308" />;
        if (name.includes('lab')) return <Activity size={36} color="#06b6d4" />;
        if (name.includes('pharm')) return <Pill size={36} color="#059669" />;
        if (name.includes('emergency')) return <Flame size={36} color="#dc2626" />;
        return <Hospital size={36} color="#4b5563" />;
    };

    const renderWelcome = () => (
        <View style={styles.fullscreenCenter}>
            <View style={styles.kioskHeader}>
                <Hospital size={64} color="#2563eb" />
                <Text style={styles.kioskHospitalTitle}>GOVERNMENT GENERAL HOSPITAL</Text>
                <Text style={styles.kioskHospitalSubtitle}>ప్రభుత్వ సర్వజన ఆసుపత్రి</Text>
            </View>

            <TouchableOpacity activeOpacity={0.9} onPress={handleStart}>
                <Animated.View style={[styles.kioskStartBtn, { transform: [{ scale: scaleAnim }] }]}>
                    <Text style={styles.kioskStartText}>TOUCH TO START</Text>
                    <Text style={styles.kioskStartSub}>ప్రారంభించడానికి తాకండి</Text>
                </Animated.View>
            </TouchableOpacity>

            <View style={styles.kioskFooter}>
                <Shield size={20} color="#64748b" />
                <Text style={styles.kioskFooterText}>Self-Service Registration Kiosk</Text>
            </View>
        </View>
    );

    const renderServiceSelect = () => (
        <View style={styles.kioskContainer}>
            <Text style={styles.kioskTitle}>Select Service Category</Text>
            <Text style={styles.kioskSubtitle}>సేవా విభాగాన్ని ఎంచుకోండి</Text>

            <View style={styles.serviceGrid}>
                {/* General Consultation */}
                <TouchableOpacity style={[styles.serviceCard, styles.bgBlueLight]} onPress={() => handleSelectService('common')}>
                    <Stethoscope size={56} color="#2563eb" style={styles.serviceIcon} />
                    <Text style={styles.serviceTitle}>General Consultation</Text>
                    <Text style={styles.serviceSub}>సాధారణ సంప్రదింపులు</Text>
                </TouchableOpacity>

                {/* Emergency Fast-Track */}
                <TouchableOpacity style={[styles.serviceCard, styles.bgRedLight]} onPress={() => handleSelectService('emergency')}>
                    <Flame size={56} color="#dc2626" style={styles.serviceIcon} />
                    <Text style={[styles.serviceTitle, { color: '#b91c1c' }]}>Emergency Fast-Track</Text>
                    <Text style={[styles.serviceSub, { color: '#dc2626' }]}>అత్యవసర చికిత్స</Text>
                </TouchableOpacity>

                {/* Accessibility Support */}
                <TouchableOpacity style={[styles.serviceCard, styles.bgGreenLight]} onPress={() => handleSelectService('disabled')}>
                    <Accessibility size={56} color="#059669" style={styles.serviceIcon} />
                    <Text style={styles.serviceTitle}>Priority / Accessibility</Text>
                    <Text style={styles.serviceSub}>ప్రత్యేక ప్రాధాన్యత</Text>
                </TouchableOpacity>
            </View>

            <Button style={styles.backBtn} variant="ghost" onPress={handleReset}>
                <ArrowLeft size={24} color="#374151" style={{ marginRight: 8 }} />
                <Text style={styles.backBtnText}>Exit Kiosk Mode</Text>
            </Button>
        </View>
    );

    const renderDepartmentSelect = () => {
        // Exclude Emergency department from the list since it's fast-tracked directly
        const filteredDepts = state.departments.filter(d => d.name.toLowerCase() !== 'emergency' && d.name.toLowerCase() !== 'reception');

        return (
            <View style={styles.kioskContainer}>
                <TouchableOpacity style={styles.backArrowBtn} onPress={() => setKioskStep('service')}>
                    <ArrowLeft size={24} color="#1f2937" />
                    <Text style={styles.backArrowText}>Back</Text>
                </TouchableOpacity>

                <Text style={styles.kioskTitle}>Select Department</Text>
                <Text style={styles.kioskSubtitle}>వైద్య విభాగాన్ని ఎంచుకోండి</Text>

                <ScrollView contentContainerStyle={styles.deptGrid} showsVerticalScrollIndicator={false}>
                    {filteredDepts.map((dept) => (
                        <TouchableOpacity key={dept.name} style={styles.deptCard} onPress={() => handleSelectDept(dept)}>
                            {getDeptIcon(dept.name)}
                            <View style={styles.deptInfo}>
                                <Text style={styles.deptCardName}>{dept.name}</Text>
                                <Text style={styles.deptCardServices}>{dept.services?.slice(0, 3).join(' • ')}</Text>
                            </View>
                            <ArrowRight size={24} color="#9ca3af" />
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        );
    };

    const renderConfirm = () => (
        <View style={styles.kioskContainer}>
            <TouchableOpacity style={styles.backArrowBtn} onPress={() => setKioskStep(selectedService === 'emergency' ? 'service' : 'department')}>
                <ArrowLeft size={24} color="#1f2937" />
                <Text style={styles.backArrowText}>Back</Text>
            </TouchableOpacity>

            <Text style={styles.kioskTitle}>Confirm Details</Text>
            <Text style={styles.kioskSubtitle}>వివరాలు నిర్ధారించండి</Text>

            {errorMessage && (
                <View style={{ backgroundColor: '#fee2e2', borderColor: '#fca5a5', borderWidth: 1, borderRadius: 12, padding: 16, marginVertical: 12, width: '100%', maxWidth: 540 }}>
                    <Text style={{ color: '#b91c1c', fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>{errorMessage}</Text>
                </View>
            )}

            <Card style={styles.confirmCard}>
                <CardContent style={{ padding: 24, gap: 16 }}>
                    <View style={styles.confirmRow}>
                        <Text style={styles.confirmLabel}>Patient Type:</Text>
                        <View style={[styles.confirmBadge, selectedService === 'emergency' ? styles.bgRed : selectedService === 'disabled' ? styles.bgGreen : styles.bgBlue]}>
                            <Text style={styles.confirmBadgeText}>
                                {selectedService === 'emergency' ? 'EMERGENCY' : selectedService === 'disabled' ? 'ACCESSIBILITY' : 'GENERAL'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.confirmRow}>
                        <Text style={styles.confirmLabel}>Department:</Text>
                        <Text style={styles.confirmVal}>{selectedDept?.name}</Text>
                    </View>

                    <View style={styles.confirmRow}>
                        <Text style={styles.confirmLabel}>Expected Wait:</Text>
                        <Text style={[styles.confirmVal, { color: '#0369a1', fontWeight: 'bold' }]}>
                            ~ {selectedService === 'emergency' ? 'Immediate' : `${selectedDept?.averageWaitTime || 15} mins`}
                        </Text>
                    </View>
                </CardContent>
            </Card>

            <View style={styles.actionRow}>
                <Button style={[styles.confirmActionBtn, styles.bgRed]} onPress={handleReset}>
                    <Text style={styles.actionBtnText}>Cancel</Text>
                </Button>
                <Button style={[styles.confirmActionBtn, styles.bgGreen, { flex: 2 }]} onPress={handleGenerateToken} disabled={loading}>
                    <Text style={styles.actionBtnText}>{loading ? 'Generating...' : 'Confirm & Print'}</Text>
                </Button>
            </View>
        </View>
    );

    const renderToken = () => {
        if (!generatedToken) return null;

        return (
            <View style={styles.fullscreenCenter}>
                <CheckCircle2 size={72} color="#16a34a" style={{ marginBottom: 16 }} />
                <Text style={styles.kioskTitle}>Token Printed Successfully!</Text>
                <Text style={styles.kioskSubtitle}>టోకెన్ విజయవంతంగా ముద్రించబడింది!</Text>

                <Card style={styles.tokenCard}>
                    <CardContent style={{ padding: 24, alignItems: 'center' }}>
                        <Text style={styles.tokenLabel}>YOUR TOKEN</Text>
                        <Text style={styles.tokenNumber}>{generatedToken.id}</Text>
                        
                        <View style={styles.divider} />

                        <Text style={styles.tokenDept}>{generatedToken.primaryDepartment}</Text>
                        
                        <View style={styles.qrWrapper}>
                            <QRCode value={generatedToken.id} size={150} />
                        </View>

                        <Text style={styles.tokenStatus}>Status: Waiting / నిరీక్షణ</Text>
                        
                        <View style={styles.tokenWaitInfo}>
                            <View style={styles.waitBox}>
                                <Text style={styles.waitNum}>{generatedToken.positionInQueue}</Text>
                                <Text style={styles.waitLbl}>Queue Position</Text>
                            </View>
                            <View style={styles.waitBox}>
                                <Text style={styles.waitNum}>{generatedToken.estimatedWaitTime} min</Text>
                                <Text style={styles.waitLbl}>Est. Wait Time</Text>
                            </View>
                        </View>
                    </CardContent>
                </Card>

                <Text style={styles.countdownText}>Returning to Home in {timer} seconds...</Text>

                <Button style={styles.doneBtn} onPress={handleReset}>
                    <Text style={styles.doneBtnText}>Done / పూర్తయింది</Text>
                </Button>
            </View>
        );
    };

    switch (kioskStep) {
        case 'welcome':
            return renderWelcome();
        case 'service':
            return renderServiceSelect();
        case 'department':
            return renderDepartmentSelect();
        case 'confirm':
            return renderConfirm();
        case 'token':
            return renderToken();
        default:
            return renderWelcome();
    }
}

const styles = StyleSheet.create({
    fullscreenCenter: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        backgroundColor: '#f8fafc'
    },
    kioskContainer: {
        flex: 1,
        padding: 32,
        backgroundColor: '#f8fafc',
        justifyContent: 'space-between'
    },
    kioskHeader: {
        alignItems: 'center',
        marginBottom: 64
    },
    kioskHospitalTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#0f172a',
        textAlign: 'center',
        marginTop: 16
    },
    kioskHospitalSubtitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#475569',
        textAlign: 'center',
        marginTop: 8
    },
    kioskStartBtn: {
        width: 320,
        height: 320,
        borderRadius: 160,
        backgroundColor: '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
        elevation: 8,
        borderWidth: 8,
        borderColor: '#bfdbfe'
    },
    kioskStartText: {
        fontSize: 28,
        fontWeight: '900',
        color: '#ffffff',
        textAlign: 'center'
    },
    kioskStartSub: {
        fontSize: 18,
        color: '#dbeafe',
        textAlign: 'center',
        marginTop: 8,
        fontWeight: '600'
    },
    kioskFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 64
    },
    kioskFooterText: {
        fontSize: 14,
        color: '#64748b',
        marginLeft: 8,
        fontWeight: '600'
    },
    kioskTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#1e293b',
        textAlign: 'center'
    },
    kioskSubtitle: {
        fontSize: 18,
        color: '#64748b',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 32,
        fontWeight: '600'
    },
    serviceGrid: {
        flex: 1,
        gap: 20,
        justifyContent: 'center',
        marginBottom: 32
    },
    serviceCard: {
        flex: 1,
        maxHeight: 180,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 2
    },
    serviceIcon: {
        marginBottom: 12
    },
    serviceTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1e293b'
    },
    serviceSub: {
        fontSize: 15,
        color: '#64748b',
        marginTop: 4,
        fontWeight: '600'
    },
    bgBlueLight: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
    bgRedLight: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
    bgGreenLight: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
    backBtn: {
        alignSelf: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12
    },
    backBtnText: {
        fontSize: 18,
        color: '#374151',
        fontWeight: '700'
    },
    backArrowBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24
    },
    backArrowText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
        marginLeft: 8
    },
    deptGrid: {
        gap: 16,
        paddingBottom: 24
    },
    deptCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 5,
        elevation: 1
    },
    deptInfo: {
        flex: 1,
        marginLeft: 20
    },
    deptCardName: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1f2937'
    },
    deptCardServices: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 4
    },
    confirmCard: {
        width: '100%',
        maxWidth: 500,
        alignSelf: 'center',
        marginVertical: 48,
        borderRadius: 16
    },
    confirmRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8
    },
    confirmLabel: {
        fontSize: 18,
        color: '#475569',
        fontWeight: '500'
    },
    confirmVal: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0f172a'
    },
    confirmBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8
    },
    confirmBadgeText: {
        color: '#ffffff',
        fontWeight: '800',
        fontSize: 14
    },
    bgRed: { backgroundColor: '#dc2626' },
    bgGreen: { backgroundColor: '#16a34a' },
    bgBlue: { backgroundColor: '#2563eb' },
    actionRow: {
        flexDirection: 'row',
        gap: 16,
        alignItems: 'center'
    },
    confirmActionBtn: {
        paddingVertical: 18,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center'
    },
    actionBtnText: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: 'bold'
    },
    tokenCard: {
        width: '100%',
        maxWidth: 450,
        alignSelf: 'center',
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 6,
        marginBottom: 32
    },
    tokenLabel: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '700',
        letterSpacing: 1
    },
    tokenNumber: {
        fontSize: 48,
        fontWeight: '900',
        color: '#1e293b',
        marginTop: 4
    },
    divider: {
        height: 1,
        backgroundColor: '#e2e8f0',
        width: '100%',
        marginVertical: 16
    },
    tokenDept: {
        fontSize: 24,
        fontWeight: '800',
        color: '#2563eb',
        marginBottom: 20
    },
    qrWrapper: {
        backgroundColor: '#ffffff',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 20
    },
    tokenStatus: {
        fontSize: 18,
        color: '#16a34a',
        fontWeight: '700'
    },
    tokenWaitInfo: {
        flexDirection: 'row',
        width: '100%',
        marginTop: 24,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 16
    },
    waitBox: {
        flex: 1,
        alignItems: 'center'
    },
    waitNum: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0f172a'
    },
    waitLbl: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 4
    },
    countdownText: {
        fontSize: 16,
        color: '#64748b',
        fontWeight: '500',
        marginBottom: 16
    },
    doneBtn: {
        paddingVertical: 16,
        paddingHorizontal: 48,
        borderRadius: 12,
        backgroundColor: '#1e293b'
    },
    doneBtnText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold'
    }
});
