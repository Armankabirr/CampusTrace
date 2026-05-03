import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

// Load .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const jwtSecret = process.env.JWT_SECRET || 'dev_secret_change_me';
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campustrace';

// Connect to MongoDB
await mongoose.connect(mongoUri);
console.log('Connected to MongoDB');

// Import User model
import User from './src/models/user.model.js';

// Create or get test user
let testUser = await User.findOne({ email: 'testuser001@bscse.uiu.ac.bd' });
if (!testUser) {
  testUser = await User.create({
    name: 'Test User',
    email: 'testuser001@bscse.uiu.ac.bd',
    phone: '01712345678',
    studentId: '011231000',
    password: 'hashed_password_here', // In real app, this would be hashed
    isVerified: true
  });
  console.log('Created test user:', testUser._id);
} else {
  console.log('Using existing test user:', testUser._id);
}

// Generate a valid JWT token for the test user
const validToken = jwt.sign({ sub: testUser._id }, jwtSecret, { expiresIn: '15m' });
console.log('Generated token:', validToken);
console.log('\n');

// Test script using FormData via Node's built-in APIs
async function testWithFetch() {
  // Test found item
  const foundPayload = {
    itemType: 'found',
    category: 'Wallet',
    title: 'Found Black Wallet',
    description: 'Found a black leather wallet with student ID inside',
    lastSeenLocation: 'Main campus library',
    date: '2026-05-03',
    contactName: 'Test User',
    contactEmail: 'testuser001@bscse.uiu.ac.bd',
    contactPhone: '01712345678',
    verificationDetails: JSON.stringify({
      proofQuestions: [
        {
          question: 'What is inside the wallet?',
          answer: 'Student ID'
        }
      ]
    })
  };
  
  console.log('=== Testing FOUND ITEM Report ===');
  console.log('Payload:', JSON.stringify(foundPayload, null, 2));
  
  try {
    const response = await fetch('http://localhost:3000/api/reports/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${validToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(foundPayload)
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Test failed:', error.message);
  }
  
  console.log('\n');
  
  // Test lost item
  const lostPayload = {
    itemType: 'lost',
    category: 'ID Card',
    title: 'Lost Student ID Card',
    description: 'Lost my student ID card with my name and photo on it',
    lastSeenLocation: 'Computer lab',
    date: '2026-05-02',
    contactName: 'Test User',
    contactEmail: 'testuser001@bscse.uiu.ac.bd',
    contactPhone: '01712345678',
    verificationDetails: JSON.stringify({
      privateIdentifier: 'Last 4 digits: 1234'
    })
  };
  
  console.log('=== Testing LOST ITEM Report ===');
  console.log('Payload:', JSON.stringify(lostPayload, null, 2));
  
  try {
    const response = await fetch('http://localhost:3000/api/reports/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${validToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(lostPayload)
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Test failed:', error.message);
  }
  
  console.log('\nTest completed. Check server logs for debug output.');
  
  // Close connection
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

// Run test
await testWithFetch();
