// Policy Negotiation Agent for DataGuard Extension
// Handles automated pricing and policy enforcement for x402 payments

import { Policy } from '../types';
import { PaymentRequest, X402PaymentService } from '../payments/x402-service';

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

export interface PricingStrategy {
    basePrice: number;
    demandMultiplier: number;
    privacyMultiplier: number;
    volumeMultiplier: number;
}

export class PolicyAgent {
    private x402Service: X402PaymentService;
    private requestHistory: Map<string, NegotiationRequest[]> = new Map();
    private pricingStrategies: Map<string, PricingStrategy> = new Map();

    constructor() {
        this.x402Service = new X402PaymentService();
        this.initializePricingStrategies();
        console.log('Policy Agent initialized');
    }

    /**
     * Process incoming data request and negotiate terms
     */
    async negotiateRequest(
        request: NegotiationRequest,
        currentPolicy: Policy
    ): Promise<NegotiationResult> {
        console.log('Processing data request:', request);

        // Check if request type is allowed globally
        if (!currentPolicy.globalDataSharing) {
            return {
                accepted: false,
                reason: 'Global data sharing is disabled'
            };
        }

        // Check if specific predicate is allowed
        const isPredicateAllowed = this.isPredicateAllowed(request.predicateType, currentPolicy);
        if (!isPredicateAllowed) {
            return {
                accepted: false,
                reason: `Access to ${request.predicateType} data is disabled`
            };
        }

        // Calculate dynamic pricing
        const basePrice = this.getBasePrice(request.predicateType, currentPolicy);
        const dynamicPrice = this.calculateDynamicPrice(request, basePrice);

        // Check privacy requirements
        const privacyCompatible = this.checkPrivacyCompatibility(request, currentPolicy);
        if (!privacyCompatible.compatible) {
            return {
                accepted: false,
                reason: privacyCompatible.reason,
                counterOffer: {
                    price: dynamicPrice,
                    conditions: privacyCompatible.suggestedConditions || []
                }
            };
        }

        // Validate wallet configuration
        if (!currentPolicy.walletAddress || !this.x402Service.validateWalletAddress(currentPolicy.walletAddress)) {
            return {
                accepted: false,
                reason: 'Invalid wallet address configuration'
            };
        }

        // Accept request with dynamic pricing
        return {
            accepted: true,
            finalPrice: dynamicPrice,
            adjustedPolicy: this.createAdjustedPolicy(request, currentPolicy)
        };
    }

    /**
     * Generate payment request for accepted negotiation
     */
    async generatePaymentRequest(
        request: NegotiationRequest,
        policy: Policy,
        finalPrice: number
    ): Promise<PaymentRequest> {
        const requestId = `req_${request.predicateType}_${Date.now()}`;
        
        return this.x402Service.createPaymentRequest(
            request.predicateType,
            { ...policy, pricing: { ...policy.pricing, [request.predicateType]: finalPrice } },
            requestId
        );
    }

