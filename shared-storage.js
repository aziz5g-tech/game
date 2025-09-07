// نظام التخزين المشترك للغرف
class SharedStorage {
    constructor() {
        this.apiUrl = 'https://api.jsonbin.io/v3/b/';
        this.binId = '67570f27ad19ca34f8c43b47'; // معرف فريد للتخزين
        this.apiKey = '$2a$10$9oKGY5mKQhAoRRbA9VvBZ.mDgYNSoI4a7XiEO5cMmVrQ8BwZqMKEy'; // مفتاح API
        this.cache = null;
        this.lastFetch = 0;
        this.cacheTimeout = 5000; // 5 ثوان cache
    }

    // إرسال البيانات إلى التخزين المشترك
    async saveRooms(rooms) {
        try {
            const data = {
                rooms: Array.from(rooms.entries()),
                lastUpdate: Date.now(),
                version: '2.1'
            };

            const response = await fetch(this.apiUrl + this.binId, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': this.apiKey
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                this.cache = data;
                this.lastFetch = Date.now();
                console.log('تم حفظ البيانات في التخزين المشترك');
                return true;
            } else {
                console.error('فشل في حفظ البيانات:', response.status);
                return false;
            }
        } catch (error) {
            console.error('خطأ في حفظ البيانات:', error);
            // استخدام localStorage كبديل
            this.saveToLocalStorage(rooms);
            return false;
        }
    }

    // تحميل البيانات من التخزين المشترك
    async loadRooms() {
        try {
            // استخدام cache إذا كان حديث
            const now = Date.now();
            if (this.cache && (now - this.lastFetch) < this.cacheTimeout) {
                return new Map(this.cache.rooms || []);
            }

            const response = await fetch(this.apiUrl + this.binId + '/latest', {
                headers: {
                    'X-Master-Key': this.apiKey
                }
            });

            if (response.ok) {
                const result = await response.json();
                const data = result.record;
                
                this.cache = data;
                this.lastFetch = now;
                
                console.log('تم تحميل البيانات من التخزين المشترك');
                return new Map(data.rooms || []);
            } else {
                console.error('فشل في تحميل البيانات:', response.status);
                return this.loadFromLocalStorage();
            }
        } catch (error) {
            console.error('خطأ في تحميل البيانات:', error);
            // استخدام localStorage كبديل
            return this.loadFromLocalStorage();
        }
    }

    // حفظ في localStorage كبديل
    saveToLocalStorage(rooms) {
        try {
            const data = {
                rooms: Array.from(rooms.entries()),
                lastUpdate: Date.now()
            };
            localStorage.setItem('gameRoomsBackup', JSON.stringify(data));
        } catch (error) {
            console.error('خطأ في حفظ البيانات في localStorage:', error);
        }
    }

    // تحميل من localStorage كبديل
    loadFromLocalStorage() {
        try {
            const data = localStorage.getItem('gameRoomsBackup');
            if (data) {
                const parsed = JSON.parse(data);
                return new Map(parsed.rooms || []);
            }
        } catch (error) {
            console.error('خطأ في تحميل البيانات من localStorage:', error);
        }
        return new Map();
    }

    // تنظيف الغرف القديمة (أكثر من ساعة)
    cleanOldRooms(rooms) {
        const oneHour = 60 * 60 * 1000;
        const now = Date.now();
        let cleaned = false;

        for (const [roomId, room] of rooms.entries()) {
            const roomAge = now - new Date(room.createdAt).getTime();
            if (roomAge > oneHour) {
                rooms.delete(roomId);
                cleaned = true;
            }
        }

        return cleaned;
    }

    // فرض تحديث من الخادم
    async forceRefresh() {
        this.cache = null;
        this.lastFetch = 0;
        return await this.loadRooms();
    }
}

// إنشاء مثيل مشترك
window.sharedStorage = new SharedStorage();
