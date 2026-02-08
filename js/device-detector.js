function detectBrowser() {
    const ua = navigator.userAgent;
    if (/Edg\//i.test(ua)) return 'Microsoft Edge';
    if (/OPR\/|Opera/i.test(ua)) return 'Opera';
    if (/Chrome/i.test(ua) && !/Edg\//i.test(ua)) return 'Google Chrome';
    if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'Safari';
    if (/Firefox/i.test(ua)) return 'Firefox';
    if (/MSIE|Trident/i.test(ua)) return 'Internet Explorer';
    return 'Unknown Browser';
}

// OS 감지 함수
function detectOS() {
    const ua = navigator.userAgent;
    if (/iPhone/.test(ua)) {
        const ver = ua.match(/OS (\d+_\d+)/);
        return ver ? `iOS ${ver[1].replace('_', '.')}` : 'iOS';
    }
    if (/iPad/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
        const ver = ua.match(/OS (\d+_\d+)/);
        return ver ? `iPadOS ${ver[1].replace('_', '.')}` : 'iPadOS';
    }
    if (/Android/.test(ua)) {
        const ver = ua.match(/Android (\d+\.?\d*)/);
        return ver ? `Android ${ver[1]}` : 'Android';
    }
    if (/Mac OS X/.test(ua)) {
        const ver = ua.match(/Mac OS X (\d+[._]\d+)/);
        return ver ? `macOS ${ver[1].replace('_', '.')}` : 'macOS';
    }
    if (/Windows NT 10/.test(ua)) return 'Windows 10/11';
    if (/Windows NT 6\.3/.test(ua)) return 'Windows 8.1';
    if (/Windows NT 6\.2/.test(ua)) return 'Windows 8';
    if (/Windows NT 6\.1/.test(ua)) return 'Windows 7';
    if (/Linux/.test(ua)) return 'Linux';
    return 'Unknown OS';
}

function getWebGLRenderer() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                return renderer;
            }
        }
    } catch (e) {
        console.log('WebGL not available');
    }
    return null;
}

// Safe Area Inset 가져오기 (노치/다이나믹 아일랜드 감지)
function getSafeAreaInsets() {
    const div = document.createElement('div');
    div.style.cssText = 'position:fixed;top:env(safe-area-inset-top);left:0;right:0;height:0;';
    document.body.appendChild(div);
    const topInset = parseInt(getComputedStyle(div).top) || 0;
    document.body.removeChild(div);
    return { top: topInset };
}

// GPU 정보로 칩셋 추정
function getChipsetFromGPU(renderer) {
    if (!renderer) return null;
    const r = renderer.toLowerCase();

    // A 시리즈 칩셋 매핑 (긴 문자열 먼저 체크)
    if (r.includes('a19 pro')) return 'A19 Pro';
    if (r.includes('a19')) return 'A19';
    if (r.includes('a18 pro')) return 'A18 Pro';
    if (r.includes('a18')) return 'A18';
    if (r.includes('a17 pro')) return 'A17 Pro';
    if (r.includes('a17')) return 'A17';
    if (r.includes('a16')) return 'A16';
    if (r.includes('a15')) return 'A15';
    if (r.includes('a14')) return 'A14';
    if (r.includes('a13')) return 'A13';
    if (r.includes('a12')) return 'A12';
    if (r.includes('a11')) return 'A11';
    if (r.includes('a10')) return 'A10';
    if (r.includes('a9')) return 'A9';

    // GPU 코어 수로 추정 (Apple GPU 표시인 경우)
    if (r.includes('apple')) {
        // 6-core GPU: A17 Pro, A16
        // 5-core GPU: A15 (Pro models)
        // 4-core GPU: A15 (standard), A14
        return 'Apple GPU';
    }

    return null;
}

// 아이폰 모델 감지 (화면 크기 + GPU 조합)
function detectiPhoneModel() {
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const devicePixelRatio = window.devicePixelRatio || 1;
    const iosVersion = parseIOSVersion();

    // 논리적 해상도
    const width = Math.min(screenWidth, screenHeight);
    const height = Math.max(screenWidth, screenHeight);
    const resolutionKey = `${width}x${height}@${devicePixelRatio}x`;

    // GPU 정보
    const gpuRenderer = getWebGLRenderer();
    const chipset = getChipsetFromGPU(gpuRenderer);

    // Safe Area (노치/다이나믹 아일랜드)
    const safeArea = getSafeAreaInsets();
    const hasDynamicIsland = safeArea.top >= 59; // 다이나믹 아일랜드: 59pt
    const hasNotch = safeArea.top >= 44 && safeArea.top < 59; // 노치: 44-47pt
    const hasHomeButton = safeArea.top < 44; // 홈버튼: 20pt 또는 0

    // 상세 모델 매핑 (해상도 + 칩셋 + 노치 유형)
    const detailedModels = {
        // ===== 다이나믹 아일랜드 모델 (iPhone 14 Pro 이후) =====
        // iPhone 17 / 16 - 6.9인치 (Pro Max)
        '440x956@3x': {
            'A19 Pro': 'iPhone 17',
            'A18 Pro': 'iPhone 16',
            'default': 'iPhone 17 / 16'
        },
        // iPhone Air (2025) - 6.5인치
        '420x912@3x': {
            'A19 Pro': 'iPhone Air',
            'A19': 'iPhone Air',
            'default': 'iPhone Air'
        },
        // iPhone 17 / 16 - 6.3인치 (Pro)
        '402x874@3x': {
            'A19 Pro': 'iPhone 17',
            'A19': 'iPhone 17',
            'A18 Pro': 'iPhone 16',
            'default': 'iPhone 17 / 16'
        },
        // iPhone 16 Plus / 15 / 14 - 6.7인치
        '430x932@3x': {
            'A18': 'iPhone 16 Plus',
            'A17 Pro': 'iPhone 15',
            'A16': 'iPhone 15 Plus / 14',
            'A15': 'iPhone 14 Plus',
            'default': 'iPhone 16 Plus / 15 / 14'
        },
        // iPhone 16 / 15 / 14 - 6.1인치 (다이나믹 아일랜드)
        '393x852@3x': {
            'A18': 'iPhone 16',
            'A17 Pro': 'iPhone 15',
            'A16': 'iPhone 15 / 14',
            'default': 'iPhone 16 / 15 / 14'
        },
        // iPhone 14 / 13 / 12 - 6.1인치 (노치)
        '390x844@3x': {
            'A16': 'iPhone 14',
            'A15': 'iPhone 13',
            'A14': 'iPhone 12',
            'default': 'iPhone 14 / 13 / 12'
        },
        // iPhone 13 / 12 - 6.7인치 (노치, Pro Max)
        '428x926@3x': {
            'A15': 'iPhone 13',
            'A14': 'iPhone 12',
            'default': 'iPhone 13 / 12'
        },
        // iPhone 13 mini / 12 mini / X / XS / 11 - 5.4/5.8인치
        '375x812@3x': {
            'A15': 'iPhone 13 mini',
            'A14': 'iPhone 12 mini',
            'A13': 'iPhone 11',
            'A12': 'iPhone XS',
            'A11': 'iPhone X',
            'default': 'iPhone 13 mini / 12 mini / X / XS / 11'
        },
        // iPhone 11 / XS Max - 6.5인치 (노치)
        '414x896@3x': {
            'A13': 'iPhone 11',
            'A12': 'iPhone XS Max',
            'default': 'iPhone 11 / XS Max'
        },
        // iPhone 11 / XR - 6.1인치 (노치, Liquid Retina)
        '414x896@2x': {
            'A13': 'iPhone 11',
            'A12': 'iPhone XR',
            'default': 'iPhone 11 / XR'
        },
        // ===== 홈버튼 모델 =====
        // iPhone 8 Plus / 7 Plus / 6s Plus - 5.5인치
        '414x736@3x': {
            'A11': 'iPhone 8 Plus',
            'A10': 'iPhone 7 Plus',
            'A9': 'iPhone 6s Plus',
            'default': 'iPhone 8 Plus / 7 Plus / 6s Plus'
        },
        // iPhone SE (2nd/3rd) / 8 / 7 / 6s - 4.7인치
        '375x667@2x': {
            'A15': 'iPhone SE (3rd Gen)',
            'A13': 'iPhone SE (2nd Gen)',
            'A11': 'iPhone 8',
            'A10': 'iPhone 7',
            'A9': 'iPhone 6s',
            'default': 'iPhone SE (3rd) / SE (2nd) / 8 / 7'
        },
        // iPhone SE (1st) / 5s / 5c / 5 - 4인치
        '320x568@2x': {
            'A9': 'iPhone SE (1st Gen)',
            'A7': 'iPhone 5s',
            'default': 'iPhone SE (1st) / 5s'
        },
        // iPhone 4s / 4 - 3.5인치
        '320x480@2x': {
            'default': 'iPhone 4s / 4'
        },
    };

    // 매칭 시도
    if (detailedModels[resolutionKey]) {
        const models = detailedModels[resolutionKey];
        // GPU 칩셋으로 정확히 매칭된 경우 단일 모델 반환
        if (chipset && chipset !== 'Apple GPU' && models[chipset]) {
            return {
                name: models[chipset],
                resolution: resolutionKey
            };
        }
        // 칩셋 정보가 없으면 default 반환 (여러 가능성 표시)
        return {
            name: models['default'] || 'iPhone',
            resolution: resolutionKey
        };
    }

    // 해상도 매칭 실패 시
    return {
        name: `iPhone (iOS ${iosVersion})`,
        resolution: resolutionKey
    };
}

// iOS 버전 파싱
function parseIOSVersion() {
    const match = navigator.userAgent.match(/OS (\d+)_/);
    return match ? parseInt(match[1]) : 0;
}

// 안드로이드 모델 감지 (User Agent 기반) - 객체 반환 { name, code }
function detectAndroidModel(ua) {
    // 일반 모델 코드 추출
    const genericModelMatch = ua.match(/;\s*([^;)]+)\s*Build/i);
    const rawModelCode = genericModelMatch ? genericModelMatch[1].trim() : null;

    // 삼성 갤럭시 - SM-XXXX 패턴 (다양한 형태 지원)
    const samsungMatch = ua.match(/SM-([A-Z]\d{3,4}[A-Z]{0,2})/i);
    if (samsungMatch) {
        const modelCode = samsungMatch[1].toUpperCase();
        const fullCode = `SM-${modelCode}`;
        const productName = getSamsungModelName(modelCode);
        return { name: productName, code: fullCode };
    }

    // 삼성 갤럭시 - Build/ 앞에서 모델 코드 추출 (rawModelCode가 SM-으로 시작하는 경우)
    if (rawModelCode && /^SM-/i.test(rawModelCode)) {
        const smMatch = rawModelCode.match(/SM-([A-Z]\d{3,4}[A-Z]{0,2})/i);
        if (smMatch) {
            const modelCode = smMatch[1].toUpperCase();
            const fullCode = `SM-${modelCode}`;
            const productName = getSamsungModelName(modelCode);
            return { name: productName, code: fullCode };
        }
        // SM- 패턴이지만 정규식에 안 맞는 경우 rawModelCode 그대로 사용
        return { name: `Samsung (${rawModelCode})`, code: rawModelCode };
    }

    // 삼성 갤럭시 (다른 패턴 - Samsung, Galaxy 키워드)
    if (/Samsung|SAMSUNG|Galaxy/i.test(ua)) {
        const galaxyMatch = ua.match(/Galaxy\s*([^\s;)]+)/i);
        if (galaxyMatch) {
            return { name: `Samsung Galaxy ${galaxyMatch[1]}`, code: rawModelCode };
        }
        return { name: 'Samsung Galaxy', code: rawModelCode };
    }

    // Google Pixel (모델 코드 기반 감지)
    if (/Pixel/i.test(ua)) {
        if (rawModelCode) {
            const pixelModel = getGooglePixelModelName(rawModelCode);
            if (pixelModel) {
                return { name: pixelModel, code: rawModelCode };
            }
        }
        const pixelMatch = ua.match(/Pixel\s*(\d+[a-z]?\s*(?:Pro|XL)?)/i);
        if (pixelMatch) {
            return { name: `Google Pixel ${pixelMatch[1]}`, code: rawModelCode };
        }
        return { name: 'Google Pixel', code: rawModelCode };
    }

    // LG
    if (/LG-|LG\s/i.test(ua)) {
        const lgMatch = ua.match(/LG[-\s]([^\s;)]+)/i);
        if (lgMatch) {
            return { name: `LG ${lgMatch[1]}`, code: rawModelCode };
        }
        return { name: 'LG', code: rawModelCode };
    }

    // 샤오미 (모델 코드 기반 감지)
    if (/Xiaomi|Redmi|POCO|Mi\s/i.test(ua)) {
        if (rawModelCode) {
            const xiaomiModel = getXiaomiModelName(rawModelCode);
            if (xiaomiModel) {
                return { name: xiaomiModel, code: rawModelCode };
            }
        }
        const xiaomiMatch = ua.match(/(Redmi|POCO|Mi)\s*([^\s;)]+)/i);
        if (xiaomiMatch) {
            return { name: `Xiaomi ${xiaomiMatch[1]} ${xiaomiMatch[2]}`, code: rawModelCode };
        }
        return { name: 'Xiaomi', code: rawModelCode };
    }

    // 화웨이/Honor (모델 코드 기반 감지)
    if (/HUAWEI|Honor/i.test(ua)) {
        if (rawModelCode) {
            const huaweiModel = getHuaweiModelName(rawModelCode);
            if (huaweiModel) {
                return { name: huaweiModel, code: rawModelCode };
            }
        }
        const huaweiMatch = ua.match(/(HUAWEI|Honor)[-\s]([^\s;)]+)/i);
        if (huaweiMatch) {
            return { name: `${huaweiMatch[1]} ${huaweiMatch[2]}`, code: rawModelCode };
        }
        return { name: 'Huawei/Honor', code: rawModelCode };
    }

    // OPPO (모델 코드 기반 감지)
    if (/OPPO/i.test(ua)) {
        if (rawModelCode) {
            const oppoModel = getOppoModelName(rawModelCode);
            if (oppoModel) {
                return { name: oppoModel, code: rawModelCode };
            }
        }
        const oppoMatch = ua.match(/OPPO\s*([^\s;)]+)/i);
        if (oppoMatch) {
            return { name: `OPPO ${oppoMatch[1]}`, code: rawModelCode };
        }
        return { name: 'OPPO', code: rawModelCode };
    }

    // vivo (모델 코드 기반 감지)
    if (/vivo/i.test(ua)) {
        if (rawModelCode) {
            const vivoModel = getVivoModelName(rawModelCode);
            if (vivoModel) {
                return { name: vivoModel, code: rawModelCode };
            }
        }
        const vivoMatch = ua.match(/vivo\s*([^\s;)]+)/i);
        if (vivoMatch) {
            return { name: `vivo ${vivoMatch[1]}`, code: rawModelCode };
        }
        return { name: 'vivo', code: rawModelCode };
    }

    // OnePlus (모델 코드 기반 감지)
    if (/OnePlus/i.test(ua)) {
        if (rawModelCode) {
            const oneplusModel = getOnePlusModelName(rawModelCode);
            if (oneplusModel) {
                return { name: oneplusModel, code: rawModelCode };
            }
        }
        const oneplusMatch = ua.match(/OnePlus\s*([^\s;)]+)/i);
        if (oneplusMatch) {
            return { name: `OnePlus ${oneplusMatch[1]}`, code: rawModelCode };
        }
        return { name: 'OnePlus', code: rawModelCode };
    }

    // Sony Xperia (모델 코드 기반 감지)
    if (/Sony|Xperia/i.test(ua)) {
        if (rawModelCode) {
            const sonyModel = getSonyXperiaModelName(rawModelCode);
            if (sonyModel) {
                return { name: sonyModel, code: rawModelCode };
            }
        }
        const sonyMatch = ua.match(/Xperia\s*([^\s;)]+)/i);
        if (sonyMatch) {
            return { name: `Sony Xperia ${sonyMatch[1]}`, code: rawModelCode };
        }
        return { name: 'Sony Xperia', code: rawModelCode };
    }

    // HTC
    if (/HTC/i.test(ua)) {
        const htcMatch = ua.match(/HTC[_\s]([^\s;)]+)/i);
        if (htcMatch) {
            return { name: `HTC ${htcMatch[1]}`, code: rawModelCode };
        }
        return { name: 'HTC', code: rawModelCode };
    }

    // ASUS (모델 코드 기반 감지)
    if (/ASUS|ROG|Zenfone/i.test(ua)) {
        if (rawModelCode) {
            const asusModel = getAsusModelName(rawModelCode);
            if (asusModel) {
                return { name: asusModel, code: rawModelCode };
            }
        }
        const asusMatch = ua.match(/(ROG Phone|Zenfone)\s*([^\s;)]+)/i);
        if (asusMatch) {
            return { name: `ASUS ${asusMatch[1]} ${asusMatch[2]}`, code: rawModelCode };
        }
        return { name: 'ASUS', code: rawModelCode };
    }

    // Motorola (모델 코드 기반 감지)
    if (/Motorola|moto\s/i.test(ua)) {
        if (rawModelCode) {
            const motoModel = getMotorolaModelName(rawModelCode);
            if (motoModel) {
                return { name: motoModel, code: rawModelCode };
            }
        }
        const motoMatch = ua.match(/moto\s*([^\s;)]+)/i);
        if (motoMatch) {
            return { name: `Motorola Moto ${motoMatch[1]}`, code: rawModelCode };
        }
        return { name: 'Motorola', code: rawModelCode };
    }

    // Nothing (모델 코드 기반 감지)
    if (/Nothing/i.test(ua)) {
        if (rawModelCode) {
            const nothingModel = getNothingModelName(rawModelCode);
            if (nothingModel) {
                return { name: nothingModel, code: rawModelCode };
            }
        }
        const nothingMatch = ua.match(/Nothing\s*Phone\s*\((\d+[a-z]?)\)/i);
        if (nothingMatch) {
            return { name: `Nothing Phone (${nothingMatch[1]})`, code: rawModelCode };
        }
        return { name: 'Nothing', code: rawModelCode };
    }

    // ZTE (모델 코드 기반 감지)
    if (/ZTE/i.test(ua)) {
        if (rawModelCode) {
            const zteModel = getZTEModelName(rawModelCode);
            if (zteModel) {
                return { name: zteModel, code: rawModelCode };
            }
        }
        const zteMatch = ua.match(/ZTE\s*([^\s;)]+)/i);
        if (zteMatch) {
            return { name: `ZTE ${zteMatch[1]}`, code: rawModelCode };
        }
        return { name: 'ZTE', code: rawModelCode };
    }

    // Nubia / Red Magic (모델 코드 기반 감지)
    if (/Nubia|Red\s*Magic|NX\d{3}/i.test(ua)) {
        if (rawModelCode) {
            const nubiaModel = getNubiaModelName(rawModelCode);
            if (nubiaModel) {
                return { name: nubiaModel, code: rawModelCode };
            }
        }
        const nubiaMatch = ua.match(/(Red\s*Magic|Nubia)\s*([^\s;)]+)/i);
        if (nubiaMatch) {
            return { name: `Nubia ${nubiaMatch[1]} ${nubiaMatch[2]}`, code: rawModelCode };
        }
        return { name: 'Nubia', code: rawModelCode };
    }

    // Lenovo / Legion (모델 코드 기반 감지)
    if (/Lenovo|Legion/i.test(ua)) {
        if (rawModelCode) {
            const lenovoModel = getLenovoModelName(rawModelCode);
            if (lenovoModel) {
                return { name: lenovoModel, code: rawModelCode };
            }
        }
        const lenovoMatch = ua.match(/(Legion|Lenovo)\s*([^\s;)]+)/i);
        if (lenovoMatch) {
            return { name: `Lenovo ${lenovoMatch[1]} ${lenovoMatch[2]}`, code: rawModelCode };
        }
        return { name: 'Lenovo', code: rawModelCode };
    }

    // Nokia (모델 코드 기반 감지)
    if (/Nokia/i.test(ua)) {
        if (rawModelCode) {
            const nokiaModel = getNokiaModelName(rawModelCode);
            if (nokiaModel) {
                return { name: nokiaModel, code: rawModelCode };
            }
        }
        const nokiaMatch = ua.match(/Nokia\s*([^\s;)]+)/i);
        if (nokiaMatch) {
            return { name: `Nokia ${nokiaMatch[1]}`, code: rawModelCode };
        }
        return { name: 'Nokia', code: rawModelCode };
    }

    // Meizu (모델 코드 기반 감지)
    if (/Meizu|M\d{3}[A-Z]|meizu/i.test(ua)) {
        if (rawModelCode) {
            const meizuModel = getMeizuModelName(rawModelCode);
            if (meizuModel) {
                return { name: meizuModel, code: rawModelCode };
            }
        }
        const meizuMatch = ua.match(/Meizu\s*([^\s;)]+)/i);
        if (meizuMatch) {
            return { name: `Meizu ${meizuMatch[1]}`, code: rawModelCode };
        }
        return { name: 'Meizu', code: rawModelCode };
    }

    // Tecno (모델 코드 기반 감지)
    if (/Tecno|TECNO/i.test(ua)) {
        if (rawModelCode) {
            const tecnoModel = getTecnoModelName(rawModelCode);
            if (tecnoModel) {
                return { name: tecnoModel, code: rawModelCode };
            }
        }
        const tecnoMatch = ua.match(/TECNO\s*([^\s;)]+)/i);
        if (tecnoMatch) {
            return { name: `Tecno ${tecnoMatch[1]}`, code: rawModelCode };
        }
        return { name: 'Tecno', code: rawModelCode };
    }

    // Infinix (모델 코드 기반 감지)
    if (/Infinix|INFINIX/i.test(ua)) {
        if (rawModelCode) {
            const infinixModel = getInfinixModelName(rawModelCode);
            if (infinixModel) {
                return { name: infinixModel, code: rawModelCode };
            }
        }
        const infinixMatch = ua.match(/Infinix\s*([^\s;)]+)/i);
        if (infinixMatch) {
            return { name: `Infinix ${infinixMatch[1]}`, code: rawModelCode };
        }
        return { name: 'Infinix', code: rawModelCode };
    }

    // 일반 Android 모델명 추출 시도
    if (rawModelCode) {
        return { name: rawModelCode, code: rawModelCode };
    }

    return { name: 'Android', code: null };
}

