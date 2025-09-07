// متغيرات اللعبة الرئيسية
let gameState = {
    teams: {
        green: {
            name: 'الفريق الأخضر',
            players: [],
            score: 0,
            color: 'green'
        },
        red: {
            name: 'الفريق الأحمر',
            players: [],
            score: 0,
            color: 'red'
        }
    },
    currentTurn: 'green',
    gameStarted: false,
    gameEnded: false,
    letters: [],
    usedQuestions: [],
    questionTimer: null,
    currentQuestion: null,
    selectedLetter: null,
    
    // متغيرات جديدة للغرف
    isMultiplayer: false,
    currentRoom: null,
    currentPlayer: null,
    playerRole: null, // 'player' or 'spectator'
    playerTeam: null // 'green' or 'red'
};

// الحروف العربية للشبكة (25 حرف غير مكررة)
const arabicLetters = [
    'أ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر',
    'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف',
    'ق', 'ك', 'ل', 'م', 'ن'
];

// عناصر DOM
const screens = {
    login: document.getElementById('login-screen'),
    rooms: document.getElementById('rooms-screen'),
    createRoom: document.getElementById('create-room-screen'),
    room: document.getElementById('room-screen'),
    teamSetup: document.getElementById('start-screen'),
    game: document.getElementById('game-screen'),
    results: document.getElementById('results-screen')
};

const elements = {
    // عناصر تسجيل الدخول
    playerNameInput: document.getElementById('player-name-input'),
    joinRoomsBtn: document.getElementById('join-rooms-btn'),
    
    // عناصر الغرف
    logoutBtn: document.getElementById('logout-btn'),
    createRoomBtn: document.getElementById('create-room-btn'),
    refreshRoomsBtn: document.getElementById('refresh-rooms-btn'),
    roomsList: document.getElementById('rooms-list'),
    
    // عناصر إنشاء غرفة
    roomNameInput: document.getElementById('room-name-input'),
    createRoomConfirmBtn: document.getElementById('create-room-confirm-btn'),
    cancelCreateRoomBtn: document.getElementById('cancel-create-room-btn'),
    
    // عناصر الغرفة
    currentRoomName: document.getElementById('current-room-name'),
    leaveRoomBtn: document.getElementById('leave-room-btn'),
    greenTeamList: document.getElementById('green-players-list'),
    redTeamList: document.getElementById('red-players-list'),
    spectatorsList: document.getElementById('spectators-list'),
    joinGreenTeamBtn: document.getElementById('join-green-team-btn'),
    joinRedTeamBtn: document.getElementById('join-red-team-btn'),
    startRoomGameBtn: document.getElementById('start-room-game-btn'),
    readyBtn: document.getElementById('ready-btn'),
    
    // العناصر القديمة
    startBtn: document.getElementById('start-game-btn'),
    resetBtn: document.getElementById('reset-game-btn'),
    endBtn: document.getElementById('end-game-btn'),
    playAgainBtn: document.getElementById('play-again-btn'),
    lettersGrid: document.getElementById('letters-grid'),
    questionModal: document.getElementById('question-modal'),
    playerInputs: document.querySelectorAll('.player-name'),
    greenTeamInfo: document.querySelector('.green-info'),
    redTeamInfo: document.querySelector('.red-info'),
    currentTurnElement: document.querySelector('.turn-team')
};

// تهيئة اللعبة
document.addEventListener('DOMContentLoaded', async function() {
    console.log('تم تحميل الصفحة، بدء التهيئة...');
    
    // إخفاء جميع الشاشات أولاً لمنع الوميض
    hideAllScreensImmediately();
    
    // فحص وإجبار التحديث إذا لزم الأمر
    checkForUpdates();
    
    // انتظار تحميل Firebase قبل بدء النظام
    await initializeGameSystem();
});

