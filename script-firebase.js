// متغيرات اللعبة الرئيسية مع دعم Firebase
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
    
    // متغيرات جديدة للغرف مع Firebase
    isMultiplayer: false,
    currentRoom: null,
    currentPlayer: null,
    playerRole: null, // 'player' or 'spectator'
    playerTeam: null, // 'green' or 'red'
    
    // متغيرات Firebase
    firebaseReady: false,
    connectionStatus: 'disconnected'
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
    // Login elements
    playerNameInput: document.getElementById('player-name-input'),
    joinRoomsBtn: document.getElementById('join-rooms-btn'),
    
    // Rooms elements
    roomsList: document.getElementById('rooms-list'),
    refreshRoomsBtn: document.getElementById('refresh-rooms-btn'),
    createRoomBtn: document.getElementById('create-room-btn'),
    backToLoginBtn: document.getElementById('back-to-login-btn'),
    
    // Create room elements
    roomNameInput: document.getElementById('room-name-input'),
    createRoomSubmitBtn: document.getElementById('create-room-submit-btn'),
    cancelCreateRoomBtn: document.getElementById('cancel-create-room-btn'),
    
    // Room elements
    roomName: document.getElementById('room-name'),
    greenTeam: document.getElementById('green-team'),
    redTeam: document.getElementById('red-team'),
    spectators: document.getElementById('spectators'),
    joinGreenBtn: document.getElementById('join-green-btn'),
    joinRedBtn: document.getElementById('join-red-btn'),
    spectateBtn: document.getElementById('spectate-btn'),
    startGameBtn: document.getElementById('start-game-btn'),
    leaveRoomBtn: document.getElementById('leave-room-btn'),
    
    // Team setup elements
    greenPlayersDiv: document.getElementById('green-players'),
    redPlayersDiv: document.getElementById('red-players'),
    
    // Game elements
    gameGrid: document.getElementById('game-grid'),
    currentTurnSpan: document.getElementById('current-turn'),
    questionDisplay: document.getElementById('question-display'),
    answerOptions: document.getElementById('answer-options'),
    timerDisplay: document.getElementById('timer-display'),
    greenScoreSpan: document.getElementById('green-score'),
    redScoreSpan: document.getElementById('red-score'),
    
    // Results elements
    winnerAnnouncement: document.getElementById('winner-announcement'),
    finalGreenScore: document.getElementById('final-green-score'),
    finalRedScore: document.getElementById('final-red-score'),
    playAgainBtn: document.getElementById('play-again-btn'),
    backToRoomsBtn: document.getElementById('back-to-rooms-btn'),
    
    // Buttons
    startGameMainBtn: document.getElementById('start-game-main-btn'),
    joinGameBtn: document.getElementById('join-game-btn'),
    gameRulesBtn: document.getElementById('game-rules-btn'),
    
    // Status indicators
    connectionStatus: document.getElementById('connection-status'),
    gameStatus: document.getElementById('game-status')
};

// متغير Firebase Manager
let firebaseManager = null;