// 삼성 모델 코드를 이름으로 변환
function getSamsungModelName(code) {
    const samsungModels = {
        // ===== Galaxy S 시리즈 =====
        // Galaxy S25 시리즈 (2025)
        'S938': 'Samsung Galaxy S25 Ultra',
        'S936': 'Samsung Galaxy S25+',
        'S931': 'Samsung Galaxy S25',

        // Galaxy S24 시리즈 (2024)
        'S928': 'Samsung Galaxy S24 Ultra',
        'S926': 'Samsung Galaxy S24+',
        'S921': 'Samsung Galaxy S24',
        'S721': 'Samsung Galaxy S24 FE',

        // Galaxy S23 시리즈 (2023)
        'S918': 'Samsung Galaxy S23 Ultra',
        'S916': 'Samsung Galaxy S23+',
        'S911': 'Samsung Galaxy S23',
        'S711': 'Samsung Galaxy S23 FE',

        // Galaxy S22 시리즈 (2022)
        'S908': 'Samsung Galaxy S22 Ultra',
        'S906': 'Samsung Galaxy S22+',
        'S901': 'Samsung Galaxy S22',

        // Galaxy S21 시리즈 (2021)
        'G998': 'Samsung Galaxy S21 Ultra 5G',
        'G996': 'Samsung Galaxy S21+ 5G',
        'G991': 'Samsung Galaxy S21 5G',
        'G990': 'Samsung Galaxy S21 FE 5G',

        // Galaxy S20 시리즈 (2020)
        'G988': 'Samsung Galaxy S20 Ultra 5G',
        'G986': 'Samsung Galaxy S20+ 5G',
        'G985': 'Samsung Galaxy S20+',
        'G981': 'Samsung Galaxy S20 5G',
        'G980': 'Samsung Galaxy S20',
        'G781': 'Samsung Galaxy S20 FE 5G',
        'G780': 'Samsung Galaxy S20 FE',

        // Galaxy S10 시리즈 (2019)
        'G977': 'Samsung Galaxy S10 5G',
        'G975': 'Samsung Galaxy S10+',
        'G973': 'Samsung Galaxy S10',
        'G970': 'Samsung Galaxy S10e',
        'G770': 'Samsung Galaxy S10 Lite',

        // Galaxy S9 시리즈 (2018)
        'G965': 'Samsung Galaxy S9+',
        'G960': 'Samsung Galaxy S9',

        // Galaxy S8 시리즈 (2017)
        'G955': 'Samsung Galaxy S8+',
        'G950': 'Samsung Galaxy S8',
        'G892': 'Samsung Galaxy S8 Active',

        // Galaxy S7 시리즈 (2016)
        'G935': 'Samsung Galaxy S7 edge',
        'G930': 'Samsung Galaxy S7',
        'G891': 'Samsung Galaxy S7 Active',

        // Galaxy S6 시리즈 (2015)
        'G928': 'Samsung Galaxy S6 edge+',
        'G925': 'Samsung Galaxy S6 edge',
        'G920': 'Samsung Galaxy S6',
        'G890': 'Samsung Galaxy S6 Active',

        // ===== Galaxy Z Fold 시리즈 =====
        'F968': 'Samsung Galaxy Z Fold6 Special Edition',
        'F956': 'Samsung Galaxy Z Fold6',
        'F946': 'Samsung Galaxy Z Fold5',
        'F936': 'Samsung Galaxy Z Fold4',
        'F926': 'Samsung Galaxy Z Fold3 5G',
        'F916': 'Samsung Galaxy Z Fold2 5G',
        'F907': 'Samsung Galaxy Fold 5G',
        'F900': 'Samsung Galaxy Fold',

        // ===== Galaxy Z Flip 시리즈 =====
        'F741': 'Samsung Galaxy Z Flip FE',
        'F731': 'Samsung Galaxy Z Flip6',
        'F721': 'Samsung Galaxy Z Flip5',
        'F711': 'Samsung Galaxy Z Flip4',
        'F707': 'Samsung Galaxy Z Flip 5G',
        'F700': 'Samsung Galaxy Z Flip',

        // ===== Galaxy A 시리즈 =====
        // Galaxy A 시리즈 (2025)
        'A566': 'Samsung Galaxy A56 5G',
        'A366': 'Samsung Galaxy A36 5G',
        'A266': 'Samsung Galaxy A26 5G',
        'A166': 'Samsung Galaxy A16 5G',
        'A165': 'Samsung Galaxy A16',

        // Galaxy A 시리즈 (2024)
        'A556': 'Samsung Galaxy A55 5G',
        'A356': 'Samsung Galaxy A35 5G',
        'A256': 'Samsung Galaxy A25 5G',
        'A156': 'Samsung Galaxy A15 5G',
        'A155': 'Samsung Galaxy A15',
        'A057': 'Samsung Galaxy A05s',
        'A055': 'Samsung Galaxy A05',

        // Galaxy A 시리즈 (2023)
        'A546': 'Samsung Galaxy A54 5G',
        'A346': 'Samsung Galaxy A34 5G',
        'A246': 'Samsung Galaxy A24',
        'A245': 'Samsung Galaxy A24 4G',
        'A146': 'Samsung Galaxy A14 5G',
        'A145': 'Samsung Galaxy A14',
        'A047': 'Samsung Galaxy A04s',
        'A045': 'Samsung Galaxy A04',
        'A042': 'Samsung Galaxy A04 Core',

        // Galaxy A 시리즈 (2022)
        'A536': 'Samsung Galaxy A53 5G',
        'A336': 'Samsung Galaxy A33 5G',
        'A236': 'Samsung Galaxy A23 5G',
        'A235': 'Samsung Galaxy A23',
        'A137': 'Samsung Galaxy A13 5G',
        'A136': 'Samsung Galaxy A13 5G',
        'A135': 'Samsung Galaxy A13',
        'A037': 'Samsung Galaxy A03s',
        'A035': 'Samsung Galaxy A03',
        'A032': 'Samsung Galaxy A03 Core',

        // Galaxy A 시리즈 (2021)
        'A528': 'Samsung Galaxy A52s 5G',
        'A526': 'Samsung Galaxy A52 5G',
        'A525': 'Samsung Galaxy A52',
        'A725': 'Samsung Galaxy A72',
        'A326': 'Samsung Galaxy A32 5G',
        'A325': 'Samsung Galaxy A32',
        'A226': 'Samsung Galaxy A22 5G',
        'A225': 'Samsung Galaxy A22',
        'A127': 'Samsung Galaxy A12',
        'A125': 'Samsung Galaxy A12',
        'A022': 'Samsung Galaxy A02s',
        'A025': 'Samsung Galaxy A02s',
        'A026': 'Samsung Galaxy A02s',

        // Galaxy A 시리즈 (2020)
        'A516': 'Samsung Galaxy A51 5G',
        'A515': 'Samsung Galaxy A51',
        'A716': 'Samsung Galaxy A71 5G',
        'A715': 'Samsung Galaxy A71',
        'A217': 'Samsung Galaxy A21s',
        'A215': 'Samsung Galaxy A21',
        'A315': 'Samsung Galaxy A31',
        'A415': 'Samsung Galaxy A41',
        'A115': 'Samsung Galaxy A11',
        'A015': 'Samsung Galaxy A01',
        'A013': 'Samsung Galaxy A01 Core',

        // Galaxy A 시리즈 (2019)
        'A908': 'Samsung Galaxy A90 5G',
        'A907': 'Samsung Galaxy A90',
        'A805': 'Samsung Galaxy A80',
        'A705': 'Samsung Galaxy A70',
        'A606': 'Samsung Galaxy A60',
        'A605': 'Samsung Galaxy A6+',
        'A505': 'Samsung Galaxy A50',
        'A507': 'Samsung Galaxy A50s',
        'A405': 'Samsung Galaxy A40',
        'A307': 'Samsung Galaxy A30s',
        'A305': 'Samsung Galaxy A30',
        'A207': 'Samsung Galaxy A20s',
        'A205': 'Samsung Galaxy A20',
        'A202': 'Samsung Galaxy A20e',
        'A107': 'Samsung Galaxy A10s',
        'A105': 'Samsung Galaxy A10',
        'A102': 'Samsung Galaxy A10e',

        // Galaxy A 시리즈 (2018)
        'A920': 'Samsung Galaxy A9 (2018)',
        'A750': 'Samsung Galaxy A7 (2018)',
        'A600': 'Samsung Galaxy A6 (2018)',
        'A605': 'Samsung Galaxy A6+ (2018)',

        // Galaxy A 시리즈 (2017)
        'A720': 'Samsung Galaxy A7 (2017)',
        'A520': 'Samsung Galaxy A5 (2017)',
        'A320': 'Samsung Galaxy A3 (2017)',

        // ===== Galaxy M 시리즈 =====
        // Galaxy M 시리즈 (2024-2025)
        'M556': 'Samsung Galaxy M55 5G',
        'M356': 'Samsung Galaxy M35 5G',
        'M156': 'Samsung Galaxy M15 5G',
        'M155': 'Samsung Galaxy M15',

        // Galaxy M 시리즈 (2023)
        'M546': 'Samsung Galaxy M54 5G',
        'M346': 'Samsung Galaxy M34 5G',
        'M146': 'Samsung Galaxy M14 5G',
        'M145': 'Samsung Galaxy M14',
        'M046': 'Samsung Galaxy M04',

        // Galaxy M 시리즈 (2022)
        'M536': 'Samsung Galaxy M53 5G',
        'M336': 'Samsung Galaxy M33 5G',
        'M236': 'Samsung Galaxy M23 5G',
        'M135': 'Samsung Galaxy M13 5G',
        'M136': 'Samsung Galaxy M13',

        // Galaxy M 시리즈 (2021)
        'M526': 'Samsung Galaxy M52 5G',
        'M325': 'Samsung Galaxy M32',
        'M326': 'Samsung Galaxy M32 5G',
        'M225': 'Samsung Galaxy M22',
        'M127': 'Samsung Galaxy M12',
        'M025': 'Samsung Galaxy M02s',
        'M022': 'Samsung Galaxy M02',

        // Galaxy M 시리즈 (2020)
        'M515': 'Samsung Galaxy M51',
        'M315': 'Samsung Galaxy M31',
        'M317': 'Samsung Galaxy M31s',
        'M215': 'Samsung Galaxy M21',
        'M115': 'Samsung Galaxy M11',
        'M015': 'Samsung Galaxy M01',
        'M013': 'Samsung Galaxy M01 Core',

        // Galaxy M 시리즈 (2019)
        'M307': 'Samsung Galaxy M30s',
        'M305': 'Samsung Galaxy M30',
        'M205': 'Samsung Galaxy M20',
        'M107': 'Samsung Galaxy M10s',
        'M105': 'Samsung Galaxy M10',

        // ===== Galaxy F 시리즈 (인도 전용) =====
        'E556': 'Samsung Galaxy F55 5G',
        'E546': 'Samsung Galaxy F54 5G',
        'E346': 'Samsung Galaxy F34 5G',
        'E236': 'Samsung Galaxy F23 5G',
        'E146': 'Samsung Galaxy F14 5G',
        'E135': 'Samsung Galaxy F13',
        'E426': 'Samsung Galaxy F42 5G',
        'E625': 'Samsung Galaxy F62',
        'E525': 'Samsung Galaxy F52 5G',
        'E415': 'Samsung Galaxy F41',
        'E225': 'Samsung Galaxy F22',
        'E127': 'Samsung Galaxy F12',
        'E025': 'Samsung Galaxy F02s',

        // ===== Galaxy Note 시리즈 =====
        'N986': 'Samsung Galaxy Note 20 Ultra 5G',
        'N985': 'Samsung Galaxy Note 20 Ultra',
        'N981': 'Samsung Galaxy Note 20 5G',
        'N980': 'Samsung Galaxy Note 20',
        'N976': 'Samsung Galaxy Note 10+ 5G',
        'N975': 'Samsung Galaxy Note 10+',
        'N971': 'Samsung Galaxy Note 10 5G',
        'N970': 'Samsung Galaxy Note 10',
        'N960': 'Samsung Galaxy Note 9',
        'N950': 'Samsung Galaxy Note 8',
        'N935': 'Samsung Galaxy Note FE',
        'N930': 'Samsung Galaxy Note 7',
        'N920': 'Samsung Galaxy Note 5',
        'N916': 'Samsung Galaxy Note 4 Duos',
        'N915': 'Samsung Galaxy Note Edge',
        'N910': 'Samsung Galaxy Note 4',
        'N900': 'Samsung Galaxy Note 3',
        'N7505': 'Samsung Galaxy Note 3 Neo',

        // ===== Galaxy Tab S 시리즈 =====
        // Galaxy Tab S10 시리즈 (2024)
        'X926': 'Samsung Galaxy Tab S10 Ultra 5G',
        'X920': 'Samsung Galaxy Tab S10 Ultra WiFi',
        'X826': 'Samsung Galaxy Tab S10+ 5G',
        'X820': 'Samsung Galaxy Tab S10+ WiFi',

        // Galaxy Tab S9 시리즈 (2023)
        'X916': 'Samsung Galaxy Tab S9 Ultra 5G',
        'X910': 'Samsung Galaxy Tab S9 Ultra WiFi',
        'X816': 'Samsung Galaxy Tab S9+ 5G',
        'X810': 'Samsung Galaxy Tab S9+ WiFi',
        'X716': 'Samsung Galaxy Tab S9 5G',
        'X710': 'Samsung Galaxy Tab S9 WiFi',
        'X516': 'Samsung Galaxy Tab S9 FE+ 5G',
        'X510': 'Samsung Galaxy Tab S9 FE+ WiFi',
        'X416': 'Samsung Galaxy Tab S9 FE 5G',
        'X410': 'Samsung Galaxy Tab S9 FE WiFi',

        // Galaxy Tab S8 시리즈 (2022)
        'X906': 'Samsung Galaxy Tab S8 Ultra 5G',
        'X900': 'Samsung Galaxy Tab S8 Ultra WiFi',
        'X806': 'Samsung Galaxy Tab S8+ 5G',
        'X800': 'Samsung Galaxy Tab S8+ WiFi',
        'X706': 'Samsung Galaxy Tab S8 5G',
        'X700': 'Samsung Galaxy Tab S8 WiFi',

        // Galaxy Tab S7 시리즈 (2020)
        'T976': 'Samsung Galaxy Tab S7+ 5G',
        'T970': 'Samsung Galaxy Tab S7+ WiFi',
        'T876': 'Samsung Galaxy Tab S7 5G',
        'T870': 'Samsung Galaxy Tab S7 WiFi',
        'T736': 'Samsung Galaxy Tab S7 FE 5G',
        'T730': 'Samsung Galaxy Tab S7 FE WiFi',

        // Galaxy Tab S6 시리즈 (2019)
        'T866': 'Samsung Galaxy Tab S6 5G',
        'T865': 'Samsung Galaxy Tab S6 LTE',
        'T860': 'Samsung Galaxy Tab S6 WiFi',
        'P619': 'Samsung Galaxy Tab S6 Lite LTE (2024)',
        'P613': 'Samsung Galaxy Tab S6 Lite WiFi (2024)',
        'P615': 'Samsung Galaxy Tab S6 Lite LTE',
        'P610': 'Samsung Galaxy Tab S6 Lite WiFi',

        // ===== Galaxy Tab A 시리즈 =====
        'X115': 'Samsung Galaxy Tab A9+ LTE',
        'X110': 'Samsung Galaxy Tab A9+ WiFi',
        'X215': 'Samsung Galaxy Tab A9 LTE',
        'X210': 'Samsung Galaxy Tab A9 WiFi',
        'P559': 'Samsung Galaxy Tab A7 Lite LTE',
        'P553': 'Samsung Galaxy Tab A7 Lite WiFi',
        'T509': 'Samsung Galaxy Tab A7 LTE',
        'T500': 'Samsung Galaxy Tab A7 WiFi',
        'T515': 'Samsung Galaxy Tab A 10.1 LTE',
        'T510': 'Samsung Galaxy Tab A 10.1 WiFi',
        'T295': 'Samsung Galaxy Tab A 8.0 LTE',
        'T290': 'Samsung Galaxy Tab A 8.0 WiFi',

        // ===== Galaxy XCover 시리즈 =====
        'G556': 'Samsung Galaxy XCover7',
        'G736': 'Samsung Galaxy XCover6 Pro',
        'G525': 'Samsung Galaxy XCover5',
        'G398': 'Samsung Galaxy XCover4s',
        'G390': 'Samsung Galaxy XCover4',

        // ===== Galaxy J 시리즈 (레거시) =====
        'J810': 'Samsung Galaxy J8',
        'J720': 'Samsung Galaxy J7 Duo',
        'J737': 'Samsung Galaxy J7 (2018)',
        'J730': 'Samsung Galaxy J7 (2017)',
        'J710': 'Samsung Galaxy J7 (2016)',
        'J700': 'Samsung Galaxy J7',
        'J610': 'Samsung Galaxy J6+',
        'J600': 'Samsung Galaxy J6',
        'J530': 'Samsung Galaxy J5 (2017)',
        'J510': 'Samsung Galaxy J5 (2016)',
        'J500': 'Samsung Galaxy J5',
        'J415': 'Samsung Galaxy J4+',
        'J410': 'Samsung Galaxy J4 Core',
        'J400': 'Samsung Galaxy J4',
        'J337': 'Samsung Galaxy J3 (2018)',
        'J330': 'Samsung Galaxy J3 (2017)',
        'J320': 'Samsung Galaxy J3 (2016)',
        'J260': 'Samsung Galaxy J2 Core',
        'J250': 'Samsung Galaxy J2 Pro',
    };

    // 정확한 매칭
    for (const [key, name] of Object.entries(samsungModels)) {
        if (code.startsWith(key)) {
            return name;
        }
    }

    // 시리즈 추론 (매칭되지 않은 경우)
    if (code.startsWith('S93')) return `Samsung Galaxy S25 시리즈 (SM-${code})`;
    if (code.startsWith('S92')) return `Samsung Galaxy S24 시리즈 (SM-${code})`;
    if (code.startsWith('S91')) return `Samsung Galaxy S23 시리즈 (SM-${code})`;
    if (code.startsWith('S90')) return `Samsung Galaxy S22 시리즈 (SM-${code})`;
    if (code.startsWith('S7')) return `Samsung Galaxy S FE 시리즈 (SM-${code})`;
    if (code.startsWith('G99')) return `Samsung Galaxy S21 시리즈 (SM-${code})`;
    if (code.startsWith('G98')) return `Samsung Galaxy S20 시리즈 (SM-${code})`;
    if (code.startsWith('G97')) return `Samsung Galaxy S10 시리즈 (SM-${code})`;
    if (code.startsWith('G96')) return `Samsung Galaxy S9 시리즈 (SM-${code})`;
    if (code.startsWith('G95')) return `Samsung Galaxy S8 시리즈 (SM-${code})`;
    if (code.startsWith('G93')) return `Samsung Galaxy S7 시리즈 (SM-${code})`;
    if (code.startsWith('G92')) return `Samsung Galaxy S6 시리즈 (SM-${code})`;
    if (code.startsWith('F9')) return `Samsung Galaxy Z Fold (SM-${code})`;
    if (code.startsWith('F7')) return `Samsung Galaxy Z Flip (SM-${code})`;
    if (code.startsWith('A5')) return `Samsung Galaxy A5x (SM-${code})`;
    if (code.startsWith('A3')) return `Samsung Galaxy A3x (SM-${code})`;
    if (code.startsWith('A2')) return `Samsung Galaxy A2x (SM-${code})`;
    if (code.startsWith('A1')) return `Samsung Galaxy A1x (SM-${code})`;
    if (code.startsWith('A0')) return `Samsung Galaxy A0x (SM-${code})`;
    if (code.startsWith('A7')) return `Samsung Galaxy A7x (SM-${code})`;
    if (code.startsWith('A')) return `Samsung Galaxy A 시리즈 (SM-${code})`;
    if (code.startsWith('M5')) return `Samsung Galaxy M5x (SM-${code})`;
    if (code.startsWith('M3')) return `Samsung Galaxy M3x (SM-${code})`;
    if (code.startsWith('M2')) return `Samsung Galaxy M2x (SM-${code})`;
    if (code.startsWith('M1')) return `Samsung Galaxy M1x (SM-${code})`;
    if (code.startsWith('M0')) return `Samsung Galaxy M0x (SM-${code})`;
    if (code.startsWith('M')) return `Samsung Galaxy M 시리즈 (SM-${code})`;
    if (code.startsWith('E')) return `Samsung Galaxy F 시리즈 (SM-${code})`;
    if (code.startsWith('N9')) return `Samsung Galaxy Note (SM-${code})`;
    if (code.startsWith('N')) return `Samsung Galaxy Note (SM-${code})`;
    if (code.startsWith('X9')) return `Samsung Galaxy Tab S Ultra (SM-${code})`;
    if (code.startsWith('X8')) return `Samsung Galaxy Tab S+ (SM-${code})`;
    if (code.startsWith('X7')) return `Samsung Galaxy Tab S (SM-${code})`;
    if (code.startsWith('X')) return `Samsung Galaxy Tab (SM-${code})`;
    if (code.startsWith('T')) return `Samsung Galaxy Tab (SM-${code})`;
    if (code.startsWith('P')) return `Samsung Galaxy Tab (SM-${code})`;
    if (code.startsWith('J')) return `Samsung Galaxy J 시리즈 (SM-${code})`;
    if (code.startsWith('G')) return `Samsung Galaxy (SM-${code})`;

    return `Samsung (SM-${code})`;
}

