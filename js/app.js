/**
 * Compare Kit - App Controller
 * MQTT 연결, 세션 관리, 활동 감지, 타임아웃 처리
 */
(function () {
    'use strict';

    // ── 설정 ──
    const CONFIG = {
        mqtt: {
            // EMQX 무료 공개 브로커 (개발용, 운영 시 변경)
            brokerUrl: 'wss://broker.emqx.io:8084/mqtt',
            options: {
                keepalive: 30,
                clean: true,
                reconnectPeriod: 3000,
                connectTimeout: 10000,
            }
        },
        session: {
            heartbeatInterval: 30000,   // 30초마다 heartbeat
            timeoutDuration: 60000,     // 1분 비활동 시 타임아웃
            timeoutBarUpdate: 1000,     // 타임아웃 바 업데이트 주기
        },
        debug: false, // URL에 &debug=true 로 활성화 가능
    };

    // ── 상태 ──
    let state = {
        boothId: null,
        token: null,
        sessionId: null,
        deviceInfo: null,
        mqttClient: null,
        connected: false,
        heartbeatTimer: null,
        timeoutTimer: null,
        timeoutBarTimer: null,
        lastActivity: Date.now(),
        timeoutRemaining: CONFIG.session.timeoutDuration,
    };

    // ── URL 파라미터 파싱 ──
    function parseParams() {
        const params = new URLSearchParams(window.location.search);
        state.boothId = params.get('booth');
        state.token = params.get('token');
        CONFIG.debug = params.get('debug') === 'true';

        if (CONFIG.debug) {
            document.getElementById('debug-panel').classList.add('show');
        }

        debugLog(`Params: booth=${state.boothId}, token=${state.token}`);
    }

    // ── 화면 전환 ──
    function showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const screen = document.getElementById(screenId);
        if (screen) screen.classList.add('active');
        debugLog(`Screen: ${screenId}`);
    }

    function showError(title, msg) {
        document.getElementById('error-title').textContent = title;
        document.getElementById('error-msg').textContent = msg;
        showScreen('screen-error');
    }

    // ── 디버그 로그 ──
    function debugLog(msg) {
        console.log(`[CompareKit] ${msg}`);
        if (CONFIG.debug) {
            const panel = document.getElementById('debug-panel');
            const time = new Date().toLocaleTimeString();
            panel.innerHTML += `<div>[${time}] ${msg}</div>`;
            panel.scrollTop = panel.scrollHeight;
        }
    }

    // ── MQTT 토픽 헬퍼 ──
    function topic(path) {
        return `comparekit/${state.boothId}/${path}`;
    }

    // ── 세션 ID 생성 ──
    function generateSessionId() {
        return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
    }

    // ── MQTT 연결 ──
    function connectMqtt() {
        debugLog('MQTT 연결 시도...');

        state.sessionId = generateSessionId();
        const clientId = `web_${state.boothId}_${Date.now().toString(36)}`;

        // LWT: 브라우저가 갑자기 닫혀도 브로커가 자동으로 disconnect 전송
        const willPayload = JSON.stringify({
            sessionId: state.sessionId,
            timestamp: new Date().toISOString(),
            reason: 'lwt',
        });

        state.mqttClient = mqtt.connect(CONFIG.mqtt.brokerUrl, {
            ...CONFIG.mqtt.options,
            clientId: clientId,
            will: {
                topic: topic('device/disconnect'),
                payload: willPayload,
                qos: 1,
                retain: false,
            },
        });

        state.mqttClient.on('connect', () => {
            debugLog('MQTT 연결 성공');
            state.connected = true;

            // 구독: MAUI → 웹 메시지
            state.mqttClient.subscribe([
                topic('session/accepted'),
                topic('session/revoke'),
                topic('maui/status'),
                topic('maui/command'),
            ], (err) => {
                if (err) {
                    debugLog(`구독 실패: ${err.message}`);
                } else {
                    debugLog('토픽 구독 완료');
                    // 기기 정보 전송
                    sendDeviceConnect();
                }
            });
        });

        state.mqttClient.on('message', (receivedTopic, message) => {
            try {
                const payload = JSON.parse(message.toString());
                handleMqttMessage(receivedTopic, payload);
            } catch (e) {
                debugLog(`메시지 파싱 에러: ${e.message}`);
            }
        });

        state.mqttClient.on('error', (err) => {
            debugLog(`MQTT 에러: ${err.message}`);
            showError('연결 오류', '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
        });

        state.mqttClient.on('close', () => {
            debugLog('MQTT 연결 종료');
            state.connected = false;
        });

        state.mqttClient.on('reconnect', () => {
            debugLog('MQTT 재연결 시도...');
        });
    }

    // ── 기기 연결 메시지 전송 ──
    function sendDeviceConnect() {
        const payload = {
            token: state.token,
            sessionId: state.sessionId,
            deviceName: state.deviceInfo.deviceName,
            modelCode: state.deviceInfo.modelCode,
            os: state.deviceInfo.os,
            browser: state.deviceInfo.browser,
            screenResolution: state.deviceInfo.screenResolution,
            pixelRatio: state.deviceInfo.pixelRatio,
            deviceType: state.deviceInfo.type,
            timestamp: new Date().toISOString(),
        };

        state.mqttClient.publish(topic('device/connect'), JSON.stringify(payload));
        debugLog(`device/connect 전송: ${state.deviceInfo.deviceName} (${state.sessionId})`);
    }

    // ── MQTT 메시지 처리 ──
    function handleMqttMessage(receivedTopic, payload) {
        const path = receivedTopic.replace(`comparekit/${state.boothId}/`, '');
        debugLog(`수신 [${path}]: ${JSON.stringify(payload).substring(0, 100)}`);

        switch (path) {
            case 'session/accepted':
                if (payload.sessionId === state.sessionId) {
                    onSessionAccepted(payload);
                }
                break;

            case 'session/revoke':
                if (payload.sessionId === state.sessionId) {
                    onSessionRevoked(payload);
                }
                break;

            case 'maui/status':
                debugLog(`MAUI 상태: ${payload.state}`);
                break;

            case 'maui/command':
                onMauiCommand(payload);
                break;
        }
    }

    // ── 세션 수락됨 ──
    function onSessionAccepted(payload) {
        debugLog('세션 수락됨!');
        showScreen('screen-connected');

        // heartbeat 및 타임아웃 시작
        startHeartbeat();
        startTimeoutTimer();
        startActivityTracking();
    }

    // ── 세션 강제 종료 (다른 사용자) ──
    function onSessionRevoked(payload) {
        debugLog(`세션 강제 종료: ${payload.reason}`);
        cleanup();
        showScreen('screen-revoked');
    }

    // ── MAUI 명령 처리 ──
    function onMauiCommand(payload) {
        debugLog(`MAUI 명령: ${payload.action}`);
        switch (payload.action) {
            case 'show_ready':
                debugLog('준비 완료');
                break;
            case 'reset':
                cleanup();
                showScreen('screen-timeout');
                break;
        }
    }

    // ── Heartbeat ──
    function startHeartbeat() {
        stopHeartbeat();
        state.heartbeatTimer = setInterval(() => {
            if (state.connected && state.sessionId) {
                state.mqttClient.publish(topic('device/heartbeat'), JSON.stringify({
                    sessionId: state.sessionId,
                    timestamp: new Date().toISOString(),
                }));
                debugLog('heartbeat 전송');
            }
        }, CONFIG.session.heartbeatInterval);
    }

    function stopHeartbeat() {
        if (state.heartbeatTimer) {
            clearInterval(state.heartbeatTimer);
            state.heartbeatTimer = null;
        }
    }

    // ── 타임아웃 관리 (1분 비활동) ──
    function startTimeoutTimer() {
        stopTimeoutTimer();
        state.lastActivity = Date.now();
        state.timeoutRemaining = CONFIG.session.timeoutDuration;

        // 메인 타임아웃 체크
        state.timeoutTimer = setInterval(() => {
            const elapsed = Date.now() - state.lastActivity;
            state.timeoutRemaining = Math.max(0, CONFIG.session.timeoutDuration - elapsed);

            if (state.timeoutRemaining <= 0) {
                onTimeout();
            }
        }, 1000);

        // 타임아웃 바 업데이트
        state.timeoutBarTimer = setInterval(() => {
            const elapsed = Date.now() - state.lastActivity;
            const ratio = Math.max(0, 1 - elapsed / CONFIG.session.timeoutDuration);
            document.getElementById('timeout-bar').style.width = (ratio * 100) + '%';
        }, CONFIG.session.timeoutBarUpdate);
    }

    function stopTimeoutTimer() {
        if (state.timeoutTimer) {
            clearInterval(state.timeoutTimer);
            state.timeoutTimer = null;
        }
        if (state.timeoutBarTimer) {
            clearInterval(state.timeoutBarTimer);
            state.timeoutBarTimer = null;
        }
    }

    function resetActivity() {
        state.lastActivity = Date.now();
        document.getElementById('timeout-bar').style.width = '100%';
    }

    function onTimeout() {
        debugLog('타임아웃! 1분간 비활동');
        if (state.connected && state.sessionId) {
            state.mqttClient.publish(topic('session/timeout'), JSON.stringify({
                sessionId: state.sessionId,
                timestamp: new Date().toISOString(),
            }));
        }
        cleanup();
        showScreen('screen-timeout');
    }

    // ── 사용자 활동 감지 ──
    function startActivityTracking() {
        const events = ['touchstart', 'touchmove', 'click', 'scroll', 'keydown', 'mousemove'];
        events.forEach(evt => {
            document.addEventListener(evt, resetActivity, { passive: true });
        });
    }

    // ── 정리 ──
    function cleanup() {
        stopHeartbeat();
        stopTimeoutTimer();
        document.getElementById('timeout-bar').style.width = '0%';
    }

    // ── 페이지 종료 시 disconnect 전송 ──
    function setupBeforeUnload() {
        window.addEventListener('beforeunload', () => {
            if (state.connected && state.sessionId) {
                const payload = JSON.stringify({
                    sessionId: state.sessionId,
                    timestamp: new Date().toISOString(),
                });
                state.mqttClient.publish(topic('device/disconnect'), payload);
            }
        });

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden' && state.connected && state.sessionId) {
                state.mqttClient.publish(topic('device/disconnect'), JSON.stringify({
                    sessionId: state.sessionId,
                    timestamp: new Date().toISOString(),
                }));
            }
        });
    }

    // ── 초기화 ──
    async function init() {
        debugLog('Compare Kit 초기화...');

        // 1. URL 파라미터 파싱
        parseParams();

        // 2. 필수 파라미터 확인
        if (!state.boothId || !state.token) {
            showError('잘못된 접근', 'QR 코드를 다시 스캔해주세요.');
            return;
        }

        // 3. 기기 감지
        try {
            state.deviceInfo = await getDeviceInfo();
            debugLog(`기기 감지: ${state.deviceInfo.deviceName} (${state.deviceInfo.os})`);
        } catch (e) {
            debugLog(`기기 감지 실패: ${e.message}`);
            state.deviceInfo = {
                deviceName: '알 수 없는 기기',
                modelCode: '',
                os: 'Unknown',
                browser: 'Unknown',
                screenResolution: `${window.screen.width}x${window.screen.height}`,
                pixelRatio: 1,
                icon: '❓',
                type: 'unknown',
            };
        }

        // 4. MQTT 연결
        connectMqtt();

        // 5. beforeunload 설정
        setupBeforeUnload();
    }

    // ── 시작 ──
    document.addEventListener('DOMContentLoaded', init);
})();
