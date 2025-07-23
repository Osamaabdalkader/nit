document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();
    const database = firebase.database();
    const user = auth.currentUser;
    const logoutBtn = document.getElementById('logoutBtn');
    const usersList = document.getElementById('usersList');
    const searchUsers = document.getElementById('searchUsers');
    const currentUserName = document.getElementById('currentUserName');
    const messagesContainer = document.getElementById('messagesContainer');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');

    // إذا لم يكن المستخدم مسجل الدخول، ارجع إلى الصفحة الرئيسية
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    // التحقق من أن المستخدم هو مدير
    database.ref('users/' + user.uid).once('value')
        .then(snapshot => {
            const userData = snapshot.val();
            if (userData.role !== 'admin') {
                alert('ليس لديك صلاحية الوصول إلى لوحة التحكم');
                auth.signOut();
                window.location.href = 'index.html';
            }
        });

    // تسجيل الخروج
    logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => {
            window.location.href = 'index.html';
        });
    });

    // جلب قائمة المستخدمين
    function loadUsers() {
        database.ref('users').on('value', snapshot => {
            usersList.innerHTML = '';
            snapshot.forEach(child => {
                const userData = child.val();
                if (userData.role === 'user') {
                    const userItem = document.createElement('div');
                    userItem.className = 'user-item';
                    userItem.dataset.userId = child.key;
                    
                    const userName = document.createElement('div');
                    userName.className = 'user-name';
                    userName.textContent = userData.name;
                    
                    const userEmail = document.createElement('div');
                    userEmail.className = 'user-email';
                    userEmail.textContent = userData.email;
                    
                    userItem.appendChild(userName);
                    userItem.appendChild(userEmail);
                    usersList.appendChild(userItem);
                    
                    // اختيار مستخدم لعرض المحادثة
                    userItem.addEventListener('click', () => {
                        document.querySelectorAll('.user-item').forEach(item => {
                            item.classList.remove('active');
                        });
                        userItem.classList.add('active');
                        loadMessages(child.key, userData.name);
                    });
                }
            });
        });
    }

    // تحميل الرسائل مع مستخدم معين
    function loadMessages(userId, name) {
        currentUserName.textContent = name;
        messagesContainer.innerHTML = '';
        messageInput.disabled = false;
        sendBtn.disabled = false;
        
        database.ref('messages')
            .orderByChild('timestamp')
            .on('child_added', snapshot => {
                const message = snapshot.val();
                
                // عرض الرسائل بين الإدارة وهذا المستخدم
                if ((message.senderId === user.uid && message.receiverId === userId) || 
                    (message.senderId === userId && message.receiverId === user.uid)) {
                    displayMessage(message);
                    
                    // تحديث حالة الرسالة كمقروءة إذا كانت مرسلة إلى الإدارة
                    if (message.receiverId === user.uid && !message.isRead) {
                        database.ref('messages/' + snapshot.key).update({ isRead: true });
                    }
                }
            });
    }

    function displayMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = message.senderId === user.uid ? 
            'message sent' : 'message received';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = message.content;
        
        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = formatTime(message.timestamp);
        
        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(messageTime);
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // إرسال رسالة إلى مستخدم
    sendBtn.addEventListener('click', () => {
        const activeUser = document.querySelector('.user-item.active');
        if (!activeUser) {
            alert('الرجاء اختيار مستخدم أولاً');
            return;
        }
        
        const message = messageInput.value.trim();
        if (!message) return;
        
        const userId = activeUser.dataset.userId;
        
        const newMessageRef = database.ref('messages').push();
        newMessageRef.set({
            senderId: user.uid,
            receiverId: userId,
            content: message,
            timestamp: Date.now(),
            isRead: false,
            senderRole: 'admin',
            receiverRole: 'user'
        }).then(() => {
            messageInput.value = '';
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });
    });

    // بحث في المستخدمين
    searchUsers.addEventListener('input', () => {
        const searchTerm = searchUsers.value.toLowerCase();
        document.querySelectorAll('.user-item').forEach(item => {
            const name = item.querySelector('.user-name').textContent.toLowerCase();
            const email = item.querySelector('.user-email').textContent.toLowerCase();
            if (name.includes(searchTerm) || email.includes(searchTerm)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    });

    function formatTime(timestamp) {
        const date = new Date(timestamp);
        return `${date.getHours()}:${date.getMinutes() < 10 ? '0' : ''}${date.getMinutes()}`;
    }

    // تحميل قائمة المستخدمين عند البدء
    loadUsers();
});