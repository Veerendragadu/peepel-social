import React, { useState } from 'react';
import { X, CreditCard, Smartphone, Building2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { paymentGateway } from '../../lib/paymentGateway';

interface AddMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddMoneyModal({ isOpen, onClose }: AddMoneyModalProps) {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, updateWalletBalance } = useAuthStore();

  const quickAmounts = [100, 500, 1000, 2000];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !paymentMethod || loading) return;

    setLoading(true);
    setError(null);

    try {
      const { success, transactionId, error: paymentError } = await paymentGateway.initiatePayment({
        amount: parseFloat(amount),
        method: paymentMethod,
        currency: 'INR',
        description: `Add money to wallet - ${user?.username}`,
      });

      if (!success) {
        throw new Error(paymentError || 'Payment failed');
      }

      const verification = await paymentGateway.verifyPayment(transactionId);
      
      if (verification.success && verification.status === 'completed') {
        // Update wallet balance
        const newBalance = (user?.walletBalance || 0) + parseFloat(amount);
        updateWalletBalance(newBalance);
        onClose();
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-background/95 rounded-xl w-full max-w-md shadow-xl border border-white/10">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Add Money</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-white/80 mb-2">
              Enter Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60">₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="0.00"
                min="1"
                step="1"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmount(amt.toString())}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-colors"
              >
                ₹{amt}
              </button>
            ))}
          </div>

          <div className="space-y-4 mb-6">
            <label className="block text-sm font-medium text-white/80 mb-2">
              Payment Method
            </label>
            
            <button
              type="button"
              onClick={() => setPaymentMethod('upi')}
              className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors ${
                paymentMethod === 'upi'
                  ? 'bg-primary/20 border-primary'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Smartphone className="w-5 h-5 text-white" />
                <span className="text-white">UPI</span>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 ${
                paymentMethod === 'upi'
                  ? 'border-primary bg-primary'
                  : 'border-white/30'
              }`} />
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors ${
                paymentMethod === 'card'
                  ? 'bg-primary/20 border-primary'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center space-x-3">
                <CreditCard className="w-5 h-5 text-white" />
                <span className="text-white">Card</span>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 ${
                paymentMethod === 'card'
                  ? 'border-primary bg-primary'
                  : 'border-white/30'
              }`} />
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('netbanking')}
              className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors ${
                paymentMethod === 'netbanking'
                  ? 'bg-primary/20 border-primary'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Building2 className="w-5 h-5 text-white" />
                <span className="text-white">Net Banking</span>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 ${
                paymentMethod === 'netbanking'
                  ? 'border-primary bg-primary'
                  : 'border-white/30'
              }`} />
            </button>
          </div>

          <button
            type="submit"
            disabled={!amount || !paymentMethod || loading}
            className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              `Add ₹${amount || '0'}`
            )}
          </button>
        </form>
      </div>
    </div>
  );
}