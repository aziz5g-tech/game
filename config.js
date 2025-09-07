// إعدادات اللعبة القابلة للتخصيص
const gameConfig = {
    // إعدادات التوقيت
    timing: {
        questionTimer: 30, // مدة الإجابة على السؤال بالثواني
        answerShowTime: 2000, // مدة إظهار الإجابة الصحيحة بالميلي ثانية
        celebrationTime: 600, // مدة تأثير الاحتفال
        modalAnimationTime: 300 // مدة حركة النافذة المنبثقة
    },
    
    // إعدادات النقاط
    scoring: {
        pointsPerCorrectAnswer: 1, // نقاط الإجابة الصحيحة
        bonusForSpeed: false, // نقاط إضافية للسرعة
        penaltyForWrongAnswer: false // خصم نقاط للإجابة الخاطئة
    },
    
    // إعدادات الشبكة
    grid: {
        size: 5, // حجم الشبكة (5x5)
        letters: [
            'أ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر',
            'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف',
            'ق', 'ك', 'ل', 'م', 'ن'
        ],
        shuffleLetters: true // خلط الحروف في كل لعبة جديدة
    },
    
    // إعدادات الفرق
    teams: {
        minPlayers: 1, // أقل عدد لاعبين في الفريق
        maxPlayers: 3, // أكبر عدد لاعبين في الفريق
        colors: {
            green: '#4CAF50',
            red: '#f44336'
        }
    },
    
    // إعدادات الأسئلة
    questions: {
        randomOrder: true, // ترتيب عشوائي للأسئلة
        avoidRepetition: true, // تجنب تكرار الأسئلة
        categoriesEnabled: true, // تفعيل تصنيف الأسئلة
        difficultyLevels: false // مستويات صعوبة (غير مفعل حالياً)
    },
    
    // إعدادات الواجهة
    ui: {
        animations: true, // تفعيل الرسوم المتحركة
        sounds: false, // الأصوات (غير متاحة حالياً)
        vibration: true, // اهتزاز الجهاز (للأجهزة المدعومة)
        theme: 'default', // تصميم اللعبة
        language: 'ar' // اللغة
    },
    
    // إعدادات التخزين
    storage: {
        saveGameState: true, // حفظ حالة اللعبة
        saveStatistics: true, // حفظ الإحصائيات
        autoSave: true // الحفظ التلقائي
    },
    
    // إعدادات PWA
    pwa: {
        enableServiceWorker: true, // تفعيل Service Worker
        cacheStrategy: 'cacheFirst', // استراتيجية التخزين المؤقت
        updatePrompt: true // إشعار التحديث
    }
};

// دالات مساعدة للإعدادات
const ConfigManager = {
    // تحديث إعداد معين
    updateSetting: function(path, value) {
        const keys = path.split('.');
        let obj = gameConfig;
        
        for (let i = 0; i < keys.length - 1; i++) {
            obj = obj[keys[i]];
        }
        
        obj[keys[keys.length - 1]] = value;
        this.saveConfig();
    },
    
    // الحصول على إعداد معين
    getSetting: function(path) {
        const keys = path.split('.');
        let value = gameConfig;
        
        for (const key of keys) {
            value = value[key];
            if (value === undefined) break;
        }
        
        return value;
    },
    
    // حفظ الإعدادات
    saveConfig: function() {
        if (gameConfig.storage.autoSave) {
            localStorage.setItem('wordCellGameConfig', JSON.stringify(gameConfig));
        }
    },
    
    // تحميل الإعدادات
    loadConfig: function() {
        const saved = localStorage.getItem('wordCellGameConfig');
        if (saved) {
            try {
                const parsedConfig = JSON.parse(saved);
                Object.assign(gameConfig, parsedConfig);
            } catch (error) {
                console.log('Error loading config:', error);
            }
        }
    },
    
    // إعادة تعيين الإعدادات للافتراضية
    resetConfig: function() {
        localStorage.removeItem('wordCellGameConfig');
        location.reload();
    }
};

// تحميل الإعدادات عند بدء التطبيق
document.addEventListener('DOMContentLoaded', function() {
    ConfigManager.loadConfig();
});

// تصدير الإعدادات للاستخدام في ملفات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { gameConfig, ConfigManager };
}
