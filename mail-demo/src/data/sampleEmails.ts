export interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  timestamp: string;
  type: 'subscription' | 'delivery' | 'purchase' | 'general';
  isRead: boolean;
}

export const sampleEmails: Email[] = [
  // Subscription emails
  {
    id: '1',
    from: 'newsletter@techcrunch.com',
    to: 'user@example.com',
    subject: 'Weekly Tech News - AI Breakthroughs',
    body: 'This week in tech: Major AI developments, startup funding rounds, and industry insights. Unsubscribe here.',
    timestamp: '2024-01-15T10:30:00Z',
    type: 'subscription',
    isRead: false
  },
  {
    id: '2',
    from: 'updates@github.com',
    to: 'user@example.com',
    subject: 'Your weekly GitHub digest',
    body: 'Here are the repositories you starred this week. Manage your subscription preferences.',
    timestamp: '2024-01-14T09:15:00Z',
    type: 'subscription',
    isRead: true
  },
  {
    id: '3',
    from: 'noreply@medium.com',
    to: 'user@example.com',
    subject: 'Your Medium digest',
    body: 'Top stories from your interests this week. Click here to unsubscribe.',
    timestamp: '2024-01-13T14:20:00Z',
    type: 'subscription',
    isRead: false
  },
  {
    id: '16',
    from: 'news@nyt.com',
    to: 'user@example.com',
    subject: 'The Morning Briefing',
    body: 'Today’s top stories, curated for you. Unsubscribe anytime.',
    timestamp: '2024-01-16T07:45:00Z',
    type: 'subscription',
    isRead: true
  },
  {
    id: '17',
    from: 'offers@udemy.com',
    to: 'user@example.com',
    subject: '50% off courses you might like',
    body: 'Exclusive deals this week. Manage your subscription here.',
    timestamp: '2024-01-15T18:00:00Z',
    type: 'subscription',
    isRead: false
  },

  // Delivery emails
  {
    id: '4',
    from: 'tracking@amazon.com',
    to: 'user@example.com',
    subject: 'Your package has been delivered',
    body: 'Your order #123-4567890 has been delivered to your doorstep. Thank you for shopping with Amazon!',
    timestamp: '2024-01-12T16:45:00Z',
    type: 'delivery',
    isRead: true
  },
  {
    id: '5',
    from: 'notifications@dhl.com',
    to: 'user@example.com',
    subject: 'Package delivered successfully',
    body: 'Your DHL shipment has been delivered. Tracking number: 1234567890',
    timestamp: '2024-01-11T11:30:00Z',
    type: 'delivery',
    isRead: false
  },
  {
    id: '6',
    from: 'orders@flipkart.com',
    to: 'user@example.com',
    subject: 'Your Flipkart order has been delivered',
    body: 'Order #FK7890123 delivered successfully. Rate your experience.',
    timestamp: '2024-01-10T13:15:00Z',
    type: 'delivery',
    isRead: true
  },
  {
    id: '18',
    from: 'service@swiggy.in',
    to: 'user@example.com',
    subject: 'Order delivered: Paneer Butter Masala & Naan',
    body: 'Your Swiggy order #SW123456 was delivered. Enjoy your meal!',
    timestamp: '2024-01-09T21:10:00Z',
    type: 'delivery',
    isRead: false
  },
  {
    id: '19',
    from: 'shipping@nike.com',
    to: 'user@example.com',
    subject: 'Nike order delivered',
    body: 'Your order #NK987654 has been delivered. Share your look with #justdoit.',
    timestamp: '2024-01-08T17:25:00Z',
    type: 'delivery',
    isRead: true
  },

  // Purchase emails
  {
    id: '7',
    from: 'receipts@stripe.com',
    to: 'user@example.com',
    subject: 'Receipt for your purchase',
    body: 'Thank you for your purchase! Amount: $29.99. Transaction ID: txn_1234567890',
    timestamp: '2024-01-09T15:30:00Z',
    type: 'purchase',
    isRead: true
  },
  {
    id: '8',
    from: 'orders@shopify.com',
    to: 'user@example.com',
    subject: 'Order confirmation - #SHOP123456',
    body: 'Your order has been confirmed. Total: $89.99. Expected delivery: 3-5 business days.',
    timestamp: '2024-01-08T12:00:00Z',
    type: 'purchase',
    isRead: false
  },
  {
    id: '9',
    from: 'billing@spotify.com',
    to: 'user@example.com',
    subject: 'Your Spotify Premium subscription',
    body: 'Monthly subscription charged: $9.99. Next billing date: February 8, 2024.',
    timestamp: '2024-01-07T08:45:00Z',
    type: 'purchase',
    isRead: true
  },
  {
    id: '20',
    from: 'billing@netflix.com',
    to: 'user@example.com',
    subject: 'Your Netflix payment confirmation',
    body: 'We’ve successfully charged $15.99 for your Netflix subscription. Enjoy your shows!',
    timestamp: '2024-01-06T06:20:00Z',
    type: 'purchase',
    isRead: true
  },
  {
    id: '21',
    from: 'sales@apple.com',
    to: 'user@example.com',
    subject: 'Apple Store receipt',
    body: 'Thank you for your purchase: AirPods Pro — $249. Order #AP12345.',
    timestamp: '2024-01-05T13:55:00Z',
    type: 'purchase',
    isRead: false
  },

  // (keep the existing general emails 10–15 for realism, but ignore in demo predicates)
];

export const getEmailsByType = (type: Email['type']): Email[] => {
  return sampleEmails.filter(email => email.type === type);
};

export const getUnreadEmails = (): Email[] => {
  return sampleEmails.filter(email => !email.isRead);
};

export const getEmailsByPredicate = (predicate: 'subscription' | 'delivery' | 'purchase'): Email[] => {
  return sampleEmails.filter(email => email.type === predicate);
};