// 샤오미 모델 코드를 이름으로 변환
function getXiaomiModelName(modelCode) {
    const xiaomiModels = {
        // Xiaomi 14 시리즈 (2024)
        '2401CPX50C': 'Xiaomi 14 Ultra',
        '23127PN0CC': 'Xiaomi 14 Pro',
        '23127PN0CD': 'Xiaomi 14',
        '2311BPN98C': 'Xiaomi 14 Civi',
        // Xiaomi 13 시리즈 (2023)
        '2304FPN6DC': 'Xiaomi 13 Ultra',
        '2210132C': 'Xiaomi 13 Pro',
        '2211133C': 'Xiaomi 13',
        '2304FPN6DD': 'Xiaomi 13 Lite',
        // Xiaomi 12 시리즈 (2022)
        '2203121C': 'Xiaomi 12S Ultra',
        '2206123SC': 'Xiaomi 12S Pro',
        '2206122SC': 'Xiaomi 12S',
        '2201123C': 'Xiaomi 12 Pro',
        '2201123G': 'Xiaomi 12',
        '2112123AG': 'Xiaomi 12X',
        '2203129G': 'Xiaomi 12 Lite',

        // Xiaomi MIX 시리즈
        '2308CPXD0C': 'Xiaomi MIX Fold 4',
        '2308CPXD0D': 'Xiaomi MIX Flip',
        '2304FPNXC0': 'Xiaomi MIX Fold 3',
        '2211133G': 'Xiaomi MIX Fold 2',

        // Redmi K 시리즈 (2024-2025)
        '24117RK6CC': 'Redmi K80 Pro',
        '24117RK6BC': 'Redmi K80',
        '23113RKC6C': 'Redmi K70 Ultra',
        '23113RKC6G': 'Redmi K70 Pro',
        '23113RKC6B': 'Redmi K70',
        '23078RKD5C': 'Redmi K70E',
        '22127RK46C': 'Redmi K60 Ultra',
        '23013RK75C': 'Redmi K60 Pro',
        '23013RK75G': 'Redmi K60',
        '22121211RG': 'Redmi K60E',
        // Redmi K 시리즈 (이전)
        '22041211AC': 'Redmi K50 Ultra',
        '22021211RC': 'Redmi K50 Pro',
        '22021211RG': 'Redmi K50',
        '22021211RE': 'Redmi K50 Gaming',

        // Redmi Note 시리즈 (2024-2025)
        '24108RAC6C': 'Redmi Note 14 Pro+',
        '24116RACBC': 'Redmi Note 14 Pro',
        '24108RAC6G': 'Redmi Note 14',
        '23090RA98C': 'Redmi Note 13 Pro+',
        '2312CRAC4C': 'Redmi Note 13 Pro',
        '23090RA98G': 'Redmi Note 13',
        '23090RA98R': 'Redmi Note 13R Pro',
        // Redmi Note 시리즈 (이전)
        '22101316C': 'Redmi Note 12 Pro+',
        '22101316G': 'Redmi Note 12 Pro',
        '22111317G': 'Redmi Note 12',
        '21091116AG': 'Redmi Note 11 Pro+',
        '21091116AC': 'Redmi Note 11 Pro',
        '2201117TG': 'Redmi Note 11',

        // Redmi 시리즈
        '24053PY09C': 'Redmi Turbo 4',
        '24069PC21C': 'Redmi Turbo 3',
        '2311ARNC8C': 'Redmi 14C',
        '23108RN84G': 'Redmi 13C',
        '23076RN8DG': 'Redmi 13',
        '22120RN86C': 'Redmi 12',

        // POCO 시리즈 (2024-2025)
        '24082PC8DG': 'POCO X7 Pro',
        '24082PC8DC': 'POCO X7',
        '2311DRK48G': 'POCO X6 Pro',
        '2311DRK48C': 'POCO X6',
        '23049PCD8G': 'POCO F6 Pro',
        '24053PY09G': 'POCO F6',
        '23013PC75G': 'POCO F5 Pro',
        '23049PCD8I': 'POCO F5',
        // POCO 시리즈 (이전)
        '22041216G': 'POCO F4 GT',
        '22021211RG': 'POCO F4',
        '21121210G': 'POCO M5',
        '22071219CG': 'POCO M5s',
        '23076PC4BI': 'POCO M6 Pro',
        '2312DRA50G': 'POCO M6',
        '22071212AG': 'POCO C55',
        '23106RN4BI': 'POCO C65',
        '24030PN60G': 'POCO C75',
    };

    for (const [key, name] of Object.entries(xiaomiModels)) {
        if (modelCode.includes(key)) {
            return name;
        }
    }

    return null;
}