    /**
     * Check if predicate type is allowed by policy
     */
    private isPredicateAllowed(predicateType: string, policy: Policy): boolean {
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

    /**
     * Get base price for predicate type
     */
    private getBasePrice(predicateType: string, policy: Policy): number {
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

    /**
     * Calculate dynamic pricing based on demand and conditions
     */
    private calculateDynamicPrice(request: NegotiationRequest, basePrice: number): number {
        const strategy = this.pricingStrategies.get(request.predicateType);
        if (!strategy) return basePrice;

        let finalPrice = basePrice;

        // Apply demand multiplier based on request history
        const requestCount = this.getRecentRequestCount(request.predicateType);
        const demandMultiplier = Math.min(1 + (requestCount * 0.1), 2.0); // Max 2x multiplier
        finalPrice *= demandMultiplier;

        // Apply privacy multiplier
        const privacyMultiplier = this.calculatePrivacyMultiplier(request);
        finalPrice *= privacyMultiplier;

        // Apply volume multiplier
        const volumeMultiplier = this.calculateVolumeMultiplier(request);
        finalPrice *= volumeMultiplier;

        // Round to 3 decimal places
        return Math.round(finalPrice * 1000) / 1000;
    }

    /**
     * Check privacy compatibility with policy
     */
    private checkPrivacyCompatibility(
        request: NegotiationRequest,
        policy: Policy
    ): { compatible: boolean; reason?: string; suggestedConditions?: string[] } {
        const conditions: string[] = [];

        // Check email body access
        if (request.requestedData.includeBodies && policy.redactEmailBodies) {
            return {
                compatible: false,
                reason: 'Email body access requested but policy requires body redaction',
                suggestedConditions: ['Accept redacted email bodies only']
            };
        }

        // Check personal info access
        if (request.requestedData.includePersonalInfo && policy.redactPersonalInfo) {
            return {
                compatible: false,
                reason: 'Personal information access requested but policy requires personal info redaction',
                suggestedConditions: ['Accept redacted personal information only']
            };
        }

        // Check max email age
        if (request.requestedData.maxAge > policy.maxEmailAge) {
            conditions.push(`Limit to ${policy.maxEmailAge} days maximum`);
        }

        // Check max emails per request
        if (request.requestedData.maxEmails > policy.maxEmailsPerRequest) {
            conditions.push(`Limit to ${policy.maxEmailsPerRequest} emails maximum`);
        }

        return {
            compatible: true,
            suggestedConditions: conditions
        };
    }

    /**
     * Create adjusted policy for accepted request
     */
    private createAdjustedPolicy(request: NegotiationRequest, policy: Policy): Partial<Policy> {
        return {
            maxEmailAge: Math.min(request.requestedData.maxAge, policy.maxEmailAge),
            maxEmailsPerRequest: Math.min(request.requestedData.maxEmails, policy.maxEmailsPerRequest),
            redactEmailBodies: !request.requestedData.includeBodies || policy.redactEmailBodies,
            redactPersonalInfo: !request.requestedData.includePersonalInfo || policy.redactPersonalInfo
        };
    }

    /**
     * Calculate privacy multiplier based on request sensitivity
     */
    private calculatePrivacyMultiplier(request: NegotiationRequest): number {
        let multiplier = 1.0;

        if (request.requestedData.includeBodies) {
            multiplier += 0.5; // 50% increase for body access
        }

        if (request.requestedData.includePersonalInfo) {
            multiplier += 0.3; // 30% increase for personal info
        }

        return multiplier;
    }

    /**
     * Calculate volume multiplier based on request size
     */
    private calculateVolumeMultiplier(request: NegotiationRequest): number {
        const baseEmails = 10;
        const requestedEmails = request.requestedData.maxEmails;
        
        if (requestedEmails <= baseEmails) {
            return 1.0;
        }

        // Graduated pricing for larger requests
        const volumeMultiplier = 1 + ((requestedEmails - baseEmails) / baseEmails) * 0.2;
        return Math.min(volumeMultiplier, 2.0); // Cap at 2x
    }

    /**
     * Get recent request count for demand calculation
     */
    private getRecentRequestCount(predicateType: string): number {
        const recentRequests = this.requestHistory.get(predicateType) || [];
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        
        return recentRequests.filter(req => req.timestamp > oneHourAgo).length;
    }

    /**
     * Record request for analytics and pricing
     */
    recordRequest(request: NegotiationRequest): void {
        const existingRequests = this.requestHistory.get(request.predicateType) || [];
        existingRequests.push(request);
        
        // Keep only last 100 requests per type
        if (existingRequests.length > 100) {
            existingRequests.splice(0, existingRequests.length - 100);
        }
        
        this.requestHistory.set(request.predicateType, existingRequests);
    }

    /**
     * Initialize pricing strategies for different predicate types
     */
    private initializePricingStrategies(): void {
        this.pricingStrategies.set('subscription', {
            basePrice: 0.05,
            demandMultiplier: 1.0,
            privacyMultiplier: 1.0,
            volumeMultiplier: 1.0
        });

        this.pricingStrategies.set('delivery', {
            basePrice: 0.10,
            demandMultiplier: 1.0,
            privacyMultiplier: 1.0,
            volumeMultiplier: 1.0
        });

        this.pricingStrategies.set('purchase', {
            basePrice: 0.25,
            demandMultiplier: 1.0,
            privacyMultiplier: 1.0,
            volumeMultiplier: 1.0
        });

        this.pricingStrategies.set('financial', {
            basePrice: 0.50,
            demandMultiplier: 1.0,
            privacyMultiplier: 1.0,
            volumeMultiplier: 1.0
        });
    }

    /**
     * Get pricing analytics
     */
    getPricingAnalytics(): Record<string, any> {
        const analytics: Record<string, any> = {};
        
        for (const [predicateType, requests] of this.requestHistory) {
            const recentRequests = requests.filter(
                req => req.timestamp > Date.now() - (24 * 60 * 60 * 1000)
            );
            
            analytics[predicateType] = {
                requestCount: recentRequests.length,
                averagePrice: this.getBasePrice(predicateType, {} as Policy),
                demandLevel: recentRequests.length > 10 ? 'high' : 'normal'
            };
        }
        
        return analytics;
    }
}
