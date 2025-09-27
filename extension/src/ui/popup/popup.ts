// DataGuard Extension Popup Script

class DataGuardPopup {
    // DOM element references
    private statusIndicator!: HTMLElement | null;
    private connectionStatus!: HTMLElement | null;
    private mailServiceStatus!: HTMLElement | null;
    
    // Policy elements
    private globalDataSharing!: HTMLInputElement | null;
    private allowSubscription!: HTMLInputElement | null;
    private allowDelivery!: HTMLInputElement | null;
    private allowPurchase!: HTMLInputElement | null;
    private allowFinancial!: HTMLInputElement | null;
    private redactBodies!: HTMLInputElement | null;
    private redactPersonalInfo!: HTMLInputElement | null;
    
    // Pricing elements
    private subscriptionPrice!: HTMLInputElement | null;
    private deliveryPrice!: HTMLInputElement | null;
    private purchasePrice!: HTMLInputElement | null;
    private financialPrice!: HTMLInputElement | null;
    
    // Advanced configuration elements
    private maxEmailAge!: HTMLInputElement | null;
    private maxEmailsPerRequest!: HTMLInputElement | null;
    private requestTimeout!: HTMLInputElement | null;
    
    // Payment configuration elements
    private walletAddress!: HTMLInputElement | null;
    private facilitatorUrl!: HTMLInputElement | null;
    
    // Demo elements
    private demoSubscription!: HTMLElement | null;
    private demoDelivery!: HTMLElement | null;
    private demoPurchase!: HTMLElement | null;
    
    // Results elements
    private resultsSection!: HTMLElement | null;
    private proofResult!: HTMLElement | null;
    private requestsList!: HTMLElement | null;
    
