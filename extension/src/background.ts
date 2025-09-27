// Background service worker for DataGuard extension
// Handles request interception, x402 payment processing, and communication with content scripts

// Import services (Note: In a real implementation, these would be imported as modules)
// For now, we'll define the interfaces and implement simplified versions

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

interface Policy {
  globalDataSharing: boolean;
  allowSubscriptionProof: boolean;
  allowDeliveryProof: boolean;
  allowPurchaseProof: boolean;
  allowFinancialProof: boolean;
  redactEmailBodies: boolean;
  redactPersonalInfo: boolean;
  pricing: {
    subscription: number;
    delivery: number;
    purchase: number;
    financial: number;
  };
  maxEmailAge: number;
  maxEmailsPerRequest: number;
  requestTimeout: number;
  walletAddress: string;
  facilitatorUrl: string;
  network: 'polygon' | 'polygon-mumbai';
  showSenderInfo: boolean;
  showSubjectInfo: boolean;
  lastUpdated?: string;
  version?: string;
}

interface X402PaymentRequest {
  predicateType: string;
  price: number;
  walletAddress: string;
  facilitatorUrl: string;
  network: 'polygon' | 'polygon-mumbai';
  requestId: string;
  timestamp: number;
}

interface X402PaymentResponse {
  success: boolean;
  paymentProof?: string;
  transactionHash?: string;
  error?: string;
  facilitatorResponse?: any;
}

interface NegotiationRequest {
  predicateType: 'subscription' | 'delivery' | 'purchase' | 'financial';
  requesterId: string;
  requesterType: 'ai-agent' | 'third-party-app' | 'human';
  requestedData: {
    maxAge: number;
    maxEmails: number;
    includeBodies: boolean;
    includePersonalInfo: boolean;
  };
  timestamp: number;
}

interface NegotiationResult {
  accepted: boolean;
  finalPrice?: number;
  adjustedPolicy?: Partial<Policy>;
  reason?: string;
  counterOffer?: {
    price: number;
    conditions: string[];
  };
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
      
    case 'PROCESS_PAYMENT':
      handleProcessPayment(message.data, sendResponse);
      return true;
      
    case 'VERIFY_PAYMENT':
      handleVerifyPayment(message.data, sendResponse);
      return true;
      
    case 'NEGOTIATE_REQUEST':
      handleNegotiateRequest(message.data, sendResponse);
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

// x402 Payment Processing Handlers

async function handleProcessPayment(request: any, sendResponse: (response: any) => void) {
  try {
    console.log('Processing x402 payment:', request);
    
    // Simulate payment processing through x402 facilitator
    const paymentRequest: X402PaymentRequest = {
      predicateType: request.predicateType,
      price: request.price,
      walletAddress: request.walletAddress,
      facilitatorUrl: request.facilitatorUrl || 'https://x402.org/facilitator',
      network: 'polygon',
      requestId: `req_${Date.now()}`,
      timestamp: Date.now()
    };

    // Simulate facilitator interaction
    const paymentResponse: X402PaymentResponse = await simulateFacilitatorPayment(paymentRequest);
    
    if (paymentResponse.success) {
      // Store payment record
      await storePaymentRecord(paymentRequest, paymentResponse);
      
      sendResponse({
        success: true,
        paymentProof: paymentResponse.paymentProof,
        transactionHash: paymentResponse.transactionHash,
        amount: paymentRequest.price,
        recipient: paymentRequest.walletAddress
      });
    } else {
      sendResponse({
        success: false,
        error: paymentResponse.error || 'Payment processing failed'
      });
    }
    
  } catch (error) {
    console.error('Payment processing error:', error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown payment error'
    });
  }
}

async function handleVerifyPayment(request: any, sendResponse: (response: any) => void) {
  try {
    console.log('Verifying payment:', request);
    
    // Simulate payment verification
    const verification = await simulatePaymentVerification(request.paymentProof);
    
    sendResponse({
      success: true,
      isValid: verification.isValid,
      amount: verification.amount,
      recipient: verification.recipient,
      timestamp: verification.timestamp,
      blockNumber: verification.blockNumber
    });
    
  } catch (error) {
    console.error('Payment verification error:', error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Payment verification failed'
    });
  }
}

async function handleNegotiateRequest(request: any, sendResponse: (response: any) => void) {
  try {
    console.log('Negotiating request:', request);
    
    // Get current policy
    const policy = await getUserPolicy();
    
    // Simulate policy agent negotiation
    const negotiationResult = await simulateNegotiation(request, policy);
    
    sendResponse({
      success: true,
      result: negotiationResult
    });
    
  } catch (error) {
    console.error('Negotiation error:', error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Negotiation failed'
    });
  }
}

