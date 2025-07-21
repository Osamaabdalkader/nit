// firebase-config.js
// تم دمج إعدادات Firebase الخاصة بك هنا
const firebaseConfig = {
    apiKey: "AIzaSyAzYZMxqNmnLMGYnCyiJYPg2MbxZMt0co0",
    authDomain: "osama-91b95.firebaseapp.com",
    databaseURL: "https://osama-91b95-default-rtdb.firebaseio.com",
    projectId: "osama-91b95",
    storageBucket: "osama-91b95.appspot.com",
    messagingSenderId: "118875905722",
    appId: "1:118875905722:web:200bff1bd99db2c1caac83",
    measurementId: "G-LEM5PVPJZC"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);

// تصدير الكائنات التي ستحتاجها في ملفات JS الأخرى
export const auth = firebase.auth();
export const db = firebase.database();
export const storage = firebase.storage(); // تم تضمين Storage هنا

// دالة مساعدة للحصول على UID المدير (مهم: راجع الملاحظات الأمنية في الدليل الكامل)
let adminUserUid = null;
export async function getAdminUid() {
    if (adminUserUid) return adminUserUid;

    const snapshot = await db.ref('users').orderByChild('role').equalTo('admin').limitToFirst(1).once('value');
    if (snapshot.exists()) {
        adminUserUid = Object.keys(snapshot.val())[0];
        return adminUserUid;
    }
    return null;
}
