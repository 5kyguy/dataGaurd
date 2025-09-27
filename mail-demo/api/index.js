import express from 'express';
import { sampleEmails, getEmailsByType, getUnreadEmails } from '../dist/data/sampleEmails.js';

const app = express();

// Enable CORS for all origins
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Direct-Call, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// API endpoint to get emails (for AI agents to access)
app.get('/api/emails', (req, res) => {
    const { type } = req.query;
    
    let emails = sampleEmails;
    
    if (type === 'subscription') {
        emails = getEmailsByType('subscription');
    } else if (type === 'delivery') {
        emails = getEmailsByType('delivery');
    } else if (type === 'purchase') {
        emails = getEmailsByType('purchase');
    } else if (type === 'unread') {
        emails = getUnreadEmails();
    }
    
    res.json(emails);
});

// Export the app for Vercel
export default app;
