// admin-panel.js
import { auth, db } from './firebase-config.js';

const userStatusParagraph = document.getElementById('user-status');
const logoutBtn = document.getElementById('logout-btn');
const userListSelect = document.getElementById('user-list-select');
const loadUserMessagesBtn = document.getElementById('load-user-messages-btn');
const adminMessagesDiv = document.getElementById('admin-messages');
const adminMessageTextarea = document.getElementById('admin-message-text');
const sendMessageToUserBtn = document.getElementById('send-message-to-user-btn');
const currentChatUserNameSpan = document.getElementById('current-chat-user-name');

let currentUser = null;
let currentChatUserUid = null;

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
        targetDiv.scrollTop = targetDiv.scrollHeight; // التمرير للأسفل
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
        adminMessageTextarea.value = ''; // مسح مربع النص
    }).catch((error) => {
        console.error('خطأ في إرسال الرسالة:', error);
        alert('حدث خطأ أثناء إرسال الرسالة.');
    });
}

// تحميل قائمة المستخدمين للمدير
function loadUsersForAdmin() {
    userListSelect.innerHTML = '<option value="">اختر مستخدم</option>';
    db.ref('users').orderByChild('role').equalTo('user').on('value', (snapshot) => {
        snapshot.forEach((childSnapshot) => {
            const user = childSnapshot.val();
            const userUid = childSnapshot.key;
            const option = document.createElement('option');
            option.value = userUid;
            option.textContent = user.name || user.email;
            userListSelect.appendChild(option);
        });
    });
}

// تحميل محادثة مع مستخدم معين
function loadAdminToUserMessages(adminUid, targetUserUid) {
    adminMessagesDiv.innerHTML = ''; // مسح الرسائل القديمة
    db.ref('messages').orderByChild('timestamp').on('value', (snapshot) => {
        adminMessagesDiv.innerHTML = '';
        snapshot.forEach((childSnapshot) => {
            const message = childSnapshot.val();
            const isAdminToTargetUser = (message.senderId === adminUid && message.receiverId === targetUserUid);
            const isTargetUserToAdmin = (message.senderId === targetUserUid && message.receiverId === adminUid);

            if (isAdminToTargetUser || isTargetUserToAdmin) {
                displayMessage(message, adminMessagesDiv, currentUser.uid);
            }
        });
        adminMessagesDiv.scrollTop = adminMessagesDiv.scrollHeight;
    });
}

// مراقبة حالة المصادقة
auth.onAuthStateChanged((user) => {
    currentUser = user;
    if (user) {
        // تأكيد أن المستخدم هو مدير
        db.ref('users/' + user.uid).once('value', (snapshot) => {
            const userData = snapshot.val();
            if (userData && userData.role === 'admin') {
                userStatusParagraph.textContent = `مرحباً يا مدير، ${user.email}`;
                loadUsersForAdmin(); // تحميل قائمة المستخدمين
            } else {
                window.location.href = 'index.html'; // إعادة توجيه إذا حاول غير المدير الوصول لصفحة الإدارة
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

loadUserMessagesBtn.addEventListener('click', () => {
    currentChatUserUid = userListSelect.value;
    if (currentChatUserUid) {
        db.ref('users/' + currentChatUserUid).once('value', (snapshot) => {
            const userData = snapshot.val();
            currentChatUserNameSpan.textContent = userData.name || userData.email;
        });
        loadAdminToUserMessages(currentUser.uid, currentChatUserUid);
    } else {
        alert('الرجاء اختيار مستخدم للمراسلة.');
    }
});

sendMessageToUserBtn.addEventListener('click', () => {
    const messageText = adminMessageTextarea.value.trim();
    if (messageText && currentUser && currentChatUserUid) {
        sendMessage(currentUser.uid, currentChatUserUid, messageText);
    } else if (!currentChatUserUid) {
        alert('الرجاء اختيار مستخدم لإرسال الرسالة إليه.');
    } else {
        alert('الرجاء كتابة رسالة قبل الإرسال.');
    }
});