// تهيئة نظام اللعبة
async function initializeGameSystem() {
    console.log('بدء تهيئة نظام اللعبة...');
    
    // التحقق من توفر Firebase
    let useFirebase = false;
    if (window.firebaseManager && window.FIREBASE_CONFIG) {
        try {
            // اختبار الاتصال بـ Firebase
            await window.firebaseManager.getRooms();
            useFirebase = true;
            console.log('تم الاتصال بـ Firebase بنجاح');
        } catch (error) {
            console.warn('فشل الاتصال بـ Firebase، سيتم استخدام النظام المحلي:', error);
        }
    }
    
    // إنشاء roomsSystem مع Firebase أو النظام البديل
    window.roomsSystem = {
        useFirebase: useFirebase,
        currentPlayer: null,
        
        // إنشاء لاعب جديد
        createPlayer: async function(name) {
            if (this.useFirebase && window.firebaseManager) {
                try {
                    const player = await window.firebaseManager.createPlayer(name);
                    this.currentPlayer = player;
                    return player;
                } catch (error) {
                    console.error('خطأ Firebase، التبديل للنظام المحلي:', error);
                    this.useFirebase = false;
                }
            }
            
            // النظام المحلي البديل
            const player = {
                id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: name,
                joinedAt: new Date()
            };
            this.currentPlayer = player;
            localStorage.setItem('currentPlayer', JSON.stringify(player));
            return player;
        },
        
        // إنشاء غرفة جديدة
        createRoom: async function(roomName, creator) {
            if (this.useFirebase && window.firebaseManager) {
                try {
                    return await window.firebaseManager.createRoom(roomName, creator);
                } catch (error) {
                    console.error('خطأ Firebase، التبديل للنظام المحلي:', error);
                    this.useFirebase = false;
                }
            }
            
            // النظام المحلي البديل
            return this.createRoomLocal(roomName, creator);
        },
        
        // إنشاء غرفة محلياً
        createRoomLocal: function(roomName, creator) {
            const roomId = `local_${Date.now()}`;
            const room = {
                id: roomId,
                name: roomName,
                creator: creator.id,
                createdAt: new Date(),
                gameStarted: false,
                greenTeam: [],
                redTeam: [],
                spectators: [creator]
            };
            
            const rooms = this.getLocalRooms();
            rooms[roomId] = room;
            localStorage.setItem('localRooms', JSON.stringify(rooms));
            return roomId;
        },
        
        // الحصول على جميع الغرف
        getAllRooms: async function() {
            if (this.useFirebase && window.firebaseManager) {
                try {
                    const firebaseRooms = await window.firebaseManager.getRooms();
                    return firebaseRooms;
                } catch (error) {
                    console.error('خطأ في تحميل الغرف من Firebase:', error);
                    this.useFirebase = false;
                }
            }
            
            // النظام المحلي البديل
            const localRooms = this.getLocalRooms();
            return Object.values(localRooms);
        },
        
        // الحصول على غرفة معينة
        getRoom: async function(roomId) {
            if (this.useFirebase && window.firebaseManager) {
                try {
                    return await window.firebaseManager.getRoom(roomId);
                } catch (error) {
                    console.error('خطأ في تحميل الغرفة من Firebase:', error);
                }
            }
            
            // النظام المحلي البديل
            const rooms = this.getLocalRooms();
            return rooms[roomId] || null;
        },
        
        // الانضمام للغرفة
        joinRoom: async function(roomId, player) {
            if (this.useFirebase && window.firebaseManager) {
                try {
                    return await window.firebaseManager.joinRoom(roomId, player);
                } catch (error) {
                    console.error('خطأ في الانضمام للغرفة Firebase:', error);
                    throw error;
                }
            }
            
            // النظام المحلي البديل
            const rooms = this.getLocalRooms();
            const room = rooms[roomId];
            if (!room) {
                throw new Error('الغرفة غير موجودة');
            }
            
            if (!room.spectators.find(p => p.id === player.id)) {
                room.spectators.push(player);
                localStorage.setItem('localRooms', JSON.stringify(rooms));
            }
            return room;
        },
        
        // الانضمام للفريق
        joinTeam: async function(roomId, playerId, teamColor) {
            if (this.useFirebase && window.firebaseManager) {
                try {
                    return await window.firebaseManager.joinTeam(roomId, playerId, teamColor);
                } catch (error) {
                    console.error('خطأ في الانضمام للفريق Firebase:', error);
                    throw error;
                }
            }
            
            // النظام المحلي البديل
            const rooms = this.getLocalRooms();
            const room = rooms[roomId];
            if (!room) {
                throw new Error('الغرفة غير موجودة');
            }
            
            const allPlayers = [...room.greenTeam, ...room.redTeam, ...room.spectators];
            const player = allPlayers.find(p => p.id === playerId);
            
            if (!player) {
                throw new Error('اللاعب غير موجود في الغرفة');
            }
            
            // إزالة اللاعب من جميع الفرق
            room.greenTeam = room.greenTeam.filter(p => p.id !== playerId);
            room.redTeam = room.redTeam.filter(p => p.id !== playerId);
            room.spectators = room.spectators.filter(p => p.id !== playerId);
            
            // إضافة للفريق المحدد
            if (teamColor === 'green') {
                if (room.greenTeam.length >= 3) {
                    throw new Error('الفريق الأخضر ممتلئ');
                }
                room.greenTeam.push(player);
            } else if (teamColor === 'red') {
                if (room.redTeam.length >= 3) {
                    throw new Error('الفريق الأحمر ممتلئ');
                }
                room.redTeam.push(player);
            } else {
                room.spectators.push(player);
            }
            
            localStorage.setItem('localRooms', JSON.stringify(rooms));
            return room;
        },
        
        // مغادرة الغرفة
        leaveRoom: async function(roomId, playerId) {
            if (this.useFirebase && window.firebaseManager) {
                try {
                    await window.firebaseManager.leaveRoom(roomId, playerId);
                    return;
                } catch (error) {
                    console.error('خطأ في مغادرة الغرفة Firebase:', error);
                }
            }
            
            // النظام المحلي البديل
            const rooms = this.getLocalRooms();
            const room = rooms[roomId];
            if (!room) return;
            
            room.greenTeam = room.greenTeam.filter(p => p.id !== playerId);
            room.redTeam = room.redTeam.filter(p => p.id !== playerId);
            room.spectators = room.spectators.filter(p => p.id !== playerId);
            
            const remainingPlayers = room.greenTeam.length + room.redTeam.length + room.spectators.length;
            
            if (remainingPlayers === 0 || room.creator === playerId) {
                delete rooms[roomId];
            }
            
            localStorage.setItem('localRooms', JSON.stringify(rooms));
        },
        
        // بدء اللعبة
        startGame: async function(roomId) {
            if (this.useFirebase && window.firebaseManager) {
                try {
                    await window.firebaseManager.startGame(roomId);
                    return;
                } catch (error) {
                    console.error('خطأ في بدء اللعبة Firebase:', error);
                    throw error;
                }
            }
            
            // النظام المحلي البديل
            const rooms = this.getLocalRooms();
            const room = rooms[roomId];
            if (!room) {
                throw new Error('الغرفة غير موجودة');
            }
            
            if (room.greenTeam.length === 0 || room.redTeam.length === 0) {
                throw new Error('يجب أن يكون هناك لاعب واحد على الأقل في كل فريق');
            }
            
            room.gameStarted = true;
            localStorage.setItem('localRooms', JSON.stringify(rooms));
        },
        
        // الحصول على الغرف المحلية
        getLocalRooms: function() {
            try {
                const stored = localStorage.getItem('localRooms');
                return stored ? JSON.parse(stored) : {};
            } catch (error) {
                console.error('خطأ في تحميل الغرف المحلية:', error);
                return {};
            }
        },
        
        // تحديث من التخزين
        refreshFromStorage: async function() {
            // لا حاجة لتحديث مع Firebase حيث البيانات محدثة في الوقت الفعلي
            if (this.useFirebase) {
                return true;
            }
            
            // تحديث النظام المحلي
            return true;
        },
        
        // حفظ للتخزين (للتوافق مع النظام القديم)
        saveToStorage: function() {
            // مع Firebase لا حاجة لحفظ يدوي
            if (this.useFirebase) {
                return;
            }
            
            // حفظ اللاعب الحالي
            if (this.currentPlayer) {
                localStorage.setItem('currentPlayer', JSON.stringify(this.currentPlayer));
            }
        },
        
        // تحميل من التخزين
        loadFromStorage: function() {
            try {
                const stored = localStorage.getItem('currentPlayer');
                if (stored) {
                    this.currentPlayer = JSON.parse(stored);
                }
                return true;
            } catch (error) {
                console.error('خطأ في تحميل بيانات اللاعب:', error);
                return false;
            }
        }
    };
    
    // تحميل بيانات اللاعب المحفوظة
    roomsSystem.loadFromStorage();
    
    // إعداد مستمعي الأحداث
    setupEventListeners();
    console.log('تم إعداد أحداث العناصر');
    
    // إعداد تحديث دوري للغرف (للنظام المحلي فقط)
    if (!roomsSystem.useFirebase) {
        setInterval(() => {
            if (screens.rooms && screens.rooms.classList.contains('active')) {
                refreshRoomsList();
            }
        }, 10000);
    }
    
    // عرض الشاشة المناسبة
    setTimeout(() => {
        try {
            const savedPlayer = roomsSystem.currentPlayer;
            if (savedPlayer && savedPlayer.name) {
                gameState.currentPlayer = savedPlayer;
                showScreen('rooms');
                refreshRoomsList();
                console.log('تم عرض شاشة الغرف للاعب المحفوظ:', savedPlayer.name);
            } else {
                showScreen('login');
                console.log('تم عرض شاشة تسجيل الدخول');
            }
        } catch (error) {
            console.error('خطأ في عرض الشاشة:', error);
            showScreen('login');
        }
    }, 500);
}

}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // أحداث تسجيل الدخول
    if (elements.playerNameInput) {
        elements.playerNameInput.addEventListener('input', validatePlayerName);
        elements.playerNameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                joinRooms();
            }
        });
    }
    
    if (elements.joinRoomsBtn) {
        elements.joinRoomsBtn.addEventListener('click', joinRooms);
    }
    
    // أحداث الغرف
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', logout);
    }
    
    if (elements.createRoomBtn) {
        elements.createRoomBtn.addEventListener('click', () => showScreen('createRoom'));
    }
    
    if (elements.refreshRoomsBtn) {
        elements.refreshRoomsBtn.addEventListener('click', refreshRoomsList);
    }
    
    // أحداث إنشاء غرفة
    if (elements.roomNameInput) {
        elements.roomNameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                createRoom();
            }
        });
    }
    
    if (elements.createRoomConfirmBtn) {
        elements.createRoomConfirmBtn.addEventListener('click', createRoom);
    }
    
    if (elements.cancelCreateRoomBtn) {
        elements.cancelCreateRoomBtn.addEventListener('click', () => showScreen('rooms'));
    }
    
    // أحداث الغرفة
    if (elements.leaveRoomBtn) {
        elements.leaveRoomBtn.addEventListener('click', leaveRoom);
    }
    
    if (elements.joinGreenTeamBtn) {
        elements.joinGreenTeamBtn.addEventListener('click', () => joinTeam('green'));
    }
    
    if (elements.joinRedTeamBtn) {
        elements.joinRedTeamBtn.addEventListener('click', () => joinTeam('red'));
    }
    
    if (elements.startRoomGameBtn) {
        elements.startRoomGameBtn.addEventListener('click', startRoomGame);
    }
}

