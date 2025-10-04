/**
 * WebSocket Client Example for xRat Ecosystem
 * 
 * This example demonstrates how to connect to and use the WebSocket service.
 * 
 * Prerequisites:
 * - npm install socket.io-client
 * - Valid JWT token from /api/auth/login
 */

const { io } = require('socket.io-client');

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const JWT_TOKEN = process.env.JWT_TOKEN || 'YOUR_JWT_TOKEN_HERE';

// Create socket connection
const socket = io(BACKEND_URL, {
  auth: {
    token: JWT_TOKEN,
  },
  // Reconnection settings
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});

// Connection event handlers
socket.on('connect', () => {
  console.log('✅ Connected to WebSocket server');
  console.log('Socket ID:', socket.id);
});

socket.on('connected', (data) => {
  console.log('📡 Connection confirmed:', data);
  console.log('User ID:', data.userId);
  console.log('Timestamp:', data.timestamp);

  // Example 1: Subscribe to product updates
  console.log('\n📦 Subscribing to product updates...');
  socket.emit('data:subscribe', {
    entity: 'products',
    filters: { category: 'electronics' },
  });

  // Example 2: Subscribe to order updates
  console.log('📋 Subscribing to order updates...');
  socket.emit('data:subscribe', {
    entity: 'orders',
    filters: { status: 'pending' },
  });
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
  if (reason === 'io server disconnect') {
    // Server disconnected us, reconnect manually
    socket.connect();
  }
});

socket.on('connect_error', (error) => {
  console.error('🔴 Connection error:', error.message);
  if (error.message.includes('Authentication')) {
    console.error('Invalid or expired JWT token');
    process.exit(1);
  }
});

// Subscription confirmations
socket.on('data:subscribed', (confirmation) => {
  console.log('✅ Subscription confirmed:', {
    entity: confirmation.entity,
    filters: confirmation.filters,
    room: confirmation.room,
  });
});

// Real-time data updates
socket.on('data:updated', (update) => {
  console.log('\n🔄 Data update received:', {
    entity: update.entity,
    timestamp: update.timestamp,
    data: update.data,
  });
});

// Notifications
socket.on('notification', (notification) => {
  console.log('\n🔔 Notification received:', {
    type: notification.type,
    message: notification.message,
    timestamp: notification.timestamp,
    queued: notification.queuedAt ? 'Yes (offline message)' : 'No',
  });

  // Mark notification as read
  if (notification.id) {
    socket.emit('notification:read', {
      notificationId: notification.id,
    });
  }
});

socket.on('notification:read:ack', (ack) => {
  console.log('✅ Notification marked as read:', ack.notificationId);
});

// User presence
socket.on('user:online', (status) => {
  console.log('\n👤 User presence update:', {
    userId: status.userId,
    status: status.status,
    timestamp: status.timestamp,
  });
});

// System health
socket.on('system:health', (health) => {
  console.log('\n💚 System health update:', {
    status: health.status,
    metrics: health.metrics,
    timestamp: health.timestamp,
  });
});

// Typing indicators (for chat-like features)
socket.on('user:typing', (data) => {
  console.log(`\n⌨️  ${data.username} is typing...`);
});

// Error handling
socket.on('error', (error) => {
  console.error('\n❌ Socket error:', error);
  if (error.message === 'Rate limit exceeded') {
    console.warn('⚠️  Rate limit exceeded. Slowing down...');
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Disconnecting...');
  socket.disconnect();
  process.exit(0);
});

// Keep the process running
console.log('\n🚀 WebSocket client started');
console.log('Press Ctrl+C to exit\n');

// Simulate sending typing indicator every 5 seconds (for demo)
setInterval(() => {
  socket.emit('user:typing', {
    roomId: 'demo-room',
  });
}, 5000);
