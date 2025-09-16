import { PAYSTACK_CONFIG, convertToKobo, convertFromKobo } from './paystack-config';

// Paystack API Response Types
export interface PaystackInitResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    amount: number;
    currency: string;
    transaction_date: string;
    status: string;
    reference: string;
    receipt_number: string;
    customer: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      customer_code: string;
      phone: string;
      metadata: any;
      risk_action: string;
    };
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
      account_name: string;
    };
    plan: any;
    split: any;
    order_id: any;
    paid_at: string;
    created_at: string;
    updated_at: string;
    metadata: any;
    fees_breakdown: any;
    subaccount: any;
    amount_settled: number;
    subtotal: number;
    fee_charged: number;
    tax: number;
    amount_due: number;
    paid_amount: number;
    paid_at: string;
    pos_transaction_data: any;
    source: any;
    fees_breakdown: any;
    channel: string;
    ip_address: string;
    timeline: any;
    log: any;
  };
}

export interface PaystackRefundResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    amount: number;
    currency: string;
    transaction: number;
    status: string;
    refunded_at: string;
    channel: string;
    recipient: string;
    reference: string;
    integration: number;
    reason: string;
    fully_deducted: boolean;
    deducted_amount: number;
    refunded_by: string;
    created_at: string;
    updated_at: string;
  };
}

export interface PaystackWebhookEvent {
  event: string;
  data: {
    id: number;
    domain: string;
    amount: number;
    currency: string;
    transaction_date: string;
    status: string;
    reference: string;
    [key: string]: any;
  };
}

// Paystack API Client Class
export class PaystackAPI {
  private baseURL: string;
  private secretKey: string;

  constructor() {
    this.baseURL = PAYSTACK_CONFIG.BASE_URL;
    this.secretKey = PAYSTACK_CONFIG.SECRET_KEY;
  }

  // Initialize Payment
  async initializePayment(params: {
    email: string;
    amount: number; // in GHS
    reference: string;
    callback_url?: string;
    channels?: string[];
    metadata?: Record<string, any>;
    subaccount?: string;
    split_code?: string;
  }): Promise<PaystackInitResponse> {
    try {
      const response = await fetch(PAYSTACK_CONFIG.INITIALIZE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: params.email,
          amount: convertToKobo(params.amount), // Convert to kobo
          reference: params.reference,
          callback_url: params.callback_url,
          channels: params.channels || [
            PAYSTACK_CONFIG.CHANNELS.MOBILE_MONEY,
            PAYSTACK_CONFIG.CHANNELS.CARD,
            PAYSTACK_CONFIG.CHANNELS.USSD,
            PAYSTACK_CONFIG.CHANNELS.BANK_TRANSFER,
          ],
          metadata: params.metadata,
          subaccount: params.subaccount,
          split_code: params.split_code,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Paystack API Error: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      return data as PaystackInitResponse;
    } catch (error) {
      console.error('Paystack Initialize Payment Error:', error);
      throw error;
    }
  }

  // Verify Payment
  async verifyPayment(reference: string): Promise<PaystackVerifyResponse> {
    try {
      const response = await fetch(`${PAYSTACK_CONFIG.VERIFY_URL}/${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Paystack API Error: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      return data as PaystackVerifyResponse;
    } catch (error) {
      console.error('Paystack Verify Payment Error:', error);
      throw error;
    }
  }

  // Process Refund
  async processRefund(params: {
    transaction: string | number;
    amount?: number; // in GHS, if not provided, refunds full amount
    reason?: string;
  }): Promise<PaystackRefundResponse> {
    try {
      const response = await fetch(PAYSTACK_CONFIG.REFUND_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction: params.transaction,
          amount: params.amount ? convertToKobo(params.amount) : undefined,
          reason: params.reason || 'Booking cancellation',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Paystack API Error: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      return data as PaystackRefundResponse;
    } catch (error) {
      console.error('Paystack Refund Error:', error);
      throw error;
    }
  }

  // Validate Webhook Signature
  validateWebhookSignature(payload: string, signature: string): boolean {
    try {
      const crypto = require('crypto');
      const hash = crypto
        .createHmac('sha512', PAYSTACK_CONFIG.WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');
      
      return hash === signature;
    } catch (error) {
      console.error('Webhook Signature Validation Error:', error);
      return false;
    }
  }

  // Parse Webhook Event
  parseWebhookEvent(payload: string): PaystackWebhookEvent | null {
    try {
      return JSON.parse(payload) as PaystackWebhookEvent;
    } catch (error) {
      console.error('Webhook Event Parsing Error:', error);
      return null;
    }
  }

  // Get Transaction Details
  async getTransaction(transactionId: string | number): Promise<PaystackVerifyResponse> {
    try {
      const response = await fetch(`${this.baseURL}/transaction/${transactionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Paystack API Error: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      return data as PaystackVerifyResponse;
    } catch (error) {
      console.error('Paystack Get Transaction Error:', error);
      throw error;
    }
  }

  // Create Subaccount (for facility managers)
  async createSubaccount(params: {
    business_name: string;
    settlement_bank: string;
    account_number: string;
    percentage_charge: number;
    description?: string;
  }): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/subaccount`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Paystack API Error: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Paystack Create Subaccount Error:', error);
      throw error;
    }
  }

  // List Banks (for bank transfer)
  async listBanks(): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/bank`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Paystack API Error: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Paystack List Banks Error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const paystackAPI = new PaystackAPI();



