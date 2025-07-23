document.addEventListener('DOMContentLoaded', () => {
    const loginTab = document.getElementById('loginTab');
    const signupTab = document.getElementById('signupTab');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const authMessage = document.getElementById('authMessage');

    // تبديل بين تسجيل الدخول وإنشاء حساب
    loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        authMessage.textContent = '';
    });

    signupTab.addEventListener('click', () => {
        signupTab.classList.add('active');
        loginTab.classList.remove('active');
        signupForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        authMessage.textContent = '';
    });

    // تسجيل الدخول
    loginBtn.addEventListener('click', () => {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                checkUserRole(user.uid);
            })
            .catch((error) => {
                showAuthMessage(`خطأ في تسجيل الدخول: ${error.message}`, 'error');
            });
    });

    // إنشاء حساب جديد
    signupBtn.addEventListener('click', () => {
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        
        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                
                // حفظ معلومات المستخدم في قاعدة البيانات
                database.ref('users/' + user.uid).set({
                    name: name,
                    email: email,
                    role: 'user',
                    createdAt: Date.now()
                }).then(() => {
                    window.location.href = 'user.html';
                });
            })
            .catch((error) => {
                showAuthMessage(`خطأ في إنشاء الحساب: ${error.message}`, 'error');
            });
    });

    // التحقق من دور المستخدم بعد تسجيل الدخول
    function checkUserRole(uid) {
        database.ref('users/' + uid).once('value')
            .then((snapshot) => {
                const userData = snapshot.val();
                if (userData.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'user.html';
                }
            })
            .catch((error) => {
                showAuthMessage('خطأ في جلب بيانات المستخدم', 'error');
            });
    }

    // عرض رسائل المصادقة
    function showAuthMessage(message, type) {
        authMessage.textContent = message;
        authMessage.className = `message ${type}`;
    }

    // تتبع حالة المصادقة
    auth.onAuthStateChanged((user) => {
        if (user) {
            checkUserRole(user.uid);
        }
    });
});