// Simulation functions for x402 integration
async function simulateFacilitatorPayment(paymentRequest: X402PaymentRequest): Promise<X402PaymentResponse> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate successful payment for demo
  return {
    success: true,
    paymentProof: `proof_${paymentRequest.requestId}_${Date.now()}`,
    transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
    facilitatorResponse: {
      amount: paymentRequest.price,
      recipient: paymentRequest.walletAddress,
      timestamp: Date.now()
    }
  };
}

async function simulatePaymentVerification(paymentProof: string): Promise<any> {
  // Simulate verification delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Simulate successful verification
  return {
    isValid: true,
    amount: 0.25, // Simulated amount
    recipient: '0x742d35Cc6634C0532925a3b8D', // Simulated recipient
    timestamp: Date.now(),
    blockNumber: 12345678 // Simulated block number
  };
}

async function simulateNegotiation(request: NegotiationRequest, policy: Policy): Promise<NegotiationResult> {
  // Simulate negotiation delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Check if request is allowed
  if (!policy.globalDataSharing) {
    return {
      accepted: false,
      reason: 'Global data sharing is disabled'
    };
  }

  const isPredicateAllowed = checkPredicateAllowed(request.predicateType, policy);
  if (!isPredicateAllowed) {
    return {
      accepted: false,
      reason: `Access to ${request.predicateType} data is disabled`
    };
  }

  // Calculate dynamic pricing
  const basePrice = getBasePrice(request.predicateType, policy);
  const finalPrice = calculateDynamicPrice(request, basePrice);

  return {
    accepted: true,
    finalPrice: finalPrice,
    adjustedPolicy: {
      maxEmailAge: Math.min(request.requestedData.maxAge, policy.maxEmailAge),
      maxEmailsPerRequest: Math.min(request.requestedData.maxEmails, policy.maxEmailsPerRequest),
      redactEmailBodies: !request.requestedData.includeBodies || policy.redactEmailBodies,
      redactPersonalInfo: !request.requestedData.includePersonalInfo || policy.redactPersonalInfo
    }
  };
}

function checkPredicateAllowed(predicateType: string, policy: Policy): boolean {
  switch (predicateType) {
    case 'subscription':
      return policy.allowSubscriptionProof;
    case 'delivery':
      return policy.allowDeliveryProof;
    case 'purchase':
      return policy.allowPurchaseProof;
    case 'financial':
      return policy.allowFinancialProof;
    default:
      return false;
  }
}

function getBasePrice(predicateType: string, policy: Policy): number {
  const pricing = policy.pricing;
  
  switch (predicateType) {
    case 'subscription':
      return pricing?.subscription || 0.05;
    case 'delivery':
      return pricing?.delivery || 0.10;
    case 'purchase':
      return pricing?.purchase || 0.25;
    case 'financial':
      return pricing?.financial || 0.50;
    default:
      return 0;
  }
}

function calculateDynamicPrice(request: NegotiationRequest, basePrice: number): number {
  let finalPrice = basePrice;
  
  // Apply privacy multiplier
  if (request.requestedData.includeBodies) {
    finalPrice *= 1.5; // 50% increase for body access
  }
  
  if (request.requestedData.includePersonalInfo) {
    finalPrice *= 1.3; // 30% increase for personal info
  }
  
  // Apply volume multiplier
  const baseEmails = 10;
  if (request.requestedData.maxEmails > baseEmails) {
    const volumeMultiplier = 1 + ((request.requestedData.maxEmails - baseEmails) / baseEmails) * 0.2;
    finalPrice *= Math.min(volumeMultiplier, 2.0);
  }
  
  return Math.round(finalPrice * 1000) / 1000;
}

async function storePaymentRecord(paymentRequest: X402PaymentRequest, paymentResponse: X402PaymentResponse): Promise<void> {
  const paymentRecord = {
    requestId: paymentRequest.requestId,
    predicateType: paymentRequest.predicateType,
    amount: paymentRequest.price,
    transactionHash: paymentResponse.transactionHash,
    timestamp: paymentRequest.timestamp,
    status: paymentResponse.success ? 'completed' : 'failed'
  };
  
  // Store in extension storage
  const result = await chrome.storage.local.get(['paymentHistory']);
  const paymentHistory = result.paymentHistory || [];
  paymentHistory.push(paymentRecord);
  
  // Keep only last 50 payment records
  if (paymentHistory.length > 50) {
    paymentHistory.splice(0, paymentHistory.length - 50);
  }
  
  await chrome.storage.local.set({ paymentHistory });
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
