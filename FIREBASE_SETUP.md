# إعداد Firebase للعبة خلية الحروف

## خطوات إعداد Firebase

### 1. إنشاء مشروع Firebase
1. اذهب إلى [Firebase Console](https://console.firebase.google.com)
2. انقر على "Add project" أو "إضافة مشروع"
3. أدخل اسم المشروع: `word-cell-game`
4. فعّل Google Analytics (اختياري)
5. أنشئ المشروع

### 2. إعداد Firestore Database
1. من القائمة الجانبية، اختر "Firestore Database"
2. انقر على "Create database"
3. اختر "Start in test mode" (للتطوير)
4. اختر المنطقة الجغرافية الأقرب لك

### 3. إعداد Realtime Database
1. من القائمة الجانبية، اختر "Realtime Database"
2. انقر على "Create Database"
3. اختر "Start in test mode"
4. اختر المنطقة الجغرافية

### 4. إعداد قواعد الأمان

#### قواعد Firestore:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // السماح بقراءة وكتابة الغرف
    match /rooms/{roomId} {
      allow read, write: if true; // للتطوير فقط
    }
    
    // السماح بقراءة وكتابة اللاعبين
    match /players/{playerId} {
      allow read, write: if true; // للتطوير فقط
    }
  }
}
```

#### قواعد Realtime Database:
```json
{
  "rules": {
    "rooms": {
      ".read": true,
      ".write": true
    },
    "players": {
      ".read": true,
      ".write": true
    },
    "gameUpdates": {
      ".read": true,
      ".write": true
    }
  }
}
```

### 5. الحصول على إعدادات التطبيق
1. اذهب إلى "Project Settings" (رمز الترس)
2. انتقل إلى تبويب "General"
3. في قسم "Your apps"، انقر على "Add app" واختر "Web"
4. أدخل اسم التطبيق: `word-cell-game-web`
5. انسخ إعدادات Firebase

### 6. تحديث الملفات

#### تحديث `firebase-config.js`:
```javascript
const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

### 7. اختبار الاتصال
1. افتح اللعبة في المتصفح
2. افتح Developer Tools (F12)
3. تحقق من Console للرسائل:
   - `تم الاتصال بـ Firebase بنجاح` ✅
   - `فشل الاتصال بـ Firebase` ❌

## هيكل قاعدة البيانات

### Firestore Collections:

#### `rooms` Collection:
```javascript
{
  id: "room_1234567890_abc123",
  name: "غرفة الأصدقاء",
  creator: "player_id",
  createdAt: timestamp,
  gameStarted: false,
  currentTurn: "green",
  gameState: {
    letters: [...],
    usedQuestions: [...],
    scores: { green: 0, red: 0 }
  },
  greenTeam: [player_objects],
  redTeam: [player_objects],
  spectators: [player_objects],
  status: "waiting" // waiting, playing, finished
}
```

#### `players` Collection:
```javascript
{
  id: "player_1234567890_abc123",
  name: "اسم اللاعب",
  joinedAt: timestamp,
  online: true,
  lastSeen: timestamp
}
```

### Realtime Database Structure:
```
/
├── rooms/
│   ├── room_id/
│   │   ├── name: "اسم الغرفة"
│   │   ├── creator: "player_id"
│   │   ├── createdAt: timestamp
│   │   ├── gameStarted: boolean
│   │   ├── playerCount: number
│   │   └── status: "waiting|playing|finished"
│   └── ...
├── players/
│   ├── player_id/
│   │   ├── name: "اسم اللاعب"
│   │   ├── online: boolean
│   │   └── lastSeen: timestamp
│   └── ...
└── gameUpdates/
    ├── room_id/
    │   ├── type: "letterUpdate|teamJoin|gameStart"
    │   ├── data: {...}
    │   └── timestamp: number
    └── ...
```

## ميزات Firebase المستخدمة

### 1. **Firestore Database**
- تخزين بيانات الغرف واللاعبين
- استعلامات معقدة
- نسخ احتياطية تلقائية

### 2. **Realtime Database**
- تحديثات فورية
- إشعارات التغييرات
- أداء سريع للبيانات البسيطة

### 3. **Auto-scaling**
- تكيف تلقائي مع عدد المستخدمين
- لا حاجة لإدارة خوادم

### 4. **Offline Support**
- النظام يتبديل تلقائياً للتخزين المحلي عند انقطاع الإنترنت

## نصائح للإنتاج

### 1. تحسين قواعد الأمان:
```javascript
// قواعد أكثر أماناً للإنتاج
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rooms/{roomId} {
      allow read: if true;
      allow write: if request.time < resource.data.createdAt + duration.value(2, 'h');
    }
  }
}
```

### 2. مراقبة الاستخدام:
- تفعيل Firebase Analytics
- مراقبة عدد القراءات/الكتابات
- تنبيهات عند تجاوز الحدود

### 3. تحسين الأداء:
- استخدام Indexes مخصصة
- تحسين استعلامات Firestore
- Cache البيانات محلياً

### 4. النسخ الاحتياطية:
- جدولة النسخ الاحتياطية التلقائية
- تصدير البيانات دورياً

## استكشاف الأخطاء

### مشاكل شائعة:

1. **خطأ في الاتصال:**
   - تحقق من إعدادات Firebase
   - تأكد من تفعيل APIs المطلوبة

2. **مشاكل القراءة/الكتابة:**
   - راجع قواعد الأمان
   - تحقق من صلاحيات المستخدم

3. **بطء في التحميل:**
   - تحسين Indexes
   - تقليل حجم البيانات المنقولة

## دعم المطورين

للحصول على مساعدة:
1. راجع [وثائق Firebase](https://firebase.google.com/docs)
2. تحقق من [Firebase Status](https://status.firebase.google.com)
3. استخدم [Firebase Support](https://firebase.google.com/support)
