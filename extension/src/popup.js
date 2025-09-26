// DataGuard Extension Popup Script

class DataGuardPopup {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.loadUserPolicy();
        this.checkMailServiceStatus();
        this.loadRecentRequests();
    }

    initializeElements() {
        // Status elements
        this.statusIndicator = document.getElementById('statusIndicator');
        this.connectionStatus = document.getElementById('connectionStatus');
        this.mailServiceStatus = document.getElementById('mailServiceStatus');

        // Policy elements
        this.allowSubscription = document.getElementById('allowSubscription');
        this.allowDelivery = document.getElementById('allowDelivery');
        this.allowPurchase = document.getElementById('allowPurchase');
        this.redactBodies = document.getElementById('redactBodies');
        this.maxEmailAge = document.getElementById('maxEmailAge');

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
        // Policy change events
        this.allowSubscription.addEventListener('change', () => this.savePolicy());
        this.allowDelivery.addEventListener('change', () => this.savePolicy());
        this.allowPurchase.addEventListener('change', () => this.savePolicy());
        this.redactBodies.addEventListener('change', () => this.savePolicy());
        this.maxEmailAge.addEventListener('change', () => this.savePolicy());

        // Demo button events
        this.demoSubscription.addEventListener('click', () => this.runDemo('subscription'));
        this.demoDelivery.addEventListener('click', () => this.runDemo('delivery'));
        this.demoPurchase.addEventListener('click', () => this.runDemo('purchase'));

        // Footer events
        this.viewLogs.addEventListener('click', (e) => {
            e.preventDefault();
            this.openLogs();
        });
        this.settings.addEventListener('click', (e) => {
            e.preventDefault();
            this.openSettings();
        });
    }

    async loadUserPolicy() {
        try {
            const response = await this.sendMessage({
                type: 'GET_USER_POLICY'
            });

            if (response.success) {
                const policy = response.policy;
                this.allowSubscription.checked = policy.allowSubscriptionProof;
                this.allowDelivery.checked = policy.allowDeliveryProof;
                this.allowPurchase.checked = policy.allowPurchaseProof;
                this.redactBodies.checked = policy.redactEmailBodies;
                this.maxEmailAge.value = policy.maxEmailAge;
            }
        } catch (error) {
            console.error('Failed to load user policy:', error);
        }
    }

    async savePolicy() {
        const policy = {
            allowSubscriptionProof: this.allowSubscription.checked,
            allowDeliveryProof: this.allowDelivery.checked,
            allowPurchaseProof: this.allowPurchase.checked,
            redactEmailBodies: this.redactBodies.checked,
            maxEmailAge: parseInt(this.maxEmailAge.value),
            showSenderInfo: true,
            showSubjectInfo: true
        };

        try {
            const response = await this.sendMessage({
                type: 'UPDATE_USER_POLICY',
                data: policy
            });

            if (response.success) {
                this.showNotification('Policy updated successfully');
            } else {
                this.showNotification('Failed to update policy', 'error');
            }
        } catch (error) {
            console.error('Failed to save policy:', error);
            this.showNotification('Failed to update policy', 'error');
        }
    }

    async runDemo(predicateType) {
        this.showNotification(`Running ${predicateType} proof demo...`);

        try {
            // Request email data
            const dataResponse = await this.sendMessage({
                type: 'REQUEST_EMAIL_DATA',
                data: {
                    predicate: {
                        type: predicateType,
                        maxAge: 90
                    }
                }
            });

            if (!dataResponse.success) {
                throw new Error(dataResponse.error || 'Failed to get email data');
            }

            // Generate proof
            const proofResponse = await this.sendMessage({
                type: 'GENERATE_PROOF',
                data: {
                    predicate: {
                        type: predicateType,
                        maxAge: 90
                    },
                    emailData: dataResponse.data
                }
            });

            if (proofResponse.success) {
                this.displayProofResult(proofResponse.proof, dataResponse.data);
                this.showNotification(`${predicateType} proof generated successfully!`);
            } else {
                throw new Error(proofResponse.error || 'Failed to generate proof');
            }

        } catch (error) {
            console.error('Demo failed:', error);
            this.showNotification(`Demo failed: ${error.message}`, 'error');
        }
    }

    displayProofResult(proof, emailData) {
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

        this.resultsSection.style.display = 'block';
    }

    async checkMailServiceStatus() {
        try {
            // Try to connect to mail-demo service
            const response = await fetch('http://localhost:3000/api/emails');
            if (response.ok) {
                this.mailServiceStatus.textContent = 'Connected';
                this.mailServiceStatus.style.color = '#28a745';
            } else {
                throw new Error('Service not responding');
            }
        } catch (error) {
            this.mailServiceStatus.textContent = 'Disconnected';
            this.mailServiceStatus.style.color = '#dc3545';
        }
    }

    async loadRecentRequests() {
        try {
            // Load recent requests from storage
            const result = await chrome.storage.local.get(['recentRequests']);
            const requests = result.recentRequests || [];

            if (requests.length === 0) {
                this.requestsList.innerHTML = '<div class="no-requests">No recent requests</div>';
                return;
            }

            this.requestsList.innerHTML = requests.map(request => `
                <div class="request-item">
                    <strong>${request.predicate.type}</strong> - ${request.timestamp}
                    <br>
                    <small>${request.emailCount} emails found</small>
                </div>
            `).join('');
        } catch (error) {
            console.error('Failed to load recent requests:', error);
        }
    }

    showNotification(message, type = 'success') {
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

    sendMessage(message) {
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