// التحقق من صحة اسم اللاعب
function validatePlayerName() {
    const name = elements.playerNameInput.value.trim();
    const isValid = name.length >= 2 && name.length <= 20;
    elements.joinRoomsBtn.disabled = !isValid;
    
    if (name.length > 0 && name.length < 2) {
        elements.playerNameInput.style.borderColor = '#e74c3c';
    } else if (name.length > 20) {
        elements.playerNameInput.style.borderColor = '#e74c3c';
    } else {
        elements.playerNameInput.style.borderColor = '';
    }
}

// الانضمام للغرف
async function joinRooms() {
    const playerName = elements.playerNameInput.value.trim();
    
    if (!playerName || playerName.length < 2) {
        showToast('يرجى إدخال اسم صالح (2-20 حرف)');
        return;
    }
    
    if (playerName.length > 20) {
        showToast('الاسم طويل جداً');
        return;
    }
    
    try {
        elements.joinRoomsBtn.textContent = 'جاري التحميل...';
        elements.joinRoomsBtn.disabled = true;
        
        const player = await roomsSystem.createPlayer(playerName);
        gameState.currentPlayer = player;
        
        elements.joinRoomsBtn.textContent = 'انضم للعب';
        elements.joinRoomsBtn.disabled = false;
        
        showScreen('rooms');
        await refreshRoomsList();
        
        const dbType = roomsSystem.useFirebase ? 'Firebase' : 'المحلي';
        showToast(`مرحباً ${playerName}! (النظام: ${dbType})`);
        
    } catch (error) {
        elements.joinRoomsBtn.textContent = 'انضم للعب';
        elements.joinRoomsBtn.disabled = false;
        showToast('خطأ في تسجيل الدخول');
        console.error('خطأ في joinRooms:', error);
    }
}

