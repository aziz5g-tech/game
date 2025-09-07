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
document.addEventListener('DOMContentLoaded', function() {
    console.log('تم تحميل الصفحة، بدء التهيئة...');
    
    // إخفاء جميع الشاشات أولاً لمنع الوميض
    hideAllScreensImmediately();
    
    // فحص وإجبار التحديث إذا لزم الأمر
    checkForUpdates();
    
    // التأكد من وجود roomsSystem أو إنشاؤه
    if (typeof roomsSystem === 'undefined') {
        console.log('إنشاء roomsSystem بديل...');
        window.roomsSystem = {
            rooms: new Map(),
            currentPlayer: null,
            
            createPlayer: function(name) {
                const player = {
                    id: Date.now() + Math.random(),
                    name: name,
                    joinedAt: new Date()
                };
                this.currentPlayer = player;
                this.saveToStorage(); // حفظ البيانات
                return player;
            },
            
            createRoom: function(roomName, creator) {
                const roomId = Date.now().toString();
                const room = {
                    id: roomId,
                    name: roomName,
                    creator: creator.id,
                    createdAt: new Date(),
                    gameStarted: false,
                    greenTeam: [],
                    redTeam: [],
                    spectators: []
                };
                
                this.rooms.set(roomId, room);
                this.saveToStorage(); // حفظ البيانات
                return roomId;
            },
            
            getAllRooms: function() {
                return Array.from(this.rooms.values());
            },
            
            getRoom: function(roomId) {
                return this.rooms.get(roomId);
            },
            
            joinRoom: function(roomId, player) {
                const room = this.getRoom(roomId);
                if (!room) {
                    throw new Error('الغرفة غير موجودة');
                }
                
                if (!room.spectators.find(p => p.id === player.id)) {
                    room.spectators.push(player);
                    this.saveToStorage(); // حفظ البيانات
                }
            },
            
            leaveRoom: function(roomId, playerId) {
                const room = this.getRoom(roomId);
                if (!room) return;
                
                room.greenTeam = room.greenTeam.filter(p => p.id !== playerId);
                room.redTeam = room.redTeam.filter(p => p.id !== playerId);
                room.spectators = room.spectators.filter(p => p.id !== playerId);
                
                if (room.creator === playerId) {
                    this.rooms.delete(roomId);
                }
                
                this.saveToStorage(); // حفظ البيانات
            },
            
            joinTeam: function(roomId, playerId, teamColor) {
                const room = this.getRoom(roomId);
                if (!room) {
                    throw new Error('الغرفة غير موجودة');
                }
                
                const player = [...room.greenTeam, ...room.redTeam, ...room.spectators]
                    .find(p => p.id === playerId);
                
                if (!player) {
                    throw new Error('اللاعب غير موجود في الغرفة');
                }
                
                room.greenTeam = room.greenTeam.filter(p => p.id !== playerId);
                room.redTeam = room.redTeam.filter(p => p.id !== playerId);
                room.spectators = room.spectators.filter(p => p.id !== playerId);
                
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
                }
                
                this.saveToStorage(); // حفظ البيانات
            },
            
            getPlayerTeam: function(roomId, playerId) {
                const room = this.getRoom(roomId);
                if (!room) return null;
                
                if (room.greenTeam.find(p => p.id === playerId)) return 'green';
                if (room.redTeam.find(p => p.id === playerId)) return 'red';
                return 'spectator';
            },
            
            startGame: function(roomId) {
                const room = this.getRoom(roomId);
                if (!room) {
                    throw new Error('الغرفة غير موجودة');
                }
                
                if (room.greenTeam.length === 0 || room.redTeam.length === 0) {
                    throw new Error('يجب أن يكون هناك لاعب واحد على الأقل في كل فريق');
                }
                
                room.gameStarted = true;
            },
            
            // حفظ البيانات في التخزين المشترك
            saveToStorage: async function() {
                try {
                    // محاولة حفظ في التخزين المشترك أولاً
                    if (window.sharedStorage) {
                        const success = await window.sharedStorage.saveRooms(this.rooms);
                        if (success) {
                            console.log('تم حفظ البيانات في التخزين المشترك');
                        }
                    }
                    
                    // حفظ بيانات اللاعب محلياً
                    const playerData = {
                        currentPlayer: this.currentPlayer
                    };
                    localStorage.setItem('gamePlayerData', JSON.stringify(playerData));
                    
                } catch (error) {
                    console.error('خطأ في حفظ البيانات:', error);
                }
            },
            
            // تحميل البيانات من التخزين المشترك
            loadFromStorage: async function() {
                try {
                    // تحميل الغرف من التخزين المشترك
                    if (window.sharedStorage) {
                        this.rooms = await window.sharedStorage.loadRooms();
                        console.log('تم تحميل الغرف من التخزين المشترك:', this.rooms.size, 'غرفة');
                    }
                    
                    // تحميل بيانات اللاعب محلياً
                    const playerData = localStorage.getItem('gamePlayerData');
                    if (playerData) {
                        const parsed = JSON.parse(playerData);
                        this.currentPlayer = parsed.currentPlayer || null;
                        console.log('تم تحميل بيانات اللاعب:', this.currentPlayer);
                    }
                    
                    return true;
                } catch (error) {
                    console.error('خطأ في تحميل البيانات:', error);
                }
                return false;
            },
            
            // مسح البيانات المحفوظة
            clearStorage: function() {
                localStorage.removeItem('globalGameRooms');
                localStorage.removeItem('gamePlayerData');
                this.rooms = new Map();
                this.currentPlayer = null;
                console.log('تم مسح البيانات المحفوظة');
            },
            
            // تحديث البيانات من التخزين المشترك (للحصول على آخر الغرف)
            refreshFromStorage: async function() {
                try {
                    if (window.sharedStorage) {
                        this.rooms = await window.sharedStorage.forceRefresh();
                        console.log('تم تحديث قائمة الغرف من التخزين المشترك:', this.rooms.size, 'غرفة');
                        return true;
                    }
                } catch (error) {
                    console.error('خطأ في تحديث البيانات:', error);
                }
                return false;
            }
        };
    }
    
    // تحميل البيانات المحفوظة (async)
    if (roomsSystem.loadFromStorage) {
        roomsSystem.loadFromStorage().then(() => {
            console.log('تم تحميل البيانات بنجاح');
        });
    }
    
    // إعادة تعريف العناصر للتأكد من تحميلها
    elements.playerNameInput = document.getElementById('player-name-input');
    elements.joinRoomsBtn = document.getElementById('join-rooms-btn');
    
    setupEventListeners();
    console.log('تم إعداد أحداث العناصر');
    
    // إعداد تحديث دوري للغرف (كل 10 ثوان)
    setInterval(() => {
        // تحديث الغرف فقط عند عرض شاشة الغرف
        if (screens.rooms && screens.rooms.classList.contains('active')) {
            refreshRoomsList();
        }
    }, 10000);
    
    // التحقق من وجود لاعب محفوظ وعرض الشاشة المناسبة
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
            console.log('لم يتم العثور على بيانات محفوظة، عرض شاشة تسجيل الدخول');
            showScreen('login');
        }
    }, 100); // تأخير قصير لضمان تحميل كل شيء
    
    console.log('تمت تهيئة التطبيق');
});

