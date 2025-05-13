const socket = io();

// When the user submits a message
document.getElementById('message-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const messageText = document.getElementById('message').value;
    if (messageText) {
        console.log('Sending message:', messageText); // Log to check for duplicate sends
        socket.emit('chatMessage', messageText);
        document.getElementById('message').value = '';  // Clear input after sending
    }
});

// Handle incoming messages
socket.on('message', (data) => {
    const messagesDiv = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.textContent = `${data.username}: ${data.text}`;
    messagesDiv.appendChild(messageElement);
});

// Handle chat history
socket.on('chatHistory', (messages) => {
    const messagesDiv = document.getElementById('messages');
    messages.forEach(msg => {
        const messageElement = document.createElement('div');
        messageElement.textContent = `${msg.username}: ${msg.text}`;
        messagesDiv.appendChild(messageElement);
    });
});

// Join the room when ready
function joinRoom(room) {
    const username = document.getElementById('username').value;
    socket.emit('joinRoom', { username, room });
    document.getElementById('room-name').textContent = `Room: ${room}`;
}
