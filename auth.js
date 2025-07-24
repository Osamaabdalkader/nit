// إدارة المصادقة
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const errorMsg = document.getElementById('error-msg');

// تسجيل الدخول
loginBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            checkAdminStatus(user.uid);
        })
        .catch((error) => {
            errorMsg.textContent = error.message;
        });
});

// إنشاء حساب
signupBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            window.location.href = 'user.html';
        })
        .catch((error) => {
            errorMsg.textContent = error.message;
        });
});

// التحقق من حالة الإدارة
function checkAdminStatus(uid) {
    database.ref('admins/' + uid).once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'user.html';
            }
        });
}

// تسجيل الخروج
function logout() {
    auth.signOut().then(() => {
        window.location.href = 'index.html';
    });
}

// مراقبة حالة المصادقة
auth.onAuthStateChanged(user => {
    if (user) {
        // المستخدم مسجل دخول
        if (window.location.pathname.endsWith('index.html')) {
            checkAdminStatus(user.uid);
        }
    } else {
        // المستخدم غير مسجل دخول
        if (!window.location.pathname.endsWith('index.html')) {
            window.location.href = 'index.html';
        }
    }
});