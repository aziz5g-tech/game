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

// نظام الغرف
let roomsSystem = {
    currentPlayer: null,
    
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
function joinRooms() {
    try {
        const playerName = elements.playerNameInput?.value?.trim();
        
        if (!validatePlayerName()) {
            showToast('يجب أن يكون الاسم مكوناً من حرفين على الأقل', 'error');
            return;
        }
        
        const player = roomsSystem.login(playerName);
        gameState.currentPlayer = player;
        
        showScreen('rooms');
        refreshRoomsList();
        showToast(`مرحباً ${player.name}!`, 'success');
        
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        showToast(error.message, 'error');
    }
}

// دالة تحديث قائمة الغرف
function refreshRoomsList() {
    if (!elements.roomsList) return;
    
    // مسح القائمة الحالية
    elements.roomsList.innerHTML = '';
    
    // رسالة عدم وجود غرف
    const noRoomsMsg = document.createElement('div');
    noRoomsMsg.className = 'no-rooms-message';
    noRoomsMsg.innerHTML = `
        <p>لا توجد غرف متاحة حالياً</p>
        <p>أنشئ غرفة جديدة للبدء!</p>
    `;
    elements.roomsList.appendChild(noRoomsMsg);
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
function createRoom() {
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
        
        // إنشاء غرفة محلية (للعرض التوضيحي)
        const room = {
            id: 'room_' + Date.now(),
            name: roomName,
            creator: gameState.currentPlayer.id,
            greenTeam: [],
            redTeam: [],
            spectators: [gameState.currentPlayer],
            gameStarted: false,
            createdAt: new Date()
        };
        
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
function joinTeam(teamColor) {
    const room = gameState.currentRoom;
    const currentPlayer = gameState.currentPlayer;
    
    if (!room || !currentPlayer) return;
    
    try {
        // إزالة اللاعب من جميع الفرق
        room.greenTeam = room.greenTeam.filter(p => p.id !== currentPlayer.id);
        room.redTeam = room.redTeam.filter(p => p.id !== currentPlayer.id);
        room.spectators = room.spectators.filter(p => p.id !== currentPlayer.id);
        
        // إضافة اللاعب للفريق المحدد
        if (teamColor === 'green') {
            if (room.greenTeam.length >= 3) {
                throw new Error('الفريق الأخضر ممتلئ');
            }
            room.greenTeam.push(currentPlayer);
            gameState.playerTeam = 'green';
        } else if (teamColor === 'red') {
            if (room.redTeam.length >= 3) {
                throw new Error('الفريق الأحمر ممتلئ');
            }
            room.redTeam.push(currentPlayer);
            gameState.playerTeam = 'red';
        }
        
        updateRoomDisplay();
        showToast(`انضممت للفريق ${teamColor === 'green' ? 'الأخضر' : 'الأحمر'}!`, 'success');
        
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// دالة المشاهدة
function spectate() {
    const room = gameState.currentRoom;
    const currentPlayer = gameState.currentPlayer;
    
    if (!room || !currentPlayer) return;
    
    // إزالة اللاعب من جميع الفرق
    room.greenTeam = room.greenTeam.filter(p => p.id !== currentPlayer.id);
    room.redTeam = room.redTeam.filter(p => p.id !== currentPlayer.id);
    room.spectators = room.spectators.filter(p => p.id !== currentPlayer.id);
    
    // إضافة للمتفرجين
    room.spectators.push(currentPlayer);
    gameState.playerTeam = null;
    gameState.playerRole = 'spectator';
    
    updateRoomDisplay();
    showToast('أصبحت متفرجاً!', 'info');
}

// دالة بدء اللعبة
function startGame() {
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
    
    // بدء اللعبة
    room.gameStarted = true;
    gameState.gameStarted = true;
    gameState.isMultiplayer = true;
    
    // نسخ الفرق إلى حالة اللعبة
    gameState.teams.green.players = [...room.greenTeam];
    gameState.teams.red.players = [...room.redTeam];
    
    showScreen('game');
    initializeGame();
    showToast('بدأت اللعبة!', 'success');
}

// دالة مغادرة الغرفة
function leaveRoom() {
    gameState.currentRoom = null;
    gameState.playerTeam = null;
    gameState.playerRole = null;
    gameState.isMultiplayer = false;
    
    showScreen('rooms');
    refreshRoomsList();
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
        }
    } catch (error) {
        console.error('خطأ في استرجاع حالة اللعبة:', error);
    }
}

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    console.log('بدء تحميل التطبيق...');
    
    // تحميل بيانات اللاعب المحفوظة
    roomsSystem.loadFromStorage();
    loadGameState();
    
    // إعداد مستمعي الأحداث
    setupEventListeners();
    console.log('تم إعداد أحداث العناصر');
    
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
    
    console.log('تمت تهيئة التطبيق');
});

// حفظ البيانات عند إغلاق النافذة
window.addEventListener('beforeunload', function() {
    if (roomsSystem && roomsSystem.saveToStorage) {
        roomsSystem.saveToStorage();
    }
    saveGameState();
});
