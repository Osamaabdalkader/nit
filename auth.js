// auth.js
import { auth, db } from './firebase-config.js';

const authEmailInput = document.getElementById('auth-email');
const authPasswordInput = document.getElementById('auth-password');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const authMessageParagraph = document.getElementById('auth-message');

loginBtn.addEventListener('click', () => {
    const email = authEmailInput.value;
    const password = authPasswordInput.value;
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('تم تسجيل الدخول بنجاح:', userCredential.user.uid);
            // يتم التعامل مع إعادة التوجيه بواسطة onAuthStateChanged
        })
        .catch((error) => {
            authMessageParagraph.textContent = 'خطأ في تسجيل الدخول: ' + error.message;
            console.error('Login Error:', error);
        });
});

signupBtn.addEventListener('click', () => {
    const email = authEmailInput.value;
    const password = authPasswordInput.value;
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            db.ref('users/' + userCredential.user.uid).set({
                email: email,
                role: 'user', // الدور الافتراضي
                name: email.split('@')[0] // اسم افتراضي
            }).then(() => {
                authMessageParagraph.textContent = 'تم التسجيل بنجاح. يمكنك الآن تسجيل الدخول.';
                console.log('تم التسجيل بنجاح:', userCredential.user.uid);
            });
        })
        .catch((error) => {
            authMessageParagraph.textContent = 'خطأ في التسجيل: ' + error.message;
            console.error('Signup Error:', error);
        });
});

// مراقبة حالة المصادقة وإعادة التوجيه
auth.onAuthStateChanged((user) => {
    if (user) {
        db.ref('users/' + user.uid).once('value', (snapshot) => {
            const userData = snapshot.val();
            if (userData && userData.role === 'admin') {
                window.location.href = 'admin.html'; // إعادة توجيه للمدير
            } else {
                window.location.href = 'user.html'; // إعادة توجيه للمستخدم العادي
            }
        });
    }
    // إذا لم يكن هناك مستخدم، يبقى في index.html
});
