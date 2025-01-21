import { Transaction } from '../types';

// Mock payment gateway for local testing
class PaymentGateway {
  private static instance: PaymentGateway;
  
  private constructor() {}

  static getInstance(): PaymentGateway {
    if (!PaymentGateway.instance) {
      PaymentGateway.instance = new PaymentGateway();
    }
    return PaymentGateway.instance;
  }

  async initiatePayment(params: {
    amount: number;
    method: 'upi' | 'card' | 'netbanking';
    currency?: string;
    description?: string;
  }): Promise<{ 
    success: boolean; 
    transactionId: string;
    error?: string;
  }> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulate success/failure (90% success rate)
    const success = Math.random() < 0.9;

    if (success) {
      return {
        success: true,
        transactionId: `TXN_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      };
    }

    return {
      success: false,
      transactionId: '',
      error: 'Payment failed. Please try again.',
    };
  }

  async verifyPayment(transactionId: string): Promise<{
    success: boolean;
    status: 'completed' | 'pending' | 'failed';
    error?: string;
  }> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      success: true,
      status: 'completed',
    };
  }
}

export const paymentGateway = PaymentGateway.getInstance();