// تسجيل الخروج
function logout() {
    gameState.currentPlayer = null;
    roomsSystem.currentPlayer = null;
    localStorage.removeItem('currentPlayer');
    
    elements.playerNameInput.value = '';
    elements.joinRoomsBtn.disabled = true;
    showScreen('login');
    showToast('تم تسجيل الخروج');
}

// تحديث قائمة الغرف
async function refreshRoomsList() {
    const roomsList = elements.roomsList;
    if (!roomsList) {
        console.error('عنصر roomsList غير موجود');
        return;
    }
    
    // عرض رسالة تحميل
    roomsList.innerHTML = '<div class="loading">🔄 جاري تحديث قائمة الغرف...</div>';
    
    try {
        const rooms = await roomsSystem.getAllRooms();
        
        roomsList.innerHTML = '';
        
        if (rooms.length === 0) {
            const dbType = roomsSystem.useFirebase ? 'Firebase' : 'المحلي';
            roomsList.innerHTML = `
                <div class="no-rooms">
                    <div class="no-rooms-icon">${roomsSystem.useFirebase ? '🌐' : '🏠'}</div>
                    <h3>لا توجد غرف متاحة حالياً</h3>
                    <p>النظام: ${dbType}</p>
                    <p>جميع الغرف التي يتم إنشاؤها تظهر هنا ${roomsSystem.useFirebase ? 'لجميع اللاعبين عبر الإنترنت' : 'محلياً'}</p>
                    <small>يمكنك إنشاء غرفة جديدة وسيتمكن أصدقاؤك من رؤيتها والانضمام إليها</small>
                </div>
            `;
            return;
        }
        
        console.log(`عرض ${rooms.length} غرفة متاحة من ${roomsSystem.useFirebase ? 'Firebase' : 'التخزين المحلي'}`);
        
        rooms.forEach(room => {
            const roomCard = createRoomCard(room);
            roomsList.appendChild(roomCard);
        });
    } catch (error) {
        console.error('خطأ في تحديث قائمة الغرف:', error);
        roomsList.innerHTML = '<div class="no-rooms">خطأ في تحميل الغرف - يرجى المحاولة مرة أخرى</div>';
    }
}