// حفظ البيانات عند إغلاق النافذة
window.addEventListener('beforeunload', function() {
    if (roomsSystem && roomsSystem.saveToStorage) {
        roomsSystem.saveToStorage();
    }
});

// فحص التحديثات وإجبار إعادة التحميل
function checkForUpdates() {
    const currentVersion = '2.0';
    const storedVersion = localStorage.getItem('gameVersion');
    
    if (storedVersion !== currentVersion) {
        console.log('اكتشف إصدار جديد، سيتم مسح الذاكرة المؤقتة...');
        
        // مسح جميع البيانات المخزنة مؤقتاً
        if ('caches' in window) {
            caches.keys().then(function(cacheNames) {
                return Promise.all(
                    cacheNames.map(function(cacheName) {
                        console.log('مسح ذاكرة التخزين المؤقت:', cacheName);
                        return caches.delete(cacheName);
                    })
                );
            });
        }
        
        // تحديث رقم الإصدار
        localStorage.setItem('gameVersion', currentVersion);
        
        // إعادة تسجيل Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
                for(let registration of registrations) {
                    registration.unregister();
                }
                // إعادة تسجيل Service Worker الجديد
                navigator.serviceWorker.register('./sw.js');
            });
        }
        
        console.log('تم تحديث التطبيق للإصدار:', currentVersion);
    }
}

// إجبار إعادة التحميل بدون ذاكرة التخزين المؤقت
function forceRefresh() {
    if (confirm('هل تريد إعادة تحميل التطبيق للحصول على آخر التحديثات؟')) {
        // مسح localStorage
        const gameData = localStorage.getItem('gameRoomsData');
        localStorage.clear();
        if (gameData) {
            localStorage.setItem('gameRoomsData', gameData);
        }
        
        // إعادة تحميل بدون ذاكرة التخزين المؤقت
        window.location.reload(true);
    }
}

function initializeGame() {
    createLettersGrid();
    showScreen('game');
}

