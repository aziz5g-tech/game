// إعدادات Firebase - يجب تحديث هذه القيم بمشروعك الخاص
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBUAOc48Ab5qNRa2TSCYAed4F-hU0wsE5A",
  authDomain: "word-cell-game.firebaseapp.com",
  databaseURL: "https://word-cell-game-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "word-cell-game",
  storageBucket: "word-cell-game.firebasestorage.app",
  messagingSenderId: "799542709240",
  appId: "1:799542709240:web:c34767e6f6986ba577e40d",
  measurementId: "G-7S7PYLM4VE"
};

// تصدير الإعدادات
window.FIREBASE_CONFIG = FIREBASE_CONFIG;

// ملاحظات للمطور:
// 1. قم بإنشاء مشروع Firebase جديد على https://console.firebase.google.com
// 2. فعّل Firestore Database و Realtime Database
// 3. انسخ إعدادات التطبيق من Project Settings > General > Your apps
// 4. استبدل القيم أعلاه بالقيم الحقيقية لمشروعك
// 5. تأكد من إعداد قواعد الأمان المناسبة في Firebase Console

/* قواعد Firestore المقترحة:
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // السماح بقراءة وكتابة الغرف واللاعبين
    match /rooms/{roomId} {
      allow read, write: if true;
    }
    match /players/{playerId} {
      allow read, write: if true;
    }
  }
}
*/

/* قواعد Realtime Database المقترحة:
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
*/
