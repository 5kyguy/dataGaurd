# Email Service Demo

## This purely AI generated code for this demo inbox.

A simple mock email service for testing AI agent integrations. This service simulates a normal email API that AI agents would access directly.

## Features

- 📧 **Sample Email Dataset**: 21 realistic emails including subscriptions, deliveries, and purchases
- 🔍 **Email Filtering**: Filter by type (subscription, delivery, purchase) or unread status
- 🔗 **REST API**: Simple API endpoint for AI agents to access email data
- 📱 **Responsive UI**: Clean, modern interface for testing

## Quick Start

```bash
# Install dependencies
yarn install

# Build the project
yarn build

# Start the demo server
yarn start
```

Then open http://localhost:3000 in your browser.

## API Endpoints

- `GET /api/emails?type=subscription|delivery|purchase|unread` - Get filtered emails

## Project Structure

```
src/
├── data/
│   └── sampleEmails.ts    # Sample email data and filtering functions
├── index.html            # Main HTML interface
├── styles.css           # CSS styling
├── index.ts             # Frontend JavaScript/TypeScript
└── server.ts            # Express server for API endpoints
```

## Purpose

This service simulates a normal email API that AI agents would access directly. The DataGuard browser extension will intercept these requests and provide privacy-preserving responses with ZK proofs instead of raw email data.

The demo provides a realistic testing environment for the DataGuard system by simulating how AI agents would normally interact with email services.