function setupEventListeners() {
    console.log('بدء إعداد أحداث العناصر...');
    
    // التحقق من وجود العناصر
    console.log('playerNameInput:', elements.playerNameInput);
    console.log('joinRoomsBtn:', elements.joinRoomsBtn);
    
    // أزرار التحكم القديمة
    if (elements.startBtn) {
        elements.startBtn.addEventListener('click', startGame);
    }
    
    if (elements.resetBtn) {
        elements.resetBtn.addEventListener('click', resetGame);
    }
    
    if (elements.endBtn) {
        elements.endBtn.addEventListener('click', endGame);
    }
    
    if (elements.playAgainBtn) {
        elements.playAgainBtn.addEventListener('click', playAgain);
    }
    
    // أحداث تسجيل الدخول
    if (elements.playerNameInput) {
        console.log('إضافة أحداث لحقل الاسم');
        elements.playerNameInput.addEventListener('input', validatePlayerName);
        elements.playerNameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                joinRooms();
            }
        });
    } else {
        console.error('عنصر playerNameInput غير موجود!');
    }
    
    if (elements.joinRoomsBtn) {
        console.log('إضافة حدث لزر الانضمام');
        elements.joinRoomsBtn.addEventListener('click', joinRooms);
    } else {
        console.error('عنصر joinRoomsBtn غير موجود!');
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
    
    // إضافة أحداث اللمس للأزرار العامة (فقط للأجهزة المحمولة)
    if ('ontouchstart' in window) {
        const allButtons = [
            elements.joinRoomsBtn, elements.createRoomBtn, elements.refreshRoomsBtn,
            elements.createRoomConfirmBtn, elements.cancelCreateRoomBtn,
            elements.leaveRoomBtn, elements.joinGreenTeamBtn, elements.joinRedTeamBtn,
            elements.startRoomGameBtn, elements.startBtn, elements.resetBtn, 
            elements.endBtn, elements.playAgainBtn
        ];
        
        allButtons.forEach(btn => {
            if (btn) {
                btn.addEventListener('touchstart', function(e) {
                    e.stopPropagation();
                    this.style.transform = 'scale(0.98)';
                }, {passive: true});
                
                btn.addEventListener('touchend', function(e) {
                    e.stopPropagation();
                    this.style.transform = '';
                }, {passive: true});
                
                btn.addEventListener('touchcancel', function(e) {
                    this.style.transform = '';
                });
            }
        });
    }
    
    // إدخال أسماء اللاعبين (للوضع القديم)
    elements.playerInputs.forEach(input => {
        input.addEventListener('input', validateTeamSetup);
    });
    
    // إغلاق نافذة السؤال عند النقر خارجها
    if (elements.questionModal) {
        elements.questionModal.addEventListener('click', function(e) {
            if (e.target === elements.questionModal) {
                closeQuestionModal();
            }
        });
    }
}

function createLettersGrid() {
    elements.lettersGrid.innerHTML = '';
    gameState.letters = [];
    
    // خلط الحروف
    const shuffledLetters = [...arabicLetters].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < 25; i++) {
        const letterCell = document.createElement('div');
        letterCell.className = 'letter-cell';
        letterCell.textContent = shuffledLetters[i];
        letterCell.dataset.letter = shuffledLetters[i];
        letterCell.dataset.index = i;
        letterCell.addEventListener('click', () => selectLetter(i));
        
        // تحسين تأثيرات اللمس للأجهزة المحمولة
        letterCell.addEventListener('touchstart', function(e) {
            e.preventDefault();
            this.style.transform = 'scale(0.95)';
            this.style.backgroundColor = '#e0e0e0';
            this.style.borderColor = '#667eea';
        }, {passive: false});
        
        letterCell.addEventListener('touchend', function(e) {
            e.preventDefault();
            this.style.transform = '';
            this.style.backgroundColor = '';
            this.style.borderColor = '';
            // تأخير بسيط لضمان تسجيل النقرة
            setTimeout(() => {
                if (!this.classList.contains('claimed')) {
                    selectLetter(i);
                }
            }, 50);
        }, {passive: false});
        
        letterCell.addEventListener('touchcancel', function(e) {
            this.style.transform = '';
            this.style.backgroundColor = '';
            this.style.borderColor = '';
        });
        
        elements.lettersGrid.appendChild(letterCell);
        
        gameState.letters.push({
            letter: shuffledLetters[i],
            claimed: false,
            team: null,
            element: letterCell
        });
    }
}

function validateTeamSetup() {
    const greenPlayers = Array.from(document.querySelectorAll('[data-team="green"]'))
        .filter(input => input.value.trim() !== '');
    const redPlayers = Array.from(document.querySelectorAll('[data-team="red"]'))
        .filter(input => input.value.trim() !== '');
    
    const isValid = greenPlayers.length >= 1 && redPlayers.length >= 1;
    
    if (elements.startBtn) {
        elements.startBtn.disabled = !isValid;
        
        if (isValid) {
            elements.startBtn.style.opacity = '1';
            elements.startBtn.style.cursor = 'pointer';
            elements.startBtn.style.pointerEvents = 'auto';
        } else {
            elements.startBtn.style.opacity = '0.5';
            elements.startBtn.style.cursor = 'not-allowed';
            elements.startBtn.style.pointerEvents = 'none';
        }
    }
}

function startGame() {
    // جمع أسماء اللاعبين
    collectPlayerNames();
    
    // التحقق من وجود لاعبين على الأقل في كل فريق
    if (gameState.teams.green.players.length === 0 || gameState.teams.red.players.length === 0) {
        alert('يجب إدخال اسم لاعب واحد على الأقل لكل فريق');
        return;
    }
    
    // تهيئة اللعبة
    gameState.gameStarted = true;
    gameState.gameEnded = false;
    gameState.currentTurn = 'green';
    gameState.usedQuestions = [];
    
    // إعادة تعيين النقاط
    gameState.teams.green.score = 0;
    gameState.teams.red.score = 0;
    
    // تحديث واجهة اللعبة
    updateGameInterface();
    
    // إظهار شاشة اللعبة
    showScreen('game');
    
    // إضافة تأثير بصري لبداية اللعبة
    if (elements.lettersGrid) {
        elements.lettersGrid.style.animation = 'fadeIn 0.5s ease';
    }
}

