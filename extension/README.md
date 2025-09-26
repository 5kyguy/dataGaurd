# DataGuard Browser Extension

A privacy-preserving browser extension that intermediates third-party requests for email data, returning only minimal redacted data and cryptographic proofs of predicates about your inbox.

## Features

- **Request Interception**: Automatically detects and intercepts email data requests from web pages
- **User Consent**: Provides clear UI for users to approve or deny data requests
- **Privacy Policy Management**: Configurable privacy settings for different types of data access
- **Zero-Knowledge Proofs**: Generates cryptographic proofs for email predicates without revealing full data
- **Mail Service Integration**: Connects to the mail-demo service for realistic email data

## Usage

### For Users

1. **Install the Extension**: Load the extension in Chrome
2. **Configure Privacy Policy**: Click the extension icon to set your privacy preferences
3. **Approve Requests**: When websites request email data, approve or deny through the popup
4. **View Proofs**: See generated zero-knowledge proofs for approved requests