// إنشاء بطاقة غرفة
function createRoomCard(room) {
    const card = document.createElement('div');
    card.className = 'room-card';
    
    const greenCount = room.greenTeam ? room.greenTeam.length : 0;
    const redCount = room.redTeam ? room.redTeam.length : 0;
    const specCount = room.spectators ? room.spectators.length : 0;
    const totalPlayers = greenCount + redCount + specCount;
    
    const isFirebaseRoom = room.id && !room.id.startsWith('local_');
    const roomIcon = isFirebaseRoom ? '🌐' : '🏠';
    
    card.innerHTML = `
        <div class="room-header">
            <h3>${roomIcon} ${room.name}</h3>
            <span class="player-count">${totalPlayers}/8</span>
        </div>
        <div class="teams-preview">
            <div class="team-preview green">
                <span>الفريق الأخضر: ${greenCount}/3</span>
            </div>
            <div class="team-preview red">
                <span>الفريق الأحمر: ${redCount}/3</span>
            </div>
            <div class="team-preview spectators">
                <span>متفرجون: ${specCount}</span>
            </div>
        </div>
        <div class="room-status">
            <span class="status ${room.gameStarted ? 'playing' : 'waiting'}">
                ${room.gameStarted ? '🎮 يلعبون' : '⏳ في الانتظار'}
            </span>
        </div>
        <button class="join-room-btn btn primary" onclick="joinRoom('${room.id}')" 
                ${room.gameStarted ? 'disabled' : ''}>
            ${room.gameStarted ? 'اللعبة قيد التشغيل' : 'انضم للغرفة'}
        </button>
    `;
    
    return card;
}

