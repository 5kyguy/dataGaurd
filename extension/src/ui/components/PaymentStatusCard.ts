// PaymentStatusCard Component
// Displays payment processing status and results

export interface PaymentStatus {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    message: string;
    transactionHash?: string;
    amount?: number;
    recipient?: string;
    timestamp?: number;
    error?: string;
}

export interface PaymentStatusCardProps {
    status: PaymentStatus;
    onRetry?: () => void;
    onClose?: () => void;
}

export class PaymentStatusCard {
    private element: HTMLElement;
    private status: PaymentStatus;
    private onRetry?: () => void;
    private onClose?: () => void;

    constructor(
        container: HTMLElement,
        status: PaymentStatus,
        onRetry?: () => void,
        onClose?: () => void
    ) {
        this.status = status;
        this.onRetry = onRetry;
        this.onClose = onClose;

        this.element = this.createStatusElement();
        container.appendChild(this.element);
        this.bindEvents();
    }

    private createStatusElement(): HTMLElement {
        const card = document.createElement('div');
        card.className = `payment-status-card ${this.status.status}`;
        card.innerHTML = `
            <div class="status-header">
                <div class="status-icon">
                    ${this.getStatusIcon()}
                </div>
                <div class="status-info">
                    <h4>${this.getStatusTitle()}</h4>
                    <p class="status-message">${this.status.message}</p>
                </div>
                ${this.onClose ? '<button class="close-btn">&times;</button>' : ''}
            </div>
            ${this.getStatusDetails()}
            ${this.getActionButtons()}
        `;

        return card;
    }

    private getStatusIcon(): string {
        switch (this.status.status) {
            case 'pending':
                return '⏳';
            case 'processing':
                return '🔄';
            case 'completed':
                return '✅';
            case 'failed':
                return '❌';
            default:
                return '❓';
        }
    }

    private getStatusTitle(): string {
        switch (this.status.status) {
            case 'pending':
                return 'Payment Pending';
            case 'processing':
                return 'Processing Payment';
            case 'completed':
                return 'Payment Completed';
            case 'failed':
                return 'Payment Failed';
            default:
                return 'Unknown Status';
        }
    }

    private getStatusDetails(): string {
        if (this.status.status === 'completed' && this.status.transactionHash) {
            return `
                <div class="status-details">
                    <div class="detail-item">
                        <span class="detail-label">Amount:</span>
                        <span class="detail-value">$${this.status.amount?.toFixed(3)} USDC</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Recipient:</span>
                        <span class="detail-value">${this.formatAddress(this.status.recipient || '')}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Transaction:</span>
                        <span class="detail-value">
                            <a href="https://polygonscan.com/tx/${this.status.transactionHash}" 
                               target="_blank" 
                               class="transaction-link">
                                ${this.formatTransactionHash(this.status.transactionHash)}
                            </a>
                        </span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Time:</span>
                        <span class="detail-value">${this.formatTimestamp(this.status.timestamp || Date.now())}</span>
                    </div>
                </div>
            `;
        }

        if (this.status.status === 'failed' && this.status.error) {
            return `
                <div class="status-details error">
                    <div class="error-message">
                        <strong>Error:</strong> ${this.status.error}
                    </div>
                </div>
            `;
        }

        return '';
    }

    private getActionButtons(): string {
        if (this.status.status === 'failed' && this.onRetry) {
            return `
                <div class="action-buttons">
                    <button class="retry-btn">Retry Payment</button>
                </div>
            `;
        }

        return '';
    }

    private bindEvents(): void {
        const closeBtn = this.element.querySelector('.close-btn');
        const retryBtn = this.element.querySelector('.retry-btn');

        if (closeBtn && this.onClose) {
            closeBtn.addEventListener('click', this.onClose);
        }

        if (retryBtn && this.onRetry) {
            retryBtn.addEventListener('click', this.onRetry);
        }
    }

    private formatAddress(address: string): string {
        if (address.length <= 42) return address;
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    private formatTransactionHash(hash: string): string {
        if (hash.length <= 16) return hash;
        return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
    }

    private formatTimestamp(timestamp: number): string {
        return new Date(timestamp).toLocaleString();
    }

    public updateStatus(newStatus: PaymentStatus): void {
        this.status = newStatus;
        this.element.className = `payment-status-card ${this.status.status}`;
        this.element.innerHTML = `
            <div class="status-header">
                <div class="status-icon">
                    ${this.getStatusIcon()}
                </div>
                <div class="status-info">
                    <h4>${this.getStatusTitle()}</h4>
                    <p class="status-message">${this.status.message}</p>
                </div>
                ${this.onClose ? '<button class="close-btn">&times;</button>' : ''}
            </div>
            ${this.getStatusDetails()}
            ${this.getActionButtons()}
        `;
        this.bindEvents();
    }

    public destroy(): void {
        if (this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

// CSS styles for the payment status card (to be included in main CSS)
export const paymentStatusCardStyles = `
.payment-status-card {
    background: white;
    border-radius: 8px;
    border: 1px solid #e9ecef;
    margin: 12px 0;
    padding: 16px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.payment-status-card.pending {
    border-left: 4px solid #ffc107;
}

.payment-status-card.processing {
    border-left: 4px solid #007bff;
}

.payment-status-card.completed {
    border-left: 4px solid #28a745;
}

.payment-status-card.failed {
    border-left: 4px solid #dc3545;
}

.status-header {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
}

.status-icon {
    font-size: 24px;
    margin-right: 12px;
}

.status-info {
    flex: 1;
}

.status-info h4 {
    margin: 0 0 4px 0;
    font-size: 16px;
    font-weight: 600;
}

.status-message {
    margin: 0;
    font-size: 14px;
    color: #666;
}

.close-btn {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #666;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.close-btn:hover {
    color: #333;
}

.status-details {
    margin: 12px 0;
}

.detail-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 13px;
}

.detail-label {
    font-weight: 500;
    color: #666;
}

.detail-value {
    color: #333;
}

.transaction-link {
    color: #007bff;
    text-decoration: none;
}

.transaction-link:hover {
    text-decoration: underline;
}

.error-message {
    background: #f8d7da;
    color: #721c24;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 13px;
}

.action-buttons {
    margin-top: 12px;
    text-align: right;
}

.retry-btn {
    background: #007bff;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
}

.retry-btn:hover {
    background: #0056b3;
}
`;

// Factory function
export function createPaymentStatusCard(
    container: HTMLElement,
    status: PaymentStatus,
    onRetry?: () => void,
    onClose?: () => void
): PaymentStatusCard {
    return new PaymentStatusCard(container, status, onRetry, onClose);
}
