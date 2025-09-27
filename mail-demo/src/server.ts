import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { sampleEmails, getEmailsByType, getUnreadEmails } from './data/sampleEmails.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

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

// Serve static files from the current directory (dist)
app.use(express.static(__dirname));

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
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

// Only start the server if not in Vercel environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`📧 Email Service Demo running at http://localhost:${PORT}`);
    console.log(`🔗 API endpoint: GET /api/emails?type=subscription|delivery|purchase|unread`);
    console.log(`🤖 This service simulates a normal email API that AI agents would access`);
  });
}