// إنشاء غرفة جديدة
async function createRoom() {
    const roomName = elements.roomNameInput.value.trim();
    
    if (!roomName || roomName.length < 2) {
        showToast('يرجى إدخال اسم صالح للغرفة');
        return;
    }
    
    if (roomName.length > 30) {
        showToast('اسم الغرفة طويل جداً');
        return;
    }
    
    try {
        elements.createRoomConfirmBtn.textContent = 'جاري الإنشاء...';
        elements.createRoomConfirmBtn.disabled = true;
        
        const roomId = await roomsSystem.createRoom(roomName, gameState.currentPlayer);
        gameState.currentRoom = roomId;
        
        elements.roomNameInput.value = '';
        elements.createRoomConfirmBtn.textContent = 'إنشاء الغرفة';
        elements.createRoomConfirmBtn.disabled = false;
        
        showScreen('room');
        updateRoomDisplay();
        
        const dbType = roomsSystem.useFirebase ? 'Firebase' : 'المحلي';
        showToast(`تم إنشاء الغرفة بنجاح في ${dbType}!`);
        
    } catch (error) {
        elements.createRoomConfirmBtn.textContent = 'إنشاء الغرفة';
        elements.createRoomConfirmBtn.disabled = false;
        showToast(error.message);
        console.error('خطأ في createRoom:', error);
    }
}

// الانضمام للغرفة
async function joinRoom(roomId) {
    try {
        await roomsSystem.joinRoom(roomId, gameState.currentPlayer);
        gameState.currentRoom = roomId;
        
        showScreen('room');
        updateRoomDisplay();
        
        showToast('تم الانضمام للغرفة');
    } catch (error) {
        showToast(error.message);
        console.error('خطأ في joinRoom:', error);
    }
}

// الانضمام للفريق
async function joinTeam(teamColor) {
    if (!gameState.currentRoom || !gameState.currentPlayer) return;
    
    try {
        await roomsSystem.joinTeam(gameState.currentRoom, gameState.currentPlayer.id, teamColor);
        gameState.playerTeam = teamColor;
        updateRoomDisplay();
        
        const teamName = teamColor === 'green' ? 'الأخضر' : 'الأحمر';
        showToast(`تم الانضمام للفريق ${teamName}`);
    } catch (error) {
        showToast(error.message);
        console.error('خطأ في joinTeam:', error);
    }
}

// مغادرة الغرفة
async function leaveRoom() {
    if (!gameState.currentRoom) return;
    
    try {
        await roomsSystem.leaveRoom(gameState.currentRoom, gameState.currentPlayer.id);
        gameState.currentRoom = null;
        gameState.playerTeam = null;
        
        showScreen('rooms');
        refreshRoomsList();
        
        showToast('تم مغادرة الغرفة');
    } catch (error) {
        showToast('خطأ في مغادرة الغرفة');
        console.error('خطأ في leaveRoom:', error);
    }
}

// بدء اللعبة في الغرفة
async function startRoomGame() {
    if (!gameState.currentRoom) return;
    
    try {
        await roomsSystem.startGame(gameState.currentRoom);
        
        showScreen('game');
        startMultiplayerGame();
        
        showToast('تم بدء اللعبة!');
    } catch (error) {
        showToast(error.message);
        console.error('خطأ في startRoomGame:', error);
    }
}

// تحديث عرض الغرفة
async function updateRoomDisplay() {
    if (!gameState.currentRoom) return;
    
    try {
        const room = await roomsSystem.getRoom(gameState.currentRoom);
        if (!room) {
            showToast('الغرفة غير موجودة');
            showScreen('rooms');
            return;
        }
        
        // تحديث اسم الغرفة
        if (elements.currentRoomName) {
            elements.currentRoomName.textContent = room.name;
        }
        
        // تحديث قوائم الفرق
        updateTeamList('green', room.greenTeam || []);
        updateTeamList('red', room.redTeam || []);
        updateSpectatorsList(room.spectators || []);
        
        // تحديث حالة الأزرار
        updateRoomButtons(room);
        
    } catch (error) {
        console.error('خطأ في updateRoomDisplay:', error);
    }
}

// تحديث قائمة فريق
function updateTeamList(teamColor, players) {
    const listElement = teamColor === 'green' ? elements.greenTeamList : elements.redTeamList;
    if (!listElement) return;
    
    listElement.innerHTML = '';
    
    if (players.length === 0) {
        listElement.innerHTML = '<li class="empty-team">لا يوجد لاعبين</li>';
        return;
    }
    
    players.forEach(player => {
        const li = document.createElement('li');
        li.className = 'player-item';
        li.innerHTML = `
            <span class="player-name">${player.name}</span>
            ${player.id === gameState.currentPlayer?.id ? '<span class="you-indicator">أنت</span>' : ''}
        `;
        listElement.appendChild(li);
    });
}

