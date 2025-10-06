// MongoDB initialization script for xRat Ecosystem
// This script runs when the MongoDB container starts for the first time

// Switch to the xrat database
db = db.getSiblingDB('xrat');

// Create a user for the application
db.createUser({
  user: 'xratapp',
  pwd: 'xratapppassword',
  roles: [
    {
      role: 'readWrite',
      db: 'xrat'
    }
  ]
});

// Create initial collections and indexes
db.createCollection('users');
db.createCollection('sessions');
db.createCollection('notifications');
db.createCollection('logs');

// Create indexes for better performance
db.users.createIndex({ 'email': 1 }, { unique: true });
db.users.createIndex({ 'username': 1 }, { unique: true });
db.sessions.createIndex({ 'token': 1 }, { unique: true });
db.sessions.createIndex({ 'expiresAt': 1 }, { expireAfterSeconds: 0 });
db.notifications.createIndex({ 'userId': 1 });
db.notifications.createIndex({ 'createdAt': 1 });
db.logs.createIndex({ 'timestamp': 1 });
db.logs.createIndex({ 'level': 1 });

print('✅ xRat database initialized successfully');