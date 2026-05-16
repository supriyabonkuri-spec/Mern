const Message = require('../models/Message');
const Customer = require('../models/Customer');
const Notification = require('../models/Notification');

// Send a message to a specific customer
const sendMessage = async (req, res) => {
  try {
    const { customerId, content, subject, channel, campaignId } = req.body;
    if (!customerId || !content) {
      return res.status(400).json({ message: 'Customer ID and content are required' });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const message = await Message.create({
      customerId, content, subject, channel: channel || 'app', campaignId: campaignId || null
    });

    // Update customer's last message date
    customer.lastMessageSentAt = new Date();
    await customer.save();

    res.status(201).json({ message: 'Message sent', data: message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Send monthly messages to all customers (called by cron or manually)
const sendMonthlyMessages = async (req, res) => {
  try {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const customersToMessage = await Customer.find({
      $or: [
        { lastMessageSentAt: null },
        { lastMessageSentAt: { $lt: oneMonthAgo } }
      ]
    });

    const content = req.body?.content || `Hello! Here's your monthly update from ShopCRM. Thank you for being a valued customer. Visit us for exclusive offers and loyalty rewards!`;

    const messages = [];
    for (const customer of customersToMessage) {
      const msg = await Message.create({
        customerId: customer._id,
        content: `Dear ${customer.name}, ${content}`,
        subject: 'Monthly Update from ShopCRM',
        channel: 'app'
      });
      customer.lastMessageSentAt = new Date();
      await customer.save();
      messages.push(msg);
    }

    // Create a notification for the admin
    await Notification.create({
      type: 'general',
      title: '📬 Monthly Messages Sent',
      message: `Monthly messages sent to ${messages.length} customer(s).`,
      isGlobal: true
    });

    res.json({ sent: messages.length, message: `Monthly messages dispatched to ${messages.length} customers` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get message history for a customer
const getCustomerMessages = async (req, res) => {
  try {
    const messages = await Message.find({ customerId: req.params.customerId })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all messages (for admin)
const getAllMessages = async (req, res) => {
  try {
    const messages = await Message.find({})
      .populate('customerId', 'name phone segment')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { sendMessage, sendMonthlyMessages, getCustomerMessages, getAllMessages };