function collectPlayerNames() {
    // جمع أسماء الفريق الأخضر
    gameState.teams.green.players = [];
    document.querySelectorAll('[data-team="green"]').forEach(input => {
        if (input.value.trim() !== '') {
            gameState.teams.green.players.push(input.value.trim());
        }
    });
    
    // جمع أسماء الفريق الأحمر
    gameState.teams.red.players = [];
    document.querySelectorAll('[data-team="red"]').forEach(input => {
        if (input.value.trim() !== '') {
            gameState.teams.red.players.push(input.value.trim());
        }
    });
}

function updateGameInterface() {
    // تحديث معلومات الفرق
    updateTeamInfo('green');
    updateTeamInfo('red');
    
    // تحديث مؤشر الدور
    if (elements.currentTurnElement) {
        elements.currentTurnElement.textContent = gameState.teams[gameState.currentTurn].name;
        elements.currentTurnElement.style.color = gameState.currentTurn === 'green' ? '#4CAF50' : '#f44336';
    }
}

function updateTeamInfo(teamColor) {
    const team = gameState.teams[teamColor];
    let teamElement;
    
    if (teamColor === 'green') {
        teamElement = elements.greenTeamInfo;
    } else {
        teamElement = elements.redTeamInfo;
    }
    
    if (!teamElement) {
        return;
    }
    
    // تحديث النقاط
    const scoreElement = teamElement.querySelector('.team-score');
    if (scoreElement) {
        scoreElement.textContent = team.score;
    }
    
    // تحديث أسماء اللاعبين
    const playersElement = teamElement.querySelector('.team-players');
    if (playersElement) {
        playersElement.textContent = team.players.join(' • ');
    }
}

function selectLetter(index) {
    if (!gameState.gameStarted || gameState.gameEnded) return;
    
    const letter = gameState.letters[index];
    if (letter.claimed) return;
    
    // إضافة تأثير بصري للنقر
    letter.element.classList.add('pulse');
    setTimeout(() => {
        letter.element.classList.remove('pulse');
    }, 800);
    
    gameState.selectedLetter = letter;
    showQuestion();
}

function showQuestion() {
    // اختيار سؤال عشوائي لم يُستخدم من قبل
    let question;
    let attempts = 0;
    
    do {
        question = getRandomQuestion();
        attempts++;
        if (attempts > 100) { // تجنب الحلقة اللانهائية
            // إذا استُخدمت كل الأسئلة، إعادة تعيين
            gameState.usedQuestions = [];
            question = getRandomQuestion();
            break;
        }
    } while (gameState.usedQuestions.includes(question.id));
    
    gameState.usedQuestions.push(question.id);
    gameState.currentQuestion = question;
    
    // عرض السؤال في النافذة المنبثقة
    displayQuestion(question);
    elements.questionModal.classList.add('active');
    
    // بدء مؤقت السؤال
    startQuestionTimer();
}

function displayQuestion(question) {
    // تحديث معلومات السؤال
    document.querySelector('.selected-letter').textContent = gameState.selectedLetter.letter;
    document.querySelector('.current-team-name').textContent = gameState.teams[gameState.currentTurn].name;
    document.querySelector('.question-text').textContent = question.question;
    
    // تحديث الخيارات
    const answerButtons = document.querySelectorAll('.answer-btn');
    question.options.forEach((option, index) => {
        const btn = answerButtons[index];
        btn.textContent = option;
        btn.onclick = () => selectAnswer(index);
        btn.classList.remove('correct', 'incorrect', 'disabled');
        
        // إضافة أحداث اللمس المحسنة للأجهزة المحمولة
        btn.ontouchstart = function(e) {
            e.preventDefault();
            if (!this.classList.contains('disabled')) {
                this.style.transform = 'scale(0.96)';
                this.style.backgroundColor = '#e8e8e8';
                this.style.borderColor = '#667eea';
                
                // اهتزاز خفيف
                if ('vibrate' in navigator) {
                    navigator.vibrate(30);
                }
            }
        };
        
        btn.ontouchend = function(e) {
            e.preventDefault();
            this.style.transform = '';
            this.style.backgroundColor = '';
            this.style.borderColor = '';
            
            // تأخير بسيط لضمان تسجيل النقرة
            if (!this.classList.contains('disabled')) {
                setTimeout(() => selectAnswer(index), 50);
            }
        };
        
        btn.ontouchcancel = function(e) {
            this.style.transform = '';
            this.style.backgroundColor = '';
            this.style.borderColor = '';
        };
    });
}

