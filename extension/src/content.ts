// Content script for DataGuard extension
// Intercepts and handles data requests from web pages

// Define types locally since we're not using modules
interface EmailPredicate {
  type: 'subscription' | 'delivery' | 'purchase';
  maxAge: number;
}

interface DataRequest {
  predicate: EmailPredicate;
  requester: string;
  purpose: string;
  timestamp: string;
  originalUrl?: string;
  originalInit?: RequestInit;
}

interface ExtensionMessage {
  type: 'REQUEST_EMAIL_DATA' | 'GENERATE_PROOF' | 'GET_USER_POLICY' | 'UPDATE_USER_POLICY';
  data?: any;
}

class DataGuardContentScript {
    private isInitialized = false;
    private requestQueue: DataRequest[] = [];

    constructor() {
        this.init();
    }

    private init() {
        if (this.isInitialized) return;
        
        console.log('🛡️ DataGuard content script initialized on:', window.location.href);
        console.log('🛡️ DataGuard extension ID:', chrome.runtime.id);
        
        // Set up core functionality immediately
        this.setupMessageListener();
        this.setupRequestInterceptor();
        this.injectDataGuardAPI();
        this.isInitialized = true;
        
        // Wait for DOM to be ready before adding visual indicator
        this.waitForDOMAndAddIndicator();
    }

    private waitForDOMAndAddIndicator() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.addExtensionIndicator();
            });
        } else {
            // DOM is already ready
            this.addExtensionIndicator();
        }
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
                console.log('🛡️ DataGuard: Intercepted email data request:', url);
                
                // Queue the request for user approval
                const request: DataRequest = {
                    predicate: self.extractPredicateFromRequest(url, init),
                    requester: self.getRequesterDomain(),
                    purpose: self.extractPurposeFromRequest(init),
                    timestamp: new Date().toISOString(),
                    originalUrl: url,
                    originalInit: init
                };
                
                self.requestQueue.push(request);
                
                // Show notification to user and wait for response
                const userResponse = await self.showRequestNotificationAndWait(request);
                
                if (userResponse.approved) {
                    console.log('🛡️ DataGuard: User approved request, processing...');
                    
                    try {
                        // Send request to background script for processing with user policy
                        const response = await self.sendMessageToBackground({
                            type: 'REQUEST_EMAIL_DATA',
                            data: { predicate: request.predicate }
                        });
                        
                        if (response.success) {
                            console.log(`🛡️ DataGuard: Returning filtered data (${response.data.length} emails)`);
                            
                            // Store the approved response
                            self.storeApprovedResponse(request, response.data);
                            
                            // Return the filtered data as if it came from the original API
                            return new Response(JSON.stringify(response.data), {
                                status: 200,
                                headers: { 'Content-Type': 'application/json' }
                            });
                        } else {
                            console.error('🛡️ DataGuard: Request failed:', response.error);
                            return new Response(JSON.stringify({
                                error: 'Request denied by DataGuard policy',
                                details: response.error
                            }), {
                                status: 403,
                                headers: { 'Content-Type': 'application/json' }
                            });
                        }
                    } catch (error) {
                        console.error('🛡️ DataGuard: Failed to process approved request:', error);
                        return new Response(JSON.stringify({
                            error: 'Failed to process request',
                            details: error instanceof Error ? error.message : String(error)
                        }), {
                            status: 500,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                } else {
                    console.log('🛡️ DataGuard: User denied request');
                    self.storeDeniedRequest(request);
                    
                    // Return an empty response for denied requests
                    return new Response(JSON.stringify([]), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            }
            
            // For non-email requests, use original fetch
            return originalFetch.call(this, input, init);
        };
    }

    private isEmailDataRequest(url: string, init?: RequestInit): boolean {
        // Check if the request is to the mail-demo service specifically
        if (url.includes('localhost:3000') && url.includes('/api/emails')) {
            return true;
        }
        
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
        
        // Check URL parameters for mail-demo service
        const urlObj = new URL(url);
        const typeParam = urlObj.searchParams.get('type');
        
        if (typeParam) {
            switch (typeParam) {
                case 'subscription':
                    return { type: 'subscription', maxAge: 90 };
                case 'delivery':
                    return { type: 'delivery', maxAge: 30 };
                case 'purchase':
                    return { type: 'purchase', maxAge: 30 };
                case 'unread':
                    return { type: 'subscription', maxAge: 90 }; // Default to subscription for unread
                default:
                    return { type: 'subscription', maxAge: 90 };
            }
        }
        
        // Fallback to keyword detection
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

    private showRequestNotificationAndWait(request: DataRequest): Promise<{approved: boolean}> {
        return new Promise((resolve) => {
            // Wait for DOM to be ready
            const showNotification = () => {
                // Wait for DOM to be ready
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', showNotification);
                    return;
                }
                
                if (!document.body) {
                    setTimeout(showNotification, 100);
                    return;
                }

                // Remove any existing notification
                const existingNotification = document.getElementById('dataguard-notification');
                if (existingNotification) {
                    existingNotification.remove();
                }

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
                    notification.remove();
                    resolve({ approved: true });
                });
                
                document.getElementById('dataguard-deny')?.addEventListener('click', () => {
                    notification.remove();
                    resolve({ approved: false });
                });
                
                // Auto-deny after 30 seconds if no response
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                        resolve({ approved: false });
                    }
                }, 30000);
            };
            
            showNotification();
        });
    }


    private storeApprovedResponse(request: DataRequest, data: any[]) {
        // Store approved requests for logging/debugging
        chrome.storage.local.get(['recentRequests']).then((result) => {
            const requests = result.recentRequests || [];
            requests.unshift({
                ...request,
                approved: true,
                emailCount: data.length,
                timestamp: new Date().toLocaleString()
            });
            // Keep only last 10 requests
            chrome.storage.local.set({ 
                recentRequests: requests.slice(0, 10) 
            });
        });
    }

    private storeDeniedRequest(request: DataRequest) {
        // Store denied requests for logging
        chrome.storage.local.get(['recentRequests']).then((result) => {
            const requests = result.recentRequests || [];
            requests.unshift({
                ...request,
                approved: false,
                timestamp: new Date().toLocaleString()
            });
            // Keep only last 10 requests
            chrome.storage.local.set({ 
                recentRequests: requests.slice(0, 10) 
            });
        });
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
        // Wait for DOM to be ready
        const showNotif = () => {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', showNotif);
                return;
            }
            
            if (!document.body) {
                setTimeout(showNotif, 100);
                return;
            }
            
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
        };
        
        showNotif();
    }

    private addExtensionIndicator() {
        // Wait for DOM to be ready before adding indicator
        const addIndicator = () => {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', addIndicator);
                return;
            }
            
            if (!document.body) {
                // If body doesn't exist yet, wait a bit more
                setTimeout(addIndicator, 100);
                return;
            }
            
            // Add a small indicator that DataGuard is active
            const indicator = document.createElement('div');
            indicator.id = 'dataguard-indicator';
            indicator.innerHTML = '🛡️ DataGuard Active';
            indicator.style.cssText = `
                position: fixed;
                top: 10px;
                left: 10px;
                background: #28a745;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                z-index: 9999;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            `;
            
            document.body.appendChild(indicator);
            
            // Remove after 3 seconds
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.remove();
                }
            }, 3000);
        };
        
        addIndicator();
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
