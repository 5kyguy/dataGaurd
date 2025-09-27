import { sampleEmails, Email, getEmailsByType, getUnreadEmails } from './data/sampleEmails.js';

class EmailServiceDemo {
    private emails: Email[] = sampleEmails;
    private filteredEmails: Email[] = sampleEmails;
    private currentFilter: string = 'all';

    constructor() {
        console.log('EmailServiceDemo constructor');
        console.log('Sample emails loaded:', this.emails.length);
        console.log('First email:', this.emails[0]);
        this.initializeEventListeners();
        this.renderEmails();
        this.updateStats();
    }

    private initializeEventListeners(): void {
        // Filter buttons
        document.getElementById('all-emails')?.addEventListener('click', () => this.filterEmails('all'));
        document.getElementById('subscription-emails')?.addEventListener('click', () => this.filterEmails('subscription'));
        document.getElementById('delivery-emails')?.addEventListener('click', () => this.filterEmails('delivery'));
        document.getElementById('purchase-emails')?.addEventListener('click', () => this.filterEmails('purchase'));
        document.getElementById('unread-emails')?.addEventListener('click', () => this.filterEmails('unread'));

        console.log('Event listeners initialized');
    }

    private filterEmails(filter: string): void {
        this.currentFilter = filter;
        
        // Update active button
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${filter}-emails`)?.classList.add('active');

        // Filter emails
        switch (filter) {
            case 'subscription':
                this.filteredEmails = getEmailsByType('subscription');
                break;
            case 'delivery':
                this.filteredEmails = getEmailsByType('delivery');
                break;
            case 'purchase':
                this.filteredEmails = getEmailsByType('purchase');
                break;
            case 'unread':
                this.filteredEmails = getUnreadEmails();
                break;
            default:
                this.filteredEmails = this.emails;
        }

        this.renderEmails();
        this.updateStats();
    }

    private renderEmails(): void {
        const emailList = document.getElementById('email-list');
        console.log('Email list element:', emailList);
        if (!emailList) {
            console.error('Email list element not found!');
            return;
        }

        emailList.innerHTML = '';

        console.log('Rendering emails', this.filteredEmails);
        console.log('Number of emails to render:', this.filteredEmails.length);

        this.filteredEmails.forEach(email => {
            const emailElement = this.createEmailElement(email);
            emailList.appendChild(emailElement);
        });

        console.log('Emails rendered', this.filteredEmails);
        console.log('Email list children count:', emailList.children.length);
    }

    private createEmailElement(email: Email): HTMLElement {
        const emailDiv = document.createElement('div');
        emailDiv.className = `email-item ${email.isRead ? 'read' : 'unread'}`;
        emailDiv.dataset.emailId = email.id;

        const timeAgo = this.formatTimeAgo(new Date(email.timestamp));
        const preview = email.body.length > 120 ? email.body.substring(0, 120) + '...' : email.body;

        emailDiv.innerHTML = `
            <div class="email-content">
                <div class="email-header">
                    <span class="email-from">${email.from}</span>
                    <span class="email-time">${timeAgo}</span>
                </div>
                <div class="email-subject">${email.subject}</div>
                <div class="email-preview">${preview}</div>
            </div>
            <div class="email-type ${email.type}">${email.type}</div>
        `;

        return emailDiv;
    }

    private updateStats(): void {
        const countElement = document.getElementById('email-count');
        if (countElement) {
            countElement.textContent = `${this.filteredEmails.length} emails`;
        }
    }

    private formatTimeAgo(date: Date): string {
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
        
        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;
        
        const diffInWeeks = Math.floor(diffInDays / 7);
        return `${diffInWeeks}w ago`;
    }

}

// Initialize the demo when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new EmailServiceDemo();
});
