import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native';
import { useAppContext } from '../context/AppContext';
import { useTranslation } from '../hooks/useTranslation';
import { Button } from './ui/button';
import { Card, CardHeader, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import {
  Brain,
  Sparkles,
  User,
  Send,
  X,
  Loader2
} from 'lucide-react-native';
import { supabase } from '../services/supabaseClient';
import { toast } from 'sonner-native';

const { height } = Dimensions.get('window');

// Department mappings across supported languages
const departmentMap = [
  { id: 'gen_med', name: 'General Medicine', te: 'జనరల్ మెడిసిన్', hi: 'जनरल मेडिसिन', keywords: ['general', 'medicine', 'gen', 'మెడిసిన్', 'జనరల్', 'मेडिसिन', 'जनरल'] },
  { id: 'cardio', name: 'Cardiology', te: 'కార్డియాలజీ', hi: 'कार्डियोलॉजी', keywords: ['cardiology', 'cardio', 'heart', 'గుండె', 'కార్డియాలజీ', 'दिल', 'कार्डियोलॉजी'] },
  { id: 'ortho', name: 'Orthopedics', te: 'ఆర్థోపెడిక్స్', hi: 'ऑर्थोपेडिक्स', keywords: ['orthopedics', 'ortho', 'bone', 'ఎముక', 'ఆర్థోపెడిక్స్', 'हड्डी', 'ऑर्थोपेडिक्स'] },
  { id: 'ent', name: 'ENT', te: 'ఈఎన్‌టీ', hi: 'ईएनटी', keywords: ['ent', 'ear', 'nose', 'throat', 'ఈఎన్‌టీ', 'చెవి', 'ఈఎన్టీ', 'ईएनटी', 'कान', 'गला'] },
  { id: 'neuro', name: 'Neurology', te: 'న్యూరాలజీ', hi: 'न्यूरोलॉजी', keywords: ['neurology', 'neuro', 'brain', 'న్యూరాలజీ', 'మెదడు', 'न्यूरोलॉजी', 'दिमाग'] },
  { id: 'ped', name: 'Pediatrics', te: 'పీడియాట్రిక్స్', hi: 'पीडियाट्रिक्स', keywords: ['pediatrics', 'pedia', 'child', 'పీడియాట్రిక్స్', 'పిల్లలు', 'पीडियाट्रिक्स', 'बच्चे'] },
  { id: 'lab', name: 'Laboratory', te: 'ల్యాబ్', hi: 'लैब', keywords: ['laboratory', 'lab', 'blood', 'test', 'ల్యాబ్', 'రక్తం', 'लैब', 'ब्लड'] },
  { id: 'pharm', name: 'Pharmacy', te: 'ఫార్మసీ', hi: 'फार्मेसी', keywords: ['pharmacy', 'medicine', 'drug', 'ఫార్మసీ', 'మందులు', 'फार्मेसी', 'दवा'] },
  { id: 'emg', name: 'Emergency', te: 'ఎమర్జెన్సీ', hi: 'इमरजेंसी', keywords: ['emergency', 'casualty', 'ఎమర్జెన్సీ', 'అత్యవసరం', 'इमरजेंसी', 'आपातकालीन'] },
  { id: 'rad', name: 'Radiology', te: 'రేడియోలజీ', hi: 'रेडियोलॉजी', keywords: ['radiology', 'x-ray', 'scan', 'రేడియోలజీ', 'ఎక్స్-రే', 'रेдиоलॉजी', 'एक्सरे'] }
];

// Multilingual Bot Dictionary
const botI18n = {
  en: {
    title: "AI Health Assistant",
    sub: "Smart Queue & Hospital Help",
    initMsg: "🏥 Welcome to District Hospital AI Assistant!\n\nI can help you with:\n• 🎫 Booking queue tokens\n• 📊 Checking live queue status\n• 👨‍⚕️ Finding available doctors\n• ℹ️ Hospital info & operating hours\n\nHow can I help you today?",
    quickActions: [
      { label: 'Book Token', query: 'I want to book a token' },
      { label: 'Token Status', query: 'What is my token status?' },
      { label: 'Available Doctors', query: 'Which doctors are available today?' },
      { label: 'Hospital Hours', query: 'What are the OPD operating hours?' }
    ],
    loginReq: "🔒 **Authentication Required**\n\nTo book a queue token, please login or continue as a patient first.",
    loginBtn: "Continue as Patient",
    existingToken: "🎫 **Active Token Found**\n\nYou already have an active queue token:\n• Token ID: {tokenId}\n• Department: {dept}\n• Position in Queue: {pos}\n• Estimated Wait: {wait} mins\n• Status: {status}\n\nYou cannot book duplicate tokens while an active queue is present.",
    viewTokenBtn: "View Live Token",
    askDept: "🏥 Which department would you like to book a token for?\n\nAvailable:\n• General Medicine\n• Cardiology\n• Orthopedics\n• ENT\n• Pediatrics\n• Laboratory",
    askPatientDetails: "📋 **Patient Details Needed**\n\nPlease reply with your **Age** and **Gender** (e.g., *Age 30, Male, General Medicine*).",
    confirmBooking: "📋 **Booking Confirmation**\n\n**Patient:** {name} (Age: {age}, {gender})\n**Department:** {dept}\n\nShall I proceed and confirm this booking?",
    yesConfirm: "Yes, Confirm & Book",
    cancelBooking: "Cancel",
    bookingCancelled: "Booking request cancelled.",
    bookingProgress: "Booking your token in hospital queue system...",
    bookingSuccess: "✅ **Token Booked Successfully!**\n\n🎫 **Token ID:** {tokenId}\n🏥 **Department:** {dept}\n👤 **Patient:** {name} ({age} yrs, {gender})\n👥 **Patients Ahead:** {ahead}\n⏱️ **Estimated Wait:** {wait} mins\n📌 **Currently Serving:** {serving}",
    smartWaitFar: "⚠️ **Smart Waiting Advice:** You do not need to wait at the hospital yet. Relax at home until your turn gets closer.",
    smartWaitNear: "🔔 **Smart Waiting Advice:** Your turn is approaching! Please start heading to the hospital now.",
    smartWaitCalled: "🟢 **YOUR TURN!** Please proceed to Room {room}.",
    bookingFailed: "❌ **Unable to generate your token.** Please try again.",
    noActiveToken: "ℹ️ You currently do not have an active queue token. Would you like to book one?",
    doctorsList: "🩺 **Available Doctors Today:**\n\n{docs}",
    hoursInfo: "🕐 **OPD Operating Hours:**\n• OPD Consultations: 8:00 AM - 6:00 PM (Mon-Sat)\n• Emergency Services: 24×7 Available\n• Pharmacy & Lab: 24×7 Available\n📞 Reception: +91-22-1234-5678",
    fallbackMsg: "🤖 I am your Hospital AI Assistant. You can ask me to book a token, check doctor availability, or view your live queue status."
  },
  te: {
    title: "AI ఆరోగ్య అసిస్టెంట్",
    sub: "స్మార్ట్ క్యూ & హాస్పిటల్ సహాయం",
    initMsg: "🏥 డిస్ట్రిక్ట్ హాస్పిటల్ AI అసిస్టెంట్‌కి స్వాగతం!\n\nనేను మీకు సహాయం చేయగలను:\n• 🎫 క్యూ టోకెన్లను బుక్ చేయడం\n• 📊 లైవ్ క్యూ స్థితిని తనిఖీ చేయడం\n• 👨‍⚕️ అందుబాటులో ఉన్న వైద్యులను కనుగొనడం\n• ℹ️ హాస్పిటల్ సమాచారం & పని వేళలు\n\nఈరోజు నేను మీకు ఎలా సహాయపడగలను?",
    quickActions: [
      { label: 'టోకెన్ బుక్ చేయండి', query: 'నాకు టోకెన్ కావాలి' },
      { label: 'టోకెన్ స్థితి', query: 'నా టోకెన్ స్థితి ఏమిటి?' },
      { label: 'వైద్యుల వివరాలు', query: 'ఈరోజు ఏ వైద్యులు అందుబాటులో ఉన్నారు?' },
      { label: 'పని వేళలు', query: 'హాస్పిటల్ పని వేళలు ఏమిటి?' }
    ],
    loginReq: "🔒 **లాగిన్ అవసరం**\n\nక్యూ టోకెన్ బుక్ చేయడానికి, దయచేసి మొదట లాగిన్ అవ్వండి లేదా పేషెంట్‌గా కొనసాగండి.",
    loginBtn: "పేషెంట్‌గా కొనసాగండి",
    existingToken: "🎫 **యాక్టివ్ టోకెన్ లభించింది**\n\nమీకు ఇప్పటికే యాక్టివ్ క్యూ టోకెన్ ఉంది:\n• టోకెన్ ID: {tokenId}\n• విభాగం: {dept}\n• క్యూలో స్థానం: {pos}\n• అంచనా సమయం: {wait} నిమిషాలు\n• స్థితి: {status}\n\nయాక్టివ్ టోకెన్ ఉన్నప్పుడు మరొకటి బుక్ చేయలేరు.",
    viewTokenBtn: "లైవ్ టోకెన్ చూడండి",
    askDept: "🏥 మీరు ఏ విభాగానికి టోకెన్ బుక్ చేయాలనుకుంటున్నారు?\n\nఅందుబాటులో ఉన్నవి:\n• జనరల్ మెడిసిన్\n• కార్డియాలజీ\n• ఆర్థోపెడిక్స్\n• ఈఎన్‌టీ\n• పీడియాట్రిక్స్\n• ల్యాబ్",
    askPatientDetails: "📋 **పేషెంట్ వివరాలు అవసరం**\n\nదయచేసి మీ **వయస్సు** మరియు **లింగం** తెలియజేయండి (ఉదా: *వయస్సు 30, పురుషుడు, జనరల్ మెడిసిన్*).",
    confirmBooking: "📋 **బుకింగ్ నిర్ధారణ**\n\n**పేషెంట్:** {name} (వయస్సు: {age}, {gender})\n**విభాగం:** {dept}\n\nనేను బుక్ చేయనా?",
    yesConfirm: "అవును, బుక్ చేయండి",
    cancelBooking: "రద్దు చేయండి",
    bookingCancelled: "బుకింగ్ అభ్యర్థన రద్దు చేయబడింది.",
    bookingProgress: "ఆసుపత్రి క్యూ సిస్టమ్‌లో మీ టోకెన్‌ని బుక్ చేస్తోంది...",
    bookingSuccess: "✅ **టోకెన్ విజయవంతంగా బుక్ చేయబడింది!**\n\n🎫 **టోకెన్ ID:** {tokenId}\n🏥 **విభాగం:** {dept}\n👤 **పేషెంట్:** {name} ({age} ఏళ్ళు, {gender})\n👥 **ముందున్న రోగులు:** {ahead}\n⏱️ **అంచనా సమయం:** {wait} నిమిషాలు\n📌 **ప్రస్తుతం పిలుస్తున్నది:** {serving}",
    smartWaitFar: "⚠️ **స్మార్ట్ నిరీక్షణ సలహా:** మీరు ఇంకా ఆసుపత్రికి రావాల్సిన అవసరం లేదు. మీ వంతు దగ్గర పడే వరకు ఇంట్లోనే ప్రశాంతంగా ఉండవచ్చు.",
    smartWaitNear: "🔔 **స్మార్ట్ నిరీక్షణ సలహా:** మీ వంతు దగ్గర పడుతోంది! దయచేసి ఇప్పుడే ఆసుపత్రికి బయలుదేరండి.",
    smartWaitCalled: "🟢 **మీ వంతు వచ్చింది!** దయచేసి రూమ్ {room} వద్దకు వెళ్లండి.",
    bookingFailed: "❌ **టోకెన్ జనరేట్ చేయడం సాధ్యపడలేదు.** దయచేసి మళ్లీ ప్రయత్నించండి.",
    noActiveToken: "ℹ️ మీకు ప్రస్తుతం యాక్టివ్ క్యూ టోకెన్ లేదు. బుక్ చేయాలనుకుంటున్నారా?",
    doctorsList: "🩺 **ఈరోజు అందుబాటులో ఉన్న వైద్యులు:**\n\n{docs}",
    hoursInfo: "🕐 **OPD పని వేళలు:**\n• OPD వైద్య సేవలు: ఉదయం 8:00 - సాయంత్రం 6:00 (సోమ-శని)\n• అత్యవసర సేవలు: 24×7 అందుబాటులో ఉన్నాయి\n• ఫార్మసీ & ల్యాబ్: 24×7 అందుబాటులో ఉన్నాయి\n📞 రిసెప్షన్: +91-22-1234-5678",
    fallbackMsg: "🤖 నేను మీ హాస్పిటల్ AI అసిస్టెంట్‌ని. మీరు టోకెన్ బుక్ చేయమని, డాక్టర్ లభ్యతను తనిఖీ చేయమని లేదా మీ లైవ్ క్యూ స్థితిని అడగవచ్చు."
  },
  hi: {
    title: "AI स्वास्थ्य सहायक",
    sub: "स्मार्ट कतार और अस्पताल सहायता",
    initMsg: "🏥 जिला अस्पताल AI सहायक में आपका स्वागत है!\n\nमैं आपकी सहायता कर सकता हूँ:\n• 🎫 कतार टोकन बुक करना\n• 📊 लाइव कतार स्थिति की जांच करना\n• 👨‍⚕️ उपलब्ध डॉक्टरों को खोजना\n• ℹ️ अस्पताल की जानकारी और समय\n\nआज मैं आपकी क्या सहायता कर सकता हूँ?",
    quickActions: [
      { label: 'टोकन बुक करें', query: 'मुझे टोकन चाहिए' },
      { label: 'टोकन स्थिति', query: 'मेरी टोकन स्थिति क्या है?' },
      { label: 'उपलब्ध डॉक्टर', query: 'आज कौन से डॉक्टर उपलब्ध हैं?' },
      { label: 'अस्पताल का समय', query: 'अस्पताल के खुलने का समय क्या है?' }
    ],
    loginReq: "🔒 **लॉगिन आवश्यक है**\n\nकतार टोकन बुक करने के लिए, कृपया पहले लॉगिन करें या मरीज के रूप में आगे बढ़ें।",
    loginBtn: "मरीज के रूप में आगे बढ़ें",
    existingToken: "🎫 **सक्रिय टोकन मिला**\n\nआपके पास पहले से ही एक सक्रिय कतार टोकन है:\n• टोकन ID: {tokenId}\n• विभाग: {dept}\n• कतार में स्थान: {pos}\n• अनुमानित समय: {wait} मिनट\n• स्थिति: {status}\n\nसक्रिय टोकन होने पर आप दूसरा टोकन बुक नहीं कर सकते।",
    viewTokenBtn: "लाइव टोकन देखें",
    askDept: "🏥 आप किस विभाग के लिए टोकन बुक करना चाहते हैं?\n\nउपलब्ध विभाग:\n• जनरल मेडिसिन\n• कार्डियोलॉजी\n• ऑर्थोपेडिक्स\n• ईएनटी\n• पीडियाट्रिक्स\n• लैब",
    askPatientDetails: "📋 **मरीज का विवरण आवश्यक है**\n\nकृपया अपनी **आयु** और **लिंग** बताएं (जैसे: *आयु 30, पुरुष, जनरल मेडिसिन*)।",
    confirmBooking: "📋 **बुकिंग की पुष्टि**\n\n**मरीज:** {name} (आयु: {age}, {gender})\n**विभाग:** {dept}\n\nक्या मैं इसे बुक कर दूँ?",
    yesConfirm: "हाँ, बुक करें",
    cancelBooking: "रद्द करें",
    bookingCancelled: "बुकिंग अनुरोध रद्द कर दिया गया।",
    bookingProgress: "अस्पताल प्रणाली में आपका टोकन बुक हो रहा है...",
    bookingSuccess: "✅ **टोकन सफलता से बुक हो गया!**\n\n🎫 **टोकन ID:** {tokenId}\n🏥 **विभाग:** {dept}\n👤 **मरीज:** {name} ({age} वर्ष, {gender})\n👥 **आगे मरीज:** {ahead}\n⏱️ **अनुमानित समय:** {wait} मिनट\n📌 **वर्तमान में बुला रहे हैं:** {serving}",
    smartWaitFar: "⚠️ **स्मार्ट प्रतीक्षा सलाह:** आपको अभी अस्पताल में इंतजार करने की आवश्यकता नहीं है। अपनी बारी पास आने तक घर पर रहें।",
    smartWaitNear: "🔔 **स्मार्ट प्रतीक्षा सलाह:** आपकी बारी आ रही है! कृपया अब अस्पताल के लिए निकलें।",
    smartWaitCalled: "🟢 **आपकी बारी है!** कृपया कमरा {room} में जाएँ।",
    bookingFailed: "❌ **टोकन जनरेट करने में असमर्थ।** कृपया पुनः प्रयास करें।",
    noActiveToken: "ℹ️ वर्तमान में आपके पास कोई सक्रिय टोकन नहीं है। क्या आप एक बुक करना चाहते हैं?",
    doctorsList: "🩺 **आज उपलब्ध डॉक्टर:**\n\n{docs}",
    hoursInfo: "🕐 **ओपीडी समय और संपर्क:**\n• ओपीडी परामर्श: सुबह 8:00 - शाम 6:00 (सोम-शनि)\n• आपातकालीन सेवाएं: 24×7 उपलब्ध\n• फार्मेसी और लैब: 24×7 उपलब्ध\n📞 रिसेप्शन: +91-22-1234-5678",
    fallbackMsg: "🤖 मैं आपका अस्पताल AI सहायक हूँ। आप मुझसे टोकन बुक करने, डॉक्टर की उपलब्धता जांचने या अपनी कतार स्थिति देखने के लिए कह सकते हैं।"
  }
};

export function AgenticChatbot() {
  const { state, setState, calculateOptimalTime } = useAppContext();
  const { language } = useTranslation();
  const lang = ['te', 'hi', 'en'].includes(language) ? language : 'en';
  const texts = botI18n[lang] || botI18n.en;

  const [isOpen, setIsOpen] = useState(false);
  const [pendingBookingDept, setPendingBookingDept] = useState(null);
  const [messages, setMessages] = useState([
    {
      id: `msg-init-${Date.now()}`,
      type: 'bot',
      message: texts.initMsg,
      timestamp: new Date(),
      suggestions: texts.quickActions.map(a => a.label)
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id.startsWith('msg-init')) {
        return [{
          id: `msg-init-${Date.now()}`,
          type: 'bot',
          message: texts.initMsg,
          timestamp: new Date(),
          suggestions: texts.quickActions.map(a => a.label)
        }];
      }
      return prev;
    });
  }, [lang]);

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking, currentTask]);

  // Helper to match natural language department requests
  const matchDepartment = (input) => {
    const lower = input.toLowerCase();
    for (const dept of departmentMap) {
      if (dept.keywords.some(kw => lower.includes(kw))) {
        return dept;
      }
    }
    return null;
  };

  // Helper to extract patient information from message
  const extractPatientInfo = (input) => {
    const info = { age: null, gender: null, name: null };
    const ageMatch = input.match(/\b(\d{1,3})\s*(years?|yrs?|y\.o\.|ఏళ్ళు|సంవత్సరాలు|वर्ष)?\b/i);
    if (ageMatch && parseInt(ageMatch[1]) >= 1 && parseInt(ageMatch[1]) <= 120) {
      info.age = parseInt(ageMatch[1]);
    }

    const lower = input.toLowerCase();
    if (lower.includes('female') || lower.includes('స్త్రీ') || lower.includes('महिला')) {
      info.gender = 'female';
    } else if (lower.includes('male') || lower.includes('పురుషుడు') || lower.includes('पुरुष')) {
      info.gender = 'male';
    } else if (lower.includes('other') || lower.includes('ఇతర') || lower.includes('अन्य')) {
      info.gender = 'other';
    }

    return info;
  };

  // Helper to get active patient token
  const getActiveToken = () => {
    if (!state.tokens || state.tokens.length === 0) return null;
    return state.tokens.find(t => t.status === 'active' || t.status === 'waiting' || t.status === 'called' || t.status === 'in_consultation');
  };

  // Perform actual Supabase token booking (with schema-safe fallback retry)
  const executeDatabaseBooking = async (targetDept, patientDetails) => {
    if (!state.patientInfo) throw new Error("Patient not authenticated");

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const typeTokens = state.tokens.filter(t => t.type === 'common');
    const tokenNumber = String(typeTokens.length + 1).padStart(3, '0');
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
    const generatedTokenId = `GEN-${timeStr}-${tokenNumber}`;
    const patientId = `PAT-${dateStr}-${tokenNumber}`;
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const optimal = calculateOptimalTime(targetDept.name, null);

    const initialVisits = [{
      id: `visit-${Date.now()}`,
      department_id: targetDept.id,
      department: targetDept.name,
      status: 'waiting',
      sequence_order: 1,
      room_counter: null,
      doctorName: null,
      notes: null,
      timestamp: now
    }];

    const pName = patientDetails?.name || state.patientInfo.name || 'Patient';
    const pPhone = state.patientInfo.phone || '';
    const pAge = patientDetails?.age || state.patientInfo.age || 30;
    const pGender = patientDetails?.gender || state.patientInfo.gender || 'male';

    const newTokenObj = {
      id: generatedTokenId,
      type: 'common',
      primaryDepartment: targetDept.name,
      timestamp: now,
      scheduledTime: optimal.time,
      patient: {
        name: pName,
        email: state.patientInfo.email || '',
        phone: pPhone,
        age: pAge,
        gender: pGender,
        patientId: patientId
      },
      status: 'waiting',
      priority: 1,
      qrCode: generatedTokenId,
      validUntil: endOfDay,
      createdAt: now,
      schedulingMethod: 'auto',
      estimatedWaitTime: optimal.waitTime,
      positionInQueue: optimal.position,
      visits: initialVisits,
      prescriptions: [],
      labTests: [],
      departmentAccess: state.departments.map(d => d.name)
    };

    // 1. Primary Supabase insert into `queue` (including booking_type)
    let queueErr = null;
    try {
      const { error } = await supabase.from('queue').insert([{
        token_id: generatedTokenId,
        patient_name: pName,
        department: targetDept.name,
        patient_phone: pPhone,
        patient_age: pAge,
        patient_gender: pGender,
        booking_type: 'remote',
        status: 'waiting',
        room_counter: null,
        token_data: newTokenObj
      }]);
      queueErr = error;
    } catch (e) {
      queueErr = e;
    }

    // 1b. Schema-safe fallback insert without booking_type column if schema error occurs
    if (queueErr) {
      console.warn('Initial queue insert failed, retrying without optional booking_type column...', queueErr);
      const { error: fallbackErr } = await supabase.from('queue').insert([{
        token_id: generatedTokenId,
        patient_name: pName,
        department: targetDept.name,
        patient_phone: pPhone,
        patient_age: pAge,
        patient_gender: pGender,
        status: 'waiting',
        room_counter: null,
        token_data: newTokenObj
      }]);

      if (fallbackErr) {
        console.error('Supabase fallback queue insert error:', fallbackErr);
        throw fallbackErr;
      }
    }

    // 2. Supabase insert into `queue_visits`
    const { error: visitErr } = await supabase.from('queue_visits').insert([{
      token_id: generatedTokenId,
      department_id: targetDept.id,
      doctor_id: null,
      status: 'waiting',
      sequence_order: 1,
      room_counter: null
    }]);

    if (visitErr) {
      console.warn('Supabase queue_visits insert error (proceeding with queue token):', visitErr);
    }

    // Update React AppContext state
    setState(prev => ({
      ...prev,
      tokens: [...prev.tokens, newTokenObj],
      currentToken: newTokenObj
    }));

    return newTokenObj;
  };

  const generateResponse = async (userMsg) => {
    const lower = userMsg.toLowerCase();
    const activeToken = getActiveToken();

    // 1. Check for Active Token Query
    if (lower.includes('my token') || lower.includes('token status') || lower.includes('స్థితి') || lower.includes('स्थिति')) {
      if (activeToken) {
        const patientsAhead = activeToken.positionInQueue || 3;
        const waitTime = activeToken.estimatedWaitTime || 15;
        let advice = texts.smartWaitFar;
        if (activeToken.status === 'called') {
          advice = texts.smartWaitCalled.replace('{room}', activeToken.visits?.[0]?.room_counter || 'Room 101');
        } else if (patientsAhead <= 5) {
          advice = texts.smartWaitNear;
        }

        const msgText = texts.existingToken
          .replace('{tokenId}', activeToken.id)
          .replace('{dept}', activeToken.primaryDepartment)
          .replace('{pos}', patientsAhead)
          .replace('{wait}', waitTime)
          .replace('{status}', activeToken.status) + `\n\n${advice}`;

        return {
          id: `msg-${Date.now()}`,
          type: 'bot',
          message: msgText,
          timestamp: new Date(),
          actions: [{
            id: 'view-token',
            label: texts.viewTokenBtn,
            handler: () => {
              setState(prev => ({ ...prev, currentView: 'token' }));
              setIsOpen(false);
            }
          }]
        };
      } else {
        return {
          id: `msg-${Date.now()}`,
          type: 'bot',
          message: texts.noActiveToken,
          timestamp: new Date(),
          suggestions: [texts.quickActions[0].query]
        };
      }
    }

    // 2. Check for Doctors Query
    if (lower.includes('doctor') || lower.includes('డాక్టర్') || lower.includes('डॉक्टर')) {
      const allDocs = state.departments
        .flatMap(d => d.doctors.map(doc => `• **Dr. ${doc.name}** (${doc.specialization} - ${d.name})`))
        .join('\n');

      return {
        id: `msg-${Date.now()}`,
        type: 'bot',
        message: texts.doctorsList.replace('{docs}', allDocs || 'Dr. Sharma (Gen Med), Dr. Rao (Cardiology)'),
        timestamp: new Date(),
        suggestions: [texts.quickActions[0].query]
      };
    }

    // 3. Check for Hospital Hours Query
    if (lower.includes('hour') || lower.includes('time') || lower.includes('పని వేళలు') || lower.includes('समय')) {
      return {
        id: `msg-${Date.now()}`,
        type: 'bot',
        message: texts.hoursInfo,
        timestamp: new Date()
      };
    }

    // 4. Token Booking Flow
    if (lower.includes('book') || lower.includes('token') || lower.includes('టోకెన్') || lower.includes('टोकन')) {
      // Step A: Authentication Check
      if (!state.patientInfo) {
        return {
          id: `msg-${Date.now()}`,
          type: 'bot',
          message: texts.loginReq,
          timestamp: new Date(),
          actions: [{
            id: 'login-now',
            label: texts.loginBtn,
            handler: () => {
              setState(prev => ({ ...prev, currentView: 'patient-registration' }));
              setIsOpen(false);
            }
          }]
        };
      }

      // Step B: Duplicate Active Token Check
      if (activeToken) {
        return {
          id: `msg-${Date.now()}`,
          type: 'bot',
          message: texts.existingToken
            .replace('{tokenId}', activeToken.id)
            .replace('{dept}', activeToken.primaryDepartment)
            .replace('{pos}', activeToken.positionInQueue || 3)
            .replace('{wait}', activeToken.estimatedWaitTime || 15)
            .replace('{status}', activeToken.status),
          timestamp: new Date(),
          actions: [{
            id: 'view-token',
            label: texts.viewTokenBtn,
            handler: () => {
              setState(prev => ({ ...prev, currentView: 'token' }));
              setIsOpen(false);
            }
          }]
        };
      }

      // Step C: Extract patient details & department from user message
      const extractedInfo = extractPatientInfo(userMsg);
      const matchedDept = matchDepartment(userMsg);

      if (!matchedDept) {
        return {
          id: `msg-${Date.now()}`,
          type: 'bot',
          message: texts.askDept,
          timestamp: new Date(),
          suggestions: [
            'Book General Medicine',
            'నాకు ENT టోకెన్ కావాలి',
            'मुझे कार्डियोलॉजी का टोकन चाहिए'
          ]
        };
      }

      const pAge = extractedInfo.age || state.patientInfo.age || 30;
      const pGender = extractedInfo.gender || state.patientInfo.gender || 'male';
      const pName = state.patientInfo.name || 'Patient';

      // Step D: Show Confirmation before Database Write
      setPendingBookingDept({ dept: matchedDept, patient: { name: pName, age: pAge, gender: pGender } });
      const localizedDeptName = matchedDept[lang] || matchedDept.name;

      return {
        id: `msg-${Date.now()}`,
        type: 'bot',
        message: texts.confirmBooking
          .replace('{name}', pName)
          .replace('{age}', pAge)
          .replace('{gender}', pGender)
          .replace('{dept}', localizedDeptName),
        timestamp: new Date(),
        actions: [
          {
            id: 'confirm-yes',
            label: `✅ ${texts.yesConfirm}`,
            handler: () => handleConfirmBooking(matchedDept, { name: pName, age: pAge, gender: pGender })
          },
          {
            id: 'confirm-no',
            label: `❌ ${texts.cancelBooking}`,
            variant: 'outline',
            handler: () => {
              setPendingBookingDept(null);
              setMessages(prev => [...prev, {
                id: `msg-${Date.now()}`,
                type: 'bot',
                message: texts.bookingCancelled,
                timestamp: new Date()
              }]);
            }
          }
        ]
      };
    }

    // Default Fallback Response
    return {
      id: `msg-${Date.now()}`,
      type: 'bot',
      message: texts.fallbackMsg,
      timestamp: new Date(),
      suggestions: texts.quickActions.map(a => a.query)
    };
  };

  const handleConfirmBooking = async (deptToBook, patientDetails) => {
    setIsThinking(true);
    setCurrentTask({
      description: texts.bookingProgress,
      progress: 50,
      steps: ['Contacting Supabase Database...', 'Generating token_id & queue_visits...']
    });

    try {
      const newToken = await executeDatabaseBooking(deptToBook, patientDetails);
      setCurrentTask({ description: texts.bookingProgress, progress: 100, steps: ['Complete!'] });
      setTimeout(() => setCurrentTask(null), 600);

      const localizedDeptName = deptToBook[lang] || deptToBook.name;
      const ahead = newToken.positionInQueue || 4;
      const wait = newToken.estimatedWaitTime || 20;

      let advice = texts.smartWaitFar;
      if (ahead <= 5) advice = texts.smartWaitNear;

      const successMsgText = texts.bookingSuccess
        .replace('{tokenId}', newToken.id)
        .replace('{dept}', localizedDeptName)
        .replace('{name}', newToken.patient.name)
        .replace('{age}', newToken.patient.age)
        .replace('{gender}', newToken.patient.gender)
        .replace('{ahead}', ahead)
        .replace('{wait}', wait)
        .replace('{serving}', `GEN-0${Math.max(1, parseInt(newToken.id.split('-').pop()) - ahead)}`)
        + `\n\n${advice}`;

      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          type: 'bot',
          message: successMsgText,
          timestamp: new Date(),
          actions: [{
            id: 'view-live-token',
            label: texts.viewTokenBtn,
            handler: () => {
              setState(prev => ({ ...prev, currentView: 'token' }));
              setIsOpen(false);
            }
          }]
        }
      ]);
      toast.success("Token generated successfully!");
    } catch (err) {
      console.error("Booking error:", err);
      setCurrentTask(null);
      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          type: 'bot',
          message: `${texts.bookingFailed}\n\nError: ${err.message || 'Database error'}`,
          timestamp: new Date()
        }
      ]);
      toast.error("Unable to generate token");
    } finally {
      setIsThinking(false);
      setPendingBookingDept(null);
    }
  };

  const handleSendMessage = async (customText) => {
    const textToSend = customText || inputValue;
    if (!textToSend.trim()) return;

    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      type: 'user',
      message: textToSend,
      timestamp: new Date()
    }]);

    setInputValue('');
    setIsThinking(true);

    try {
      const botResponse = await generateResponse(textToSend);
      setMessages(prev => [...prev, botResponse]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsThinking(false);
    }
  };

  if (!isOpen) {
    return (
      <View style={styles.fabContainer}>
        <TouchableOpacity
          onPress={() => setIsOpen(true)}
          style={styles.fabBtn}
          activeOpacity={0.8}
        >
          <Brain size={28} color="#ffffff" />
          <View style={styles.fabBadge}>
            <Sparkles size={12} color="#fde047" />
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.chatWindow, { height: height * 0.82 }]}
      pointerEvents="box-none"
    >
      <Card style={styles.card}>
        {/* Header */}
        <CardHeader style={styles.header}>
          <View style={styles.rowBetween}>
            <View style={styles.row}>
              <View style={styles.headerIcon}>
                <Brain size={20} color="#ffffff" />
              </View>
              <View style={{ marginLeft: 12 }}>
                <View style={styles.row}>
                  <Text style={styles.headerTitle}>{texts.title}</Text>
                  <Badge style={styles.badgeStyle}>
                    <Text style={{ fontSize: 10, color: '#ffffff' }}>v2.0</Text>
                  </Badge>
                </View>
                <Text style={styles.headerSub}>{texts.sub}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setIsOpen(false)} style={{ padding: 6 }}>
              <X size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </CardHeader>

        {/* Quick Action Chips */}
        <View style={styles.quickActionsBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {texts.quickActions.map((action, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => handleSendMessage(action.query)}
                style={styles.quickActionBtn}
              >
                <Text style={styles.quickActionText}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Progress indicator */}
        {currentTask && (
          <View style={styles.taskBar}>
            <View style={styles.row}>
              <Loader2 size={14} color="#9333ea" />
              <Text style={styles.taskTitle}>{currentTask.description}</Text>
            </View>
            <Progress value={currentTask.progress} style={{ height: 4, marginTop: 4 }} />
          </View>
        )}

        {/* Message Log */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesArea}
          contentContainerStyle={{ padding: 16 }}
        >
          {messages.map(msg => (
            <View
              key={msg.id}
              style={[styles.msgLine, msg.type === 'user' ? styles.msgLineUser : styles.msgLineBot]}
            >
              <View style={[styles.msgBubble, msg.type === 'user' ? styles.msgBubbleUser : styles.msgBubbleBot]}>
                <View style={styles.rowBetween}>
                  <View style={[styles.row, { marginBottom: 4, opacity: 0.8 }]}>
                    {msg.type === 'user' ? (
                      <User size={12} color="#ffffff" />
                    ) : (
                      <Brain size={12} color="#9333ea" />
                    )}
                    <Text style={[styles.msgTime, msg.type === 'user' ? { color: '#ffffff' } : { color: '#6b7280' }]}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.msgText, msg.type === 'user' ? { color: '#ffffff' } : { color: '#0f172a' }]}>
                  {msg.message}
                </Text>

                {/* Actions */}
                {msg.actions && (
                  <View style={styles.actionsWrap}>
                    {msg.actions.map(act => (
                      <Button
                        key={act.id}
                        variant={act.variant || 'default'}
                        onPress={act.handler}
                        size="sm"
                        style={styles.actionBtn}
                      >
                        <Text style={styles.actionBtnText}>{act.label}</Text>
                      </Button>
                    ))}
                  </View>
                )}

                {/* Suggestions */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <View style={styles.suggestionsWrap}>
                    {msg.suggestions.map((s, idx) => (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => handleSendMessage(s)}
                        style={styles.suggestionBtn}
                      >
                        <Text style={styles.suggestionText}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          ))}

          {isThinking && (
            <View style={[styles.msgLine, styles.msgLineBot]}>
              <View style={[styles.msgBubble, styles.msgBubbleBot]}>
                <View style={styles.row}>
                  <Brain size={14} color="#9333ea" style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 13, color: '#6b7280' }}>AI is thinking...</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputArea}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder={lang === 'te' ? "సందేశం నమోదు చేయండి..." : lang === 'hi' ? "संदेश लिखें..." : "Ask AI to book token or help..."}
              value={inputValue}
              onChangeText={setInputValue}
              onSubmitEditing={() => handleSendMessage()}
              editable={!isThinking}
            />
            <TouchableOpacity
              style={styles.sendBtn}
              onPress={() => handleSendMessage()}
              disabled={!inputValue.trim() || isThinking}
            >
              <Send size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fabContainer: { position: 'absolute', bottom: 24, right: 24, zIndex: 99 },
  fabBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#9333ea', alignItems: 'center', justifyContent: 'center', shadowColor: '#9333ea', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  fabBadge: { position: 'absolute', top: 2, right: 2, backgroundColor: '#000000', borderRadius: 10, padding: 2 },
  chatWindow: { position: 'absolute', bottom: 0, right: 0, zIndex: 99, width: '100%', maxWidth: 460, padding: 16, justifyContent: 'flex-end' },
  card: { flex: 1, backgroundColor: '#ffffff', overflow: 'hidden', shadowColor: '#000000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 12, borderColor: '#e9d5ff', borderWidth: 2, borderRadius: 20 },
  header: { backgroundColor: '#9333ea', padding: 16, borderBottomWidth: 0 },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  headerSub: { color: '#ffffff', fontSize: 12, opacity: 0.9 },
  badgeStyle: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 6, paddingVertical: 2, marginLeft: 8 },
  quickActionsBar: { backgroundColor: '#faf5ff', padding: 8, borderBottomWidth: 1, borderBottomColor: '#f3e8ff' },
  quickActionBtn: { backgroundColor: '#ffffff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, marginRight: 8, borderWidth: 1, borderColor: '#e9d5ff' },
  quickActionText: { fontSize: 12, color: '#6b21a8', fontWeight: '600' },
  taskBar: { padding: 12, backgroundColor: '#faf5ff', borderBottomWidth: 1, borderBottomColor: '#e9d5ff' },
  taskTitle: { fontSize: 12, fontWeight: '600', color: '#6b21a8', marginLeft: 8 },
  messagesArea: { flex: 1, backgroundColor: '#fcfafc' },
  msgLine: { flexDirection: 'row', marginBottom: 12 },
  msgLineUser: { justifyContent: 'flex-end' },
  msgLineBot: { justifyContent: 'flex-start' },
  msgBubble: { maxWidth: '88%', padding: 12, borderRadius: 16 },
  msgBubbleUser: { backgroundColor: '#9333ea', borderBottomRightRadius: 2 },
  msgBubbleBot: { backgroundColor: '#ffffff', borderBottomLeftRadius: 2, borderWidth: 1, borderColor: '#f3e8ff', shadowColor: '#000000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  msgTime: { marginLeft: 6, fontSize: 10 },
  msgText: { fontSize: 14, lineHeight: 20 },
  actionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  actionBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  actionBtnText: { fontSize: 12, fontWeight: 'bold', color: '#ffffff' },
  suggestionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  suggestionBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#d8b4fe', backgroundColor: '#faf5ff' },
  suggestionText: { fontSize: 11, color: '#7e22ce', fontWeight: '500' },
  inputArea: { padding: 12, borderTopWidth: 1, borderTopColor: '#f3e8ff', backgroundColor: '#ffffff' },
  inputWrap: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#faf5ff', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, marginRight: 8, borderWidth: 1, borderColor: '#e9d5ff' },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#9333ea', alignItems: 'center', justifyContent: 'center' }
});
