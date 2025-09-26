// Mail service integration for DataGuard extension
// Connects to the mail-demo service for email data

import { EmailData, EmailPredicate } from './types';

export class MailService {
    private baseUrl = 'http://localhost:3000';
    private fallbackData: EmailData[] = [];

    async getEmails(): Promise<EmailData[]> {
        try {
            const response = await fetch(`${this.baseUrl}/api/emails`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const emails = await response.json();
            return this.normalizeEmailData(emails);
        } catch (error) {
            console.warn('Failed to fetch from mail-demo service, using fallback data:', error);
            return this.fallbackData;
        }
    }

    async getEmailsByPredicate(predicate: EmailPredicate): Promise<EmailData[]> {
        const allEmails = await this.getEmails();
        return this.filterEmailsByPredicate(allEmails, predicate);
    }

    private filterEmailsByPredicate(emails: EmailData[], predicate: EmailPredicate): EmailData[] {
        const now = new Date();
        const cutoffDate = new Date(now.getTime() - predicate.maxAge * 24 * 60 * 60 * 1000);
        
        return emails.filter(email => {
            const emailDate = new Date(email.date);
            if (emailDate < cutoffDate) return false;
            
            switch (predicate.type) {
                case 'subscription':
                    return this.isSubscriptionEmail(email);
                case 'delivery':
                    return this.isDeliveryEmail(email);
                case 'purchase':
                    return this.isPurchaseEmail(email);
                default:
                    return false;
            }
        });
    }

    private isSubscriptionEmail(email: EmailData): boolean {
        const subscriptionKeywords = [
            'unsubscribe', 'subscription', 'newsletter', 'digest', 'weekly', 'monthly'
        ];
        
        const subjectLower = email.subject.toLowerCase();
        const senderLower = email.sender.toLowerCase();
        
        return email.type === 'subscription' ||
               subscriptionKeywords.some(keyword => 
                   subjectLower.includes(keyword) || senderLower.includes(keyword)
               ) ||
               this.isNewsletterSender(email.sender);
    }

    private isDeliveryEmail(email: EmailData): boolean {
        const deliveryKeywords = [
            'delivered', 'delivery', 'shipped', 'tracking', 'package', 'parcel'
        ];
        
        const deliverySenders = [
            'amazon', 'dhl', 'ups', 'fedex', 'usps', 'flipkart', 'myntra'
        ];
        
        const subjectLower = email.subject.toLowerCase();
        const senderLower = email.sender.toLowerCase();
        
        return email.type === 'delivery' ||
               deliveryKeywords.some(keyword => subjectLower.includes(keyword)) ||
               deliverySenders.some(sender => senderLower.includes(sender));
    }

    private isPurchaseEmail(email: EmailData): boolean {
        const purchaseKeywords = [
            'order', 'receipt', 'invoice', 'payment', 'purchase', 'billing'
        ];
        
        const subjectLower = email.subject.toLowerCase();
        
        return email.type === 'purchase' ||
               purchaseKeywords.some(keyword => subjectLower.includes(keyword));
    }

    private isNewsletterSender(sender: string): boolean {
        const newsletterDomains = [
            'newsletter', 'digest', 'weekly', 'monthly', 'updates'
        ];
        
        const senderLower = sender.toLowerCase();
        return newsletterDomains.some(domain => senderLower.includes(domain));
    }

    private normalizeEmailData(emails: any[]): EmailData[] {
        return emails.map(email => ({
            id: email.id || this.generateId(),
            subject: email.subject || 'No Subject',
            sender: email.sender || 'Unknown Sender',
            date: email.date || new Date().toISOString(),
            body: email.body || '',
            type: email.type || 'general'
        }));
    }

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }

    async checkServiceStatus(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/health`, {
                method: 'GET',
                timeout: 5000
            } as any);
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    async getServiceInfo(): Promise<any> {
        try {
            const response = await fetch(`${this.baseUrl}/api/info`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            return {
                name: 'DataGuard Mail Demo',
                version: '1.0.0',
                status: 'offline',
                fallback: true
            };
        }
    }
}