function startQuestionTimer() {
    let timeLeft = 30;
    const timerText = document.querySelector('.timer-text');
    const timerBar = document.querySelector('.timer-bar');
    
    timerText.textContent = timeLeft;
    timerBar.classList.remove('running');
    
    // إعادة تشغيل الرسم المتحرك
    setTimeout(() => {
        timerBar.classList.add('running');
    }, 100);
    
    gameState.questionTimer = setInterval(() => {
        timeLeft--;
        timerText.textContent = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(gameState.questionTimer);
            handleTimeOut();
        }
    }, 1000);
}

function selectAnswer(selectedIndex) {
    if (!gameState.currentQuestion) return;
    
    // إيقاف المؤقت
    clearInterval(gameState.questionTimer);
    
    const question = gameState.currentQuestion;
    const answerButtons = document.querySelectorAll('.answer-btn');
    const isCorrect = selectedIndex === question.correct;
    
    // إظهار الإجابة الصحيحة والخاطئة
    answerButtons.forEach((btn, index) => {
        btn.classList.add('disabled');
        if (index === question.correct) {
            btn.classList.add('correct');
        } else if (index === selectedIndex && !isCorrect) {
            btn.classList.add('incorrect');
        }
    });
    
    // التعامل مع الإجابة
    setTimeout(() => {
        if (isCorrect) {
            handleCorrectAnswer();
        } else {
            handleIncorrectAnswer();
        }
    }, 2000);
}

function handleCorrectAnswer() {
    // إضافة نقطة للفريق
    gameState.teams[gameState.currentTurn].score++;
    
    // تلوين الحرف بلون الفريق
    const letter = gameState.selectedLetter;
    letter.claimed = true;
    letter.team = gameState.currentTurn;
    letter.element.classList.add(gameState.currentTurn + '-team');
    letter.element.classList.add('celebration');
    
    // إضافة تأثير الاحتفال
    setTimeout(() => {
        letter.element.classList.remove('celebration');
    }, 600);
    
    // تحديث واجهة اللعبة
    updateGameInterface();
    
    // إغلاق نافذة السؤال
    closeQuestionModal();
    
    // التحقق من انتهاء اللعبة
    checkGameEnd();
}

function handleIncorrectAnswer() {
    // تغيير الدور للفريق الآخر
    switchTurn();
    closeQuestionModal();
}

function handleTimeOut() {
    // التعامل مع انتهاء الوقت كإجابة خاطئة
    handleIncorrectAnswer();
}

function switchTurn() {
    gameState.currentTurn = gameState.currentTurn === 'green' ? 'red' : 'green';
    updateGameInterface();
    
    // إضافة تأثير بصري لتغيير الدور
    elements.currentTurnElement.style.animation = 'pulse 0.5s ease';
    setTimeout(() => {
        elements.currentTurnElement.style.animation = '';
    }, 500);
}

function closeQuestionModal() {
    elements.questionModal.classList.remove('active');
    gameState.currentQuestion = null;
    gameState.selectedLetter = null;
    
    // إيقاف المؤقت
    if (gameState.questionTimer) {
        clearInterval(gameState.questionTimer);
    }
}

function checkGameEnd() {
    const totalClaimed = gameState.letters.filter(letter => letter.claimed).length;
    const greenCount = gameState.letters.filter(letter => letter.team === 'green').length;
    const redCount = gameState.letters.filter(letter => letter.team === 'red').length;
    
    // انتهاء اللعبة إذا تم الإجابة على جميع الأسئلة أو فاز أحد الفرق بأغلبية واضحة
    if (totalClaimed === 25 || greenCount >= 13 || redCount >= 13) {
        gameState.gameEnded = true;
        setTimeout(() => {
            showResults();
        }, 1500);
    }
}

function showResults() {
    const greenScore = gameState.teams.green.score;
    const redScore = gameState.teams.red.score;
    
    // تحديد الفائز
    let winner;
    if (greenScore > redScore) {
        winner = 'الفريق الأخضر';
    } else if (redScore > greenScore) {
        winner = 'الفريق الأحمر';
    } else {
        winner = 'تعادل';
    }
    
    // تحديث شاشة النتائج
    document.querySelector('.winner-announcement').textContent = 
        winner === 'تعادل' ? 'انتهت اللعبة بالتعادل!' : `🎉 الفائز: ${winner} 🎉`;
    
    document.querySelector('.green .score').textContent = greenScore;
    document.querySelector('.red .score').textContent = redScore;
    
    showScreen('results');
}

function resetGame() {
    if (confirm('هل أنت متأكد من إعادة تشغيل اللعبة؟')) {
        gameState.gameStarted = false;
        gameState.gameEnded = false;
        gameState.currentTurn = 'green';
        gameState.usedQuestions = [];
        
        // إعادة تعيين النقاط
        gameState.teams.green.score = 0;
        gameState.teams.red.score = 0;
        
        // إعادة إنشاء شبكة الحروف
        createLettersGrid();
        
        // العودة لشاشة البداية
        showScreen('start');
        
        // إعادة تعيين النماذج
        elements.playerInputs.forEach(input => input.value = '');
        validateTeamSetup();
    }
}

function endGame() {
    if (confirm('هل أنت متأكد من إنهاء اللعبة؟')) {
        gameState.gameEnded = true;
        showResults();
    }
}