// تحديث قائمة المتفرجين
function updateSpectatorsList(spectators) {
    if (!elements.spectatorsList) return;
    
    elements.spectatorsList.innerHTML = '';
    
    if (spectators.length === 0) {
        elements.spectatorsList.innerHTML = '<li class="empty-team">لا يوجد متفرجين</li>';
        return;
    }
    
    spectators.forEach(player => {
        const li = document.createElement('li');
        li.className = 'player-item';
        li.innerHTML = `
            <span class="player-name">${player.name}</span>
            ${player.id === gameState.currentPlayer?.id ? '<span class="you-indicator">أنت</span>' : ''}
        `;
        elements.spectatorsList.appendChild(li);
    });
}

// تحديث حالة أزرار الغرفة
function updateRoomButtons(room) {
    if (!room || !gameState.currentPlayer) return;
    
    const isCreator = room.creator === gameState.currentPlayer.id;
    const canStartGame = isCreator && !room.gameStarted && 
                        room.greenTeam && room.redTeam && 
                        room.greenTeam.length > 0 && room.redTeam.length > 0;
    
    if (elements.startRoomGameBtn) {
        elements.startRoomGameBtn.disabled = !canStartGame;
        elements.startRoomGameBtn.style.display = isCreator ? 'block' : 'none';
    }
    
    if (elements.joinGreenTeamBtn) {
        elements.joinGreenTeamBtn.disabled = room.gameStarted || 
                                           (room.greenTeam && room.greenTeam.length >= 3);
    }
    
    if (elements.joinRedTeamBtn) {
        elements.joinRedTeamBtn.disabled = room.gameStarted || 
                                          (room.redTeam && room.redTeam.length >= 3);
    }
}

// عرض الشاشات
function showScreen(screenName) {
    Object.values(screens).forEach(screen => {
        if (screen) {
            screen.classList.remove('active');
        }
    });
    
    if (screens[screenName]) {
        screens[screenName].classList.add('active');
        console.log('تم عرض الشاشة:', screenName);
        
        if (screenName === 'rooms') {
            setTimeout(() => {
                refreshRoomsList();
            }, 100);
        }
    } else {
        console.error('الشاشة غير موجودة:', screenName);
    }
}

// إخفاء جميع الشاشات فوراً
function hideAllScreensImmediately() {
    const allScreens = document.querySelectorAll('.screen');
    allScreens.forEach(screen => {
        screen.classList.remove('active');
    });
    
    Object.values(screens).forEach(screen => {
        if (screen) {
            screen.classList.remove('active');
        }
    });
}

// عرض رسالة Toast
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// فحص التحديثات
function checkForUpdates() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(registration => {
            if (registration) {
                registration.update();
            }
        });
    }
}

// إعادة تحميل قسري
function forceRefresh() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(registration => {
                registration.unregister();
            });
            window.location.reload(true);
        });
    } else {
        window.location.reload(true);
    }
}

// بدء اللعبة متعددة اللاعبين (مبسط)
function startMultiplayerGame() {
    // هذه دالة مبسطة، يمكن توسيعها لاحقاً
    gameState.isMultiplayer = true;
    gameState.gameStarted = true;
    
    // إنشاء شبكة الحروف
    generateLettersGrid();
    
    showToast('بدأت اللعبة! حظ سعيد!');
}

// توليد شبكة الحروف
function generateLettersGrid() {
    if (!elements.lettersGrid) return;
    
    elements.lettersGrid.innerHTML = '';
    gameState.letters = [];
    
    const shuffled = [...arabicLetters].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < 25; i++) {
        const letter = {
            id: i,
            letter: shuffled[i],
            owner: null,
            answered: false
        };
        
        gameState.letters.push(letter);
        
        const cell = document.createElement('div');
        cell.className = 'letter-cell';
        cell.textContent = letter.letter;
        cell.dataset.letterId = i;
        
        cell.addEventListener('click', () => handleLetterClick(i));
        
        elements.lettersGrid.appendChild(cell);
    }
}

// معالجة النقر على الحرف
function handleLetterClick(letterId) {
    // دالة مبسطة للنقر على الحرف
    console.log('تم النقر على الحرف:', letterId);
    showToast('ميزة اللعب قيد التطوير');
}
