// منطق لوحة تحكم الإدارة
const conversationsList = document.getElementById('conversations-list');
const chatContainer = document.getElementById('chat-container');
const messagesContainer = document.getElementById('messages-container');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const currentContact = document.getElementById('current-contact');
const logoutBtn = document.getElementById('logout-btn');
let currentUser = null;
let currentContactId = null;

// تهيئة الصفحة
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        loadConversations();
    } else {
        window.location.href = 'index.html';
    }
});

// تحميل المحادثات
function loadConversations() {
    const contactsRef = database.ref('user_contacts');
    
    contactsRef.on('value', (snapshot) => {
        conversationsList.innerHTML = '';
        snapshot.forEach((childSnapshot) => {
            const userId = childSnapshot.key;
            const contactInfo = childSnapshot.val().admin;
            
            const conversationItem = document.createElement('div');
            conversationItem.classList.add('conversation-item');
            conversationItem.innerHTML = `
                <div class="user-info">
                    <span class="user-id">${userId}</span>
                    <span class="last-message">${contactInfo.lastMessage}</span>
                </div>
                <span class="time">${formatTime(contactInfo.timestamp)}</span>
            `;
            
            conversationItem.addEventListener('click', () => {
                openChat(userId);
            });
            
            conversationsList.appendChild(conversationItem);
        });
    });
}

// فتح محادثة
function openChat(userId) {
    currentContactId = userId;
    chatContainer.style.display = 'block';
    currentContact.textContent = userId;
    messagesContainer.innerHTML = '';
    
    const conversationId = generateConversationId(userId, 'admin');
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
    
    if (message.senderId === 'admin') {
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
            <div class="avatar">${currentContactId.substring(0,2)}</div>
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
    if (!message || !currentContactId) return;
    
    const conversationId = generateConversationId(currentContactId, 'admin');
    const messagesRef = database.ref(`messages/${conversationId}/messages`);
    const newMessageRef = messagesRef.push();
    
    newMessageRef.set({
        senderId: 'admin',
        receiverId: currentContactId,
        text: message,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        read: true
    });
    
    // تحديث جهة الاتصال
    const userContactRef = database.ref(`user_contacts/${currentContactId}/admin`);
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
}