// دالات إدارة الغرف
function validatePlayerName() {
    const name = elements.playerNameInput.value.trim();
    const isValid = name.length >= 2 && name.length <= 20;
    
    console.log('تحقق من الاسم:', name, 'صالح:', isValid);
    
    elements.joinRoomsBtn.disabled = !isValid;
    
    if (name.length > 0 && name.length < 2) {
        elements.playerNameInput.style.borderColor = '#e74c3c';
    } else if (isValid) {
        elements.playerNameInput.style.borderColor = '#2ecc71';
    } else {
        elements.playerNameInput.style.borderColor = '';
    }
    
    return isValid;
}

function joinRooms() {
    console.log('جاري محاولة الانضمام للغرف...');
    
    const playerName = elements.playerNameInput ? elements.playerNameInput.value.trim() : '';
    
    if (!playerName || playerName.length < 2) {
        showToast('يرجى إدخال اسم صالح (2-20 حرف)');
        return;
    }
    
    console.log('اسم اللاعب:', playerName);
    
    try {
        gameState.currentPlayer = roomsSystem.createPlayer(playerName);
        console.log('تم إنشاء اللاعب:', gameState.currentPlayer);
        
        showScreen('rooms');
        refreshRoomsList();
        console.log('تم الانتقال لشاشة الغرف');
    } catch (error) {
        console.error('خطأ في إنشاء اللاعب:', error);
        showToast('حدث خطأ، يرجى المحاولة مرة أخرى');
    }
}

function logout() {
    // إذا كان اللاعب في غرفة، اتركها
    if (gameState.currentRoom) {
        leaveRoom();
    }
    
    // مسح البيانات المحفوظة
    if (roomsSystem.clearStorage) {
        roomsSystem.clearStorage();
    }
    
    gameState.currentPlayer = null;
    gameState.currentRoom = null;
    elements.playerNameInput.value = '';
    elements.playerNameInput.style.borderColor = '';
    elements.joinRoomsBtn.disabled = true;
    showScreen('login');
    showToast('تم تسجيل الخروج');
}

async function refreshRoomsList() {
    const roomsList = elements.roomsList;
    if (!roomsList) {
        console.error('عنصر roomsList غير موجود');
        return;
    }
    
    // عرض رسالة تحميل
    roomsList.innerHTML = '<div class="loading">🔄 جاري تحديث قائمة الغرف...</div>';
    
    try {
        // تحديث البيانات من التخزين المشترك للحصول على آخر الغرف
        await roomsSystem.refreshFromStorage();
        
        const rooms = roomsSystem.getAllRooms();
        
        // تنظيف الغرف القديمة
        if (window.sharedStorage) {
            const cleaned = window.sharedStorage.cleanOldRooms(roomsSystem.rooms);
            if (cleaned) {
                await roomsSystem.saveToStorage();
            }
        }
        
        roomsList.innerHTML = '';
        
        if (rooms.length === 0) {
            roomsList.innerHTML = `
                <div class="no-rooms">
                    <div class="no-rooms-icon">🏠</div>
                    <h3>لا توجد غرف متاحة حالياً</h3>
                    <p>جميع الغرف التي يتم إنشاؤها تظهر هنا للجميع من أي جهاز</p>
                    <small>يمكنك إنشاء غرفة جديدة وسيتمكن أصدقاؤك من رؤيتها والانضمام إليها فوراً</small>
                </div>
            `;
            return;
        }
        
        console.log('عرض', rooms.length, 'غرفة متاحة');
        
        rooms.forEach(room => {
            const roomCard = createRoomCard(room);
            roomsList.appendChild(roomCard);
        });
    } catch (error) {
        console.error('خطأ في تحديث قائمة الغرف:', error);
        roomsList.innerHTML = '<div class="no-rooms">خطأ في تحميل الغرف - يرجى المحاولة مرة أخرى</div>';
    }
}

function createRoomCard(room) {
    const card = document.createElement('div');
    card.className = 'room-card';
    
    const greenCount = room.greenTeam.length;
    const redCount = room.redTeam.length;
    const specCount = room.spectators.length;
    const totalPlayers = greenCount + redCount + specCount;
    
    card.innerHTML = `
        <div class="room-header">
            <h3>${room.name}</h3>
            <span class="player-count">${totalPlayers}/8</span>
        </div>
        <div class="teams-preview">
            <div class="team-preview green">
                <span>الفريق الأخضر: ${greenCount}/3</span>
            </div>
            <div class="team-preview red">
                <span>الفريق الأحمر: ${redCount}/3</span>
            </div>
            ${specCount > 0 ? `<div class="spectators">المتفرجون: ${specCount}</div>` : ''}
        </div>
        <div class="room-status">
            ${room.gameStarted ? 'اللعبة جارية' : 'في الانتظار'}
        </div>
    `;
    
    card.addEventListener('click', () => joinRoom(room.id));
    
    // إضافة تأثير اللمس للأجهزة المحمولة
    if ('ontouchstart' in window) {
        card.addEventListener('touchstart', function(e) {
            this.style.transform = 'scale(0.98)';
        }, {passive: true});
        
        card.addEventListener('touchend', function(e) {
            this.style.transform = '';
        }, {passive: true});
        
        card.addEventListener('touchcancel', function(e) {
            this.style.transform = '';
        });
    }
    
    return card;
}

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
        // إظهار حالة التحميل
        elements.createRoomConfirmBtn.textContent = 'جاري الإنشاء...';
        elements.createRoomConfirmBtn.disabled = true;
        
        const roomId = roomsSystem.createRoom(roomName, gameState.currentPlayer);
        
        // حفظ في التخزين المشترك
        await roomsSystem.saveToStorage();
        
        gameState.currentRoom = roomId;
        
        elements.roomNameInput.value = '';
        elements.createRoomConfirmBtn.textContent = 'إنشاء الغرفة';
        elements.createRoomConfirmBtn.disabled = false;
        
        showScreen('room');
        updateRoomDisplay();
        
        showToast('تم إنشاء الغرفة بنجاح - يمكن لأصدقائك رؤيتها الآن');
    } catch (error) {
        elements.createRoomConfirmBtn.textContent = 'إنشاء الغرفة';
        elements.createRoomConfirmBtn.disabled = false;
        showToast(error.message);
    }
}