    // Footer elements
    private viewLogs!: HTMLElement | null;
    private settings!: HTMLElement | null;

    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.init();
    }

    async init() {
        // Small delay to ensure DOM is fully ready
        await new Promise(resolve => setTimeout(resolve, 100));
        await this.loadUserPolicy();
        this.checkMailServiceStatus();
        this.loadRecentRequests();
    }

    initializeElements() {
        // Status elements
        this.statusIndicator = document.getElementById('statusIndicator');
        this.connectionStatus = document.getElementById('connectionStatus');
        this.mailServiceStatus = document.getElementById('mailServiceStatus');

        // Policy elements
        this.globalDataSharing = document.getElementById('globalDataSharing') as HTMLInputElement;
        this.allowSubscription = document.getElementById('allowSubscription') as HTMLInputElement;
        this.allowDelivery = document.getElementById('allowDelivery') as HTMLInputElement;
        this.allowPurchase = document.getElementById('allowPurchase') as HTMLInputElement;
        this.allowFinancial = document.getElementById('allowFinancial') as HTMLInputElement;
        this.redactBodies = document.getElementById('redactBodies') as HTMLInputElement;
        this.redactPersonalInfo = document.getElementById('redactPersonalInfo') as HTMLInputElement;
        
        // Pricing elements
        this.subscriptionPrice = document.getElementById('subscriptionPrice') as HTMLInputElement;
        this.deliveryPrice = document.getElementById('deliveryPrice') as HTMLInputElement;
        this.purchasePrice = document.getElementById('purchasePrice') as HTMLInputElement;
        this.financialPrice = document.getElementById('financialPrice') as HTMLInputElement;
        
        // Advanced configuration elements
        this.maxEmailAge = document.getElementById('maxEmailAge') as HTMLInputElement;
        this.maxEmailsPerRequest = document.getElementById('maxEmailsPerRequest') as HTMLInputElement;
        this.requestTimeout = document.getElementById('requestTimeout') as HTMLInputElement;
        
        // Payment configuration elements
        this.walletAddress = document.getElementById('walletAddress') as HTMLInputElement;
        this.facilitatorUrl = document.getElementById('facilitatorUrl') as HTMLInputElement;

        // Demo elements
        this.demoSubscription = document.getElementById('demoSubscription');
        this.demoDelivery = document.getElementById('demoDelivery');
        this.demoPurchase = document.getElementById('demoPurchase');

        // Results elements
        this.resultsSection = document.getElementById('resultsSection');
        this.proofResult = document.getElementById('proofResult');
        this.requestsList = document.getElementById('requestsList');

        // Footer elements
        this.viewLogs = document.getElementById('viewLogs');
        this.settings = document.getElementById('settings');
    }

    bindEvents() {
        // Global policy toggle
        if (this.globalDataSharing) {
            this.globalDataSharing.addEventListener('change', () => this.handleGlobalToggle());
        }

        // Policy change events
        if (this.allowSubscription) {
            this.allowSubscription.addEventListener('change', () => this.savePolicy());
        }
        if (this.allowDelivery) {
            this.allowDelivery.addEventListener('change', () => this.savePolicy());
        }
        if (this.allowPurchase) {
            this.allowPurchase.addEventListener('change', () => this.savePolicy());
        }
        if (this.allowFinancial) {
            this.allowFinancial.addEventListener('change', () => this.savePolicy());
        }
        if (this.redactBodies) {
            this.redactBodies.addEventListener('change', () => this.savePolicy());
        }
        if (this.redactPersonalInfo) {
            this.redactPersonalInfo.addEventListener('change', () => this.savePolicy());
        }

        // Pricing change events
        if (this.subscriptionPrice) {
            this.subscriptionPrice.addEventListener('change', () => this.savePolicy());
        }
        if (this.deliveryPrice) {
            this.deliveryPrice.addEventListener('change', () => this.savePolicy());
        }
        if (this.purchasePrice) {
            this.purchasePrice.addEventListener('change', () => this.savePolicy());
        }
        if (this.financialPrice) {
            this.financialPrice.addEventListener('change', () => this.savePolicy());
        }

        // Advanced configuration events
        if (this.maxEmailAge) {
            this.maxEmailAge.addEventListener('change', () => this.savePolicy());
        }
        if (this.maxEmailsPerRequest) {
            this.maxEmailsPerRequest.addEventListener('change', () => this.savePolicy());
        }
        if (this.requestTimeout) {
            this.requestTimeout.addEventListener('change', () => this.savePolicy());
        }

        // Payment configuration events
        if (this.walletAddress) {
            this.walletAddress.addEventListener('change', () => this.savePolicy());
        }

        // Demo button events
        if (this.demoSubscription) {
            this.demoSubscription.addEventListener('click', () => this.runDemo('subscription'));
        }
        if (this.demoDelivery) {
            this.demoDelivery.addEventListener('click', () => this.runDemo('delivery'));
        }
        if (this.demoPurchase) {
            this.demoPurchase.addEventListener('click', () => this.runDemo('purchase'));
        }

        // Footer events
        if (this.viewLogs) {
            this.viewLogs.addEventListener('click', (e: Event) => {
                e.preventDefault();
                this.openLogs();
            });
        }
        if (this.settings) {
            this.settings.addEventListener('click', (e: Event) => {
                e.preventDefault();
                this.openSettings();
            });
        }
    }

    async loadUserPolicy() {
        try {
            const response = await this.sendMessage({
                type: 'GET_USER_POLICY'
            }) as any;

            if (response.success) {
                const policy = response.policy;
                console.log('Loading policy:', policy);
                
                // Update UI elements with saved policy
                if (this.globalDataSharing) this.globalDataSharing.checked = policy.globalDataSharing || false;
                if (this.allowSubscription) this.allowSubscription.checked = policy.allowSubscriptionProof || false;
                if (this.allowDelivery) this.allowDelivery.checked = policy.allowDeliveryProof || false;
                if (this.allowPurchase) this.allowPurchase.checked = policy.allowPurchaseProof || false;
                if (this.allowFinancial) this.allowFinancial.checked = policy.allowFinancialProof || false;
                if (this.redactBodies) this.redactBodies.checked = policy.redactEmailBodies || false;
                if (this.redactPersonalInfo) this.redactPersonalInfo.checked = policy.redactPersonalInfo || false;
                if (this.maxEmailAge) this.maxEmailAge.value = policy.maxEmailAge || 90;
                if (this.maxEmailsPerRequest) this.maxEmailsPerRequest.value = policy.maxEmailsPerRequest || 10;
                if (this.requestTimeout) this.requestTimeout.value = policy.requestTimeout || 60;
                if (this.walletAddress) this.walletAddress.value = policy.walletAddress || '';
                if (this.facilitatorUrl) this.facilitatorUrl.value = policy.facilitatorUrl || 'https://x402.org/facilitator';
                
                // Update pricing
                if (policy.pricing) {
                    if (this.subscriptionPrice) this.subscriptionPrice.value = policy.pricing.subscription || 0.05;
                    if (this.deliveryPrice) this.deliveryPrice.value = policy.pricing.delivery || 0.10;
                    if (this.purchasePrice) this.purchasePrice.value = policy.pricing.purchase || 0.25;
                    if (this.financialPrice) this.financialPrice.value = policy.pricing.financial || 0.50;
                }
                
                console.log('Policy loaded successfully');
                this.showNotification('Policy loaded', 'success');
            } else {
                console.error('Failed to get policy:', response.error);
                // Load default policy if none exists
                this.loadDefaultPolicy();
            }
        } catch (error) {
            console.error('Failed to load user policy:', error);
            // Load default policy on error
            this.loadDefaultPolicy();
        }
    }

    loadDefaultPolicy() {
        console.log('Loading default policy');
        if (this.globalDataSharing) this.globalDataSharing.checked = true;
        if (this.allowSubscription) this.allowSubscription.checked = true;
        if (this.allowDelivery) this.allowDelivery.checked = true;
        if (this.allowPurchase) this.allowPurchase.checked = false;
        if (this.allowFinancial) this.allowFinancial.checked = false;
        if (this.redactBodies) this.redactBodies.checked = true;
        if (this.redactPersonalInfo) this.redactPersonalInfo.checked = true;
        if (this.maxEmailAge) this.maxEmailAge.value = '90';
        if (this.maxEmailsPerRequest) this.maxEmailsPerRequest.value = '10';
        if (this.requestTimeout) this.requestTimeout.value = '60';
        if (this.subscriptionPrice) this.subscriptionPrice.value = '0.05';
        if (this.deliveryPrice) this.deliveryPrice.value = '0.10';
        if (this.purchasePrice) this.purchasePrice.value = '0.25';
        if (this.financialPrice) this.financialPrice.value = '0.50';
        if (this.facilitatorUrl) this.facilitatorUrl.value = 'https://x402.org/facilitator';
    }

    handleGlobalToggle() {
        const isEnabled = this.globalDataSharing?.checked || false;
        
        // Enable/disable all individual predicates based on global toggle
        const predicates = [
            this.allowSubscription,
            this.allowDelivery,
            this.allowPurchase,
            this.allowFinancial
        ];
        
        predicates.forEach(predicate => {
            if (predicate) {
                predicate.checked = isEnabled;
            }
        });
        
        this.savePolicy();
        this.showNotification(isEnabled ? 'All data sharing enabled' : 'All data sharing disabled');
    }

    validatePolicy() {
        const errors = [];
        
        // Validate wallet address if provided
        const walletAddress = this.walletAddress?.value?.trim();
        if (walletAddress && !this.isValidEthereumAddress(walletAddress)) {
            errors.push('Invalid wallet address format');
        }
        
        // Validate pricing values
        const prices = [
            { name: 'Subscription', value: this.subscriptionPrice?.value },
            { name: 'Delivery', value: this.deliveryPrice?.value },
            { name: 'Purchase', value: this.purchasePrice?.value },
            { name: 'Financial', value: this.financialPrice?.value }
        ];
        
        prices.forEach(price => {
            const numValue = parseFloat(price.value || '0');
            if (isNaN(numValue) || numValue < 0 || numValue > 100) {
                errors.push(`${price.name} price must be between $0 and $100`);
            }
        });
        
        // Validate numeric inputs
        const maxAge = parseInt(this.maxEmailAge?.value || '0');
        if (maxAge < 1 || maxAge > 365) {
            errors.push('Max email age must be between 1 and 365 days');
        }
        
        const maxEmails = parseInt(this.maxEmailsPerRequest?.value || '0');
        if (maxEmails < 1 || maxEmails > 100) {
            errors.push('Max emails per request must be between 1 and 100');
        }
        
        const timeout = parseInt(this.requestTimeout?.value || '0');
        if (timeout < 10 || timeout > 300) {
            errors.push('Request timeout must be between 10 and 300 seconds');
        }
        
        return errors;
    }
    
    isValidEthereumAddress(address: string): boolean {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }

    async savePolicy() {
        // Validate policy before saving
        const validationErrors = this.validatePolicy();
        if (validationErrors.length > 0) {
            this.showNotification(`Policy validation failed: ${validationErrors.join(', ')}`, 'error');
            return;
        }

        const policy = {
            // Global settings
            globalDataSharing: this.globalDataSharing?.checked || false,
            
            // Predicate permissions
            allowSubscriptionProof: this.allowSubscription?.checked || false,
            allowDeliveryProof: this.allowDelivery?.checked || false,
            allowPurchaseProof: this.allowPurchase?.checked || false,
            allowFinancialProof: this.allowFinancial?.checked || false,
            
            // Privacy settings
            redactEmailBodies: this.redactBodies?.checked || false,
            redactPersonalInfo: this.redactPersonalInfo?.checked || false,
            
            // Pricing configuration
            pricing: {
                subscription: parseFloat(this.subscriptionPrice?.value || '0.05'),
                delivery: parseFloat(this.deliveryPrice?.value || '0.10'),
                purchase: parseFloat(this.purchasePrice?.value || '0.25'),
                financial: parseFloat(this.financialPrice?.value || '0.50')
            },
            
            // Advanced configuration
            maxEmailAge: parseInt(this.maxEmailAge?.value || '90'),
            maxEmailsPerRequest: parseInt(this.maxEmailsPerRequest?.value || '10'),
            requestTimeout: parseInt(this.requestTimeout?.value || '60'),
            
            // Payment configuration
            walletAddress: this.walletAddress?.value?.trim() || '',
            facilitatorUrl: this.facilitatorUrl?.value || 'https://x402.org/facilitator',
            network: 'polygon', // Default to Polygon for x402
            
            // Legacy fields for backward compatibility
            showSenderInfo: !(this.redactPersonalInfo?.checked || false),
            showSubjectInfo: true,
            
            // Metadata
            lastUpdated: new Date().toISOString(),
            version: '1.0.0'
        };

        console.log('Saving policy:', policy);

        try {
            const response = await this.sendMessage({
                type: 'UPDATE_USER_POLICY',
                data: policy
            }) as any;

            if (response.success) {
                console.log('Policy saved successfully');
                this.showNotification('Policy updated successfully');
            } else {
                console.error('Failed to save policy:', response.error);
                this.showNotification('Failed to update policy', 'error');
            }
        } catch (error) {
            console.error('Failed to save policy:', error);
            this.showNotification('Failed to update policy', 'error');
        }
    }

    async runDemo(predicateType: string) {
        this.showNotification(`Testing ${predicateType} data filtering...`);

        try {
            // Get current policy to show what would be allowed
            const policyResponse = await this.sendMessage({
                type: 'GET_USER_POLICY'
            }) as any;

            if (!policyResponse.success) {
                throw new Error('Failed to get user policy');
            }

            const policy = policyResponse.policy;
            
            // Check if this predicate type is allowed
            const isAllowed = this.isPredicateAllowed(predicateType, policy);
            
            if (!isAllowed) {
                this.showNotification(`${predicateType} data access is disabled in your policy`, 'error');
                return;
            }

            // Request email data
            const dataResponse = await this.sendMessage({
                type: 'REQUEST_EMAIL_DATA',
                data: {
                    predicate: {
                        type: predicateType,
                        maxAge: policy.maxEmailAge
                    }
                }
            }) as any;

            if (!dataResponse.success) {
                throw new Error(dataResponse.error || 'Failed to get email data');
            }

            // Show the filtered results
            this.displayFilteredResults(predicateType, dataResponse.data, policy);
            this.showNotification(`Found ${dataResponse.data.length} ${predicateType} emails (filtered by policy)`);

        } catch (error: any) {
            console.error('Demo failed:', error);
            this.showNotification(`Demo failed: ${error.message}`, 'error');
        }
    }

    isPredicateAllowed(predicateType: string, policy: any) {
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

    displayFilteredResults(predicateType: string, emailData: any[], policy: any) {
        // Create a results display in the popup
        let resultsHtml = `
            <div class="filter-results">
                <h4>${predicateType.charAt(0).toUpperCase() + predicateType.slice(1)} Data (${emailData.length} emails)</h4>
                <div class="filter-info">
                    <strong>Policy Applied:</strong><br>
                    • Max age: ${policy.maxEmailAge} days<br>
                    • Bodies redacted: ${policy.redactEmailBodies ? 'Yes' : 'No'}<br>
                    • Sender info: ${policy.showSenderInfo ? 'Shown' : 'Hidden'}<br>
                    • Subject info: ${policy.showSubjectInfo ? 'Shown' : 'Hidden'}
                </div>
                <div class="email-list">
        `;

        emailData.slice(0, 3).forEach((email: any) => {
            resultsHtml += `
                <div class="email-item">
                    <strong>${policy.showSubjectInfo ? email.subject : '[REDACTED]'}</strong><br>
                    <small>From: ${policy.showSenderInfo ? email.sender : '[REDACTED]'}</small><br>
                    <small>Body: ${policy.redactEmailBodies ? '[REDACTED]' : email.body.substring(0, 50) + '...'}</small>
                </div>
            `;
        });

        if (emailData.length > 3) {
            resultsHtml += `<div class="more-emails">... and ${emailData.length - 3} more emails</div>`;
        }

        resultsHtml += `
                </div>
            </div>
        `;

        // Add results to the popup
        const resultsSection = document.createElement('section');
        resultsSection.className = 'results-section';
        resultsSection.innerHTML = resultsHtml;

        // Remove existing results if any
        const existingResults = document.querySelector('.results-section');
        if (existingResults) {
            existingResults.remove();
        }

        // Add new results before footer
        const footer = document.querySelector('.footer');
        if (footer && footer.parentNode) {
            footer.parentNode.insertBefore(resultsSection, footer);
        }
    }

    displayProofResult(proof: any, emailData: any) {
        if (this.proofResult) {
            this.proofResult.innerHTML = `
            <div class="proof-item">
                <div class="proof-label">Predicate Type:</div>
                <div class="proof-value">${proof.predicate.type}</div>
            </div>
            <div class="proof-item">
                <div class="proof-label">Email Count:</div>
                <div class="proof-value">${proof.emailCount}</div>
            </div>
            <div class="proof-item">
                <div class="proof-label">Proof:</div>
                <div class="proof-value">${proof.proof.substring(0, 50)}...</div>
            </div>
            <div class="proof-item">
                <div class="proof-label">Public Signals:</div>
                <div class="proof-value">${proof.publicSignals.join(', ')}</div>
            </div>
            <div class="proof-item">
                <div class="proof-label">Timestamp:</div>
                <div class="proof-value">${new Date(proof.timestamp).toLocaleString()}</div>
            </div>
        `;
        }

        if (this.resultsSection) {
            this.resultsSection.style.display = 'block';
        }
    }

    async checkMailServiceStatus() {
        try {
            // Try to connect to mail-demo service
            const response = await fetch('http://localhost:3000/api/emails');
            if (response.ok) {
                if (this.mailServiceStatus) {
                    this.mailServiceStatus.textContent = 'Connected';
                    this.mailServiceStatus.style.color = '#28a745';
                }
            } else {
                throw new Error('Service not responding');
            }
        } catch (error) {
            if (this.mailServiceStatus) {
                this.mailServiceStatus.textContent = 'Disconnected';
                this.mailServiceStatus.style.color = '#dc3545';
            }
        }
    }

    async loadRecentRequests() {
        try {
            // Load recent requests from storage
            const result = await chrome.storage.local.get(['recentRequests']);
            const requests = result.recentRequests || [];

            if (requests.length === 0) {
                if (this.requestsList) {
                    this.requestsList.innerHTML = '<div class="no-requests">No recent requests</div>';
                }
                return;
            }

            if (this.requestsList) {
                this.requestsList.innerHTML = requests.map((request: any) => `
                <div class="request-item">
                    <strong>${request.predicate.type}</strong> - ${request.timestamp}
                    <br>
                    <small>${request.emailCount} emails found</small>
                </div>
            `).join('');
            }
        } catch (error) {
            console.error('Failed to load recent requests:', error);
        }
    }

    showNotification(message: string, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 8px 16px;
            border-radius: 4px;
            color: white;
            font-size: 12px;
            z-index: 1000;
            background: ${type === 'error' ? '#dc3545' : '#28a745'};
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    openLogs() {
        // Open extension logs (would open a new tab with logs)
        chrome.tabs.create({ url: 'chrome://extensions/' });
    }

    openSettings() {
        // Open extension settings (would open options page)
        chrome.runtime.openOptionsPage();
    }

    sendMessage(message: any) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(response);
                }
            });
        });
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DataGuardPopup();
});
