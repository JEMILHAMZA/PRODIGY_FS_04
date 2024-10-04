

// // // // // // // public/js/chat.js


const socket = io();

// Get DOM elements
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const messages = document.getElementById('messages');
const privateMessageForm = document.getElementById('private-message-form');
const privateMessageInput = document.getElementById('private-message-input');
const privateMessages = document.getElementById('private-messages');
const privateChatContainer = document.getElementById('private-chat-container');
const privateChatUser = document.getElementById('private-chat-user');
const unreadCountElement = document.getElementById('unread-count');
const username = document.getElementById('username').value;
let activePrivateChat = null; // Track the currently active private chat user


// Utility to generate consistent room name
const generateRoomName = (user1, user2) => {
  return [user1, user2].sort().join('-');
};

// Get the DOM elements
const userStatusElements = {};

// Join the public chat room
socket.emit('joinRoom', { username, room: 'General' });

// **Emit request to get unread messages upon connection**
socket.emit('getUnreadMessages', username); // New event to request unread messages on connection

// Handle public messages
socket.on('message', (message) => {
  const newMessage = document.createElement('li');
  newMessage.textContent = `${message.user}: ${message.text}`;
  messages.appendChild(newMessage);
});

// Load public message history
socket.on('loadMessages', (messagesHistory) => {
  messagesHistory.forEach((msg) => {
    const newMessage = document.createElement('li');
    newMessage.textContent = `${msg.sender}: ${msg.message}`;
    messages.appendChild(newMessage);
  });
});

// Send public message
messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const message = messageInput.value;
  socket.emit('chatMessage', { room: 'General', username, message });
  messageInput.value = '';
});

// Handle private chat initiation
document.querySelectorAll('.user-item').forEach(button => {
  button.addEventListener('click', () => {
    const targetUsername = button.getAttribute('data-username');
    const room = generateRoomName(username, targetUsername);
    privateChatUser.textContent = targetUsername;
    privateMessages.innerHTML = ''; // Clear previous messages
    privateChatContainer.style.display = 'block';
    activePrivateChat = targetUsername;


     // Add class to trigger layout change
     document.querySelector('.side-container').classList.add('private-chat-active');

    // Fetch previous chat history
    socket.emit('loadPrivateChat', { from: username, to: targetUsername, room });

    // Emit event to join private room
    socket.emit('privateChatInit', { from: username, to: targetUsername });

    // Mark messages as read when a private chat is opened
    markMessagesAsRead(room);
  });
});

// Handle receiving private messages
socket.on('privateMessage', (message) => {
  if (message.room === generateRoomName(username, activePrivateChat)) {
    const newPrivateMessage = document.createElement('li');
    newPrivateMessage.textContent = `${message.user}: ${message.text}`;
    privateMessages.appendChild(newPrivateMessage);
  }
});



socket.on('unreadNotification', (unreadMessages) => {
  const unreadCountElement = document.getElementById('unread-count');
  
  if (unreadMessages > 0) {
    unreadCountElement.textContent = unreadMessages;
    unreadCountElement.style.display = 'inline';
  } else {
    unreadCountElement.style.display = 'none';
  }
});


// Mark messages as read when user opens the private chat
const markMessagesAsRead = (room) => {
  socket.emit('markAsRead', room);  // Emit event to mark messages as read
};

// Load chat history
socket.on('loadPrivateMessages', (messages) => {
  messages.forEach((message) => {
    const newPrivateMessage = document.createElement('li');
    newPrivateMessage.textContent = `${message.sender}: ${message.message}`;
    privateMessages.appendChild(newPrivateMessage);
  });
});

// Send private message
privateMessageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const message = privateMessageInput.value;
  const targetUser = privateChatUser.textContent;
  const room = generateRoomName(username, targetUser);

  socket.emit('privateMessage', { from: username, to: targetUser, message, room });
  privateMessageInput.value = '';
});




// Emit an event to notify that the user is online
socket.emit('userOnline', username);

// Listen for online status updates for all users
socket.on('userOnlineUpdate', (userStatuses) => {
  Object.keys(userStatuses).forEach(user => {
    const statusElement = document.getElementById(`status-${user}`);
    if (statusElement) {
      
      const userStatus = userStatuses[user].status;
      statusElement.textContent = userStatus;

      // Change color based on status
      if (userStatus === 'Online') {
        statusElement.style.color = 'green';  // Online = green
      } else if (userStatus === 'Offline') {
        statusElement.style.color = 'lightgray';  // Offline = light gray
      }
    }
  });
});

// Listen for typing updates

messageInput.addEventListener('input', () => {
  socket.emit('typing', { username, room: 'General' });
});




// Emit typing event for private chat
privateMessageInput.addEventListener('input', () => {
  const targetUser = privateChatUser.textContent; // User you're chatting with
  const room = generateRoomName(username, targetUser); // Generate private room name
  socket.emit('typing', { username, room });  // Emit typing event for private chat
});





// Listen for typing indicator for both public and private chats
socket.on('typing', (typingUser) => {
  // Handle typing in public chat
  if (typingUser !== username && !activePrivateChat) {
    const typingIndicator = document.getElementById(`status-${typingUser}`);
    if (typingIndicator) {
      typingIndicator.textContent = 'Typing...';
      typingIndicator.style.color = 'green';
      setTimeout(() => {
        typingIndicator.textContent = 'Online';
        typingIndicator.style.color = 'green';
      }, 3000);  // Clear typing indicator after 3 seconds
    }
  }

  // Handle typing in private chat
  if (activePrivateChat && typingUser === privateChatUser.textContent) {
    const typingIndicator = document.getElementById(`status-${typingUser}`);
    if (typingIndicator) {
      typingIndicator.textContent = 'Typing...';
      typingIndicator.style.color = 'green';
      setTimeout(() => {
        typingIndicator.textContent = 'Online';
        typingIndicator.style.color = 'green';
      }, 3000);  // Clear typing indicator after 3 seconds
    }
  }
});



// When the user disconnects or closes the browser window
window.addEventListener('beforeunload', () => {
  socket.emit('userOffline', username);
});



// Detect when the user clicks the logout button
document.querySelector('a[href="/api/auth/logout"]').addEventListener('click', () => {
  socket.disconnect();  // Disconnect the user from the chat
});