function joinRoom(roomId) {
    try {
        roomsSystem.joinRoom(roomId, gameState.currentPlayer);
        gameState.currentRoom = roomId;
        
        showScreen('room');
        updateRoomDisplay();
        
        showToast('تم الانضمام للغرفة');
    } catch (error) {
        showToast(error.message);
    }
}

function leaveRoom() {
    if (!gameState.currentRoom) return;
    
    try {
        roomsSystem.leaveRoom(gameState.currentRoom, gameState.currentPlayer.id);
        gameState.currentRoom = null;
        
        showScreen('rooms');
        refreshRoomsList();
        
        showToast('تم مغادرة الغرفة');
    } catch (error) {
        showToast(error.message);
    }
}

function joinTeam(teamColor) {
    if (!gameState.currentRoom) return;
    
    try {
        roomsSystem.joinTeam(gameState.currentRoom, gameState.currentPlayer.id, teamColor);
        updateRoomDisplay();
        showToast(`تم الانضمام للفريق ${teamColor === 'green' ? 'الأخضر' : 'الأحمر'}`);
    } catch (error) {
        showToast(error.message);
    }
}

function updateRoomDisplay() {
    if (!gameState.currentRoom) return;
    
    const room = roomsSystem.getRoom(gameState.currentRoom);
    if (!room) return;
    
    // تحديث اسم الغرفة
    elements.currentRoomName.textContent = room.name;
    
    // تحديث قوائم الفرق
    updateTeamList('green', room.greenTeam);
    updateTeamList('red', room.redTeam);
    updateSpectatorsList(room.spectators);
    
    // تحديث حالة الأزرار
    updateRoomButtons(room);
}

function updateTeamList(teamColor, teamMembers) {
    const listElement = teamColor === 'green' ? elements.greenTeamList : elements.redTeamList;
    listElement.innerHTML = '';
    
    teamMembers.forEach(player => {
        const playerElement = document.createElement('div');
        playerElement.className = 'player-item';
        if (player.id === gameState.currentPlayer.id) {
            playerElement.classList.add('current-player');
        }
        playerElement.textContent = player.name;
        listElement.appendChild(playerElement);
    });
    
    // إضافة مواضع فارغة
    for (let i = teamMembers.length; i < 3; i++) {
        const emptySlot = document.createElement('div');
        emptySlot.className = 'player-item empty';
        emptySlot.textContent = 'فارغ';
        listElement.appendChild(emptySlot);
    }
}

function updateSpectatorsList(spectators) {
    elements.spectatorsList.innerHTML = '';
    
    spectators.forEach(player => {
        const playerElement = document.createElement('div');
        playerElement.className = 'player-item';
        if (player.id === gameState.currentPlayer.id) {
            playerElement.classList.add('current-player');
        }
        playerElement.textContent = player.name;
        elements.spectatorsList.appendChild(playerElement);
    });
}

function updateRoomButtons(room) {
    const currentPlayerTeam = roomsSystem.getPlayerTeam(room.id, gameState.currentPlayer.id);
    
    // أزرار الانضمام للفرق
    elements.joinGreenTeamBtn.disabled = room.greenTeam.length >= 3 || currentPlayerTeam === 'green';
    elements.joinRedTeamBtn.disabled = room.redTeam.length >= 3 || currentPlayerTeam === 'red';
    
    // زر بدء اللعبة (فقط لمنشئ الغرفة)
    const canStartGame = room.creator === gameState.currentPlayer.id && 
                        room.greenTeam.length > 0 && 
                        room.redTeam.length > 0 && 
                        !room.gameStarted;
    
    elements.startRoomGameBtn.disabled = !canStartGame;
    elements.startRoomGameBtn.style.display = room.creator === gameState.currentPlayer.id ? 'block' : 'none';
}

