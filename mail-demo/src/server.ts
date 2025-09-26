import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '..', 'dist')));

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// API endpoint to get emails (for AI agents to access)
app.get('/api/emails', (req, res) => {
    const { type } = req.query;
    
    // Import the sample emails
    const { sampleEmails, getEmailsByType, getUnreadEmails } = require('./data/sampleEmails');
    
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

app.listen(PORT, () => {
    console.log(`📧 Email Service Demo running at http://localhost:${PORT}`);
    console.log(`🔗 API endpoint: GET /api/emails?type=subscription|delivery|purchase|unread`);
    console.log(`🤖 This service simulates a normal email API that AI agents would access`);
});
