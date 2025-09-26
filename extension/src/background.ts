// Background service worker for DataGuard extension
// Handles request interception and communication with content scripts

import { EmailData, EmailPredicate, ProofResult } from './types';
import { generateProof } from './zk-proof';

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  
  switch (message.type) {
    case 'REQUEST_EMAIL_DATA':
      handleEmailDataRequest(message.data, sendResponse);
      return true; // Keep message channel open for async response
      
    case 'GENERATE_PROOF':
      handleProofGeneration(message.data, sendResponse);
      return true;
      
    case 'GET_USER_POLICY':
      handleGetUserPolicy(sendResponse);
      return true;
      
    case 'UPDATE_USER_POLICY':
      handleUpdateUserPolicy(message.data, sendResponse);
      return true;
      
    default:
      console.warn('Unknown message type:', message.type);
      sendResponse({ error: 'Unknown message type' });
  }
});

async function handleEmailDataRequest(request: any, sendResponse: (response: any) => void) {
  try {
    // Get user policy from storage
    const policy = await getUserPolicy();
    
    // Check if request is allowed by policy
    if (!isRequestAllowed(request, policy)) {
      sendResponse({ 
        error: 'Request not allowed by user policy',
        policy: policy 
      });
      return;
    }
    
    // Fetch email data from mail-demo service
    const emailData = await fetchEmailData(request.predicate);
    
    // Apply redaction based on policy
    const redactedData = applyRedaction(emailData, policy);
    
    sendResponse({
      success: true,
      data: redactedData,
      policy: policy
    });
    
  } catch (error) {
    console.error('Error handling email data request:', error);
    sendResponse({ 
      error: 'Failed to process email data request',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

async function handleProofGeneration(request: any, sendResponse: (response: any) => void) {
  try {
    const proof = await generateProof(request.predicate, request.emailData);
    sendResponse({
      success: true,
      proof: proof
    });
  } catch (error) {
    console.error('Error generating proof:', error);
    sendResponse({ 
      error: 'Failed to generate proof',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

async function handleGetUserPolicy(sendResponse: (response: any) => void) {
  try {
    const policy = await getUserPolicy();
    sendResponse({
      success: true,
      policy: policy
    });
  } catch (error) {
    console.error('Error getting user policy:', error);
    sendResponse({ 
      error: 'Failed to get user policy',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

async function handleUpdateUserPolicy(policy: any, sendResponse: (response: any) => void) {
  try {
    await chrome.storage.local.set({ userPolicy: policy });
    sendResponse({
      success: true,
      message: 'Policy updated successfully'
    });
  } catch (error) {
    console.error('Error updating user policy:', error);
    sendResponse({ 
      error: 'Failed to update user policy',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

async function getUserPolicy() {
  const result = await chrome.storage.local.get(['userPolicy']);
  return result.userPolicy || getDefaultPolicy();
}

function getDefaultPolicy() {
  return {
    allowSubscriptionProof: true,
    allowDeliveryProof: true,
    allowPurchaseProof: false,
    maxEmailAge: 90, // days
    redactEmailBodies: true,
    showSenderInfo: true,
    showSubjectInfo: true
  };
}

function isRequestAllowed(request: any, policy: any): boolean {
  // Check if the requested predicate type is allowed
  switch (request.predicate.type) {
    case 'subscription':
      return policy.allowSubscriptionProof;
    case 'delivery':
      return policy.allowDeliveryProof;
    case 'purchase':
      return policy.allowPurchaseProof;
    default:
      return false;
  }
}

async function fetchEmailData(predicate: EmailPredicate): Promise<EmailData[]> {
  // In a real implementation, this would connect to the mail-demo service
  // For now, we'll simulate the data fetch
  try {
    const response = await fetch('http://localhost:3000/api/emails');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const emails = await response.json();
    return filterEmailsByPredicate(emails, predicate);
  } catch (error) {
    console.error('Failed to fetch email data:', error);
    // Fallback to mock data for development
    return getMockEmailData(predicate);
  }
}

function filterEmailsByPredicate(emails: EmailData[], predicate: EmailPredicate): EmailData[] {
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - predicate.maxAge * 24 * 60 * 60 * 1000);
  
  return emails.filter(email => {
    const emailDate = new Date(email.date);
    if (emailDate < cutoffDate) return false;
    
    switch (predicate.type) {
      case 'subscription':
        return email.type === 'subscription' || 
               email.subject.toLowerCase().includes('unsubscribe') ||
               email.subject.toLowerCase().includes('subscription');
      case 'delivery':
        return email.type === 'delivery' ||
               email.sender.toLowerCase().includes('amazon') ||
               email.sender.toLowerCase().includes('dhl') ||
               email.sender.toLowerCase().includes('ups');
      case 'purchase':
        return email.type === 'purchase' ||
               email.subject.toLowerCase().includes('order') ||
               email.subject.toLowerCase().includes('receipt');
      default:
        return false;
    }
  });
}

function applyRedaction(emailData: EmailData[], policy: any): EmailData[] {
  return emailData.map(email => ({
    ...email,
    body: policy.redactEmailBodies ? '[REDACTED]' : email.body,
    subject: policy.showSubjectInfo ? email.subject : '[REDACTED]',
    sender: policy.showSenderInfo ? email.sender : '[REDACTED]'
  }));
}

function getMockEmailData(predicate: EmailPredicate): EmailData[] {
  // Mock data for development when mail-demo service is not available
  const mockEmails: EmailData[] = [
    {
      id: '1',
      subject: 'Your Amazon order has been delivered',
      sender: 'noreply@amazon.com',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      body: 'Your order #123-456789 has been delivered to your address.',
      type: 'delivery'
    },
    {
      id: '2',
      subject: 'Newsletter: Weekly Tech Updates',
      sender: 'newsletter@techcrunch.com',
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      body: 'This week in tech: AI breakthroughs, startup funding, and more.',
      type: 'subscription'
    }
  ];
  
  return filterEmailsByPredicate(mockEmails, predicate);
}

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('DataGuard extension installed');
  
  // Set default policy if not exists
  chrome.storage.local.get(['userPolicy']).then((result) => {
    if (!result.userPolicy) {
      chrome.storage.local.set({ userPolicy: getDefaultPolicy() });
    }
  });
});
