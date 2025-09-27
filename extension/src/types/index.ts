// Type definitions for DataGuard extension

export interface EmailData {
  id: string;
  subject: string;
  sender: string;
  date: string;
  body: string;
  type: 'subscription' | 'delivery' | 'purchase' | 'general';
}

export interface EmailPredicate {
  type: 'subscription' | 'delivery' | 'purchase';
  maxAge: number; // days
  minCount?: number;
  keywords?: string[];
}

export interface UserPolicy {
  allowSubscriptionProof: boolean;
  allowDeliveryProof: boolean;
  allowPurchaseProof: boolean;
  maxEmailAge: number; // days
  redactEmailBodies: boolean;
  showSenderInfo: boolean;
  showSubjectInfo: boolean;
}

// Enhanced Policy interface for x402 integration
export interface Policy {
  // Global settings
  globalDataSharing: boolean;
  
  // Predicate permissions
  allowSubscriptionProof: boolean;
  allowDeliveryProof: boolean;
  allowPurchaseProof: boolean;
  allowFinancialProof: boolean;
  
  // Privacy settings
  redactEmailBodies: boolean;
  redactPersonalInfo: boolean;
  
  // Pricing configuration
  pricing: {
    subscription: number;
    delivery: number;
    purchase: number;
    financial: number;
  };
  
  // Advanced configuration
  maxEmailAge: number;
  maxEmailsPerRequest: number;
  requestTimeout: number;
  
  // Payment configuration
  walletAddress: string;
  facilitatorUrl: string;
  network: 'polygon' | 'polygon-mumbai';
  
  // Legacy fields for backward compatibility
  showSenderInfo: boolean;
  showSubjectInfo: boolean;
  
  // Metadata
  lastUpdated?: string;
  version?: string;
}


export interface DataRequest {
  predicate: EmailPredicate;
  requester: string;
  purpose: string;
  timestamp: string;
  originalUrl?: string;
  originalInit?: RequestInit;
}

export interface ExtensionMessage {
  type: 'REQUEST_EMAIL_DATA' | 'GENERATE_PROOF' | 'GET_USER_POLICY' | 'UPDATE_USER_POLICY' | 'PROCESS_PAYMENT' | 'VERIFY_PAYMENT' | 'NEGOTIATE_REQUEST';
  data?: any;
}

// x402 Payment related types
export interface PaymentRequest {
  predicateType: string;
  price: number; // in USDC
  walletAddress: string;
  facilitatorUrl: string;
  network: 'polygon' | 'polygon-mumbai';
  requestId: string;
  timestamp: number;
}

export interface PaymentResponse {
  success: boolean;
  paymentProof?: string;
  transactionHash?: string;
  error?: string;
  facilitatorResponse?: any;
}

export interface PaymentVerification {
  isValid: boolean;
  amount: number;
  recipient: string;
  timestamp: number;
  blockNumber?: number;
}

// Agent negotiation types
export interface NegotiationRequest {
  predicateType: 'subscription' | 'delivery' | 'purchase' | 'financial';
  requesterId: string;
  requesterType: 'ai-agent' | 'third-party-app' | 'human';
  requestedData: {
    maxAge: number; // days
    maxEmails: number;
    includeBodies: boolean;
    includePersonalInfo: boolean;
  };
  timestamp: number;
}

export interface NegotiationResult {
  accepted: boolean;
  finalPrice?: number;
  adjustedPolicy?: Partial<Policy>;
  reason?: string;
  counterOffer?: {
    price: number;
    conditions: string[];
  };
}