// 화웨이 모델 코드를 이름으로 변환
function getHuaweiModelName(modelCode) {
    const huaweiModels = {
        // Huawei Mate 시리즈 (2024-2025)
        'ALT-AL00': 'Huawei Mate 70 Pro+',
        'ALT-AL10': 'Huawei Mate 70 Pro',
        'ALP-AL00': 'Huawei Mate 70',
        'BRA-AL00': 'Huawei Mate 70 RS',
        'ALN-AL00': 'Huawei Mate 60 Pro+',
        'ALN-AL10': 'Huawei Mate 60 Pro',
        'BRA-AL10': 'Huawei Mate 60 RS',
        'MGA-AL00': 'Huawei Mate 60',
        'DCO-AL00': 'Huawei Mate 50 Pro',
        'CET-AL00': 'Huawei Mate 50',
        'CET-AL60': 'Huawei Mate 50 RS',

        // Huawei Mate X 시리즈 (폴더블)
        'BRT-AL00': 'Huawei Mate X6',
        'ALT-AL80': 'Huawei Mate X5',
        'PAL-AL00': 'Huawei Mate X3',
        'PAL-AL10': 'Huawei Mate X3 Collector',
        'TET-AN00': 'Huawei Mate Xs 2',
        'TAH-AN00': 'Huawei Mate X2',

        // Huawei Pura 시리즈 (구 P 시리즈)
        'HBN-AL00': 'Huawei Pura 70 Ultra',
        'HBN-AL10': 'Huawei Pura 70 Pro+',
        'HBN-AL20': 'Huawei Pura 70 Pro',
        'HBN-AL30': 'Huawei Pura 70',
        'LNA-AL00': 'Huawei P60 Pro',
        'LNA-AL10': 'Huawei P60 Art',
        'MNA-AL00': 'Huawei P60',
        'ABR-AL00': 'Huawei P50 Pro',
        'ABR-AL80': 'Huawei P50 Pocket',
        'JAD-AL00': 'Huawei P50',

        // Huawei Nova 시리즈
        'FMG-AN00': 'Huawei Nova 13 Pro',
        'FMG-AN10': 'Huawei Nova 13',
        'FOA-AL00': 'Huawei Nova 12 Ultra',
        'FOA-AL10': 'Huawei Nova 12 Pro',
        'FOA-AL20': 'Huawei Nova 12',
        'CTR-AL00': 'Huawei Nova 11 Ultra',
        'FOA-LX9': 'Huawei Nova 11 Pro',
        'FOA-LX3': 'Huawei Nova 11',

        // Huawei Pocket 시리즈 (폴더블)
        'WED-AL00': 'Huawei Pocket 2',
        'BAL-AL80': 'Huawei Pocket S',

        // Honor 시리즈 (독립 후)
        'PGT-AN10': 'Honor Magic7 Pro',
        'PGT-AN00': 'Honor Magic7',
        'PGT-AN20': 'Honor Magic7 RSR',
        'MGA-AN00': 'Honor Magic6 Pro',
        'BVL-AN00': 'Honor Magic6',
        'BVL-AN10': 'Honor Magic6 RSR',
        'FRI-AN00': 'Honor Magic V3',
        'VER-AN10': 'Honor Magic V2',
        'VER-AN00': 'Honor Magic V2 RSR',
        'MGI-AN00': 'Honor Magic Vs',
        'PGT-N19': 'Honor Magic V Flip',

        // Honor 숫자 시리즈
        'WDY-AN00': 'Honor 300 Pro',
        'WDY-AN10': 'Honor 300',
        'ALI-AN00': 'Honor 200 Pro',
        'ALI-AN10': 'Honor 200',
        'REA-AN00': 'Honor 100 Pro',
        'REA-AN10': 'Honor 100',
        'ANY-AN00': 'Honor 90 Pro',
        'ANY-AN10': 'Honor 90',
        'CMA-AN00': 'Honor 90 GT',

        // Honor X 시리즈
        'ALI-NX9': 'Honor X9c',
        'ANY-NX1': 'Honor X9b',
        'ANY-LX1': 'Honor X9a',
        'RMO-NX1': 'Honor X8b',
        'VNE-NX1': 'Honor X8a',
    };

    for (const [key, name] of Object.entries(huaweiModels)) {
        if (modelCode.includes(key)) {
            return name;
        }
    }

    return null;
}

// OPPO 모델 코드를 이름으로 변환
function getOppoModelName(modelCode) {
    const oppoModels = {
        // OPPO Find X 시리즈 (2024-2025)
        'PHZ110': 'OPPO Find X8 Ultra',
        'PKL110': 'OPPO Find X8 Pro',
        'PKL010': 'OPPO Find X8',
        'PHU110': 'OPPO Find X7 Ultra',
        'PHK110': 'OPPO Find X7',
        'PHV110': 'OPPO Find X6 Pro',
        'PGP110': 'OPPO Find X6',
        'PGEM10': 'OPPO Find X5 Pro',
        'PFFM10': 'OPPO Find X5',
        'PEEM00': 'OPPO Find X3 Pro',
        'PEDM00': 'OPPO Find X3',

        // OPPO Find N 시리즈 (폴더블)
        'PHT110': 'OPPO Find N5',
        'PHN110': 'OPPO Find N3',
        'PHB110': 'OPPO Find N3 Flip',
        'PGU110': 'OPPO Find N2',
        'PGT110': 'OPPO Find N2 Flip',
        'PEUM00': 'OPPO Find N',

        // OPPO Reno 시리즈 (2024-2025)
        'PLT110': 'OPPO Reno13 Pro+',
        'PLR110': 'OPPO Reno13 Pro',
        'PLQ110': 'OPPO Reno13',
        'PJZ110': 'OPPO Reno12 Pro+',
        'PJY110': 'OPPO Reno12 Pro',
        'PJX110': 'OPPO Reno12',
        'PJV110': 'OPPO Reno12 F',
        'PHM110': 'OPPO Reno11 Pro',
        'PHJ110': 'OPPO Reno11',
        'PHG110': 'OPPO Reno11 F',
        'PGX110': 'OPPO Reno10 Pro+',
        'PGW110': 'OPPO Reno10 Pro',
        'PGV110': 'OPPO Reno10',
        'PGT210': 'OPPO Reno10 5G',
        'PHE110': 'OPPO Reno9 Pro+',
        'PHD110': 'OPPO Reno9 Pro',
        'PHC110': 'OPPO Reno9',
        'PGAM10': 'OPPO Reno8 Pro+',
        'PGZ110': 'OPPO Reno8 Pro',
        'PGY110': 'OPPO Reno8',
        'PFVM10': 'OPPO Reno7 Pro',
        'PFUM10': 'OPPO Reno7',

        // OPPO A 시리즈 (2024-2025)
        'PKB110': 'OPPO A5 Pro',
        'PKA110': 'OPPO A3 Pro',
        'PK3110': 'OPPO A3',
        'PK2110': 'OPPO A2 Pro',
        'PK1110': 'OPPO A2',
        'PHQ110': 'OPPO A1 Pro',
        'PHP110': 'OPPO A1',
        'CPH2625': 'OPPO A98',
        'CPH2609': 'OPPO A97',
        'CPH2603': 'OPPO A96',
        'CPH2557': 'OPPO A95',
        'CPH2569': 'OPPO A79',
        'CPH2577': 'OPPO A78',
        'CPH2565': 'OPPO A77',
        'CPH2549': 'OPPO A76',
        'CPH2387': 'OPPO A74',
        'CPH2581': 'OPPO A60',
        'CPH2579': 'OPPO A59',
        'CPH2581': 'OPPO A58',
        'CPH2385': 'OPPO A57',
        'CPH2317': 'OPPO A55',
        'CPH2533': 'OPPO A38',
        'CPH2535': 'OPPO A18',
        'CPH2543': 'OPPO A17',

        // OPPO K/F 시리즈
        'PHF110': 'OPPO K12',
        'PJC110': 'OPPO K11x',
        'PGR110': 'OPPO K11',
        'PGF110': 'OPPO K10 Pro',
        'PGCM10': 'OPPO K10',
        'PJD110': 'OPPO F27 Pro+',
        'PJF110': 'OPPO F25 Pro',
        'CPH2573': 'OPPO F23',
        'CPH2507': 'OPPO F21 Pro',

        // realme (OPPO 서브브랜드)
        'RMX5010': 'realme GT 7 Pro',
        'RMX3999': 'realme GT 6',
        'RMX3851': 'realme GT 5 Pro',
        'RMX3820': 'realme GT 5',
        'RMX3708': 'realme GT Neo 6 SE',
        'RMX3706': 'realme GT Neo 6',
        'RMX3588': 'realme GT Neo 5',
        'RMX3797': 'realme GT Neo 5 SE',
        'RMX5011': 'realme 14 Pro+',
        'RMX5012': 'realme 14 Pro',
        'RMX5050': 'realme 14',
        'RMX3992': 'realme 13 Pro+',
        'RMX3990': 'realme 13 Pro',
        'RMX3993': 'realme 13',
        'RMX3781': 'realme 12 Pro+',
        'RMX3785': 'realme 12 Pro',
        'RMX3999': 'realme 12',
        'RMX3771': 'realme 12x',
        'RMX3663': 'realme 11 Pro+',
        'RMX3661': 'realme 11 Pro',
        'RMX3636': 'realme 11',
        'RMX3780': 'realme C67',
        'RMX3762': 'realme C65',
        'RMX3760': 'realme C63',
        'RMX3710': 'realme C61',
        'RMX3939': 'realme C55',
        'RMX3909': 'realme C53',
        'RMX3890': 'realme C51',
        'RMX3830': 'realme Narzo 70 Pro',
        'RMX3840': 'realme Narzo 70',
    };

    for (const [key, name] of Object.entries(oppoModels)) {
        if (modelCode.includes(key)) {
            return name;
        }
    }

    return null;
}

// vivo 모델 코드를 이름으로 변환
function getVivoModelName(modelCode) {
    const vivoModels = {
        // vivo X 시리즈 (2024-2025)
        'V2426': 'vivo X200 Ultra',
        'V2425': 'vivo X200 Pro mini',
        'V2423': 'vivo X200 Pro',
        'V2422': 'vivo X200',
        'V2329': 'vivo X100 Ultra',
        'V2324': 'vivo X100 Pro',
        'V2314': 'vivo X100',
        'V2309': 'vivo X100s Pro',
        'V2307': 'vivo X100s',
        'V2227': 'vivo X90 Pro+',
        'V2219': 'vivo X90 Pro',
        'V2217': 'vivo X90',
        'V2218': 'vivo X90s',
        'V2145': 'vivo X80 Pro',
        'V2183': 'vivo X80',
        'V2111': 'vivo X70 Pro+',
        'V2105': 'vivo X70 Pro',
        'V2104': 'vivo X70',

        // vivo X Fold 시리즈 (폴더블)
        'V2430': 'vivo X Fold4 Pro',
        'V2429': 'vivo X Fold4',
        'V2330': 'vivo X Fold3 Pro',
        'V2319': 'vivo X Fold3',
        'V2229': 'vivo X Fold2',
        'V2178': 'vivo X Fold+',
        'V2160': 'vivo X Fold',
        // vivo X Flip
        'V2320': 'vivo X Flip2',
        'V2256': 'vivo X Flip',

        // vivo S 시리즈 (2024-2025)
        'V2427': 'vivo S20 Pro',
        'V2428': 'vivo S20',
        'V2318': 'vivo S19 Pro',
        'V2317': 'vivo S19',
        'V2316': 'vivo S18 Pro',
        'V2315': 'vivo S18',
        'V2313': 'vivo S18e',
        'V2243': 'vivo S17 Pro',
        'V2242': 'vivo S17',
        'V2241': 'vivo S17t',
        'V2240': 'vivo S17e',
        'V2203': 'vivo S16 Pro',
        'V2246': 'vivo S16',
        'V2244': 'vivo S16e',
        'V2188': 'vivo S15 Pro',
        'V2190': 'vivo S15',
        'V2189': 'vivo S15e',

        // vivo Y 시리즈 (2024-2025)
        'V2437': 'vivo Y300 Pro',
        'V2436': 'vivo Y300',
        'V2420': 'vivo Y200i',
        'V2415': 'vivo Y200 Pro',
        'V2414': 'vivo Y200',
        'V2402': 'vivo Y200t',
        'V2404': 'vivo Y200e',
        'V2302': 'vivo Y100i',
        'V2301': 'vivo Y100',
        'V2303': 'vivo Y100t',
        'V2238': 'vivo Y78+',
        'V2237': 'vivo Y78',
        'V2234': 'vivo Y77e',
        'V2204': 'vivo Y77',
        'V2166': 'vivo Y76',
        'V2164': 'vivo Y76s',
        'V2158': 'vivo Y75',
        'V2247': 'vivo Y36',
        'V2248': 'vivo Y35',
        'V2230': 'vivo Y27',
        'V2310': 'vivo Y28',
        'V2311': 'vivo Y18',
        'V2249': 'vivo Y17s',

        // vivo T 시리즈
        'V2341': 'vivo T3 Ultra',
        'V2340': 'vivo T3 Pro',
        'V2346': 'vivo T3x',
        'V2331': 'vivo T3',
        'V2303': 'vivo T2 Pro',
        'V2252': 'vivo T2x',
        'V2240': 'vivo T2',
        'V2223': 'vivo T1 Pro',
        'V2154': 'vivo T1',

        // vivo V 시리즈 (글로벌)
        'V2316A': 'vivo V30 Pro',
        'V2315A': 'vivo V30',
        'V2317A': 'vivo V30 Lite',
        'V2250': 'vivo V29 Pro',
        'V2251': 'vivo V29',
        'V2252': 'vivo V29 Lite',
        'V2217A': 'vivo V27 Pro',
        'V2218A': 'vivo V27',
        'V2230A': 'vivo V27e',

        // iQOO (vivo 서브브랜드)
        'V2432': 'iQOO 13',
        'V2326': 'iQOO 12 Pro',
        'V2325': 'iQOO 12',
        'V2254': 'iQOO 11 Pro',
        'V2253': 'iQOO 11',
        'V2201': 'iQOO 10 Pro',
        'V2171': 'iQOO 10',
        'V2231': 'iQOO Neo 9S Pro+',
        'V2328': 'iQOO Neo 9S Pro',
        'V2327': 'iQOO Neo 9 Pro',
        'V2259': 'iQOO Neo 9',
        'V2258': 'iQOO Neo 8 Pro',
        'V2255': 'iQOO Neo 8',
        'V2348': 'iQOO Z9 Turbo+',
        'V2344': 'iQOO Z9 Turbo',
        'V2343': 'iQOO Z9x',
        'V2342': 'iQOO Z9',
        'V2304': 'iQOO Z8x',
        'V2305': 'iQOO Z8',
        'V2245': 'iQOO Z7x',
        'V2232': 'iQOO Z7',
    };

    for (const [key, name] of Object.entries(vivoModels)) {
        if (modelCode.includes(key)) {
            return name;
        }
    }

    return null;
}