function startRoomGame() {
    if (!gameState.currentRoom) return;
    
    const room = roomsSystem.getRoom(gameState.currentRoom);
    if (!room) return;
    
    if (room.creator !== gameState.currentPlayer.id) {
        showToast('فقط منشئ الغرفة يمكنه بدء اللعبة');
        return;
    }
    
    if (room.greenTeam.length === 0 || room.redTeam.length === 0) {
        showToast('يجب أن يكون هناك لاعب واحد على الأقل في كل فريق');
        return;
    }
    
    try {
        roomsSystem.startGame(gameState.currentRoom);
        
        // تحديث حالة اللعبة
        gameState.isMultiplayer = true;
        gameState.teamNames = {
            green: 'الفريق الأخضر',
            red: 'الفريق الأحمر'
        };
        
        showScreen('game');
        initializeGame();
        showToast('بدأت اللعبة!');
    } catch (error) {
        showToast(error.message);
    }
}

function playAgain() {
    resetGame();
}

// دالة عرض الرسائل
function showToast(message, duration = 3000) {
    // إزالة أي toast موجود
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // إنشاء toast جديد
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    
    // إضافة الستايل
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2c3e50;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        font-family: 'Cairo', sans-serif;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    // إضافة animation CSS
    if (!document.querySelector('#toast-animation')) {
        const style = document.createElement('style');
        style.id = 'toast-animation';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(toast);
    
    // إزالة toast بعد المدة المحددة
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, duration);
}

function showScreen(screenName) {
    console.log('محاولة عرض الشاشة:', screenName);
    
    // إخفاء جميع الشاشات
    Object.values(screens).forEach(screen => {
        if (screen) {
            screen.classList.remove('active');
        }
    });
    
    // إظهار الشاشة المطلوبة
    if (screens[screenName]) {
        screens[screenName].classList.add('active');
        console.log('تم عرض الشاشة:', screenName);
        
        // تحديث قائمة الغرف عند عرض شاشة الغرف
        if (screenName === 'rooms') {
            setTimeout(() => {
                refreshRoomsList();
            }, 100);
        }
    } else {
        console.error('الشاشة غير موجودة:', screenName);
    }
}

// إخفاء جميع الشاشات فوراً بدون انيميشن
function hideAllScreensImmediately() {
    // البحث عن جميع الشاشات في الصفحة
    const allScreens = document.querySelectorAll('.screen');
    allScreens.forEach(screen => {
        screen.classList.remove('active');
    });
    
    // التأكد من screens object أيضاً
    Object.values(screens).forEach(screen => {
        if (screen) {
            screen.classList.remove('active');
        }
    });
}

// دالات مساعدة للأجهزة المحمولة
function enableMobileOptimizations() {
    // منع التكبير عند double tap
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
    // منع scroll على الحروف والأزرار
    document.addEventListener('touchmove', function(e) {
        if (e.target.classList.contains('letter-cell') || 
            e.target.classList.contains('answer-btn') || 
            e.target.classList.contains('btn')) {
            e.preventDefault();
        }
    }, {passive: false});
    
    // تحسين الأداء على الأجهزة المحمولة
    document.addEventListener('touchstart', function() {}, {passive: true});
    
    // إضافة اهتزاز عند النقر (إذا كان مدعوماً)
    if ('vibrate' in navigator) {
        document.addEventListener('touchstart', function(e) {
            if ((e.target.classList.contains('letter-cell') && !e.target.classList.contains('claimed')) ||
                (e.target.classList.contains('answer-btn') && !e.target.classList.contains('disabled')) ||
                e.target.classList.contains('btn')) {
                navigator.vibrate(50);
            }
        });
    }
}

// تفعيل التحسينات للأجهزة المحمولة
if ('ontouchstart' in window) {
    enableMobileOptimizations();
}

// إضافة keyboard shortcuts للحاسوب
document.addEventListener('keydown', function(event) {
    if (gameState.gameStarted && !gameState.gameEnded) {
        // مفاتيح الأرقام 1-4 للإجابة على الأسئلة
        if (event.key >= '1' && event.key <= '4' && gameState.currentQuestion) {
            const answerIndex = parseInt(event.key) - 1;
            selectAnswer(answerIndex);
        }
        
        // مفتاح Escape لإغلاق نافذة السؤال
        if (event.key === 'Escape' && elements.questionModal.classList.contains('active')) {
            closeQuestionModal();
        }
    }
});

// حفظ حالة اللعبة في localStorage
function saveGameState() {
    localStorage.setItem('wordCellGameState', JSON.stringify({
        teams: gameState.teams,
        currentTurn: gameState.currentTurn,
        gameStarted: gameState.gameStarted,
        gameEnded: gameState.gameEnded,
        usedQuestions: gameState.usedQuestions
    }));
}

// استرجاع حالة اللعبة من localStorage
function loadGameState() {
    const saved = localStorage.getItem('wordCellGameState');
    if (saved) {
        const parsedState = JSON.parse(saved);
        // دمج الحالة المحفوظة مع الحالة الحالية
        Object.assign(gameState, parsedState);
    }
}

// حفظ الحالة عند تغييرها
window.addEventListener('beforeunload', saveGameState);

// استرجاع الحالة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', loadGameState);
