const express = require('express');
const http = require('http');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const socketio = require('socket.io');
const authRoutes = require('./routes/auth');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.get('/', (req, res) => {
    res.redirect('/login');
});

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/chatapp', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'chatsecret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: 'mongodb://localhost:27017/chatapp' })
}));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/', authRoutes);

// Auth check middleware for chat page
app.get('/chat', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('chat', { username: req.session.user.username });
});

// Socket.IO Logic
io.on('connection', (socket) => {
    console.log('A user connected');

    // Join room event
    socket.on('joinRoom', async ({ username, room }) => {
        socket.join(room);
        socket.username = username;
        socket.room = room;

        // Send last 10 messages from the room to the new user
        const messages = await Message.find({ room }).sort({ createdAt: -1 }).limit(10).lean();
        socket.emit('chatHistory', messages.reverse());

        // Welcome message to the room
        socket.to(room).emit('message', { username: 'System', text: `${username} has joined the room.` });
    });

    // Handle chat message from the user
    socket.on('chatMessage', async (msg) => {
        console.log('Server received message:', msg); // Log received message to check for duplicates

        const messageData = { room: socket.room, username: socket.username, text: msg };
        await Message.create(messageData);

        // Emit to all users in the room
        io.to(socket.room).emit('message', messageData);
    });

    // Handle user disconnecting from the room
    socket.on('disconnect', () => {
        console.log('A user disconnected');
        if (socket.room) {
            socket.to(socket.room).emit('message', { username: 'System', text: `${socket.username} has left the room.` });
        }
    });
});

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
