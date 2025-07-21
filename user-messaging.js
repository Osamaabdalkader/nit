// user-messaging.js
import { auth, db, getAdminUid } from './firebase-config.js';

const userStatusParagraph = document.getElementById('user-status');
const logoutBtn = document.getElementById('logout-btn');
const userMessagesDiv = document.getElementById('user-messages');
const userMessageTextarea = document.getElementById('user-message-text');
const sendMessageToAdminBtn = document.getElementById('send-message-to-admin-btn');

let currentUser = null;

// دالة مساعدة لعرض الرسائل في واجهة المستخدم
function displayMessage(message, targetDiv, currentLoggedInUserUid) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');

    if (message.senderId === currentLoggedInUserUid) {
        messageElement.classList.add('sent');
    } else {
        messageElement.classList.add('received');
    }

    db.ref('users/' + message.senderId).once('value', (snapshot) => {
        const senderData = snapshot.val();
        const senderName = (senderData && senderData.name) ? senderData.name : senderData.email.split('@')[0];

        const senderSpan = document.createElement('span');
        senderSpan.classList.add('message-sender');
        senderSpan.textContent = senderName + ': ';
        messageElement.appendChild(senderSpan);

        const messageTextSpan = document.createElement('span');
        messageTextSpan.textContent = message.messageText;
        messageElement.appendChild(messageTextSpan);

        const timestampSpan = document.createElement('span');
        timestampSpan.classList.add('message-timestamp');
        timestampSpan.textContent = new Date(message.timestamp).toLocaleString();
        messageElement.appendChild(timestampSpan);

        targetDiv.appendChild(messageElement);
        targetDiv.scrollTop = targetDiv.scrollHeight; // التمرير للأسفل بعد إضافة رسالة
    });
}

// دالة لإرسال الرسائل
function sendMessage(senderId, receiverId, messageText) {
    db.ref('messages').push({
        senderId: senderId,
        receiverId: receiverId,
        messageText: messageText,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        isRead: false
    }).then(() => {
        console.log('تم إرسال الرسالة بنجاح.');
        userMessageTextarea.value = ''; // مسح مربع النص بعد الإرسال
    }).catch((error) => {
        console.error('خطأ في إرسال الرسالة:', error);
        alert('حدث خطأ أثناء إرسال الرسالة.');
    });
}

// تحميل رسائل المستخدم
async function loadUserMessages(userUid) {
    userMessagesDiv.innerHTML = ''; // مسح الرسائل القديمة
    const adminUid = await getAdminUid(); // انتظار جلب UID المدير

    if (!adminUid) {
        userMessagesDiv.textContent = 'لا يمكن تحميل الرسائل: لم يتم العثور على حساب للمدير. يرجى التأكد من وجود مستخدم بدور "admin".';
        return;
    }

    db.ref('messages').orderByChild('timestamp').on('value', (snapshot) => {
        userMessagesDiv.innerHTML = '';
        snapshot.forEach((childSnapshot) => {
            const message = childSnapshot.val();
            const isAdminMessage = (message.senderId === adminUid && message.receiverId === userUid);
            const isUserMessage = (message.senderId === userUid && message.receiverId === adminUid);

            if (isAdminMessage || isUserMessage) {
                displayMessage(message, userMessagesDiv, currentUser.uid);
            }
        });
        userMessagesDiv.scrollTop = userMessagesDiv.scrollHeight;
    });
}

// مراقبة حالة المصادقة
auth.onAuthStateChanged((user) => {
    currentUser = user;
    if (user) {
        // تأكيد أن المستخدم هو مستخدم عادي وليس مدير (لضمان إعادة التوجيه الصحيحة)
        db.ref('users/' + user.uid).once('value', (snapshot) => {
            const userData = snapshot.val();
            if (userData && userData.role === 'admin') {
                window.location.href = 'admin.html'; // إعادة توجيه إذا حاول مدير الوصول لصفحة المستخدم
            } else {
                userStatusParagraph.textContent = `مرحباً، ${user.email}`;
                loadUserMessages(user.uid);
            }
        });
    } else {
        window.location.href = 'index.html'; // إعادة توجيه لتسجيل الدخول إذا لم يكن هناك مستخدم
    }
});

logoutBtn.addEventListener('click', () => {
    auth.signOut()
        .then(() => {
            window.location.href = 'index.html';
        })
        .catch((error) => {
            console.error('Logout Error:', error);
            alert('حدث خطأ أثناء تسجيل الخروج.');
        });
});

sendMessageToAdminBtn.addEventListener('click', async () => {
    const messageText = userMessageTextarea.value.trim();
    if (messageText && currentUser) {
        const adminUid = await getAdminUid();
        if (adminUid) {
            sendMessage(currentUser.uid, adminUid, messageText);
        } else {
            alert('لا يمكن إرسال الرسالة: لم يتم العثور على حساب للمدير. يرجى التأكد من وجود مستخدم بدور "admin".');
        }
    } else {
        alert('الرجاء كتابة رسالة قبل الإرسال.');
    }
});
