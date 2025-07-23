document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();
    const database = firebase.database();
    const user = auth.currentUser;
    const userName = document.getElementById('userName');
    const logoutBtn = document.getElementById('logoutBtn');
    const messagesContainer = document.getElementById('messagesContainer');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const unreadCount = document.getElementById('unreadCount');

    // إذا لم يكن المستخدم مسجل الدخول، ارجع إلى الصفحة الرئيسية
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    // جلب معلومات المستخدم
    database.ref('users/' + user.uid).once('value')
        .then(snapshot => {
            const userData = snapshot.val();
            userName.textContent = userData.name;
        });

    // تسجيل الخروج
    logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => {
            window.location.href = 'index.html';
        });
    });

    // إرسال رسالة
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    function sendMessage() {
        const message = messageInput.value.trim();
        if (!message) return;

        // البحث عن الإدارة لإرسال الرسالة لها
        database.ref('users').orderByChild('role').equalTo('admin').once('value')
            .then(snapshot => {
                let adminId = null;
                snapshot.forEach(child => {
                    adminId = child.key;
                    return true; // نأخذ أول إدارة فقط
                });
                
                if (!adminId) {
                    alert('لم يتم العثور على الإدارة!');
                    return;
                }

                // إرسال الرسالة
                const newMessageRef = database.ref('messages').push();
                newMessageRef.set({
                    senderId: user.uid,
                    receiverId: adminId,
                    content: message,
                    timestamp: Date.now(),
                    isRead: false,
                    senderRole: 'user',
                    receiverRole: 'admin'
                }).then(() => {
                    messageInput.value = '';
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                });
            });
    }

    // استقبال الرسائل في الوقت الحقيقي
    database.ref('messages')
        .orderByChild('timestamp')
        .on('child_added', (snapshot) => {
            const message = snapshot.val();
            
            // عرض الرسائل المرسلة أو المستقبلة من/إلى هذا المستخدم
            if (message.senderId === user.uid || message.receiverId === user.uid) {
                displayMessage(message);
                
                // تحديث عدد الرسائل غير المقروءة
                if (message.receiverId === user.uid && !message.isRead) {
                    updateUnreadCount();
                }
            }
        });

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
        
        // إذا كانت الرسالة موجهة للمستخدم ولم تقرأ بعد، قم بتحديث حالة القراءة
        if (message.receiverId === user.uid && !message.isRead) {
            database.ref('messages/' + snapshot.key).update({ isRead: true });
        }
    }

    function formatTime(timestamp) {
        const date = new Date(timestamp);
        return `${date.getHours()}:${date.getMinutes() < 10 ? '0' : ''}${date.getMinutes()}`;
    }

    function updateUnreadCount() {
        database.ref('messages')
            .orderByChild('receiverId')
            .equalTo(user.uid)
            .on('value', snapshot => {
                let count = 0;
                snapshot.forEach(child => {
                    const message = child.val();
                    if (!message.isRead) count++;
                });
                unreadCount.textContent = count;
                unreadCount.style.display = count > 0 ? 'block' : 'none';
            });
    }
    
    // تحديث عدد الرسائل غير المقروءة عند التحميل
    updateUnreadCount();
});