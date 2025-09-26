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


export interface DataRequest {
  predicate: EmailPredicate;
  requester: string;
  purpose: string;
  timestamp: string;
}

export interface ExtensionMessage {
  type: 'REQUEST_EMAIL_DATA' | 'GENERATE_PROOF' | 'GET_USER_POLICY' | 'UPDATE_USER_POLICY';
  data?: any;
}
