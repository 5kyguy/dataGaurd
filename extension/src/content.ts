// Content script for DataGuard extension
// Intercepts and handles data requests from web pages

import { DataRequest, ExtensionMessage } from './types';

class DataGuardContentScript {
    private isInitialized = false;
    private requestQueue: DataRequest[] = [];

    constructor() {
        this.init();
    }

    private init() {
        if (this.isInitialized) return;
        
        console.log('DataGuard content script initialized');
        this.setupMessageListener();
        this.setupRequestInterceptor();
        this.injectDataGuardAPI();
        this.isInitialized = true;
    }

    private setupMessageListener() {
        // Listen for messages from the extension popup/background
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            console.log('Content script received message:', message);
            
            switch (message.type) {
                case 'INJECT_DATA_GUARD_API':
                    this.injectDataGuardAPI();
                    sendResponse({ success: true });
                    break;
                    
                case 'HANDLE_DATA_REQUEST':
                    this.handleDataRequest(message.data, sendResponse);
                    return true; // Keep message channel open for async response
                    
                default:
                    console.warn('Unknown message type in content script:', message.type);
                    sendResponse({ error: 'Unknown message type' });
            }
        });
    }

    private setupRequestInterceptor() {
        // Intercept fetch requests that might be requesting email data
        const originalFetch = window.fetch;
        const self = this;

        window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
            const url = typeof input === 'string' ? input : input.toString();
            
            // Check if this looks like an email data request
            if (self.isEmailDataRequest(url, init)) {
                console.log('Intercepted potential email data request:', url);
                
                // Queue the request for user approval
                const request: DataRequest = {
                    predicate: self.extractPredicateFromRequest(url, init),
                    requester: self.getRequesterDomain(),
                    purpose: self.extractPurposeFromRequest(init),
                    timestamp: new Date().toISOString()
                };
                
                self.requestQueue.push(request);
                
                // Show notification to user
                self.showRequestNotification(request);
                
                // Return a placeholder response
                return new Response(JSON.stringify({
                    error: 'Request intercepted by DataGuard',
                    message: 'Please approve this request in the DataGuard extension popup'
                }), {
                    status: 202,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            
            // For non-email requests, use original fetch
            return originalFetch.call(this, input, init);
        };
    }

    private isEmailDataRequest(url: string, init?: RequestInit): boolean {
        // Check if the request is likely asking for email data
        const emailKeywords = [
            'email', 'inbox', 'mail', 'subscription', 'delivery', 
            'purchase', 'receipt', 'order', 'newsletter'
        ];
        
        const urlLower = url.toLowerCase();
        const bodyText = init?.body ? init.body.toString().toLowerCase() : '';
        
        return emailKeywords.some(keyword => 
            urlLower.includes(keyword) || bodyText.includes(keyword)
        );
    }

    private extractPredicateFromRequest(url: string, init?: RequestInit): any {
        // Extract predicate information from the request
        const urlLower = url.toLowerCase();
        const bodyText = init?.body ? init.body.toString().toLowerCase() : '';
        
        if (urlLower.includes('subscription') || bodyText.includes('subscription')) {
            return { type: 'subscription', maxAge: 90 };
        } else if (urlLower.includes('delivery') || bodyText.includes('delivery')) {
            return { type: 'delivery', maxAge: 30 };
        } else if (urlLower.includes('purchase') || bodyText.includes('purchase')) {
            return { type: 'purchase', maxAge: 30 };
        }
        
        // Default to subscription if unclear
        return { type: 'subscription', maxAge: 90 };
    }

    private getRequesterDomain(): string {
        return window.location.hostname;
    }

    private extractPurposeFromRequest(init?: RequestInit): string {
        // Try to extract purpose from request headers or body
        const purposeHeader = init?.headers ? 
            (init.headers as any)['X-Purpose'] || 
            (init.headers as any)['Purpose'] : null;
            
        if (purposeHeader) {
            return purposeHeader.toString();
        }
        
        return 'Data access request';
    }

    private showRequestNotification(request: DataRequest) {
        // Create a notification element
        const notification = document.createElement('div');
        notification.id = 'dataguard-notification';
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #007bff;
                color: white;
                padding: 16px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                max-width: 300px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
            ">
                <div style="font-weight: 600; margin-bottom: 8px;">
                    🛡️ DataGuard Request
                </div>
                <div style="margin-bottom: 8px;">
                    <strong>${request.requester}</strong> is requesting ${request.predicate.type} data
                </div>
                <div style="margin-bottom: 12px; font-size: 12px; opacity: 0.9;">
                    Purpose: ${request.purpose}
                </div>
                <div style="display: flex; gap: 8px;">
                    <button id="dataguard-approve" style="
                        background: #28a745;
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    ">Approve</button>
                    <button id="dataguard-deny" style="
                        background: #dc3545;
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    ">Deny</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Add event listeners
        document.getElementById('dataguard-approve')?.addEventListener('click', () => {
            this.handleUserResponse(request, true);
            notification.remove();
        });
        
        document.getElementById('dataguard-deny')?.addEventListener('click', () => {
            this.handleUserResponse(request, false);
            notification.remove();
        });
        
        // Auto-remove after 30 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 30000);
    }

    private async handleUserResponse(request: DataRequest, approved: boolean) {
        if (approved) {
            // Send request to background script for processing
            try {
                const response = await this.sendMessageToBackground({
                    type: 'REQUEST_EMAIL_DATA',
                    data: { predicate: request.predicate }
                });
                
                if (response.success) {
                    this.showSuccessNotification('Request approved and processed');
                } else {
                    this.showErrorNotification('Request failed: ' + response.error);
                }
            } catch (error) {
                console.error('Failed to process approved request:', error);
                this.showErrorNotification('Failed to process request');
            }
        } else {
            this.showInfoNotification('Request denied by user');
        }
    }

    private async handleDataRequest(request: DataRequest, sendResponse: (response: any) => void) {
        try {
            // Forward request to background script
            const response = await this.sendMessageToBackground({
                type: 'REQUEST_EMAIL_DATA',
                data: { predicate: request.predicate }
            });
            
            sendResponse(response);
        } catch (error) {
            console.error('Failed to handle data request:', error);
            sendResponse({ 
                error: 'Failed to process data request',
                details: error instanceof Error ? error.message : String(error)
            });
        }
    }

    private injectDataGuardAPI() {
        // Inject DataGuard API into the page
        if ((window as any).DataGuard) return; // Already injected
        
        (window as any).DataGuard = {
            requestEmailData: async (predicate: any) => {
                console.log('DataGuard API called with predicate:', predicate);
                
                const response = await this.sendMessageToBackground({
                    type: 'REQUEST_EMAIL_DATA',
                    data: { predicate }
                });
                
                return response;
            },
            
            generateProof: async (predicate: any, emailData: any) => {
                console.log('DataGuard API called to generate proof:', predicate);
                
                const response = await this.sendMessageToBackground({
                    type: 'GENERATE_PROOF',
                    data: { predicate, emailData }
                });
                
                return response;
            },
            
            getPolicy: async () => {
                const response = await this.sendMessageToBackground({
                    type: 'GET_USER_POLICY'
                });
                
                return response;
            }
        };
        
        console.log('DataGuard API injected into page');
    }

    private showSuccessNotification(message: string) {
        this.showNotification(message, 'success');
    }

    private showErrorNotification(message: string) {
        this.showNotification(message, 'error');
    }

    private showInfoNotification(message: string) {
        this.showNotification(message, 'info');
    }

    private showNotification(message: string, type: 'success' | 'error' | 'info') {
        const notification = document.createElement('div');
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            info: '#17a2b8'
        };
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type]};
            color: white;
            padding: 12px 16px;
            border-radius: 6px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    private sendMessageToBackground(message: ExtensionMessage): Promise<any> {
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

// Initialize content script
new DataGuardContentScript();