// OnePlus 모델 코드를 이름으로 변환
function getOnePlusModelName(modelCode) {
    const oneplusModels = {
        // OnePlus 13 시리즈 (2025)
        'PJZ110': 'OnePlus 13',
        'CPH2653': 'OnePlus 13',
        'PJD110': 'OnePlus 13R',
        'CPH2667': 'OnePlus 13R',

        // OnePlus 12 시리즈 (2024)
        'CPH2573': 'OnePlus 12',
        'PJA110': 'OnePlus 12',
        'CPH2583': 'OnePlus 12R',
        'PJB110': 'OnePlus 12R',

        // OnePlus 11 시리즈 (2023)
        'CPH2449': 'OnePlus 11',
        'PHB110': 'OnePlus 11',
        'CPH2491': 'OnePlus 11R',
        'PHC110': 'OnePlus 11R',

        // OnePlus 10 시리즈 (2022)
        'NE2210': 'OnePlus 10 Pro',
        'NE2215': 'OnePlus 10 Pro',
        'CPH2413': 'OnePlus 10 Pro',
        'NE2211': 'OnePlus 10T',
        'CPH2415': 'OnePlus 10T',
        'CPH2417': 'OnePlus 10R',
        'NE2213': 'OnePlus 10R',

        // OnePlus 9 시리즈 (2021)
        'LE2120': 'OnePlus 9 Pro',
        'LE2125': 'OnePlus 9 Pro',
        'LE2110': 'OnePlus 9',
        'LE2115': 'OnePlus 9',
        'LE2100': 'OnePlus 9R',
        'LE2101': 'OnePlus 9R',
        'LE2117': 'OnePlus 9RT',

        // OnePlus 8 시리즈 (2020)
        'IN2020': 'OnePlus 8 Pro',
        'IN2025': 'OnePlus 8 Pro',
        'IN2010': 'OnePlus 8',
        'IN2015': 'OnePlus 8',
        'IN2011': 'OnePlus 8T',
        'KB2001': 'OnePlus 8T',
        'KB2003': 'OnePlus 8T',

        // OnePlus Nord 시리즈 (2024-2025)
        'CPH2639': 'OnePlus Nord 4',
        'IV2201': 'OnePlus Nord 4',
        'CPH2625': 'OnePlus Nord CE 4',
        'CPH2631': 'OnePlus Nord CE 4 Lite',

        // OnePlus Nord 시리즈 (2023)
        'CPH2493': 'OnePlus Nord 3',
        'IV2201': 'OnePlus Nord 3',
        'CPH2467': 'OnePlus Nord CE 3',
        'IV2203': 'OnePlus Nord CE 3',
        'CPH2469': 'OnePlus Nord CE 3 Lite',
        'CPH2471': 'OnePlus Nord N30',

        // OnePlus Nord 시리즈 (2022)
        'CPH2409': 'OnePlus Nord 2T',
        'IV2201': 'OnePlus Nord 2T',
        'CPH2381': 'OnePlus Nord CE 2',
        'IV2201': 'OnePlus Nord CE 2',
        'CPH2399': 'OnePlus Nord CE 2 Lite',
        'CPH2437': 'OnePlus Nord N20',

        // OnePlus Nord 시리즈 (2021)
        'DN2101': 'OnePlus Nord 2',
        'DN2103': 'OnePlus Nord 2',
        'EB2101': 'OnePlus Nord CE',
        'EB2103': 'OnePlus Nord CE',
        'BE2025': 'OnePlus Nord N10',
        'BE2029': 'OnePlus Nord N100',

        // OnePlus Nord 시리즈 (2020)
        'AC2001': 'OnePlus Nord',
        'AC2003': 'OnePlus Nord',

        // OnePlus Open (폴더블)
        'CPH2551': 'OnePlus Open',
        'PHW110': 'OnePlus Open',
        'CPH2661': 'OnePlus Open 2',

        // OnePlus Ace 시리즈 (중국)
        'PJE110': 'OnePlus Ace 5',
        'PJF110': 'OnePlus Ace 5 Pro',
        'PJC110': 'OnePlus Ace 3V',
        'PHM110': 'OnePlus Ace 3',
        'PHL110': 'OnePlus Ace 3 Pro',
        'PGP110': 'OnePlus Ace 2',
        'PHK110': 'OnePlus Ace 2V',
        'PGN110': 'OnePlus Ace 2 Pro',
        'PGKM10': 'OnePlus Ace Pro',
        'PGH110': 'OnePlus Ace',
        'PHN110': 'OnePlus Ace Racing',

        // OnePlus Pad
        'OPD2401': 'OnePlus Pad 2',
        'OPD2302': 'OnePlus Pad Go',
        'OPD2101': 'OnePlus Pad',
    };

    for (const [key, name] of Object.entries(oneplusModels)) {
        if (modelCode.includes(key)) {
            return name;
        }
    }

    return null;
}

// Google Pixel 모델 코드를 이름으로 변환
function getGooglePixelModelName(modelCode) {
    const pixelModels = {
        // Pixel 9 시리즈 (2024)
        'Pixel 9 Pro XL': 'Google Pixel 9 Pro XL',
        'Pixel 9 Pro Fold': 'Google Pixel 9 Pro Fold',
        'Pixel 9 Pro': 'Google Pixel 9 Pro',
        'Pixel 9': 'Google Pixel 9',

        // Pixel 8 시리즈 (2023)
        'Pixel 8 Pro': 'Google Pixel 8 Pro',
        'Pixel 8a': 'Google Pixel 8a',
        'Pixel 8': 'Google Pixel 8',

        // Pixel 7 시리즈 (2022)
        'Pixel 7 Pro': 'Google Pixel 7 Pro',
        'Pixel 7a': 'Google Pixel 7a',
        'Pixel 7': 'Google Pixel 7',

        // Pixel Fold (2023)
        'Pixel Fold': 'Google Pixel Fold',

        // Pixel 6 시리즈 (2021)
        'Pixel 6 Pro': 'Google Pixel 6 Pro',
        'Pixel 6a': 'Google Pixel 6a',
        'Pixel 6': 'Google Pixel 6',

        // Pixel 5 시리즈 (2020)
        'Pixel 5a': 'Google Pixel 5a',
        'Pixel 5': 'Google Pixel 5',

        // Pixel 4 시리즈 (2019)
        'Pixel 4 XL': 'Google Pixel 4 XL',
        'Pixel 4a 5G': 'Google Pixel 4a 5G',
        'Pixel 4a': 'Google Pixel 4a',
        'Pixel 4': 'Google Pixel 4',

        // Pixel 3 시리즈 (2018)
        'Pixel 3 XL': 'Google Pixel 3 XL',
        'Pixel 3a XL': 'Google Pixel 3a XL',
        'Pixel 3a': 'Google Pixel 3a',
        'Pixel 3': 'Google Pixel 3',

        // Pixel 2 시리즈 (2017)
        'Pixel 2 XL': 'Google Pixel 2 XL',
        'Pixel 2': 'Google Pixel 2',

        // Pixel 1 시리즈 (2016)
        'Pixel XL': 'Google Pixel XL',
        'Pixel': 'Google Pixel',

        // Pixel Tablet (2023)
        'Pixel Tablet': 'Google Pixel Tablet',

        // 모델 코드 기반
        'GFE4J': 'Google Pixel 9 Pro XL',
        'GWKK3': 'Google Pixel 9 Pro Fold',
        'G1MNW': 'Google Pixel 9 Pro',
        'G4HCZ': 'Google Pixel 9',
        'GP4BC': 'Google Pixel 8 Pro',
        'G6GPR': 'Google Pixel 8a',
        'GKWS6': 'Google Pixel 8',
        'GVU6C': 'Google Pixel 7 Pro',
        'GWKK3': 'Google Pixel 7a',
        'GQML3': 'Google Pixel 7',
        'G9FPL': 'Google Pixel Fold',
        'GX7AS': 'Google Pixel 6 Pro',
        'GX7AS': 'Google Pixel 6a',
        'GB62Z': 'Google Pixel 6',
        'G1F8F': 'Google Pixel 5a',
        'GD1YQ': 'Google Pixel 5',
        'G020J': 'Google Pixel 4 XL',
        'G025E': 'Google Pixel 4a 5G',
        'G025J': 'Google Pixel 4a',
        'G020I': 'Google Pixel 4',
        'G013C': 'Google Pixel 3 XL',
        'G020C': 'Google Pixel 3a XL',
        'G020F': 'Google Pixel 3a',
        'G013A': 'Google Pixel 3',
        'G011C': 'Google Pixel 2 XL',
        'G011A': 'Google Pixel 2',
        'G-2PW4100': 'Google Pixel XL',
        'G-2PW2100': 'Google Pixel',
        'GGLGG': 'Google Pixel Tablet',

        // 코드명 기반
        'husky': 'Google Pixel 8 Pro',
        'shiba': 'Google Pixel 8',
        'akita': 'Google Pixel 8a',
        'cheetah': 'Google Pixel 7 Pro',
        'panther': 'Google Pixel 7',
        'lynx': 'Google Pixel 7a',
        'felix': 'Google Pixel Fold',
        'raven': 'Google Pixel 6 Pro',
        'oriole': 'Google Pixel 6',
        'bluejay': 'Google Pixel 6a',
        'barbet': 'Google Pixel 5a',
        'redfin': 'Google Pixel 5',
        'bramble': 'Google Pixel 4a 5G',
        'sunfish': 'Google Pixel 4a',
        'coral': 'Google Pixel 4 XL',
        'flame': 'Google Pixel 4',
        'bonito': 'Google Pixel 3a XL',
        'sargo': 'Google Pixel 3a',
        'crosshatch': 'Google Pixel 3 XL',
        'blueline': 'Google Pixel 3',
        'taimen': 'Google Pixel 2 XL',
        'walleye': 'Google Pixel 2',
        'marlin': 'Google Pixel XL',
        'sailfish': 'Google Pixel',
        'tangorpro': 'Google Pixel Tablet',
        'comet': 'Google Pixel 9 Pro XL',
        'caiman': 'Google Pixel 9 Pro',
        'tokay': 'Google Pixel 9',
        'komodo': 'Google Pixel 9 Pro Fold',
    };

    for (const [key, name] of Object.entries(pixelModels)) {
        if (modelCode.includes(key)) {
            return name;
        }
    }

    return null;
}

// Sony Xperia 모델 코드를 이름으로 변환
function getSonyXperiaModelName(modelCode) {
    const sonyModels = {
        // Xperia 1 시리즈 (플래그십)
        'XQ-DQ72': 'Sony Xperia 1 VI',
        'XQ-DQ54': 'Sony Xperia 1 VI',
        'XQ-DQ62': 'Sony Xperia 1 VI',
        'XQ-DQ44': 'Sony Xperia 1 V',
        'XQ-DQ52': 'Sony Xperia 1 V',
        'XQ-DQ62': 'Sony Xperia 1 V',
        'XQ-CT72': 'Sony Xperia 1 IV',
        'XQ-CT54': 'Sony Xperia 1 IV',
        'XQ-CT62': 'Sony Xperia 1 IV',
        'XQ-AT72': 'Sony Xperia 1 III',
        'XQ-AT52': 'Sony Xperia 1 III',
        'XQ-AT42': 'Sony Xperia 1 III',
        'SO-51B': 'Sony Xperia 1 III',
        'XQ-AT51': 'Sony Xperia 1 II',
        'XQ-AT42': 'Sony Xperia 1 II',
        'SO-51A': 'Sony Xperia 1 II',
        'J9110': 'Sony Xperia 1',
        'J8110': 'Sony Xperia 1',
        'J8170': 'Sony Xperia 1',
        'SO-03L': 'Sony Xperia 1',
        'SOV40': 'Sony Xperia 1',

        // Xperia 5 시리즈 (컴팩트 플래그십)
        'XQ-DE72': 'Sony Xperia 5 VI',
        'XQ-DE54': 'Sony Xperia 5 VI',
        'XQ-DE44': 'Sony Xperia 5 V',
        'XQ-DE52': 'Sony Xperia 5 V',
        'XQ-DE62': 'Sony Xperia 5 V',
        'XQ-CQ72': 'Sony Xperia 5 IV',
        'XQ-CQ54': 'Sony Xperia 5 IV',
        'XQ-CQ62': 'Sony Xperia 5 IV',
        'SO-54C': 'Sony Xperia 5 IV',
        'XQ-AS72': 'Sony Xperia 5 III',
        'XQ-AS52': 'Sony Xperia 5 III',
        'XQ-AS42': 'Sony Xperia 5 III',
        'SO-53B': 'Sony Xperia 5 III',
        'XQ-AS72': 'Sony Xperia 5 II',
        'XQ-AS52': 'Sony Xperia 5 II',
        'XQ-AS42': 'Sony Xperia 5 II',
        'SO-52A': 'Sony Xperia 5 II',
        'J9210': 'Sony Xperia 5',
        'J8210': 'Sony Xperia 5',
        'SO-01M': 'Sony Xperia 5',
        'SOV41': 'Sony Xperia 5',

        // Xperia 10 시리즈 (미드레인지)
        'XQ-EC72': 'Sony Xperia 10 VI',
        'XQ-EC54': 'Sony Xperia 10 VI',
        'XQ-DC72': 'Sony Xperia 10 V',
        'XQ-DC54': 'Sony Xperia 10 V',
        'XQ-DC44': 'Sony Xperia 10 V',
        'SO-52D': 'Sony Xperia 10 V',
        'XQ-CC72': 'Sony Xperia 10 IV',
        'XQ-CC54': 'Sony Xperia 10 IV',
        'XQ-CC44': 'Sony Xperia 10 IV',
        'SO-52C': 'Sony Xperia 10 IV',
        'XQ-BT52': 'Sony Xperia 10 III',
        'XQ-BT44': 'Sony Xperia 10 III',
        'SO-52B': 'Sony Xperia 10 III',
        'SOG04': 'Sony Xperia 10 III',
        'XQ-AU52': 'Sony Xperia 10 II',
        'XQ-AU42': 'Sony Xperia 10 II',
        'SO-41A': 'Sony Xperia 10 II',
        'SOV43': 'Sony Xperia 10 II',
        'I4193': 'Sony Xperia 10',
        'I3113': 'Sony Xperia 10',
        'I4113': 'Sony Xperia 10',
        'I3123': 'Sony Xperia 10 Plus',
        'I4213': 'Sony Xperia 10 Plus',

        // Xperia PRO 시리즈 (프로페셔널)
        'XQ-BE62': 'Sony Xperia PRO-I',
        'XQ-BE42': 'Sony Xperia PRO-I',
        'XQ-AQ52': 'Sony Xperia PRO',

        // Xperia Ace 시리즈 (일본 전용 컴팩트)
        'XQ-CG42': 'Sony Xperia Ace IV',
        'SO-41C': 'Sony Xperia Ace IV',
        'XQ-BQ42': 'Sony Xperia Ace III',
        'SO-53C': 'Sony Xperia Ace III',
        'SOG08': 'Sony Xperia Ace III',
        'XQ-AQ42': 'Sony Xperia Ace II',
        'SO-41B': 'Sony Xperia Ace II',
        'J3173': 'Sony Xperia Ace',
        'SO-02L': 'Sony Xperia Ace',

        // Xperia XZ 시리즈 (구형 플래그십)
        'G8341': 'Sony Xperia XZ1',
        'G8342': 'Sony Xperia XZ1',
        'G8441': 'Sony Xperia XZ1 Compact',
        'G8231': 'Sony Xperia XZs',
        'G8232': 'Sony Xperia XZs',
        'F8331': 'Sony Xperia XZ',
        'F8332': 'Sony Xperia XZ',
        'G8141': 'Sony Xperia XZ Premium',
        'G8142': 'Sony Xperia XZ Premium',
        'H8216': 'Sony Xperia XZ2',
        'H8266': 'Sony Xperia XZ2',
        'H8314': 'Sony Xperia XZ2 Compact',
        'H8324': 'Sony Xperia XZ2 Compact',
        'H8416': 'Sony Xperia XZ2 Premium',
        'H8166': 'Sony Xperia XZ2 Premium',
        'H8116': 'Sony Xperia XZ3',
        'H9436': 'Sony Xperia XZ3',
        'H9493': 'Sony Xperia XZ3',

        // Xperia XA 시리즈 (구형 미드레인지)
        'G3121': 'Sony Xperia XA1',
        'G3112': 'Sony Xperia XA1',
        'G3416': 'Sony Xperia XA1 Plus',
        'G3423': 'Sony Xperia XA1 Plus',
        'G3421': 'Sony Xperia XA1 Plus',
        'G3412': 'Sony Xperia XA1 Ultra',
        'G3221': 'Sony Xperia XA1 Ultra',
        'H3113': 'Sony Xperia XA2',
        'H4113': 'Sony Xperia XA2',
        'H4133': 'Sony Xperia XA2',
        'H3213': 'Sony Xperia XA2 Ultra',
        'H4213': 'Sony Xperia XA2 Ultra',
        'H4233': 'Sony Xperia XA2 Ultra',
        'H3413': 'Sony Xperia XA2 Plus',
        'H4413': 'Sony Xperia XA2 Plus',
        'H4493': 'Sony Xperia XA2 Plus',

        // Xperia L 시리즈 (엔트리)
        'XQ-AD52': 'Sony Xperia L4',
        'XQ-AD51': 'Sony Xperia L4',
        'I4312': 'Sony Xperia L3',
        'I3312': 'Sony Xperia L3',
        'H3311': 'Sony Xperia L2',
        'H4311': 'Sony Xperia L2',

        // 모델명 직접 매칭
        'Xperia 1 VI': 'Sony Xperia 1 VI',
        'Xperia 1 V': 'Sony Xperia 1 V',
        'Xperia 1 IV': 'Sony Xperia 1 IV',
        'Xperia 1 III': 'Sony Xperia 1 III',
        'Xperia 1 II': 'Sony Xperia 1 II',
        'Xperia 5 VI': 'Sony Xperia 5 VI',
        'Xperia 5 V': 'Sony Xperia 5 V',
        'Xperia 5 IV': 'Sony Xperia 5 IV',
        'Xperia 5 III': 'Sony Xperia 5 III',
        'Xperia 5 II': 'Sony Xperia 5 II',
        'Xperia 10 VI': 'Sony Xperia 10 VI',
        'Xperia 10 V': 'Sony Xperia 10 V',
        'Xperia 10 IV': 'Sony Xperia 10 IV',
        'Xperia 10 III': 'Sony Xperia 10 III',
        'Xperia 10 II': 'Sony Xperia 10 II',
        'Xperia PRO-I': 'Sony Xperia PRO-I',
        'Xperia PRO': 'Sony Xperia PRO',
        'Xperia Ace IV': 'Sony Xperia Ace IV',
        'Xperia Ace III': 'Sony Xperia Ace III',
        'Xperia Ace II': 'Sony Xperia Ace II',
    };

    for (const [key, name] of Object.entries(sonyModels)) {
        if (modelCode.includes(key)) {
            return name;
        }
    }

    return null;
}

