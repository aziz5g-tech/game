// إعدادات Firebase للعبة خلية الحروف
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getDatabase, ref, set, get, child, push, update, remove, onValue, off } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

// إعدادات Firebase (ستحتاج لتحديث هذه القيم بمشروعك)
const firebaseConfig = {
  apiKey: "AIzaSyB8K7_VjNhEgAYQO5kJM3p2Wj9xLz6_Abc",
  authDomain: "word-cell-game.firebaseapp.com",
  databaseURL: "https://word-cell-game-default-rtdb.firebaseio.com",
  projectId: "word-cell-game",
  storageBucket: "word-cell-game.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456ghi789"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const rtdb = getDatabase(app);

// فئة إدارة Firebase للعبة
class FirebaseManager {
    constructor() {
        this.listeners = new Map(); // لإدارة المستمعين
        this.currentRoom = null;
        this.currentPlayer = null;
    }

    // إنشاء لاعب جديد
    async createPlayer(name) {
        try {
            const player = {
                id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: name,
                joinedAt: serverTimestamp(),
                online: true,
                lastSeen: serverTimestamp()
            };

            // حفظ اللاعب في Firestore
            await addDoc(collection(db, 'players'), player);
            
            // حفظ حالة اللاعب في Realtime Database
            await set(ref(rtdb, `players/${player.id}`), {
                name: player.name,
                online: true,
                lastSeen: Date.now()
            });

            this.currentPlayer = player;
            console.log('تم إنشاء اللاعب:', player);
            return player;
        } catch (error) {
            console.error('خطأ في إنشاء اللاعب:', error);
            throw error;
        }
    }

    // إنشاء غرفة جديدة
    async createRoom(roomName, creator) {
        try {
            const room = {
                id: `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: roomName,
                creator: creator.id,
                createdAt: serverTimestamp(),
                gameStarted: false,
                currentTurn: 'green',
                gameState: {
                    letters: this.generateLettersGrid(),
                    usedQuestions: [],
                    scores: { green: 0, red: 0 }
                },
                greenTeam: [],
                redTeam: [],
                spectators: [creator],
                maxPlayers: 6,
                status: 'waiting' // waiting, playing, finished
            };

            // حفظ الغرفة في Firestore
            const docRef = await addDoc(collection(db, 'rooms'), room);
            room.firestoreId = docRef.id;

            // حفظ الغرفة في Realtime Database للتحديثات السريعة
            await set(ref(rtdb, `rooms/${room.id}`), {
                name: room.name,
                creator: room.creator,
                createdAt: Date.now(),
                gameStarted: room.gameStarted,
                playerCount: 1,
                status: room.status
            });

            console.log('تم إنشاء الغرفة:', room);
            return room.id;
        } catch (error) {
            console.error('خطأ في إنشاء الغرفة:', error);
            throw error;
        }
    }

    // توليد شبكة الحروف
    generateLettersGrid() {
        const arabicLetters = [
            'أ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر',
            'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف',
            'ق', 'ك', 'ل', 'م', 'ن'
        ];
        
        const shuffled = [...arabicLetters].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 25).map((letter, index) => ({
            id: index,
            letter: letter,
            owner: null,
            answered: false
        }));
    }

    // الحصول على جميع الغرف
    async getRooms() {
        try {
            const roomsSnapshot = await get(child(ref(rtdb), 'rooms'));
            const rooms = [];
            
            if (roomsSnapshot.exists()) {
                const roomsData = roomsSnapshot.val();
                for (const [roomId, roomInfo] of Object.entries(roomsData)) {
                    // فلترة الغرف القديمة (أكثر من 2 ساعة)
                    const roomAge = Date.now() - roomInfo.createdAt;
                    if (roomAge < 2 * 60 * 60 * 1000) { // 2 ساعة
                        rooms.push({
                            id: roomId,
                            ...roomInfo
                        });
                    }
                }
            }
            
            return rooms;
        } catch (error) {
            console.error('خطأ في تحميل الغرف:', error);
            return [];
        }
    }

    // الحصول على تفاصيل غرفة معينة
    async getRoom(roomId) {
        try {
            const q = query(collection(db, 'rooms'), where('id', '==', roomId));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const roomDoc = querySnapshot.docs[0];
                return { firestoreId: roomDoc.id, ...roomDoc.data() };
            }
            return null;
        } catch (error) {
            console.error('خطأ في تحميل الغرفة:', error);
            return null;
        }
    }

    // الانضمام للغرفة
    async joinRoom(roomId, player) {
        try {
            const room = await this.getRoom(roomId);
            if (!room) {
                throw new Error('الغرفة غير موجودة');
            }

            // التحقق من أن اللاعب ليس في الغرفة بالفعل
            const allPlayers = [...room.greenTeam, ...room.redTeam, ...room.spectators];
            if (allPlayers.find(p => p.id === player.id)) {
                throw new Error('أنت في الغرفة بالفعل');
            }

            // إضافة اللاعب للمتفرجين
            room.spectators.push(player);

            // تحديث الغرفة في Firestore
            await updateDoc(doc(db, 'rooms', room.firestoreId), {
                spectators: room.spectators
            });

            // تحديث العدد في Realtime Database
            const playerCount = room.greenTeam.length + room.redTeam.length + room.spectators.length;
            await update(ref(rtdb, `rooms/${roomId}`), {
                playerCount: playerCount
            });

            console.log('تم الانضمام للغرفة:', roomId);
            return room;
        } catch (error) {
            console.error('خطأ في الانضمام للغرفة:', error);
            throw error;
        }
    }

    // الانضمام لفريق
    async joinTeam(roomId, playerId, teamColor) {
        try {
            const room = await this.getRoom(roomId);
            if (!room) {
                throw new Error('الغرفة غير موجودة');
            }

            // العثور على اللاعب
            const allPlayers = [...room.greenTeam, ...room.redTeam, ...room.spectators];
            const player = allPlayers.find(p => p.id === playerId);
            
            if (!player) {
                throw new Error('اللاعب غير موجود في الغرفة');
            }

            // إزالة اللاعب من جميع الفرق
            room.greenTeam = room.greenTeam.filter(p => p.id !== playerId);
            room.redTeam = room.redTeam.filter(p => p.id !== playerId);
            room.spectators = room.spectators.filter(p => p.id !== playerId);

            // إضافة اللاعب للفريق المطلوب
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

            // تحديث الغرفة في Firestore
            await updateDoc(doc(db, 'rooms', room.firestoreId), {
                greenTeam: room.greenTeam,
                redTeam: room.redTeam,
                spectators: room.spectators
            });

            console.log('تم الانضمام للفريق:', teamColor);
            return room;
        } catch (error) {
            console.error('خطأ في الانضمام للفريق:', error);
            throw error;
        }
    }

    // مغادرة الغرفة
    async leaveRoom(roomId, playerId) {
        try {
            const room = await this.getRoom(roomId);
            if (!room) return;

            // إزالة اللاعب من جميع الفرق
            room.greenTeam = room.greenTeam.filter(p => p.id !== playerId);
            room.redTeam = room.redTeam.filter(p => p.id !== playerId);
            room.spectators = room.spectators.filter(p => p.id !== playerId);

            const remainingPlayers = room.greenTeam.length + room.redTeam.length + room.spectators.length;

            if (remainingPlayers === 0 || room.creator === playerId) {
                // حذف الغرفة إذا لم يبق أحد أو غادر المنشئ
                await deleteDoc(doc(db, 'rooms', room.firestoreId));
                await remove(ref(rtdb, `rooms/${roomId}`));
            } else {
                // تحديث الغرفة
                await updateDoc(doc(db, 'rooms', room.firestoreId), {
                    greenTeam: room.greenTeam,
                    redTeam: room.redTeam,
                    spectators: room.spectators
                });

                await update(ref(rtdb, `rooms/${roomId}`), {
                    playerCount: remainingPlayers
                });
            }

            console.log('تم مغادرة الغرفة:', roomId);
        } catch (error) {
            console.error('خطأ في مغادرة الغرفة:', error);
        }
    }

    // بدء اللعبة
    async startGame(roomId) {
        try {
            const room = await this.getRoom(roomId);
            if (!room) {
                throw new Error('الغرفة غير موجودة');
            }

            if (room.greenTeam.length === 0 || room.redTeam.length === 0) {
                throw new Error('يجب أن يكون هناك لاعب واحد على الأقل في كل فريق');
            }

            await updateDoc(doc(db, 'rooms', room.firestoreId), {
                gameStarted: true,
                status: 'playing',
                gameStartedAt: serverTimestamp()
            });

            await update(ref(rtdb, `rooms/${roomId}`), {
                gameStarted: true,
                status: 'playing'
            });

            console.log('تم بدء اللعبة:', roomId);
        } catch (error) {
            console.error('خطأ في بدء اللعبة:', error);
            throw error;
        }
    }

    // تحديث حالة حرف في اللعبة
    async updateLetterState(roomId, letterId, owner, isCorrect) {
        try {
            const room = await this.getRoom(roomId);
            if (!room) return;

            const letter = room.gameState.letters[letterId];
            if (letter && !letter.answered) {
                letter.owner = owner;
                letter.answered = true;

                if (isCorrect) {
                    room.gameState.scores[owner]++;
                }

                await updateDoc(doc(db, 'rooms', room.firestoreId), {
                    gameState: room.gameState,
                    currentTurn: owner === 'green' ? 'red' : 'green'
                });

                // إشعار في الوقت الفعلي
                await set(ref(rtdb, `gameUpdates/${roomId}`), {
                    type: 'letterUpdate',
                    letterId: letterId,
                    owner: owner,
                    timestamp: Date.now()
                });
            }
        } catch (error) {
            console.error('خطأ في تحديث الحرف:', error);
        }
    }

    // الاستماع للتحديثات في الوقت الفعلي
    listenToRoomUpdates(roomId, callback) {
        const roomRef = ref(rtdb, `rooms/${roomId}`);
        const gameRef = ref(rtdb, `gameUpdates/${roomId}`);
        
        // الاستماع لتحديثات الغرفة
        const roomListener = onValue(roomRef, callback);
        const gameListener = onValue(gameRef, callback);
        
        // حفظ المستمعين للإزالة لاحقاً
        this.listeners.set(`room_${roomId}`, { roomRef, roomListener });
        this.listeners.set(`game_${roomId}`, { gameRef, gameListener });
    }

    // إزالة المستمعين
    removeListeners(roomId) {
        const roomKey = `room_${roomId}`;
        const gameKey = `game_${roomId}`;
        
        if (this.listeners.has(roomKey)) {
            const { roomRef, roomListener } = this.listeners.get(roomKey);
            off(roomRef, 'value', roomListener);
            this.listeners.delete(roomKey);
        }
        
        if (this.listeners.has(gameKey)) {
            const { gameRef, gameListener } = this.listeners.get(gameKey);
            off(gameRef, 'value', gameListener);
            this.listeners.delete(gameKey);
        }
    }

    // تنظيف الغرف القديمة
    async cleanOldRooms() {
        try {
            const rooms = await this.getRooms();
            const now = Date.now();
            const maxAge = 2 * 60 * 60 * 1000; // 2 ساعة

            for (const room of rooms) {
                if (now - room.createdAt > maxAge) {
                    await remove(ref(rtdb, `rooms/${room.id}`));
                    
                    // حذف من Firestore أيضاً
                    const q = query(collection(db, 'rooms'), where('id', '==', room.id));
                    const querySnapshot = await getDocs(q);
                    querySnapshot.forEach(async (doc) => {
                        await deleteDoc(doc.ref);
                    });
                }
            }
        } catch (error) {
            console.error('خطأ في تنظيف الغرف:', error);
        }
    }

    // تحديث حالة اللاعب (متصل/غير متصل)
    async updatePlayerStatus(playerId, online) {
        try {
            await update(ref(rtdb, `players/${playerId}`), {
                online: online,
                lastSeen: Date.now()
            });
        } catch (error) {
            console.error('خطأ في تحديث حالة اللاعب:', error);
        }
    }
}

// إنشاء مثيل عام
window.firebaseManager = new FirebaseManager();
console.log('تم تهيئة Firebase Manager');
