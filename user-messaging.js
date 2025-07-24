// منطق مراسلة المستخدم
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const messagesContainer = document.getElementById('messages-container');
const logoutBtn = document.getElementById('logout-btn');
let currentUser = null;

// تهيئة الصفحة
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        loadMessages();
    } else {
        window.location.href = 'index.html';
    }
});

// تحميل الرسائل
function loadMessages() {
    const conversationId = generateConversationId(currentUser.uid, 'admin');
    const messagesRef = database.ref(`messages/${conversationId}/messages`);
    
    messagesRef.orderByChild('timestamp').on('child_added', (snapshot) => {
        const message = snapshot.val();
        displayMessage(message);
    });
}

// عرض الرسالة
function displayMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    
    if (message.senderId === currentUser.uid) {
        messageDiv.classList.add('sent');
        messageDiv.innerHTML = `
            <div class="message-content">
                <p>${message.text}</p>
                <span class="time">${formatTime(message.timestamp)}</span>
            </div>
        `;
    } else {
        messageDiv.classList.add('received');
        messageDiv.innerHTML = `
            <div class="avatar">إدارة</div>
            <div class="message-content">
                <p>${message.text}</p>
                <span class="time">${formatTime(message.timestamp)}</span>
            </div>
        `;
    }
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// إرسال رسالة
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;
    
    const conversationId = generateConversationId(currentUser.uid, 'admin');
    const messagesRef = database.ref(`messages/${conversationId}/messages`);
    const newMessageRef = messagesRef.push();
    
    newMessageRef.set({
        senderId: currentUser.uid,
        receiverId: 'admin',
        text: message,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        read: false
    });
    
    // تحديث جهة الاتصال
    const userContactRef = database.ref(`user_contacts/${currentUser.uid}/admin`);
    userContactRef.set({
        lastMessage: message,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    });
    
    messageInput.value = '';
}

// تسجيل الخروج
logoutBtn.addEventListener('click', logout);

// وظائف مساعدة
function generateConversationId(uid1, uid2) {
    return [uid1, uid2].sort().join('_');
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}()