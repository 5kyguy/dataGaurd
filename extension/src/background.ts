// Background service worker for DataGuard extension
// Handles request interception and communication with content scripts

// Define types locally since we're not using modules
interface EmailData {
  id: string;
  subject: string;
  sender: string;
  date: string;
  body: string;
  type: string;
}

interface EmailPredicate {
  type: 'subscription' | 'delivery' | 'purchase';
  maxAge: number;
}

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
    // For now, generate a mock proof without ZK
    const mockProof = {
      predicate: request.predicate,
      emailCount: request.emailData.length,
      proof: 'mock-proof-' + Date.now(),
      publicSignals: [request.emailData.length.toString()],
      timestamp: new Date().toISOString()
    };
    
    sendResponse({
      success: true,
      proof: mockProof
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
  // Connect to the mail-demo service with proper URL parameters
  try {
    const url = `http://localhost:3000/api/emails?type=${predicate.type}`;
    console.log('Fetching email data from:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const emails = await response.json();
    console.log(`Fetched ${emails.length} emails from mail-demo service`);
    
    // Apply additional filtering based on predicate criteria
    return filterEmailsByPredicate(emails, predicate);
  } catch (error) {
    console.error('Failed to fetch email data from mail-demo service:', error);
    // Fallback to mock data for development
    console.log('Using mock data as fallback');
    return getMockEmailData(predicate);
  }
}

function filterEmailsByPredicate(emails: any[], predicate: EmailPredicate): EmailData[] {
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - predicate.maxAge * 24 * 60 * 60 * 1000);
  
  console.log(`Filtering emails by predicate: ${predicate.type}, maxAge: ${predicate.maxAge} days`);
  
  return emails.filter(email => {
    // Check date filter
    const emailDate = new Date(email.timestamp || email.date);
    if (emailDate < cutoffDate) {
      console.log(`Email ${email.id} filtered out due to age (${emailDate.toISOString()} < ${cutoffDate.toISOString()})`);
      return false;
    }
    
    // Since the mail-demo service already filters by type, we mainly need to check date
    // But we can also do additional keyword-based filtering for robustness
    const emailType = email.type || 'general';
    const subject = email.subject || '';
    const sender = email.from || email.sender || '';
    
    switch (predicate.type) {
      case 'subscription':
        return emailType === 'subscription' || 
               subject.toLowerCase().includes('unsubscribe') ||
               subject.toLowerCase().includes('subscription') ||
               subject.toLowerCase().includes('newsletter');
      case 'delivery':
        return emailType === 'delivery' ||
               subject.toLowerCase().includes('delivered') ||
               subject.toLowerCase().includes('delivery') ||
               sender.toLowerCase().includes('amazon') ||
               sender.toLowerCase().includes('dhl') ||
               sender.toLowerCase().includes('ups');
      case 'purchase':
        return emailType === 'purchase' ||
               subject.toLowerCase().includes('order') ||
               subject.toLowerCase().includes('receipt') ||
               subject.toLowerCase().includes('payment');
      default:
        return false;
    }
  }).map(email => ({
    id: email.id,
    subject: email.subject,
    sender: email.from || email.sender,
    date: email.timestamp || email.date,
    body: email.body,
    type: email.type
  }));
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