// ASUS 모델 코드를 이름으로 변환
function getAsusModelName(modelCode) {
    const asusModels = {
        // ROG Phone 시리즈 (게이밍)
        'AI2501': 'ASUS ROG Phone 9 Pro',
        'AI2501_D': 'ASUS ROG Phone 9 Pro Edition',
        'AI2401': 'ASUS ROG Phone 8 Pro',
        'AI2401_D': 'ASUS ROG Phone 8 Pro Edition',
        'AI2401_C': 'ASUS ROG Phone 8',
        'AI2301': 'ASUS ROG Phone 7 Ultimate',
        'AI2301_C': 'ASUS ROG Phone 7',
        'AI2201': 'ASUS ROG Phone 6 Pro',
        'AI2201_D': 'ASUS ROG Phone 6D Ultimate',
        'AI2201_C': 'ASUS ROG Phone 6D',
        'AI2201_B': 'ASUS ROG Phone 6',
        'ASUS_I005': 'ASUS ROG Phone 5s Pro',
        'ASUS_I005_1': 'ASUS ROG Phone 5s',
        'ASUS_I005DA': 'ASUS ROG Phone 5 Ultimate',
        'ASUS_I005D': 'ASUS ROG Phone 5 Pro',
        'ASUS_I005_2': 'ASUS ROG Phone 5',
        'ASUS_I003': 'ASUS ROG Phone 3 Strix',
        'ASUS_I003D': 'ASUS ROG Phone 3',
        'ASUS_I001': 'ASUS ROG Phone II',
        'ASUS_I001D': 'ASUS ROG Phone II',
        'ZS600KL': 'ASUS ROG Phone',

        // Zenfone 시리즈
        'AI2302': 'ASUS Zenfone 11 Ultra',
        'AI2202': 'ASUS Zenfone 10',
        'AI2202_B': 'ASUS Zenfone 10',
        'AI2102': 'ASUS Zenfone 9',
        'AI2102_B': 'ASUS Zenfone 9',
        'ZS590KS': 'ASUS Zenfone 8',
        'ZS672KS': 'ASUS Zenfone 8 Flip',
        'ZS671KS': 'ASUS Zenfone 7 Pro',
        'ZS670KS': 'ASUS Zenfone 7',
        'ZS630KL': 'ASUS Zenfone 6',
        'ZS620KL': 'ASUS Zenfone 5Z',
        'ZE620KL': 'ASUS Zenfone 5',
        'ZE554KL': 'ASUS Zenfone 4',
        'ZE552KL': 'ASUS Zenfone 3',
        'ZE520KL': 'ASUS Zenfone 3',

        // Zenfone Max 시리즈
        'ZB634KL': 'ASUS Zenfone Max Pro M2',
        'ZB631KL': 'ASUS Zenfone Max Pro M2',
        'ZB633KL': 'ASUS Zenfone Max M2',
        'ZB602KL': 'ASUS Zenfone Max Pro M1',
        'ZB601KL': 'ASUS Zenfone Max Pro M1',
        'ZB570TL': 'ASUS Zenfone Max Plus M1',
        'ZC520KL': 'ASUS Zenfone 4 Max',
        'ZC554KL': 'ASUS Zenfone 4 Max Pro',
        'ZC550KL': 'ASUS Zenfone Max',
        'ZC520TL': 'ASUS Zenfone 3 Max',
        'ZC553KL': 'ASUS Zenfone 3 Max',

        // 모델명 직접 매칭
        'ROG Phone 9 Pro': 'ASUS ROG Phone 9 Pro',
        'ROG Phone 9': 'ASUS ROG Phone 9',
        'ROG Phone 8 Pro': 'ASUS ROG Phone 8 Pro',
        'ROG Phone 8': 'ASUS ROG Phone 8',
        'ROG Phone 7 Ultimate': 'ASUS ROG Phone 7 Ultimate',
        'ROG Phone 7': 'ASUS ROG Phone 7',
        'ROG Phone 6 Pro': 'ASUS ROG Phone 6 Pro',
        'ROG Phone 6D Ultimate': 'ASUS ROG Phone 6D Ultimate',
        'ROG Phone 6D': 'ASUS ROG Phone 6D',
        'ROG Phone 6': 'ASUS ROG Phone 6',
        'ROG Phone 5 Ultimate': 'ASUS ROG Phone 5 Ultimate',
        'ROG Phone 5 Pro': 'ASUS ROG Phone 5 Pro',
        'ROG Phone 5s Pro': 'ASUS ROG Phone 5s Pro',
        'ROG Phone 5s': 'ASUS ROG Phone 5s',
        'ROG Phone 5': 'ASUS ROG Phone 5',
        'Zenfone 11 Ultra': 'ASUS Zenfone 11 Ultra',
        'Zenfone 10': 'ASUS Zenfone 10',
        'Zenfone 9': 'ASUS Zenfone 9',
        'Zenfone 8 Flip': 'ASUS Zenfone 8 Flip',
        'Zenfone 8': 'ASUS Zenfone 8',
    };

    for (const [key, name] of Object.entries(asusModels)) {
        if (modelCode.includes(key)) {
            return name;
        }
    }

    return null;
}

// Motorola 모델 코드를 이름으로 변환
function getMotorolaModelName(modelCode) {
    const motorolaModels = {
        // Motorola Edge 시리즈 (2024-2025)
        'XT2451': 'Motorola Edge 60 Pro',
        'XT2449': 'Motorola Edge 60 Ultra',
        'XT2435': 'Motorola Edge 50 Ultra',
        'XT2433': 'Motorola Edge 50 Pro',
        'XT2431': 'Motorola Edge 50 Fusion',
        'XT2429': 'Motorola Edge 50 Neo',
        'XT2427': 'Motorola Edge 50',
        // Motorola Edge 시리즈 (2023)
        'XT2321': 'Motorola Edge 40 Pro',
        'XT2319': 'Motorola Edge 40 Neo',
        'XT2317': 'Motorola Edge 40',
        // Motorola Edge 시리즈 (2022)
        'XT2245': 'Motorola Edge 30 Ultra',
        'XT2243': 'Motorola Edge 30 Fusion',
        'XT2241': 'Motorola Edge 30 Neo',
        'XT2239': 'Motorola Edge 30 Pro',
        'XT2237': 'Motorola Edge 30',
        // Motorola Edge 시리즈 (2021)
        'XT2175': 'Motorola Edge 20 Pro',
        'XT2173': 'Motorola Edge 20',
        'XT2171': 'Motorola Edge 20 Lite',
        'XT2153': 'Motorola Edge S Pro',
        'XT2141': 'Motorola Edge S',
        // Motorola Edge 시리즈 (2020)
        'XT2063': 'Motorola Edge+',
        'XT2061': 'Motorola Edge',

        // Motorola Razr 시리즈 (폴더블)
        'XT2451': 'Motorola Razr 50 Ultra',
        'XT2453': 'Motorola Razr 50',
        'XT2323': 'Motorola Razr 40 Ultra',
        'XT2321': 'Motorola Razr 40',
        'XT2251': 'Motorola Razr 2023',
        'XT2201': 'Motorola Razr 2022',
        'XT2071': 'Motorola Razr 5G',
        'XT2000': 'Motorola Razr 2019',

        // Moto G 시리즈 (2024-2025)
        'XT2437': 'Motorola Moto G85',
        'XT2439': 'Motorola Moto G75',
        'XT2441': 'Motorola Moto G55',
        'XT2443': 'Motorola Moto G45',
        'XT2445': 'Motorola Moto G35',
        'XT2447': 'Motorola Moto G25',
        'XT2421': 'Motorola Moto G Stylus 5G (2024)',
        'XT2423': 'Motorola Moto G Power 5G (2024)',
        // Moto G 시리즈 (2023)
        'XT2347': 'Motorola Moto G84',
        'XT2345': 'Motorola Moto G73',
        'XT2343': 'Motorola Moto G53',
        'XT2341': 'Motorola Moto G23',
        'XT2339': 'Motorola Moto G13',
        'XT2333': 'Motorola Moto G Stylus 5G (2023)',
        'XT2335': 'Motorola Moto G Power 5G (2023)',
        // Moto G 시리즈 (2022)
        'XT2265': 'Motorola Moto G82',
        'XT2263': 'Motorola Moto G72',
        'XT2261': 'Motorola Moto G62',
        'XT2259': 'Motorola Moto G52',
        'XT2257': 'Motorola Moto G42',
        'XT2255': 'Motorola Moto G32',
        'XT2253': 'Motorola Moto G22',
        'XT2251': 'Motorola Moto G Stylus 5G (2022)',
        'XT2249': 'Motorola Moto G Power (2022)',
        // Moto G 시리즈 (2021)
        'XT2165': 'Motorola Moto G100',
        'XT2163': 'Motorola Moto G60',
        'XT2161': 'Motorola Moto G50',
        'XT2159': 'Motorola Moto G40 Fusion',
        'XT2157': 'Motorola Moto G30',
        'XT2155': 'Motorola Moto G20',
        'XT2153': 'Motorola Moto G10',
        'XT2137': 'Motorola Moto G Stylus (2021)',
        'XT2135': 'Motorola Moto G Power (2021)',
        'XT2133': 'Motorola Moto G Play (2021)',

        // Moto E 시리즈
        'XT2345': 'Motorola Moto E14',
        'XT2343': 'Motorola Moto E13',
        'XT2233': 'Motorola Moto E32',
        'XT2231': 'Motorola Moto E22',
        'XT2157': 'Motorola Moto E7 Power',
        'XT2155': 'Motorola Moto E7',
        'XT2097': 'Motorola Moto E (2020)',
        'XT2095': 'Motorola Moto E7 Plus',

        // ThinkPhone
        'XT2309': 'Motorola ThinkPhone',
        'XT2311': 'Motorola ThinkPhone 25',

        // 모델명 직접 매칭
        'moto edge 50 ultra': 'Motorola Edge 50 Ultra',
        'moto edge 50 pro': 'Motorola Edge 50 Pro',
        'moto edge 50 fusion': 'Motorola Edge 50 Fusion',
        'moto edge 40 pro': 'Motorola Edge 40 Pro',
        'moto edge 40': 'Motorola Edge 40',
        'moto razr 50 ultra': 'Motorola Razr 50 Ultra',
        'moto razr 50': 'Motorola Razr 50',
        'moto razr 40 ultra': 'Motorola Razr 40 Ultra',
        'moto razr 40': 'Motorola Razr 40',
        'moto g85': 'Motorola Moto G85',
        'moto g84': 'Motorola Moto G84',
        'moto g75': 'Motorola Moto G75',
        'moto g73': 'Motorola Moto G73',
        'moto g stylus': 'Motorola Moto G Stylus',
        'moto g power': 'Motorola Moto G Power',
        'ThinkPhone': 'Motorola ThinkPhone',
    };

    for (const [key, name] of Object.entries(motorolaModels)) {
        if (modelCode.toLowerCase().includes(key.toLowerCase())) {
            return name;
        }
    }

    return null;
}

// Nothing 모델 코드를 이름으로 변환
function getNothingModelName(modelCode) {
    const nothingModels = {
        // Nothing Phone 시리즈
        'A059': 'Nothing Phone (1)',
        'A063': 'Nothing Phone (2)',
        'A142': 'Nothing Phone (2a)',
        'A142P': 'Nothing Phone (2a) Plus',
        'B065': 'Nothing Phone (3)',
        'A065': 'Nothing Phone (2a) Plus Community Edition',

        // CMF by Nothing (서브브랜드)
        'A015': 'CMF Phone 1',
        'B015': 'CMF Phone 2',
        'C015': 'CMF Phone 2 Pro',

        // 모델명 직접 매칭
        'Nothing Phone (1)': 'Nothing Phone (1)',
        'Nothing Phone (2)': 'Nothing Phone (2)',
        'Nothing Phone (2a)': 'Nothing Phone (2a)',
        'Nothing Phone (2a) Plus': 'Nothing Phone (2a) Plus',
        'Nothing Phone (3)': 'Nothing Phone (3)',
        'Phone (1)': 'Nothing Phone (1)',
        'Phone (2)': 'Nothing Phone (2)',
        'Phone (2a)': 'Nothing Phone (2a)',
        'Phone (2a) Plus': 'Nothing Phone (2a) Plus',
        'Phone (3)': 'Nothing Phone (3)',
        'CMF Phone 1': 'CMF Phone 1',
        'CMF Phone 2': 'CMF Phone 2',
        'CMF Phone 2 Pro': 'CMF Phone 2 Pro',
    };

    for (const [key, name] of Object.entries(nothingModels)) {
        if (modelCode.includes(key)) {
            return name;
        }
    }

    return null;
}