// نظام الغرف مع دعم Firebase
let roomsSystem = {
    currentPlayer: null,
    useFirebase: false,
    
    // تهيئة Firebase
    initialize: async function() {
        try {
            // التحقق من وجود Firebase Manager
            if (window.FirebaseManager) {
                this.useFirebase = true;
                firebaseManager = new window.FirebaseManager();
                await firebaseManager.initialize();
                gameState.firebaseReady = true;
                gameState.connectionStatus = 'connected';
                console.log('تم تهيئة Firebase بنجاح');
                updateConnectionStatus('connected');
                return true;
            } else {
                console.log('Firebase غير متوفر، استخدام النظام المحلي');
                this.useFirebase = false;
                gameState.connectionStatus = 'local';
                updateConnectionStatus('local');
                return false;
            }
        } catch (error) {
            console.error('خطأ في تهيئة Firebase:', error);
            this.useFirebase = false;
            gameState.connectionStatus = 'error';
            updateConnectionStatus('error');
            return false;
        }
    },
    
    // إنشاء لاعب جديد
    createPlayer: function(name) {
        return {
            id: 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name: name.trim(),
            avatar: this.generateAvatar(),
            joinedAt: new Date()
        };
    },
    
    // توليد أفاتار عشوائي
    generateAvatar: function() {
        const avatars = ['👤', '👨', '👩', '🧑', '👱', '👨‍💼', '👩‍💼', '🧑‍💼'];
        return avatars[Math.floor(Math.random() * avatars.length)];
    },
    
    // تسجيل الدخول
    login: function(playerName) {
        if (!playerName || playerName.trim().length < 2) {
            throw new Error('يجب أن يكون الاسم مكوناً من حرفين على الأقل');
        }
        
        this.currentPlayer = this.createPlayer(playerName);
        this.saveToStorage();
        return this.currentPlayer;
    },
    
    // الحصول على اللاعب الحالي
    getCurrentPlayer: function() {
        return this.currentPlayer;
    },
    
    // تسجيل الخروج
    logout: function() {
        this.currentPlayer = null;
        this.saveToStorage();
    },
    
    // إنشاء غرفة جديدة
    createRoom: async function(roomName, creatorPlayer) {
        try {
            const room = {
                id: 'room_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                name: roomName,
                creator: creatorPlayer.id,
                greenTeam: [],
                redTeam: [],
                spectators: [creatorPlayer],
                gameStarted: false,
                createdAt: new Date(),
                lastActivity: new Date()
            };
            
            if (this.useFirebase && firebaseManager) {
                const success = await firebaseManager.createRoom(room);
                if (success) {
                    console.log('تم إنشاء الغرفة في Firebase:', room.id);
                    return room;
                } else {
                    throw new Error('فشل في إنشاء الغرفة في Firebase');
                }
            } else {
                // النظام المحلي
                console.log('تم إنشاء الغرفة محلياً:', room.id);
                return room;
            }
        } catch (error) {
            console.error('خطأ في إنشاء الغرفة:', error);
            throw error;
        }
    },
    
    // الحصول على جميع الغرف
    getRooms: async function() {
        try {
            if (this.useFirebase && firebaseManager) {
                const rooms = await firebaseManager.getRooms();
                console.log('تم جلب الغرف من Firebase:', rooms.length);
                return rooms;
            } else {
                // النظام المحلي - إرجاع مصفوفة فارغة
                return [];
            }
        } catch (error) {
            console.error('خطأ في جلب الغرف:', error);
            return [];
        }
    },
    
    // الانضمام لغرفة
    joinRoom: async function(roomId, player) {
        try {
            if (this.useFirebase && firebaseManager) {
                const success = await firebaseManager.joinRoom(roomId, player);
                if (success) {
                    console.log('تم الانضمام للغرفة:', roomId);
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('خطأ في الانضمام للغرفة:', error);
            return false;
        }
    },
    
    // مغادرة غرفة
    leaveRoom: async function(roomId, playerId) {
        try {
            if (this.useFirebase && firebaseManager) {
                const success = await firebaseManager.leaveRoom(roomId, playerId);
                if (success) {
                    console.log('تم مغادرة الغرفة:', roomId);
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('خطأ في مغادرة الغرفة:', error);
            return false;
        }
    },
    
    // الانضمام لفريق
    joinTeam: async function(roomId, playerId, teamColor) {
        try {
            if (this.useFirebase && firebaseManager) {
                const success = await firebaseManager.joinTeam(roomId, playerId, teamColor);
                if (success) {
                    console.log(`تم الانضمام للفريق ${teamColor} في الغرفة ${roomId}`);
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('خطأ في الانضمام للفريق:', error);
            return false;
        }
    },
    
    // حفظ للتخزين المحلي
    saveToStorage: function() {
        try {
            if (this.currentPlayer) {
                localStorage.setItem('currentPlayer', JSON.stringify(this.currentPlayer));
            }
        } catch (error) {
            console.error('خطأ في حفظ بيانات اللاعب:', error);
        }
    },
    
    // تحميل من التخزين المحلي
    loadFromStorage: function() {
        try {
            const stored = localStorage.getItem('currentPlayer');
            if (stored) {
                this.currentPlayer = JSON.parse(stored);
                return true;
            }
        } catch (error) {
            console.error('خطأ في تحميل بيانات اللاعب:', error);
        }
        return false;
    },
    
    // مسح البيانات
    clearStorage: function() {
        localStorage.removeItem('currentPlayer');
        this.currentPlayer = null;
    }
};

// دوال عرض الشاشات
function showScreen(screenName) {
    // إخفاء جميع الشاشات
    Object.values(screens).forEach(screen => {
        if (screen) {
            screen.classList.remove('active');
        }
    });
    
    // عرض الشاشة المطلوبة
    if (screens[screenName]) {
        screens[screenName].classList.add('active');
        console.log(`تم عرض شاشة: ${screenName}`);
    } else {
        console.error(`الشاشة غير موجودة: ${screenName}`);
    }
}

// دالة عرض الرسائل
function showToast(message, type = 'info') {
    // إنشاء عنصر الرسالة
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // إضافة الرسالة للصفحة
    document.body.appendChild(toast);
    
    // عرض الرسالة
    setTimeout(() => toast.classList.add('show'), 100);
    
    // إخفاء الرسالة بعد 3 ثوان
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}

// تحديث حالة الاتصال
function updateConnectionStatus(status) {
    if (!elements.connectionStatus) return;
    
    const statusMessages = {
        'connected': '🟢 متصل بـ Firebase',
        'local': '🟡 وضع محلي',
        'error': '🔴 خطأ في الاتصال',
        'disconnected': '⚫ غير متصل'
    };
    
    elements.connectionStatus.textContent = statusMessages[status] || statusMessages['disconnected'];
    elements.connectionStatus.className = `connection-status status-${status}`;
}

// دالة التحقق من صحة اسم اللاعب
function validatePlayerName() {
    const name = elements.playerNameInput?.value?.trim() || '';
    const isValid = name.length >= 2;
    
    if (elements.joinRoomsBtn) {
        elements.joinRoomsBtn.disabled = !isValid;
        elements.joinRoomsBtn.classList.toggle('disabled', !isValid);
    }
    
    return isValid;
}

// دالة الانضمام للغرف
async function joinRooms() {
    try {
        const playerName = elements.playerNameInput?.value?.trim();
        
        if (!validatePlayerName()) {
            showToast('يجب أن يكون الاسم مكوناً من حرفين على الأقل', 'error');
            return;
        }
        
        const player = roomsSystem.login(playerName);
        gameState.currentPlayer = player;
        
        showScreen('rooms');
        await refreshRoomsList();
        showToast(`مرحباً ${player.name}!`, 'success');
        
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        showToast(error.message, 'error');
    }
}

// دالة تحديث قائمة الغرف
async function refreshRoomsList() {
    if (!elements.roomsList) return;
    
    // مسح القائمة الحالية
    elements.roomsList.innerHTML = '<p class="loading">جاري تحميل الغرف...</p>';
    
    try {
        const rooms = await roomsSystem.getRooms();
        
        // مسح رسالة التحميل
        elements.roomsList.innerHTML = '';
        
        if (rooms.length === 0) {
            // رسالة عدم وجود غرف
            const noRoomsMsg = document.createElement('div');
            noRoomsMsg.className = 'no-rooms-message';
            noRoomsMsg.innerHTML = `
                <p>لا توجد غرف متاحة حالياً</p>
                <p>أنشئ غرفة جديدة للبدء!</p>
            `;
            elements.roomsList.appendChild(noRoomsMsg);
        } else {
            // عرض الغرف
            rooms.forEach(room => {
                const roomElement = createRoomElement(room);
                elements.roomsList.appendChild(roomElement);
            });
        }
        
    } catch (error) {
        console.error('خطأ في تحديث قائمة الغرف:', error);
        elements.roomsList.innerHTML = '<p class="error">خطأ في تحميل الغرف</p>';
        showToast('خطأ في تحميل الغرف', 'error');
    }
}

// إنشاء عنصر الغرفة
function createRoomElement(room) {
    const roomDiv = document.createElement('div');
    roomDiv.className = 'room-card';
    
    const totalPlayers = room.greenTeam.length + room.redTeam.length;
    const statusText = room.gameStarted ? 'جارية' : 'في الانتظار';
    const statusClass = room.gameStarted ? 'playing' : 'waiting';
    
    roomDiv.innerHTML = `
        <div class="room-header">
            <h3 class="room-name">${room.name}</h3>
            <span class="room-status ${statusClass}">${statusText}</span>
        </div>
        <div class="room-info">
            <span class="players-count">👥 ${totalPlayers}/6 لاعبين</span>
            <span class="spectators-count">👁️ ${room.spectators.length} متفرج</span>
        </div>
        <div class="room-teams">
            <div class="team-info green">
                <span>🟢 ${room.greenTeam.length}/3</span>
            </div>
            <div class="team-info red">
                <span>🔴 ${room.redTeam.length}/3</span>
            </div>
        </div>
        <button class="join-room-btn" ${room.gameStarted ? 'disabled' : ''} 
                onclick="joinRoomById('${room.id}')">
            ${room.gameStarted ? 'مشاهدة' : 'انضمام'}
        </button>
    `;
    
    return roomDiv;
}

// الانضمام لغرفة بواسطة ID
async function joinRoomById(roomId) {
    try {
        if (!gameState.currentPlayer) {
            showToast('يجب تسجيل الدخول أولاً', 'error');
            return;
        }
        
        const success = await roomsSystem.joinRoom(roomId, gameState.currentPlayer);
        if (success) {
            // الحصول على بيانات الغرفة المحدثة
            const rooms = await roomsSystem.getRooms();
            const room = rooms.find(r => r.id === roomId);
            
            if (room) {
                gameState.currentRoom = room;
                showScreen('room');
                updateRoomDisplay();
                showToast(`انضممت للغرفة "${room.name}"`, 'success');
            }
        } else {
            showToast('فشل في الانضمام للغرفة', 'error');
        }
    } catch (error) {
        console.error('خطأ في الانضمام للغرفة:', error);
        showToast('حدث خطأ في الانضمام للغرفة', 'error');
    }
}

// دالة عرض شاشة إنشاء غرفة
function showCreateRoom() {
    showScreen('createRoom');
    if (elements.roomNameInput) {
        elements.roomNameInput.value = '';
        elements.roomNameInput.focus();
    }
}

// دالة إنشاء غرفة جديدة
async function createRoom() {
    try {
        const roomName = elements.roomNameInput?.value?.trim();
        
        if (!roomName || roomName.length < 3) {
            showToast('يجب أن يكون اسم الغرفة مكوناً من 3 أحرف على الأقل', 'error');
            return;
        }
        
        if (!gameState.currentPlayer) {
            showToast('يجب تسجيل الدخول أولاً', 'error');
            showScreen('login');
            return;
        }
        
        const room = await roomsSystem.createRoom(roomName, gameState.currentPlayer);
        gameState.currentRoom = room;
        
        showScreen('room');
        updateRoomDisplay();
        showToast(`تم إنشاء الغرفة "${roomName}" بنجاح!`, 'success');
        
    } catch (error) {
        console.error('خطأ في إنشاء الغرفة:', error);
        showToast('حدث خطأ في إنشاء الغرفة', 'error');
    }
}

// دالة تحديث عرض الغرفة
function updateRoomDisplay() {
    const room = gameState.currentRoom;
    if (!room) return;
    
    // تحديث اسم الغرفة
    if (elements.roomName) {
        elements.roomName.textContent = room.name;
    }
    
    // تحديث الفرق
    updateTeamDisplay('green', room.greenTeam);
    updateTeamDisplay('red', room.redTeam);
    updateSpectatorsDisplay(room.spectators);
    
    // تحديث الأزرار
    updateRoomButtons(room);
}

// دالة تحديث عرض الفريق
function updateTeamDisplay(teamColor, players) {
    const teamElement = elements[teamColor + 'Team'];
    if (!teamElement) return;
    
    teamElement.innerHTML = '';
    
    if (players.length === 0) {
        teamElement.innerHTML = '<p class="empty-team">لا يوجد لاعبون</p>';
        return;
    }
    
    players.forEach(player => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-card';
        playerDiv.innerHTML = `
            <span class="player-avatar">${player.avatar}</span>
            <span class="player-name">${player.name}</span>
        `;
        teamElement.appendChild(playerDiv);
    });
}

// دالة تحديث عرض المتفرجين
function updateSpectatorsDisplay(spectators) {
    if (!elements.spectators) return;
    
    elements.spectators.innerHTML = '';
    
    if (spectators.length === 0) {
        elements.spectators.innerHTML = '<p class="empty-spectators">لا يوجد متفرجون</p>';
        return;
    }
    
    spectators.forEach(player => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'spectator-card';
        playerDiv.innerHTML = `
            <span class="player-avatar">${player.avatar}</span>
            <span class="player-name">${player.name}</span>
        `;
        elements.spectators.appendChild(playerDiv);
    });
}

// دالة تحديث أزرار الغرفة
function updateRoomButtons(room) {
    const currentPlayer = gameState.currentPlayer;
    if (!currentPlayer) return;
    
    // التحقق من إمكانية الانضمام للفرق
    const canJoinGreen = room.greenTeam.length < 3 && !room.gameStarted;
    const canJoinRed = room.redTeam.length < 3 && !room.gameStarted;
    
    if (elements.joinGreenBtn) {
        elements.joinGreenBtn.disabled = !canJoinGreen;
        elements.joinGreenBtn.classList.toggle('disabled', !canJoinGreen);
    }
    
    if (elements.joinRedBtn) {
        elements.joinRedBtn.disabled = !canJoinRed;
        elements.joinRedBtn.classList.toggle('disabled', !canJoinRed);
    }
    
    // زر بدء اللعبة (للمنشئ فقط)
    if (elements.startGameBtn) {
        const canStart = (room.creator === currentPlayer.id) && 
                        (room.greenTeam.length > 0) && 
                        (room.redTeam.length > 0) && 
                        !room.gameStarted;
        
        elements.startGameBtn.style.display = (room.creator === currentPlayer.id) ? 'block' : 'none';
        elements.startGameBtn.disabled = !canStart;
        elements.startGameBtn.classList.toggle('disabled', !canStart);
    }
}

// دالة الانضمام لفريق
async function joinTeam(teamColor) {
    const room = gameState.currentRoom;
    const currentPlayer = gameState.currentPlayer;
    
    if (!room || !currentPlayer) return;
    
    try {
        const success = await roomsSystem.joinTeam(room.id, currentPlayer.id, teamColor);
        if (success) {
            gameState.playerTeam = teamColor;
            showToast(`انضممت للفريق ${teamColor === 'green' ? 'الأخضر' : 'الأحمر'}!`, 'success');
            // تحديث عرض الغرفة
            setTimeout(updateRoomDisplay, 1000);
        } else {
            showToast('فشل في الانضمام للفريق', 'error');
        }
    } catch (error) {
        console.error('خطأ في الانضمام للفريق:', error);
        showToast('حدث خطأ في الانضمام للفريق', 'error');
    }
}

// دالة المشاهدة
async function spectate() {
    const room = gameState.currentRoom;
    const currentPlayer = gameState.currentPlayer;
    
    if (!room || !currentPlayer) return;
    
    try {
        const success = await roomsSystem.joinTeam(room.id, currentPlayer.id, 'spectator');
        if (success) {
            gameState.playerTeam = null;
            gameState.playerRole = 'spectator';
            showToast('أصبحت متفرجاً!', 'info');
            // تحديث عرض الغرفة
            setTimeout(updateRoomDisplay, 1000);
        } else {
            showToast('فشل في المشاهدة', 'error');
        }
    } catch (error) {
        console.error('خطأ في المشاهدة:', error);
        showToast('حدث خطأ في المشاهدة', 'error');
    }
}

// دالة بدء اللعبة
async function startGame() {
    const room = gameState.currentRoom;
    const currentPlayer = gameState.currentPlayer;
    
    if (!room || !currentPlayer) return;
    
    if (room.creator !== currentPlayer.id) {
        showToast('يمكن لمنشئ الغرفة فقط بدء اللعبة', 'error');
        return;
    }
    
    if (room.greenTeam.length === 0 || room.redTeam.length === 0) {
        showToast('يجب أن يكون هناك لاعب واحد على الأقل في كل فريق', 'error');
        return;
    }
    
    try {
        // بدء اللعبة في Firebase
        if (roomsSystem.useFirebase && firebaseManager) {
            const success = await firebaseManager.startGame(room.id);
            if (success) {
                room.gameStarted = true;
                gameState.gameStarted = true;
                gameState.isMultiplayer = true;
                
                // نسخ الفرق إلى حالة اللعبة
                gameState.teams.green.players = [...room.greenTeam];
                gameState.teams.red.players = [...room.redTeam];
                
                showScreen('game');
                initializeGame();
                showToast('بدأت اللعبة!', 'success');
            } else {
                showToast('فشل في بدء اللعبة', 'error');
            }
        }
    } catch (error) {
        console.error('خطأ في بدء اللعبة:', error);
        showToast('حدث خطأ في بدء اللعبة', 'error');
    }
}

// دالة مغادرة الغرفة
async function leaveRoom() {
    const room = gameState.currentRoom;
    const currentPlayer = gameState.currentPlayer;
    
    if (room && currentPlayer) {
        try {
            await roomsSystem.leaveRoom(room.id, currentPlayer.id);
        } catch (error) {
            console.error('خطأ في مغادرة الغرفة:', error);
        }
    }
    
    gameState.currentRoom = null;
    gameState.playerTeam = null;
    gameState.playerRole = null;
    gameState.isMultiplayer = false;
    
    showScreen('rooms');
    await refreshRoomsList();
    showToast('غادرت الغرفة', 'info');
}

// دالة العودة لتسجيل الدخول
function backToLogin() {
    roomsSystem.logout();
    gameState.currentPlayer = null;
    showScreen('login');
    
    if (elements.playerNameInput) {
        elements.playerNameInput.value = '';
    }
}

// دالة إلغاء إنشاء الغرفة
function cancelCreateRoom() {
    showScreen('rooms');
    if (elements.roomNameInput) {
        elements.roomNameInput.value = '';
    }
}

// تهيئة اللعبة
function initializeGame() {
    gameState.letters = generateGameLetters();
    gameState.usedQuestions = [];
    gameState.currentTurn = 'green';
    gameState.gameStarted = true;
    gameState.gameEnded = false;
    
    // إعادة تعيين النقاط
    gameState.teams.green.score = 0;
    gameState.teams.red.score = 0;
    
    createGameGrid();
    updateScoreDisplay();
    updateTurnDisplay();
    
    console.log('تم تهيئة اللعبة');
}

// إنشاء أحرف اللعبة
function generateGameLetters() {
    const shuffled = [...arabicLetters].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 25).map((letter, index) => ({
        id: index,
        letter: letter,
        revealed: false,
        team: null,
        position: index
    }));
}

// إنشاء شبكة اللعبة
function createGameGrid() {
    if (!elements.gameGrid) return;
    
    elements.gameGrid.innerHTML = '';
    
    gameState.letters.forEach(letterObj => {
        const letterElement = document.createElement('div');
        letterElement.className = 'game-letter';
        letterElement.textContent = letterObj.letter;
        letterElement.dataset.letterId = letterObj.id;
        
        letterElement.addEventListener('click', () => handleLetterClick(letterObj.id));
        
        elements.gameGrid.appendChild(letterElement);
    });
}

// معالجة النقر على الحرف
function handleLetterClick(letterId) {
    console.log('تم النقر على الحرف:', letterId);
    showToast('ميزة اللعب قيد التطوير', 'info');
}

// تحديث عرض النقاط
function updateScoreDisplay() {
    if (elements.greenScoreSpan) {
        elements.greenScoreSpan.textContent = gameState.teams.green.score;
    }
    if (elements.redScoreSpan) {
        elements.redScoreSpan.textContent = gameState.teams.red.score;
    }
}

// تحديث عرض الدور الحالي
function updateTurnDisplay() {
    if (elements.currentTurnSpan) {
        const currentTeamName = gameState.teams[gameState.currentTurn].name;
        elements.currentTurnSpan.textContent = currentTeamName;
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
    if (elements.refreshRoomsBtn) {
        elements.refreshRoomsBtn.addEventListener('click', refreshRoomsList);
    }
    
    if (elements.createRoomBtn) {
        elements.createRoomBtn.addEventListener('click', showCreateRoom);
    }
    
    if (elements.backToLoginBtn) {
        elements.backToLoginBtn.addEventListener('click', backToLogin);
    }
    
    // أحداث إنشاء الغرفة
    if (elements.roomNameInput) {
        elements.roomNameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                createRoom();
            }
        });
    }
    
    if (elements.createRoomSubmitBtn) {
        elements.createRoomSubmitBtn.addEventListener('click', createRoom);
    }
    
    if (elements.cancelCreateRoomBtn) {
        elements.cancelCreateRoomBtn.addEventListener('click', cancelCreateRoom);
    }
    
    // أحداث الغرفة
    if (elements.joinGreenBtn) {
        elements.joinGreenBtn.addEventListener('click', () => joinTeam('green'));
    }
    
    if (elements.joinRedBtn) {
        elements.joinRedBtn.addEventListener('click', () => joinTeam('red'));
    }
    
    if (elements.spectateBtn) {
        elements.spectateBtn.addEventListener('click', spectate);
    }
    
    if (elements.startGameBtn) {
        elements.startGameBtn.addEventListener('click', startGame);
    }
    
    if (elements.leaveRoomBtn) {
        elements.leaveRoomBtn.addEventListener('click', leaveRoom);
    }
    
    // أحداث اللعبة الرئيسية
    if (elements.startGameMainBtn) {
        elements.startGameMainBtn.addEventListener('click', function() {
            gameState.isMultiplayer = false;
            showScreen('teamSetup');
        });
    }
    
    if (elements.joinGameBtn) {
        elements.joinGameBtn.addEventListener('click', function() {
            showScreen('login');
        });
    }
    
    // أحداث النتائج
    if (elements.playAgainBtn) {
        elements.playAgainBtn.addEventListener('click', function() {
            if (gameState.isMultiplayer) {
                showScreen('room');
                updateRoomDisplay();
            } else {
                showScreen('teamSetup');
            }
        });
    }
    
    if (elements.backToRoomsBtn) {
        elements.backToRoomsBtn.addEventListener('click', function() {
            showScreen('rooms');
            refreshRoomsList();
        });
    }
}

// حفظ حالة اللعبة
function saveGameState() {
    try {
        const stateToSave = {
            currentPlayer: gameState.currentPlayer,
            isMultiplayer: gameState.isMultiplayer,
            firebaseReady: gameState.firebaseReady,
            timestamp: Date.now()
        };
        localStorage.setItem('gameState', JSON.stringify(stateToSave));
    } catch (error) {
        console.error('خطأ في حفظ حالة اللعبة:', error);
    }
}

// استرجاع حالة اللعبة
function loadGameState() {
    try {
        const saved = localStorage.getItem('gameState');
        if (saved) {
            const state = JSON.parse(saved);
            if (state.currentPlayer) {
                gameState.currentPlayer = state.currentPlayer;
                roomsSystem.currentPlayer = state.currentPlayer;
            }
            gameState.isMultiplayer = state.isMultiplayer || false;
            gameState.firebaseReady = state.firebaseReady || false;
        }
    } catch (error) {
        console.error('خطأ في استرجاع حالة اللعبة:', error);
    }
}

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async function() {
    console.log('بدء تحميل التطبيق مع دعم Firebase...');
    
    // تهيئة Firebase
    updateConnectionStatus('disconnected');
    await roomsSystem.initialize();
    
    // تحميل بيانات اللاعب المحفوظة
    roomsSystem.loadFromStorage();
    loadGameState();
    
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
    
    console.log('تمت تهيئة التطبيق مع Firebase');
});

// حفظ البيانات عند إغلاق النافذة
window.addEventListener('beforeunload', function() {
    if (roomsSystem && roomsSystem.saveToStorage) {
        roomsSystem.saveToStorage();
    }
    saveGameState();
});
