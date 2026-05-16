const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');

dotenv.config();

// Routes
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const billingRoutes = require('./routes/billingRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const storeRoutes = require('./routes/storeRoutes');
const userAdminRoutes = require('./routes/userAdminRoutes');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Make io accessible in controllers via req.app.get('io')
app.set('io', io);

app.use(express.json());
app.use(cors());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Atlas connected successfully.'))
  .catch((err) => console.error('❌ MongoDB Atlas connection error:', err));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/admin/users', userAdminRoutes);

// Root route to prevent 'Cannot GET /'
app.get('/', (req, res) => {
  res.json({ message: 'CRM API is running successfully. Please open the frontend URL (e.g., http://localhost:5173 or 5174) in your browser to view the application.' });
});
// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// Monthly message cron job — runs on 1st of each month at 9:00 AM
cron.schedule('0 9 1 * *', async () => {
  console.log('📬 Running monthly messaging cron job...');
  try {
    const Message = require('./models/Message');
    const Customer = require('./models/Customer');
    const Notification = require('./models/Notification');

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const customers = await Customer.find({
      $or: [
        { lastMessageSentAt: null },
        { lastMessageSentAt: { $lt: oneMonthAgo } }
      ]
    });

    let count = 0;
    for (const customer of customers) {
      await Message.create({
        customerId: customer._id,
        content: `Dear ${customer.name}, thank you for being with ShopCRM! Visit us this month for exclusive offers and loyalty rewards.`,
        subject: 'Monthly Update from ShopCRM',
        channel: 'app'
      });
      customer.lastMessageSentAt = new Date();
      await customer.save();
      count++;
    }

    const notif = await Notification.create({
      type: 'general',
      title: '📬 Monthly Messages Sent',
      message: `Monthly messages automatically sent to ${count} customer(s).`,
      isGlobal: true
    });
    io.emit('notification', notif);
    console.log(`✅ Monthly messages sent to ${count} customers.`);
  } catch (err) {
    console.error('❌ Monthly cron error:', err.message);
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