// ZTE 모델 코드를 이름으로 변환
function getZTEModelName(modelCode) {
    const zteModels = {
        // ZTE Axon 시리즈 (플래그십)
        'A2023': 'ZTE Axon 60 Ultra',
        'A2022': 'ZTE Axon 50 Ultra',
        'A2021': 'ZTE Axon 50 Pro',
        'A2020': 'ZTE Axon 40 Ultra',
        'A2019': 'ZTE Axon 40 Pro',
        'A2018': 'ZTE Axon 40 SE',
        'A2017': 'ZTE Axon 30 Ultra',
        'A2016': 'ZTE Axon 30 Pro',
        'A2015': 'ZTE Axon 30',
        'A2014': 'ZTE Axon 30 5G',
        'A2013': 'ZTE Axon 20 5G',
        'A2012': 'ZTE Axon 11 5G',
        'A2011': 'ZTE Axon 11',
        'A2010': 'ZTE Axon 10 Pro 5G',
        'A2009': 'ZTE Axon 10 Pro',
        'A2008': 'ZTE Axon 10s Pro',
        'A2007': 'ZTE Axon 9 Pro',
        'A2006': 'ZTE Axon 7',

        // ZTE Blade 시리즈 (미드레인지)
        'A7050': 'ZTE Blade V50 Design',
        'A7040': 'ZTE Blade V50 Vita',
        'A7030': 'ZTE Blade V50',
        'A7020': 'ZTE Blade V40 Pro',
        'A7010': 'ZTE Blade V40',
        'A7000': 'ZTE Blade V40 Design',
        'A6090': 'ZTE Blade V40 Vita',
        'A6080': 'ZTE Blade V30',
        'A6070': 'ZTE Blade V30 Vita',
        'A6060': 'ZTE Blade A73',
        'A6050': 'ZTE Blade A72',
        'A6040': 'ZTE Blade A71',
        'A6030': 'ZTE Blade A54',
        'A6020': 'ZTE Blade A53',
        'A6010': 'ZTE Blade A52',
        'A6000': 'ZTE Blade A51',
        'A5050': 'ZTE Blade A35',
        'A5040': 'ZTE Blade A34',
        'A5030': 'ZTE Blade A33',
        '8050': 'ZTE Blade A72 5G',
        '8045': 'ZTE Blade A52',
        '8040': 'ZTE Blade A51',
        '9046': 'ZTE Blade V30 Vita',

        // ZTE Nubia (구형)
        'NX709S': 'ZTE Nubia Z50 Ultra',
        'NX709J': 'ZTE Nubia Z50',
        'NX679J': 'ZTE Nubia Z40 Pro',
        'NX666J': 'ZTE Nubia Z30 Pro',

        // ZTE Libero 시리즈 (일본)
        'A003ZT': 'ZTE Libero 5G IV',
        'A302ZT': 'ZTE Libero 5G III',
        'A202ZT': 'ZTE Libero 5G II',
        'A103ZT': 'ZTE Libero 5G',

        // 모델명 직접 매칭
        'Axon 60 Ultra': 'ZTE Axon 60 Ultra',
        'Axon 50 Ultra': 'ZTE Axon 50 Ultra',
        'Axon 40 Ultra': 'ZTE Axon 40 Ultra',
        'Axon 40 Pro': 'ZTE Axon 40 Pro',
        'Axon 30 Ultra': 'ZTE Axon 30 Ultra',
        'Axon 30 Pro': 'ZTE Axon 30 Pro',
        'Axon 30': 'ZTE Axon 30',
        'Blade V50': 'ZTE Blade V50',
        'Blade V40': 'ZTE Blade V40',
        'Blade A73': 'ZTE Blade A73',
        'Blade A72': 'ZTE Blade A72',
    };

    for (const [key, name] of Object.entries(zteModels)) {
        if (modelCode.includes(key)) {
            return name;
        }
    }

    return null;
}

// Nubia 모델 코드를 이름으로 변환
function getNubiaModelName(modelCode) {
    const nubiaModels = {
        // Red Magic 시리즈 (게이밍)
        'NX769J': 'Nubia Red Magic 10 Pro+',
        'NX768J': 'Nubia Red Magic 10 Pro',
        'NX767J': 'Nubia Red Magic 10',
        'NX759J': 'Nubia Red Magic 9 Pro+',
        'NX757J': 'Nubia Red Magic 9 Pro',
        'NX755J': 'Nubia Red Magic 9',
        'NX749J': 'Nubia Red Magic 8S Pro+',
        'NX747J': 'Nubia Red Magic 8S Pro',
        'NX739J': 'Nubia Red Magic 8 Pro+',
        'NX737J': 'Nubia Red Magic 8 Pro',
        'NX729J': 'Nubia Red Magic 7S Pro',
        'NX727J': 'Nubia Red Magic 7S',
        'NX719J': 'Nubia Red Magic 7 Pro',
        'NX717J': 'Nubia Red Magic 7',
        'NX709J': 'Nubia Red Magic 6S Pro',
        'NX669J': 'Nubia Red Magic 6 Pro',
        'NX659J': 'Nubia Red Magic 6',
        'NX659S': 'Nubia Red Magic 6R',
        'NX651J': 'Nubia Red Magic 5S',
        'NX659B': 'Nubia Red Magic 5G',
        'NX629J': 'Nubia Red Magic 3S',
        'NX619J': 'Nubia Red Magic 3',
        'NX616J': 'Nubia Red Magic Mars',
        'NX609J': 'Nubia Red Magic',

        // Red Magic Tablet
        'NX765T': 'Nubia Red Magic Tablet',
        'NX766T': 'Nubia Red Magic Nova',

        // Nubia Z 시리즈 (플래그십)
        'NX721J': 'Nubia Z60 Ultra',
        'NX720J': 'Nubia Z60S Pro',
        'NX713J': 'Nubia Z50S Pro',
        'NX711J': 'Nubia Z50 Ultra',
        'NX709S': 'Nubia Z50',
        'NX701J': 'Nubia Z50 Pro',
        'NX679J': 'Nubia Z40 Pro',
        'NX670J': 'Nubia Z40S Pro',
        'NX666J': 'Nubia Z30 Pro',
        'NX659': 'Nubia Z20',
        'NX629': 'Nubia Z18',
        'NX619': 'Nubia Z17',
        'NX606J': 'Nubia Z17 mini',

        // Nubia Neo 시리즈 (미드레인지)
        'NX723J': 'Nubia Neo 3 5G',
        'NX722J': 'Nubia Neo 2 5G',
        'NX712J': 'Nubia Neo 5G',

        // Nubia Focus 시리즈
        'NX718J': 'Nubia Focus Pro 5G',
        'NX717S': 'Nubia Focus 5G',

        // Nubia Flip (폴더블)
        'NX724J': 'Nubia Flip 5G',
        'NX726J': 'Nubia Flip 2',

        // 모델명 직접 매칭
        'Red Magic 10 Pro+': 'Nubia Red Magic 10 Pro+',
        'Red Magic 10 Pro': 'Nubia Red Magic 10 Pro',
        'Red Magic 10': 'Nubia Red Magic 10',
        'Red Magic 9 Pro+': 'Nubia Red Magic 9 Pro+',
        'Red Magic 9 Pro': 'Nubia Red Magic 9 Pro',
        'Red Magic 9': 'Nubia Red Magic 9',
        'Red Magic 8S Pro+': 'Nubia Red Magic 8S Pro+',
        'Red Magic 8S Pro': 'Nubia Red Magic 8S Pro',
        'Red Magic 8 Pro+': 'Nubia Red Magic 8 Pro+',
        'Red Magic 8 Pro': 'Nubia Red Magic 8 Pro',
        'Red Magic 7S Pro': 'Nubia Red Magic 7S Pro',
        'Red Magic 7S': 'Nubia Red Magic 7S',
        'Red Magic 7 Pro': 'Nubia Red Magic 7 Pro',
        'Red Magic 7': 'Nubia Red Magic 7',
        'Z60 Ultra': 'Nubia Z60 Ultra',
        'Z50 Ultra': 'Nubia Z50 Ultra',
        'Z50S Pro': 'Nubia Z50S Pro',
        'Z50': 'Nubia Z50',
        'Nubia Flip': 'Nubia Flip 5G',
    };

    for (const [key, name] of Object.entries(nubiaModels)) {
        if (modelCode.includes(key)) {
            return name;
        }
    }

    return null;
}

// Lenovo 모델 코드를 이름으로 변환
function getLenovoModelName(modelCode) {
    const lenovoModels = {
        // Legion Phone 시리즈 (게이밍)
        'L71091': 'Lenovo Legion Phone 3 Pro',
        'L71092': 'Lenovo Legion Phone 3',
        'L70081': 'Lenovo Legion Y90',
        'L70051': 'Lenovo Legion Phone Duel 2',
        'L79031': 'Lenovo Legion Phone Duel',
        'L38111': 'Lenovo Legion Pro',

        // Legion Tab 시리즈
        'TB320FC': 'Lenovo Legion Tab Y700 (2023)',
        'TB-9707F': 'Lenovo Legion Y700',
        'TB-9707N': 'Lenovo Legion Y700 5G',

        // Lenovo Z 시리즈
        'L78071': 'Lenovo Z6 Pro',
        'L78051': 'Lenovo Z6',
        'L78032': 'Lenovo Z6 Youth',
        'L78011': 'Lenovo Z5 Pro GT',
        'L78031': 'Lenovo Z5 Pro',
        'L78012': 'Lenovo Z5s',
        'L78021': 'Lenovo Z5',

        // Lenovo K 시리즈
        'L38083': 'Lenovo K14 Plus',
        'L38082': 'Lenovo K14',
        'L38081': 'Lenovo K13',
        'L38043': 'Lenovo K12 Pro',
        'L38041': 'Lenovo K12',
        'L38031': 'Lenovo K10 Plus',
        'L38021': 'Lenovo K10',

        // Lenovo A 시리즈
        'L19111': 'Lenovo A8 2020',
        'L19041': 'Lenovo A6 Note',
        'L19011': 'Lenovo A7',

        // Lenovo Tab 시리즈
        'TB371FC': 'Lenovo Tab P12 Pro',
        'TB370FU': 'Lenovo Tab P12',
        'TB350FU': 'Lenovo Tab P11 Pro Gen 2',
        'TB350XU': 'Lenovo Tab P11 Pro Gen 2 5G',
        'TB-J606F': 'Lenovo Tab P11',
        'TB-J607Z': 'Lenovo Tab P11 5G',
        'TB-J616F': 'Lenovo Tab P11 Plus',
        'TB328FU': 'Lenovo Tab M10 Plus Gen 3',
        'TB328XU': 'Lenovo Tab M10 Plus Gen 3 5G',
        'TB-X606F': 'Lenovo Tab M10 FHD Plus',
        'TB-X306F': 'Lenovo Tab M10 HD Gen 2',
        'TB125FU': 'Lenovo Tab M11',
        'TB310FU': 'Lenovo Tab M9',
        'TB300FU': 'Lenovo Tab M8 Gen 4',

        // 모델명 직접 매칭
        'Legion Phone Duel 2': 'Lenovo Legion Phone Duel 2',
        'Legion Phone Duel': 'Lenovo Legion Phone Duel',
        'Legion Y90': 'Lenovo Legion Y90',
        'Legion Y700': 'Lenovo Legion Y700',
        'Legion Phone 3 Pro': 'Lenovo Legion Phone 3 Pro',
        'Legion Phone 3': 'Lenovo Legion Phone 3',
    };

    for (const [key, name] of Object.entries(lenovoModels)) {
        if (modelCode.includes(key)) {
            return name;
        }
    }

    return null;
}

// Nokia 모델 코드를 이름으로 변환
function getNokiaModelName(modelCode) {
    const nokiaModels = {
        // Nokia X 시리즈 (프리미엄)
        'TA-1484': 'Nokia X100',
        'TA-1390': 'Nokia X50',
        'TA-1388': 'Nokia X30',
        'TA-1450': 'Nokia X30 5G',
        'TA-1373': 'Nokia X20',
        'TA-1372': 'Nokia X20',
        'TA-1374': 'Nokia X10',
        'TA-1350': 'Nokia X10',

        // Nokia G 시리즈 (미드레인지)
        'TA-1613': 'Nokia G512',
        'TA-1612': 'Nokia G512 5G',
        'TA-1570': 'Nokia G400',
        'TA-1548': 'Nokia G400 5G',
        'TA-1530': 'Nokia G310 5G',
        'TA-1528': 'Nokia G310',
        'TA-1505': 'Nokia G60 5G',
        'TA-1503': 'Nokia G60',
        'TA-1490': 'Nokia G50 5G',
        'TA-1489': 'Nokia G50',
        'TA-1468': 'Nokia G42 5G',
        'TA-1467': 'Nokia G42',
        'TA-1456': 'Nokia G35',
        'TA-1455': 'Nokia G35 5G',
        'TA-1445': 'Nokia G32',
        'TA-1440': 'Nokia G32',
        'TA-1401': 'Nokia G22',
        'TA-1400': 'Nokia G22',
        'TA-1386': 'Nokia G21',
        'TA-1385': 'Nokia G21',
        'TA-1367': 'Nokia G20',
        'TA-1365': 'Nokia G20',
        'TA-1341': 'Nokia G11 Plus',
        'TA-1340': 'Nokia G11',
        'TA-1335': 'Nokia G11',
        'TA-1334': 'Nokia G10',
        'TA-1338': 'Nokia G10',

        // Nokia C 시리즈 (엔트리)
        'TA-1610': 'Nokia C402',
        'TA-1608': 'Nokia C320',
        'TA-1606': 'Nokia C320 5G',
        'TA-1540': 'Nokia C300',
        'TA-1538': 'Nokia C210',
        'TA-1502': 'Nokia C110',
        'TA-1500': 'Nokia C32',
        'TA-1499': 'Nokia C32',
        'TA-1480': 'Nokia C31',
        'TA-1478': 'Nokia C31',
        'TA-1422': 'Nokia C22',
        'TA-1420': 'Nokia C22',
        'TA-1418': 'Nokia C21 Plus',
        'TA-1416': 'Nokia C21 Plus',
        'TA-1380': 'Nokia C21',
        'TA-1378': 'Nokia C21',
        'TA-1352': 'Nokia C20 Plus',
        'TA-1348': 'Nokia C20',
        'TA-1342': 'Nokia C12 Pro',
        'TA-1340': 'Nokia C12',
        'TA-1330': 'Nokia C10',
        'TA-1325': 'Nokia C2 2nd Edition',
        'TA-1292': 'Nokia C3',
        'TA-1290': 'Nokia C2',
        'TA-1234': 'Nokia C1 Plus',
        'TA-1165': 'Nokia C1',

        // Nokia 숫자 시리즈
        'TA-1520': 'Nokia 8210 4G',
        'TA-1518': 'Nokia 8000 4G',
        'TA-1502': 'Nokia 6310 (2024)',
        'TA-1400': 'Nokia 6310 (2021)',
        'TA-1415': 'Nokia 5710 XpressAudio',
        'TA-1407': 'Nokia 5310 (2020)',
        'TA-1316': 'Nokia 3310 4G',
        'TA-1270': 'Nokia 3310 3G',
        'TA-1030': 'Nokia 3310 (2017)',
        'TA-1347': 'Nokia 2760 Flip',
        'TA-1325': 'Nokia 2720 V Flip',
        'TA-1170': 'Nokia 2720 Flip',
        'TA-1292': 'Nokia 2660 Flip',

        // Nokia PureView / 플래그십
        'TA-1234': 'Nokia 9 PureView',
        'TA-1119': 'Nokia 8 Sirocco',
        'TA-1052': 'Nokia 8',
        'TA-1004': 'Nokia 8',
        'TA-1157': 'Nokia 7.2',
        'TA-1178': 'Nokia 7.1',
        'TA-1097': 'Nokia 7 Plus',

        // 모델명 직접 매칭
        'Nokia X100': 'Nokia X100',
        'Nokia X30': 'Nokia X30 5G',
        'Nokia X20': 'Nokia X20',
        'Nokia X10': 'Nokia X10',
        'Nokia G512': 'Nokia G512',
        'Nokia G400': 'Nokia G400 5G',
        'Nokia G310': 'Nokia G310 5G',
        'Nokia G60': 'Nokia G60 5G',
        'Nokia G50': 'Nokia G50 5G',
        'Nokia G42': 'Nokia G42 5G',
        'Nokia G35': 'Nokia G35',
        'Nokia G32': 'Nokia G32',
        'Nokia G22': 'Nokia G22',
        'Nokia G21': 'Nokia G21',
        'Nokia G20': 'Nokia G20',
        'Nokia G11': 'Nokia G11',
        'Nokia G10': 'Nokia G10',
        'Nokia C32': 'Nokia C32',
        'Nokia C31': 'Nokia C31',
        'Nokia C22': 'Nokia C22',
        'Nokia C21': 'Nokia C21',
        'Nokia C20': 'Nokia C20',
        'Nokia C12': 'Nokia C12',
        'Nokia C10': 'Nokia C10',
    };

    for (const [key, name] of Object.entries(nokiaModels)) {
        if (modelCode.includes(key)) {
            return name;
        }
    }

    return null;
}

