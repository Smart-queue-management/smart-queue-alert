var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault"); Object.defineProperty(exports, "__esModule", { value: true }); exports.TokenDisplay = TokenDisplay; var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator")); var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray")); var _react = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _useTranslation = require("../hooks/useTranslation");
var _button = require("./ui/button");
var _card = require("./ui/card");
var _badge = require("./ui/badge");
var _progress = require("./ui/progress");
var _tabs = require("./ui/tabs");
var _lucideReactNative = require("lucide-react-native");
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t in e) "default" !== _t && {}.hasOwnProperty.call(e, _t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t)) && (i.get || i.set) ? o(f, _t, i) : f[_t] = e[_t]); return f; })(e, t); }
var _reactNativeQrcodeSvg = _interopRequireDefault(require("react-native-qrcode-svg"));
function TokenDisplay(_ref) {
    var token = _ref.token;
    var _useAppContext = require("../context/AppContext").useAppContext(), state = _useAppContext.state, setState = _useAppContext.setState;
    var t = (0, _useTranslation.useTranslation)().t;
    var _useWindowDimensions = (0, _reactNative.useWindowDimensions)(), width = _useWindowDimensions.width;
    var isMobile = width < 768;
    var _useState = (0, _react.useState)(0), _useState2 = (0, _slicedToArray2.default)(_useState, 2), timeLeft = _useState2[0], setTimeLeft = _useState2[1];
    var _useState3 = (0, _react.useState)('overview'), _useState4 = (0, _slicedToArray2.default)(_useState3, 2), activeTab = _useState4[0], setActiveTab = _useState4[1];
    var _useState5 = (0, _react.useState)(false), _useState6 = (0, _slicedToArray2.default)(_useState5, 2), isDownloading = _useState6[0], setIsDownloading = _useState6[1];
    var viewRef = (0, _react.useRef)(null);

    (0, _react.useEffect)(function () {
        if (token) {
            var updateTimeLeft = function updateTimeLeft() {
                var now = new Date().getTime();
                var expiry = new Date(token.validUntil).getTime();
                setTimeLeft(Math.max(0, expiry - now));
            };
            updateTimeLeft();
            var interval = setInterval(updateTimeLeft, 1000);
            return function () { return clearInterval(interval); };
        }
    }, [token]);

    // Calculate live queue position based on queue_visits for the current department
    const currentActiveVisit = token ? (token.visits || []).find(v => v.status === 'waiting' || v.status === 'called' || v.status === 'in_consultation') : null;
    const currentDeptId = currentActiveVisit ? currentActiveVisit.department_id : (token ? (token.primaryDepartment === 'General Medicine' ? 'gen_med' : token.primaryDepartment === 'Cardiology' ? 'cardio' : token.primaryDepartment === 'ENT' ? 'ent' : token.primaryDepartment === 'Orthopedics' ? 'ortho' : token.primaryDepartment === 'Laboratory' ? 'lab' : token.primaryDepartment === 'Pharmacy' ? 'pharm' : 'gen_med') : 'gen_med');
    const currentDeptName = currentActiveVisit ? currentActiveVisit.department : (token ? token.primaryDepartment : 'General Medicine');

    // Filter tokens that have an active/waiting visit in this department
    const activeDeptTokens = (state.tokens || []).filter(function (t) {
        const v = (t.visits || []).find(v => v.department_id === currentDeptId && (v.status === 'waiting' || v.status === 'called'));
        return v !== undefined;
      });

    // Sort active tokens
    const priorityMap = { emergency: 1, disabled: 2, common: 3 };
    activeDeptTokens.sort(function (a, b) {
        var isAEmergency = (a.type || '').toLowerCase() === 'emergency' || (a.primaryDepartment || '').toLowerCase() === 'emergency';
        var isBEmergency = (b.type || '').toLowerCase() === 'emergency' || (b.primaryDepartment || '').toLowerCase() === 'emergency';
        if (isAEmergency && !isBEmergency) return -1;
        if (!isAEmergency && isBEmergency) return 1;
        var pA = priorityMap[a.type] || 3;
        var pB = priorityMap[b.type] || 3;
        if (pA !== pB) return pA - pB;
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });

    var tokenIndex = token ? activeDeptTokens.findIndex(function (t) { return t.id === token.id; }) : -1;
    var patientsAhead = tokenIndex >= 0 ? tokenIndex : 0;
    var queuePosition = tokenIndex >= 0 ? tokenIndex + 1 : 1;
    
    // Find current token being served in this department
    var currentServingToken = activeDeptTokens.find(function (t) {
        const v = (t.visits || []).find(v => v.department_id === currentDeptId);
        return v && v.status === 'called';
      });
    var currentServingId = currentServingToken ? currentServingToken.id : 'None';

    // Fetch wait time based on department average
    var matchedDept = (state.departments || []).find(function (d) { return d.id === currentDeptId; });
    var averageWait = matchedDept ? matchedDept.averageWaitTime : 15;
    var estimatedWait = patientsAhead * averageWait;

    // Get current status of active token
    const tokenStatus = currentActiveVisit ? currentActiveVisit.status : (token ? token.status : 'waiting');
    const displayRoom = currentActiveVisit ? currentActiveVisit.room_counter : (token ? token.room_counter : null);

    // Simple notifications feed
    const notificationFeed = [];
    if (token) {
        notificationFeed.push({ id: '1', text: `Token ${token.id} generated for ${token.primaryDepartment}.`, time: new Date(token.timestamp) });
        (token.visits || []).forEach((v, idx) => {
            if (v.status === 'called') {
                notificationFeed.push({ id: `call_${idx}`, text: `Called to ${v.department} (${v.room_counter || '\u2014'}).`, time: v.called_at ? new Date(v.called_at) : new Date() });
            } else if (v.status === 'in_consultation') {
                notificationFeed.push({ id: `consult_${idx}`, text: `Consultation in progress at ${v.department}.`, time: v.called_at ? new Date(v.called_at) : new Date() });
            } else if (v.status === 'completed') {
                notificationFeed.push({ id: `comp_${idx}`, text: `Completed consultation in ${v.department}.`, time: v.completed_at ? new Date(v.completed_at) : new Date() });
            }
            if (idx > 0) {
                notificationFeed.push({ id: `ref_${idx}`, text: `Referred to ${v.department}.`, time: new Date(v.timestamp) });
            }
        });
    }
    notificationFeed.reverse(); // Show latest first

    var handleShare =/*#__PURE__*/function () {
        var _ref2 = (0, _asyncToGenerator2.default)(function* () {
            var _token$patient;
            if (!token) return;
            var shareText = `🏥 Hospital Token ID: ${token.id}\nPatient: ${(_token$patient = token.patient) == null ? void 0 : _token$patient.name}\nDept: ${token.primaryDepartment}`;
            try {
                yield _reactNative.Share.share({ message: shareText });
            } catch (error) {
                console.log('Error sharing', error);
            }
        }); return function handleShare() { return _ref2.apply(this, arguments); };
    }();

    var handleBackToPrevious = function handleBackToPrevious() {
        setState(function (prev) { return Object.assign({}, prev, { currentView: prev.currentView === 'token-display' ? 'patient-dashboard' : prev.currentView }); });
    };

    var handleBackToHome = function handleBackToHome() {
        setState(function (prev) { return Object.assign({}, prev, { currentView: 'patient-dashboard' }); });
    };

    if (!token) {
        return (/*#__PURE__*/
            (0, _jsxRuntime.jsxs)(_reactNative.View, {
                style: styles.centerContainer, children: [/*#__PURE__*/
                    (0, _jsxRuntime.jsx)(_reactNative.Text, { children: t.noTokenFound }),/*#__PURE__*/
                    (0, _jsxRuntime.jsx)(_button.Button, { onPress: handleBackToHome, style: { marginTop: 16 }, children:/*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.Text, { style: { color: '#fff' }, children: t.backToDashboard }) })]
            }
            ));

    }

    var handleDownload = /*#__PURE__*/function () {
        var _ref3 = (0, _asyncToGenerator2.default)(function* () {
            setIsDownloading(true);
            try {
                // Give React a frame to ensure the UI is fully rendered without glitching
                yield new Promise(function(resolve) { setTimeout(resolve, 50); });
                
                if (_reactNative.Platform.OS === 'web') {
                    var html2canvas = require('html2canvas').default || require('html2canvas');
                    var element = viewRef.current;
                    if (!element) return;
                    var canvas = yield html2canvas(element, { scale: 3, useCORS: true, backgroundColor: '#ffffff', scrollY: -window.scrollY });
                    var dataUrl = canvas.toDataURL('image/png', 1.0);
                    var link = document.createElement('a');
                    link.download = "Medical_Token_" + token.id + ".png";
                    link.href = dataUrl;
                    link.click();
                } else {
                    var captureRef = require('react-native-view-shot').captureRef;
                    var Sharing = require('expo-sharing');
                    var uri = yield captureRef(viewRef, {
                        format: "png",
                        quality: 1,
                        result: "tmpfile"
                    });
                    var isAvailable = yield Sharing.isAvailableAsync();
                    if (isAvailable) {
                        yield Sharing.shareAsync(uri, { UTI: 'public.png', mimeType: 'image/png', dialogTitle: 'Save Token Image' });
                    }
                }
            } catch (err) {
                console.error("Failed to capture token:", err);
            } finally {
                setIsDownloading(false);
            }
        }); return function handleDownload() { return _ref3.apply(this, arguments); };
    }();

    var validityProgress = timeLeft > 0 ? timeLeft / (24 * 60 * 60 * 1000) * 100 : 0;

    return (/*#__PURE__*/
        (0, _jsxRuntime.jsxs)(_reactNative.ScrollView, {
            contentContainerStyle: styles.container, children: [/*#__PURE__*/
                (0, _jsxRuntime.jsx)(_card.Card, {
                    style: [styles.card, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }], children:/*#__PURE__*/
                        (0, _jsxRuntime.jsx)(_card.CardHeader, {
                            children:/*#__PURE__*/
                                (0, _jsxRuntime.jsxs)(_reactNative.View, {
                                    style: styles.row, children: [/*#__PURE__*/
                                        (0, _jsxRuntime.jsx)(_reactNative.View, { style: styles.iconCircle, children:/*#__PURE__*/(0, _jsxRuntime.jsx)(_lucideReactNative.Building2, { size: 24, color: "#16a34a" }) }),/*#__PURE__*/
                                        (0, _jsxRuntime.jsxs)(_reactNative.View, {
                                            style: { flex: 1, marginLeft: 16 }, children: [/*#__PURE__*/
                                                (0, _jsxRuntime.jsx)(_card.CardTitle, { style: { color: '#166534' }, children: t.tokenGenerated }),/*#__PURE__*/
                                                (0, _jsxRuntime.jsx)(_reactNative.Text, { style: { color: '#15803d', fontSize: 13 }, children: t.reusableDay })]
                                        }
                                        ),/*#__PURE__*/
                                        (0, _jsxRuntime.jsx)(_badge.Badge, { style: { backgroundColor: '#16a34a' }, children:/*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.Text, { style: { color: '#fff' }, children: t.accessAll }) })]
                                }
                                )
                        }
                        )
                }
                ),/*#__PURE__*/

                (0, _jsxRuntime.jsx)(_card.Card, {
                    style: styles.card, children:/*#__PURE__*/
                        (0, _jsxRuntime.jsxs)(_card.CardContent, {
                            style: { paddingTop: 16 }, children: [/*#__PURE__*/
                                (0, _jsxRuntime.jsxs)(_reactNative.View, {
                                    style: styles.rowBetween, children: [/*#__PURE__*/
                                        (0, _jsxRuntime.jsx)(_reactNative.Text, { style: { fontWeight: '600' }, children: t.validUntil }),/*#__PURE__*/
                                        (0, _jsxRuntime.jsxs)(_reactNative.Text, { style: { color: '#6b7280' }, children: [Math.floor(timeLeft / 3600000), "h ", Math.floor(timeLeft % 3600000 / 60000), "m ", t.remaining] })]
                                }
                                ),/*#__PURE__*/
                                (0, _jsxRuntime.jsx)(_progress.Progress, { value: validityProgress, style: { marginTop: 8 } })]
                        }
                        )
                }
                ),/*#__PURE__*/

                (0, _jsxRuntime.jsx)(_card.Card, {
                    style: styles.card, children:/*#__PURE__*/
                        (0, _jsxRuntime.jsx)(_card.CardContent, {
                            style: { paddingTop: 16 }, children:/*#__PURE__*/
                                (0, _jsxRuntime.jsxs)(_tabs.Tabs, {
                                    value: activeTab, onValueChange: setActiveTab, children: [/*#__PURE__*/
                                        (0, _jsxRuntime.jsxs)(_tabs.TabsList, {
                                            style: [styles.tabsList, isMobile && { width: '100%', flexDirection: 'row' }], children: [/*#__PURE__*/
                                                (0, _jsxRuntime.jsx)(_tabs.TabsTrigger, { value: "overview", style: isMobile ? { flex: 1, alignItems: 'center' } : {}, children:/*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.Text, { children: t.overview }) }),/*#__PURE__*/
                                                (0, _jsxRuntime.jsx)(_tabs.TabsTrigger, { value: "visits", style: isMobile ? { flex: 1, alignItems: 'center' } : {}, children:/*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.Text, { children: t.visits }) })]
                                        }
                                        ),/*#__PURE__*/

                                        (0, _jsxRuntime.jsx)(_tabs.TabsContent, {
                                            value: "overview", children:/*#__PURE__*/
                                                (0, _jsxRuntime.jsxs)(_reactNative.View, {
                                                    style: { marginTop: 16, gap: 16 }, children: [/*#__PURE__*/
                                                        (0, _jsxRuntime.jsxs)(_reactNative.View, {
                                                            ref: viewRef, collapsable: false, style: { backgroundColor: '#ffffff', gap: 16, padding: 16, borderRadius: 12 }, children: [/*#__PURE__*/
                                                            /* Live Queue Status Card */
                                                             (0, _jsxRuntime.jsx)(_card.Card, {
                                                                 style: { 
                                                                     backgroundColor: tokenStatus === 'called' ? '#f0fdf4' : tokenStatus === 'in_consultation' ? '#f3e8ff' : tokenStatus === 'completed' ? '#f1f5f9' : (patientsAhead <= 5 ? '#fff7ed' : '#f0f9ff'),
                                                                     borderColor: tokenStatus === 'called' ? '#bbf7d0' : tokenStatus === 'in_consultation' ? '#d8b4fe' : tokenStatus === 'completed' ? '#cbd5e1' : (patientsAhead <= 5 ? '#fed7aa' : '#bae6fd'),
                                                                     borderWidth: 2,
                                                                     borderRadius: 16,
                                                                     marginBottom: 16,
                                                                     width: '100%'
                                                                 },
                                                                 children: (0, _jsxRuntime.jsxs)(_card.CardContent, {
                                                                     style: { padding: 18, alignItems: 'center' },
                                                                     children: [
                                                                         (0, _jsxRuntime.jsxs)(_reactNative.Text, { style: { fontSize: 32, fontWeight: '900', color: '#1e293b', marginBottom: 4 }, children: ["Token: ", token.id] }),
                                                                         (0, _jsxRuntime.jsxs)(_reactNative.Text, { style: { fontSize: 16, fontWeight: '700', color: '#475569', marginBottom: 12 }, children: ["Current Department: ", currentDeptName] }),
                                                                         tokenStatus === 'called' ? (0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, { children: [
                                                                             (0, _jsxRuntime.jsx)(_reactNative.Text, { style: { fontSize: 24, fontWeight: '900', color: '#16a34a', textAlign: 'center' }, children: "🟢 " + t.yourTurnTitle }),
                                                                             (0, _jsxRuntime.jsxs)(_reactNative.Text, { style: { fontSize: 18, fontWeight: 'bold', color: '#15803d', marginTop: 8, textAlign: 'center' }, children: [t.pleaseProceedTo, displayRoom || '\u2014'] })
                                                                         ]}) : tokenStatus === 'in_consultation' ? (0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, { children: [
                                                                             (0, _jsxRuntime.jsx)(_reactNative.Text, { style: { fontSize: 20, fontWeight: '800', color: '#7c3aed' }, children: t.inConsultationLabel }),
                                                                             (0, _jsxRuntime.jsx)(_reactNative.Text, { style: { fontSize: 14, color: '#6d28d9', marginTop: 4, textAlign: 'center' }, children: t.pleaseWaitDoctor })
                                                                         ]}) : tokenStatus === 'completed' ? (0, _jsxRuntime.jsx)(_reactNative.Text, { style: { fontSize: 20, fontWeight: '800', color: '#475569', textAlign: 'center' }, children: t.consultationCompletedLabel }) : (0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, { children: [
                                                                             (0, _jsxRuntime.jsx)(_reactNative.Text, { style: { fontSize: 18, fontWeight: '800', color: patientsAhead <= 5 ? '#c2410c' : '#0369a1', textAlign: 'center' }, children: patientsAhead <= 5 ? "🔔 " + t.approachingAlert : t.statusWaitingLabel }),
                                                                             (0, _jsxRuntime.jsxs)(_reactNative.View, { 
                                                                                 style: { flexDirection: 'row', gap: 16, marginTop: 12, justifyContent: 'center', width: '100%' },
                                                                                 children: [
                                                                                     (0, _jsxRuntime.jsxs)(_reactNative.View, { style: { alignItems: 'center', flex: 1 }, children: [
                                                                                         (0, _jsxRuntime.jsx)(_reactNative.Text, { style: { fontSize: 20, fontWeight: '800', color: '#0f172a' }, children: patientsAhead }),
                                                                                         (0, _jsxRuntime.jsx)(_reactNative.Text, { style: { fontSize: 11, color: '#64748b', marginTop: 2 }, children: t.patientsAheadLabel })
                                                                                     ]}),
                                                                                     (0, _jsxRuntime.jsxs)(_reactNative.View, { style: { alignItems: 'center', flex: 1 }, children: [
                                                                                         (0, _jsxRuntime.jsxs)(_reactNative.Text, { style: { fontSize: 20, fontWeight: '800', color: '#0f172a' }, children: [estimatedWait, " m"] }),
                                                                                         (0, _jsxRuntime.jsx)(_reactNative.Text, { style: { fontSize: 11, color: '#64748b', marginTop: 2 }, children: t.estimatedWaitLabel })
                                                                                     ]})
                                                                                 ]
                                                                             }),
                                                                             (0, _jsxRuntime.jsx)(_reactNative.Text, { style: { fontSize: 13, color: '#475569', marginTop: 16, textAlign: 'center', fontStyle: 'italic' }, children: patientsAhead <= 5 ? "" : t.waitingMessage })
                                                                         ]}),
                                                                         (0, _jsxRuntime.jsxs)(_reactNative.Text, { style: { fontSize: 13, color: '#475569', marginTop: 12, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8, width: '100%', textAlign: 'center' }, children: [t.currentlyServingLabel + ": ", currentServingId] })
                                                                     ]
                                                                 })
                                                             }),

                                                                (0, _jsxRuntime.jsxs)(_reactNative.View, { style: { alignItems: 'center', marginBottom: 8, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }, children: [/*#__PURE__*/
                                                                    (0, _jsxRuntime.jsx)(_lucideReactNative.HeartPulse, { size: 32, color: "#0ea5e9", style: { marginBottom: 8 } }),/*#__PURE__*/
                                                                    (0, _jsxRuntime.jsx)(_reactNative.Text, { style: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' }, children: "Medical Services" }),/*#__PURE__*/
                                                                    (0, _jsxRuntime.jsx)(_reactNative.Text, { style: { fontSize: 13, color: '#64748b' }, children: "Official Patient Token" })]
                                                                }
                                                                ),/*#__PURE__*/
                                                        (0, _jsxRuntime.jsxs)(_reactNative.View, {
                                                            style: [{ flexDirection: 'row', gap: 12 }, isMobile && { flexDirection: 'column', gap: 16 }], children: [/*#__PURE__*/
                                                        (0, _jsxRuntime.jsxs)(_reactNative.View, {
                                                            style: [styles.dataBox, { flex: 1 }, isMobile && { width: '100%' }], children: [/*#__PURE__*/
                                                                (0, _jsxRuntime.jsx)(_reactNative.Text, { style: styles.dataLabel, children: t.patientDetails || 'Patient Details' }),/*#__PURE__*/
                                                                (0, _jsxRuntime.jsxs)(_reactNative.View, {
                                                                    style: { gap: 8, marginTop: 4 }, children: [/*#__PURE__*/
                                                                        (0, _jsxRuntime.jsxs)(_reactNative.Text, {
                                                                            style: styles.detailText, children: [/*#__PURE__*/
                                                                                (0, _jsxRuntime.jsx)(_reactNative.Text, { style: styles.detailLabel, children: "Name: " }),
                                                                                (token.patient == null ? void 0 : token.patient.name) || 'N/A']
                                                                        }
                                                                        ),/*#__PURE__*/
                                                                        (0, _jsxRuntime.jsxs)(_reactNative.Text, {
                                                                            style: styles.detailText, children: [/*#__PURE__*/
                                                                                (0, _jsxRuntime.jsx)(_reactNative.Text, { style: styles.detailLabel, children: "Phone: " }),
                                                                                (token.patient == null ? void 0 : token.patient.phone) || 'N/A']
                                                                        }
                                                                        ),/*#__PURE__*/
                                                                        (0, _jsxRuntime.jsxs)(_reactNative.Text, {
                                                                            style: styles.detailText, children: [/*#__PURE__*/
                                                                                (0, _jsxRuntime.jsxs)(_reactNative.Text, { style: styles.detailLabel, children: ["Age / Gender: "] }),
                                                                                (token.patient == null ? void 0 : token.patient.age) || 'N/A', " / ", (token.patient == null ? void 0 : token.patient.gender) || 'N/A']
                                                                        }
                                                                        )]
                                                                }
                                                                )]
                                                        }
                                                        ),/*#__PURE__*/

                                                        (0, _jsxRuntime.jsxs)(_reactNative.View, {
                                                            style: [styles.dataBox, { flex: 1 }, isMobile && { width: '100%' }], children: [/*#__PURE__*/
                                                                (0, _jsxRuntime.jsx)(_reactNative.Text, { style: styles.dataLabel, children: t.serviceDetails || 'Service Details' }),/*#__PURE__*/
                                                                (0, _jsxRuntime.jsxs)(_reactNative.View, {
                                                                    style: { gap: 8, marginTop: 4 }, children: [/*#__PURE__*/
                                                                        (0, _jsxRuntime.jsxs)(_reactNative.Text, {
                                                                            style: styles.detailText, children: [/*#__PURE__*/
                                                                                (0, _jsxRuntime.jsx)(_reactNative.Text, { style: styles.detailLabel, children: "Token ID: " }),
                                                                                token.id]
                                                                        }
                                                                        ),/*#__PURE__*/
                                                                        (0, _jsxRuntime.jsxs)(_reactNative.Text, {
                                                                            style: styles.detailText, children: [/*#__PURE__*/
                                                                                (0, _jsxRuntime.jsx)(_reactNative.Text, { style: styles.detailLabel, children: "Service: " }),/*#__PURE__*/
                                                                                (0, _jsxRuntime.jsx)(_reactNative.Text, { style: { textTransform: 'capitalize' }, children: token.type || 'N/A' })]
                                                                        }
                                                                        ),/*#__PURE__*/
                                                                        (0, _jsxRuntime.jsxs)(_reactNative.Text, {
                                                                            style: styles.detailText, children: [/*#__PURE__*/
                                                                                (0, _jsxRuntime.jsx)(_reactNative.Text, { style: styles.detailLabel, children: "Department: " }),
                                                                                token.primaryDepartment || 'N/A']
                                                                        }
                                                                        ),/*#__PURE__*/
                                                                        (0, _jsxRuntime.jsxs)(_reactNative.Text, {
                                                                            style: styles.detailText, children: [/*#__PURE__*/
                                                                                (0, _jsxRuntime.jsx)(_reactNative.Text, { style: styles.detailLabel, children: "Time Slot: " }),/*#__PURE__*/
                                                                                (0, _jsxRuntime.jsxs)(_reactNative.Text, {
                                                                                    style: { color: '#dc2626', fontWeight: 'bold' }, children: [
                                                                                        token.scheduledTime ? new Date(token.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date(token.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })]
                                                                                }
                                                                                )]
                                                                        }
                                                                        )]
                                                                }
                                                                )]
                                                        }
                                                        )]
                                                        }
                                                        ),/*#__PURE__*/

                                                        (0, _jsxRuntime.jsxs)(_reactNative.View, {
                                                            style: [styles.dataBox, isMobile && { alignItems: 'center', width: '100%', marginVertical: 8 }], children: [/*#__PURE__*/
                                                                (0, _jsxRuntime.jsx)(_reactNative.Text, { style: styles.dataLabel, children: t.scanQr || 'Scan QR for verification' }),/*#__PURE__*/
                                                                (0, _jsxRuntime.jsxs)(_reactNative.View, {
                                                                    style: { alignItems: 'center', marginVertical: 16 }, children: [/*#__PURE__*/
                                                                        (0, _jsxRuntime.jsx)(_reactNativeQrcodeSvg.default, { value: token.qrCode || token.id, size: 160 }),/*#__PURE__*/
                                                                        (0, _jsxRuntime.jsx)(_reactNative.Text, { style: { marginTop: 12, fontWeight: '600', color: '#374151' }, children: "Scan for Patient ID" }),/*#__PURE__*/
                                                                        (0, _jsxRuntime.jsx)(_reactNative.Text, { style: { color: '#6b7280', fontSize: 13 }, children: token.id })]
                                                                }
                                                                ),/*#__PURE__*/
                                                                (0, _jsxRuntime.jsxs)(_reactNative.View, {
                                                                    style: { backgroundColor: '#f0f9ff', padding: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderColor: '#e0f2fe' }, children: [/*#__PURE__*/
                                                                        (0, _jsxRuntime.jsx)(_lucideReactNative.Info, { size: 16, color: "#0284c7", style: { marginTop: 2, marginRight: 8 } }),/*#__PURE__*/
                                                                        (0, _jsxRuntime.jsx)(_reactNative.Text, { style: { color: '#0369a1', flex: 1, fontSize: 13 }, children: "Present this QR code and Token ID at the reception counter." })]
                                                                }
                                                                )]
                                                        }
                                                        ),/*#__PURE__*/
                                                        (0, _jsxRuntime.jsx)(_reactNative.Text, { style: { textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 16 }, children: "Generated on " + new Date().toLocaleString() })]
                                                    }
                                                    ),/*#__PURE__*/

                                                            /* Journey flow card */
                                                            (0, _jsxRuntime.jsxs)(_card.Card, {
                                                                style: { marginTop: 16, width: '100%', borderColor: '#e2e8f0', borderWidth: 1 },
                                                                children: [
                                                                    (0, _jsxRuntime.jsxs)(_card.CardHeader, {
                                                                        children: [
                                                                            (0, _jsxRuntime.jsx)(_card.CardTitle, { style: { fontSize: 16, fontWeight: 'bold' }, children: "Patient Journey / రోగి ప్రయాణం" }),
                                                                            (0, _jsxRuntime.jsx)(_card.CardDescription, { children: "Clinics routing order" })
                                                                        ]
                                                                    }),
                                                                    (0, _jsxRuntime.jsx)(_card.CardContent, {
                                                                        style: { gap: 12 },
                                                                        children: (token.visits && token.visits.length > 0) ? token.visits.map((visit, idx) => (
                                                                            (0, _jsxRuntime.jsxs)(_reactNative.View, {
                                                                                key: visit.id || idx,
                                                                                style: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: idx < token.visits.length - 1 ? 1 : 0, borderBottomColor: '#f1f5f9' },
                                                                                children: [
                                                                                    (0, _jsxRuntime.jsxs)(_reactNative.View, {
                                                                                        style: { flexDirection: 'row', alignItems: 'center', gap: 10 },
                                                                                        children: [
                                                                                            (0, _jsxRuntime.jsx)(_reactNative.Text, { style: { fontWeight: 'bold', color: '#64748b' }, children: `${idx + 1}.` }),
                                                                                            (0, _jsxRuntime.jsx)(_reactNative.Text, { style: { fontSize: 15, fontWeight: '600', color: '#1e293b' }, children: visit.department })
                                                                                        ]
                                                                                    }),
                                                                                    (0, _jsxRuntime.jsxs)(_reactNative.View, {
                                                                                        style: { flexDirection: 'row', alignItems: 'center', gap: 6 },
                                                                                        children: [
                                                                                            (0, _jsxRuntime.jsx)(_reactNative.Text, { 
                                                                                                style: { fontSize: 13, fontWeight: 'bold', color: visit.status === 'completed' ? '#16a34a' : visit.status === 'called' ? '#ea580c' : visit.status === 'in_consultation' ? '#7c3aed' : visit.status === 'pending' ? '#94a3b8' : '#2563eb' },
                                                                                                children: visit.status === 'completed' ? '✓ Completed' : visit.status === 'called' ? '● Your Turn' : visit.status === 'in_consultation' ? '● In Consultation' : visit.status === 'pending' ? '○ Pending' : '● Waiting'
                                                                                            })
                                                                                        ]
                                                                                    })
                                                                                ]
                                                                            })
                                                                        )) : (
                                                                            (0, _jsxRuntime.jsxs)(_reactNative.View, {
                                                                                style: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
                                                                                children: [
                                                                                    (0, _jsxRuntime.jsx)(_reactNative.Text, { style: { fontSize: 15, fontWeight: '600', color: '#1e293b' }, children: token.primaryDepartment }),
                                                                                    (0, _jsxRuntime.jsx)(_reactNative.Text, { style: { fontSize: 13, fontWeight: 'bold', color: '#2563eb' }, children: '● Waiting' })
                                                                                ]
                                                                            })
                                                                        )
                                                                    })
                                                                ]
                                                            }),/*#__PURE__*/

                                                            /* Simple Notifications Panel */
                                                            (0, _jsxRuntime.jsxs)(_card.Card, {
                                                                style: { marginTop: 16, width: '100%', borderColor: '#e2e8f0', borderWidth: 1 },
                                                                children: [
                                                                    (0, _jsxRuntime.jsxs)(_card.CardHeader, {
                                                                        children: [
                                                                            (0, _jsxRuntime.jsx)(_card.CardTitle, { style: { fontSize: 16, fontWeight: 'bold' }, children: "Activity Notifications" }),
                                                                            (0, _jsxRuntime.jsx)(_card.CardDescription, { children: "Updates for your check-in" })
                                                                        ]
                                                                    }),
                                                                    (0, _jsxRuntime.jsx)(_card.CardContent, {
                                                                        style: { gap: 10 },
                                                                        children: notificationFeed.length > 0 ? notificationFeed.map(note => (
                                                                            (0, _jsxRuntime.jsxs)(_reactNative.View, {
                                                                                key: note.id,
                                                                                style: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 4 },
                                                                                children: [
                                                                                    (0, _jsxRuntime.jsx)(_lucideReactNative.Zap, { size: 16, color: '#f59e0b', style: { marginTop: 2 } }),
                                                                                    (0, _jsxRuntime.jsxs)(_reactNative.View, {
                                                                                        style: { flex: 1 },
                                                                                        children: [
                                                                                            (0, _jsxRuntime.jsx)(_reactNative.Text, { style: { fontSize: 14, color: '#334155', fontWeight: '500' }, children: note.text }),
                                                                                            (0, _jsxRuntime.jsx)(_reactNative.Text, { style: { fontSize: 11, color: '#94a3b8', marginTop: 2 }, children: note.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })
                                                                                        ]
                                                                                    })
                                                                                ]
                                                                            })
                                                                        )) : (
                                                                            (0, _jsxRuntime.jsx)(_reactNative.Text, { style: { fontSize: 14, color: '#64748b', fontStyle: 'italic' }, children: "No notifications yet." })
                                                                        )
                                                                    })
                                                                ]
                                                            }),/*#__PURE__*/

                                                    (0, _jsxRuntime.jsxs)(_button.Button, {
                                                        onPress: handleDownload, disabled: isDownloading, style: [isMobile && { width: '100%' }, { marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' }], children: [/*#__PURE__*/
                                                            (0, _jsxRuntime.jsx)(_lucideReactNative.Download, { size: 16, color: "#ffffff", style: { marginRight: 8 } }),/*#__PURE__*/
                                                            (0, _jsxRuntime.jsx)(_reactNative.Text, { style: { color: '#ffffff', fontWeight: 'bold' }, children: isDownloading ? "Generating Image..." : "Download Token" })]
                                                    }
                                                    )]
                                                }
                                                )
                                        }
                                        ),/*#__PURE__*/

                                        (0, _jsxRuntime.jsx)(_tabs.TabsContent, {
                                            value: "visits", children:/*#__PURE__*/
                                                (0, _jsxRuntime.jsx)(_reactNative.View, {
                                                    style: { marginTop: 16, gap: 12 }, children: (token.visits && token.visits.length > 0 ? token.visits.map(function (visit, index) {
                                                        return (/*#__PURE__*/
                                                            (0, _jsxRuntime.jsxs)(_reactNative.View, {
                                                                key: visit.id || index, style: styles.visitCard, children: [/*#__PURE__*/
                                                                    (0, _jsxRuntime.jsxs)(_reactNative.View, {
                                                                        style: styles.visitHeader, children: [/*#__PURE__*/
                                                                            (0, _jsxRuntime.jsx)(_reactNative.Text, {
                                                                                style: styles.visitDate, children: new Date(visit.timestamp || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                                                                            }
                                                                            ),
                                                                            visit.status && /*#__PURE__*/(0, _jsxRuntime.jsx)(_badge.Badge, {
                                                                                variant: "outline", style: { backgroundColor: '#f3f4f6' }, children:/*#__PURE__*/
                                                                                    (0, _jsxRuntime.jsx)(_reactNative.Text, { style: { fontSize: 12, textTransform: 'capitalize' }, children: visit.status })
                                                                            }
                                                                            )]
                                                                    }
                                                                    ),/*#__PURE__*/
                                                                    (0, _jsxRuntime.jsxs)(_reactNative.View, {
                                                                        style: styles.visitContent, children: [
                                                                            visit.department && /*#__PURE__*/(0, _jsxRuntime.jsxs)(_reactNative.Text, {
                                                                                style: styles.visitDetail, children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.Text, { style: { fontWeight: '600' }, children: "Dept:" }), " ", visit.department]
                                                                            }
                                                                            ),
                                                                            visit.doctorName && /*#__PURE__*/(0, _jsxRuntime.jsxs)(_reactNative.Text, {
                                                                                style: styles.visitDetail, children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.Text, { style: { fontWeight: '600' }, children: "Doctor:" }), " Dr. ", visit.doctorName]
                                                                            }
                                                                            ),
                                                                            visit.notes && /*#__PURE__*/(0, _jsxRuntime.jsxs)(_reactNative.View, {
                                                                                style: { marginTop: 8 }, children: [/*#__PURE__*/
                                                                                    (0, _jsxRuntime.jsx)(_reactNative.Text, { style: { fontWeight: '600', fontSize: 13, color: '#374151', marginBottom: 2 }, children: "Notes:" }),/*#__PURE__*/
                                                                                    (0, _jsxRuntime.jsx)(_reactNative.Text, { style: styles.visitNotes, children: visit.notes })]
                                                                            }
                                                                            )]
                                                                    }
                                                                    )]
                                                            }
                                                            ));
                                                    }) : /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.View, {
                                                        style: { padding: 24, backgroundColor: '#f9fafb', borderRadius: 8, alignItems: 'center' }, children:/*#__PURE__*/
                                                            (0, _jsxRuntime.jsx)(_reactNative.Text, { style: { color: '#6b7280', textAlign: 'center' }, children: t.noVisits || 'No visits recorded yet for this active token.' })
                                                    }
                                                    ))
                                                }
                                                )
                                        }
                                        )]
                                }
                                )
                        }
                        )
                }
                ),/*#__PURE__*/

                (0, _jsxRuntime.jsxs)(_reactNative.View, {
                    style: styles.btnRow, children: [/*#__PURE__*/
                        (0, _jsxRuntime.jsxs)(_button.Button, {
                            variant: "outline", onPress: handleShare, style: { flex: 1, marginRight: 8 }, children: [/*#__PURE__*/
                                (0, _jsxRuntime.jsx)(_lucideReactNative.Share2, { size: 16, color: "#0f172a", style: { marginRight: 8 } }),/*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.Text, { style: { color: '#0f172a', fontWeight: '500' }, children: t.shareBtn })]
                        }
                        ),/*#__PURE__*/
                        (0, _jsxRuntime.jsx)(_button.Button, {
                            onPress: handleBackToHome, style: { flex: 1, backgroundColor: '#0ea5e9' }, children:/*#__PURE__*/
                                (0, _jsxRuntime.jsx)(_reactNative.Text, { style: { color: '#ffffff', fontWeight: 'bold' }, children: t.dashboardBtn })
                        }
                        )]
                }
                )]
        }
        ));

}

var styles = _reactNative.StyleSheet.create({
    container: { padding: 24, paddingBottom: 40, backgroundColor: '#f0fdfa', flexGrow: 1 },// mint bg
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0fdfa' },
    card: { marginBottom: 20 },// more spacing
    row: { flexDirection: 'row', alignItems: 'center' },
    rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#ccfbf1', alignItems: 'center', justifyContent: 'center' },// softer teal bg
    tabsList: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 6 },// rounder
    dataBox: { padding: 16, backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e0f2fe' },// white, rounder
    dataLabel: { fontSize: 15, fontWeight: '700', color: '#334155', marginBottom: 8, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }, // bolder heading with underline
    dataValue: { fontSize: 16, fontWeight: '700', color: '#0f172a' }, // darker slate
    detailText: { fontSize: 15, color: '#334155', lineHeight: 22 },
    detailLabel: { color: '#64748b', fontWeight: '500' },
    btnRow: { flexDirection: 'row', marginTop: 24 }, // more margin
    visitCard: { backgroundColor: '#ffffff', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#e2e8f0' },
    visitHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    visitDate: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
    visitContent: { gap: 4 },
    visitDetail: { fontSize: 14, color: '#334155' },
    visitNotes: { fontSize: 14, color: '#475569', fontStyle: 'italic', backgroundColor: '#f8fafc', padding: 8, borderRadius: 6 }
});