// Meizu 모델 코드를 이름으로 변환
function getMeizuModelName(modelCode) {
    const meizuModels = {
        // Meizu 21 시리즈 (2024)
        'M481Q': 'Meizu 21 Pro',
        'M481M': 'Meizu 21 Pro',
        'M461Q': 'Meizu 21 Note',
        'M461M': 'Meizu 21 Note',
        'M451Q': 'Meizu 21',
        'M451M': 'Meizu 21',
        // Meizu 20 시리즈 (2023)
        'M431Q': 'Meizu 20 Infinity',
        'M431M': 'Meizu 20 Infinity',
        'M411Q': 'Meizu 20 Pro',
        'M411M': 'Meizu 20 Pro',
        'M391Q': 'Meizu 20',
        'M391M': 'Meizu 20',
        // Meizu 18 시리즈 (2021)
        'M381Q': 'Meizu 18s Pro',
        'M381M': 'Meizu 18s Pro',
        'M371Q': 'Meizu 18s',
        'M371M': 'Meizu 18s',
        'M361Q': 'Meizu 18 Pro',
        'M361M': 'Meizu 18 Pro',
        'M351Q': 'Meizu 18',
        'M351M': 'Meizu 18',
        'M341Q': 'Meizu 18X',
        'M341M': 'Meizu 18X',
        // Meizu 17 시리즈 (2020)
        'M331Q': 'Meizu 17 Pro',
        'M331M': 'Meizu 17 Pro',
        'M321Q': 'Meizu 17',
        'M321M': 'Meizu 17',
        // Meizu 16 시리즈 (2019)
        'M311Q': 'Meizu 16s Pro',
        'M311M': 'Meizu 16s Pro',
        'M301Q': 'Meizu 16s',
        'M301M': 'Meizu 16s',
        'M291Q': 'Meizu 16T',
        'M291M': 'Meizu 16T',
        'M281Q': 'Meizu 16Xs',
        'M281M': 'Meizu 16Xs',
        'M272Q': 'Meizu 16X',
        'M272M': 'Meizu 16X',
        'M262Q': 'Meizu 16th Plus',
        'M262M': 'Meizu 16th Plus',
        'M252Q': 'Meizu 16th',
        'M252M': 'Meizu 16th',

        // Meizu Note 시리즈
        'M241Q': 'Meizu Note 9',
        'M241M': 'Meizu Note 9',
        'M231Q': 'Meizu Note 8',
        'M231M': 'Meizu Note 8',

        // Meizu PRO 시리즈
        'M221Q': 'Meizu PRO 7 Plus',
        'M221M': 'Meizu PRO 7 Plus',
        'M211Q': 'Meizu PRO 7',
        'M211M': 'Meizu PRO 7',
        'M201Q': 'Meizu PRO 6 Plus',
        'M201M': 'Meizu PRO 6 Plus',
        'M191Q': 'Meizu PRO 6s',
        'M191M': 'Meizu PRO 6s',
        'M181Q': 'Meizu PRO 6',
        'M181M': 'Meizu PRO 6',

        // 모델명 직접 매칭
        'Meizu 21 Pro': 'Meizu 21 Pro',
        'Meizu 21 Note': 'Meizu 21 Note',
        'Meizu 21': 'Meizu 21',
        'Meizu 20 Infinity': 'Meizu 20 Infinity',
        'Meizu 20 Pro': 'Meizu 20 Pro',
        'Meizu 20': 'Meizu 20',
        'Meizu 18s Pro': 'Meizu 18s Pro',
        'Meizu 18s': 'Meizu 18s',
        'Meizu 18 Pro': 'Meizu 18 Pro',
        'Meizu 18': 'Meizu 18',
        'Meizu 17 Pro': 'Meizu 17 Pro',
        'Meizu 17': 'Meizu 17',
    };

    for (const [key, name] of Object.entries(meizuModels)) {
        if (modelCode.includes(key)) {
            return name;
        }
    }

    return null;
}

// Tecno 모델 코드를 이름으로 변환
function getTecnoModelName(modelCode) {
    const tecnoModels = {
        // Tecno Phantom 시리즈 (플래그십)
        'AH8': 'Tecno Phantom V Fold 2',
        'AH7': 'Tecno Phantom V Flip 2',
        'AD9': 'Tecno Phantom V Fold',
        'AD8': 'Tecno Phantom V Flip',
        'AF9': 'Tecno Phantom X2 Pro',
        'AF8': 'Tecno Phantom X2',
        'AC8': 'Tecno Phantom X',
        'AH9': 'Tecno Phantom Ultimate',

        // Tecno Camon 시리즈 (카메라 특화)
        'CL8': 'Tecno Camon 30 Premier',
        'CL7': 'Tecno Camon 30 Pro',
        'CL6': 'Tecno Camon 30',
        'CK9': 'Tecno Camon 20 Premier',
        'CK8': 'Tecno Camon 20 Pro',
        'CK7': 'Tecno Camon 20',
        'CK6': 'Tecno Camon 20 Pro 5G',
        'CH9': 'Tecno Camon 19 Pro Mondrian',
        'CH8': 'Tecno Camon 19 Pro',
        'CH7': 'Tecno Camon 19',
        'CH6': 'Tecno Camon 19 Neo',
        'CG8': 'Tecno Camon 18 Premier',
        'CG7': 'Tecno Camon 18 Pro',
        'CG6': 'Tecno Camon 18',
        'CE9': 'Tecno Camon 17 Pro',
        'CE8': 'Tecno Camon 17',
        'CD8': 'Tecno Camon 16 Premier',
        'CD7': 'Tecno Camon 16 Pro',
        'CD6': 'Tecno Camon 16',
        'CC8': 'Tecno Camon 15 Premier',
        'CC7': 'Tecno Camon 15 Pro',
        'CC6': 'Tecno Camon 15',

        // Tecno Spark 시리즈 (미드레인지)
        'KJ9': 'Tecno Spark 30 Pro',
        'KJ8': 'Tecno Spark 30',
        'KJ7': 'Tecno Spark 30C',
        'KI8': 'Tecno Spark 20 Pro+',
        'KI7': 'Tecno Spark 20 Pro',
        'KI6': 'Tecno Spark 20',
        'KI5': 'Tecno Spark 20C',
        'KH7': 'Tecno Spark 10 Pro',
        'KH6': 'Tecno Spark 10',
        'KH5': 'Tecno Spark 10C',
        'KG5': 'Tecno Spark 9 Pro',
        'KG6': 'Tecno Spark 9',
        'KG7': 'Tecno Spark 9T',
        'KF8': 'Tecno Spark 8 Pro',
        'KF7': 'Tecno Spark 8',
        'KF6': 'Tecno Spark 8C',
        'KE7': 'Tecno Spark 7 Pro',
        'KE6': 'Tecno Spark 7',
        'KD7': 'Tecno Spark 6 Go',
        'KD6': 'Tecno Spark 6',
        'KE5': 'Tecno Spark 6 Air',

        // Tecno Pova 시리즈 (배터리/게이밍)
        'LI8': 'Tecno Pova 6 Pro',
        'LI7': 'Tecno Pova 6',
        'LI6': 'Tecno Pova 6 Neo',
        'LH8': 'Tecno Pova 5 Pro',
        'LH7': 'Tecno Pova 5',
        'LG8': 'Tecno Pova 4 Pro',
        'LG7': 'Tecno Pova 4',
        'LG6': 'Tecno Pova Neo 2',
        'LF8': 'Tecno Pova 3',
        'LF7': 'Tecno Pova Neo',
        'LE7': 'Tecno Pova 2',
        'LD7': 'Tecno Pova',

        // Tecno Pop 시리즈 (엔트리)
        'BG7': 'Tecno Pop 8',
        'BG6': 'Tecno Pop 7 Pro',
        'BG5': 'Tecno Pop 7',
        'BF7': 'Tecno Pop 6 Pro',
        'BF6': 'Tecno Pop 6',
        'BE8': 'Tecno Pop 5 Pro',
        'BE7': 'Tecno Pop 5',
        'BD4': 'Tecno Pop 4 Pro',
        'BD3': 'Tecno Pop 4',

        // 모델명 직접 매칭
        'Phantom V Fold 2': 'Tecno Phantom V Fold 2',
        'Phantom V Flip 2': 'Tecno Phantom V Flip 2',
        'Phantom V Fold': 'Tecno Phantom V Fold',
        'Phantom V Flip': 'Tecno Phantom V Flip',
        'Phantom X2 Pro': 'Tecno Phantom X2 Pro',
        'Phantom X2': 'Tecno Phantom X2',
        'Camon 30 Premier': 'Tecno Camon 30 Premier',
        'Camon 30 Pro': 'Tecno Camon 30 Pro',
        'Camon 30': 'Tecno Camon 30',
        'Spark 30 Pro': 'Tecno Spark 30 Pro',
        'Spark 30': 'Tecno Spark 30',
        'Pova 6 Pro': 'Tecno Pova 6 Pro',
        'Pova 6': 'Tecno Pova 6',
    };

    for (const [key, name] of Object.entries(tecnoModels)) {
        if (modelCode.includes(key)) {
            return name;
        }
    }

    return null;
}

// Infinix 모델 코드를 이름으로 변환
function getInfinixModelName(modelCode) {
    const infinixModels = {
        // Infinix Zero 시리즈 (플래그십)
        'X6850': 'Infinix Zero 40 5G',
        'X6851': 'Infinix Zero 40',
        'X6830': 'Infinix Zero 30 5G',
        'X6831': 'Infinix Zero 30',
        'X6821': 'Infinix Zero Ultra',
        'X6820': 'Infinix Zero 20',
        'X6811': 'Infinix Zero 5G',
        'X6810': 'Infinix Zero X Pro',
        'X6815': 'Infinix Zero X Neo',
        'X6816': 'Infinix Zero X',

        // Infinix Note 시리즈
        'X6950': 'Infinix Note 40 Pro+ 5G',
        'X6951': 'Infinix Note 40 Pro',
        'X6952': 'Infinix Note 40',
        'X6953': 'Infinix Note 40S',
        'X6833': 'Infinix Note 30 Pro',
        'X6831B': 'Infinix Note 30 5G',
        'X6833B': 'Infinix Note 30',
        'X6833VIP': 'Infinix Note 30 VIP',
        'X6723': 'Infinix Note 12 Pro 5G',
        'X6722': 'Infinix Note 12 Pro',
        'X6721': 'Infinix Note 12',
        'X6720': 'Infinix Note 12 VIP',
        'X6711': 'Infinix Note 11 Pro',
        'X6710': 'Infinix Note 11',
        'X6701': 'Infinix Note 10 Pro',
        'X6700': 'Infinix Note 10',

        // Infinix Hot 시리즈
        'X6871': 'Infinix Hot 50 Pro+',
        'X6872': 'Infinix Hot 50 Pro',
        'X6873': 'Infinix Hot 50',
        'X6878': 'Infinix Hot 50i',
        'X6837': 'Infinix Hot 40 Pro',
        'X6836': 'Infinix Hot 40',
        'X6838': 'Infinix Hot 40i',
        'X6827': 'Infinix Hot 30 5G',
        'X6826': 'Infinix Hot 30',
        'X6828': 'Infinix Hot 30i',
        'X6823': 'Infinix Hot 20 5G',
        'X6822': 'Infinix Hot 20',
        'X6824': 'Infinix Hot 20S',
        'X6825': 'Infinix Hot 20i',
        'X6817': 'Infinix Hot 12 Pro',
        'X6816': 'Infinix Hot 12',
        'X6818': 'Infinix Hot 12i',
        'X6812': 'Infinix Hot 11S',
        'X6811': 'Infinix Hot 11',
        'X6813': 'Infinix Hot 11 Play',
        'X6802': 'Infinix Hot 10S',
        'X6801': 'Infinix Hot 10',
        'X6803': 'Infinix Hot 10 Play',

        // Infinix Smart 시리즈 (엔트리)
        'X6533': 'Infinix Smart 8 Pro',
        'X6532': 'Infinix Smart 8 Plus',
        'X6531': 'Infinix Smart 8 HD',
        'X6530': 'Infinix Smart 8',
        'X6525': 'Infinix Smart 7 Plus',
        'X6524': 'Infinix Smart 7 HD',
        'X6523': 'Infinix Smart 7',
        'X6517': 'Infinix Smart 6 Plus',
        'X6516': 'Infinix Smart 6 HD',
        'X6515': 'Infinix Smart 6',
        'X6511': 'Infinix Smart 5 Pro',
        'X6510': 'Infinix Smart 5',

        // Infinix GT 시리즈 (게이밍)
        'X6880': 'Infinix GT 20 Pro',
        'X6881': 'Infinix GT 20',
        'X6731': 'Infinix GT 10 Pro',
        'X6730': 'Infinix GT 10',

        // 모델명 직접 매칭
        'Zero 40 5G': 'Infinix Zero 40 5G',
        'Zero 40': 'Infinix Zero 40',
        'Zero 30 5G': 'Infinix Zero 30 5G',
        'Zero 30': 'Infinix Zero 30',
        'Note 40 Pro': 'Infinix Note 40 Pro',
        'Note 40': 'Infinix Note 40',
        'Hot 50 Pro': 'Infinix Hot 50 Pro',
        'Hot 50': 'Infinix Hot 50',
        'Smart 8': 'Infinix Smart 8',
        'GT 20 Pro': 'Infinix GT 20 Pro',
        'GT 10 Pro': 'Infinix GT 10 Pro',
    };

    for (const [key, name] of Object.entries(infinixModels)) {
        if (modelCode.includes(key)) {
            return name;
        }
    }

    return null;
}

// ── getDeviceInfo: DOM 없이 기종 정보를 객체로 반환 ──
async function getDeviceInfo() {
    const ua = navigator.userAgent;
    const result = {
        deviceName: '알 수 없는 기기',
        modelCode: '',
        os: detectOS(),
        browser: detectBrowser(),
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        pixelRatio: window.devicePixelRatio || 1,
        icon: '❓',
        type: 'unknown' // phone, tablet, pc
    };

    // iOS (아이폰)
    if (/iPhone/.test(ua)) {
        result.icon = '📱';
        result.type = 'phone';
        const iPhoneResult = detectiPhoneModel();
        result.deviceName = iPhoneResult.name;
        const gpuInfo = getWebGLRenderer() || 'unknown';
        const chipset = getChipsetFromGPU(gpuInfo);
        result.modelCode = chipset || '';
        return result;
    }

    // iPad
    if (/iPad/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
        result.icon = '📱';
        result.type = 'tablet';
        result.deviceName = 'Apple iPad';
        const w = Math.min(window.screen.width, window.screen.height);
        const h = Math.max(window.screen.width, window.screen.height);
        result.modelCode = `${w}x${h}@${window.devicePixelRatio}x`;
        return result;
    }

    // Android
    if (/Android/.test(ua)) {
        result.icon = '📱';
        result.type = 'phone';

        // Android 14+ High Entropy API
        if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
            try {
                const hev = await navigator.userAgentData.getHighEntropyValues(['model', 'platformVersion']);
                const model = hev.model;
                if (model && model !== '' && model !== 'K') {
                    const androidResult = detectAndroidModel(`; ${model} Build/`);
                    result.deviceName = androidResult.name;
                    result.modelCode = androidResult.code || model;
                    return result;
                }
            } catch (e) {
                console.log('High Entropy API not available:', e);
            }
        }

        const androidResult = detectAndroidModel(ua);
        result.deviceName = androidResult.name;
        result.modelCode = androidResult.code || '';
        return result;
    }

    // macOS
    if (/Mac/.test(ua) && !/iPhone|iPad/.test(ua)) {
        result.deviceName = 'Apple Mac';
        result.icon = '💻';
        result.type = 'pc';
        return result;
    }

    // Windows
    if (/Windows/.test(ua)) {
        result.deviceName = 'Windows PC';
        result.icon = '🖥️';
        result.type = 'pc';
        return result;
    }

    // Linux
    if (/Linux/.test(ua)) {
        result.deviceName = 'Linux PC';
        result.icon = '🖥️';
        result.type = 'pc';
        return result;
    }

    return result;
}
