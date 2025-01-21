import React, { useState } from 'react';
import { X, Wallet, CreditCard, IndianRupee, Ban as Bank } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Transaction } from '../../types';
import { AddMoneyModal } from './AddMoneyModal';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const [isAddMoneyModalOpen, setIsAddMoneyModalOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'balance' | 'transactions'>('balance');
  const user = useAuthStore((state) => state.user);

  // Mock transactions for demo
  const transactions: Transaction[] = [
    {
      id: '1',
      userId: user?.id || '',
      amount: 500,
      type: 'credit',
      status: 'completed',
      method: 'upi',
      description: 'Added money via UPI',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      userId: user?.id || '',
      amount: 200,
      type: 'debit',
      status: 'completed',
      method: 'upi',
      description: 'Sent to @johndoe',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-background/95 rounded-xl w-full max-w-md shadow-xl border border-white/10">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h2 className="text-xl font-bold text-white">Wallet</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {/* Balance Card */}
            <div className="bg-gradient-to-r from-primary to-secondary rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <Wallet className="w-8 h-8 text-white" />
                <span className="text-sm text-white/80">Available Balance</span>
              </div>
              <div className="flex items-center space-x-2">
                <IndianRupee className="w-6 h-6 text-white" />
                <span className="text-3xl font-bold text-white">
                  {user?.walletBalance?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-4 mb-6">
              <button
                onClick={() => setSelectedTab('balance')}
                className={`flex-1 py-2 text-center rounded-lg transition-colors ${
                  selectedTab === 'balance'
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                Balance
              </button>
              <button
                onClick={() => setSelectedTab('transactions')}
                className={`flex-1 py-2 text-center rounded-lg transition-colors ${
                  selectedTab === 'transactions'
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                Transactions
              </button>
            </div>

            {selectedTab === 'balance' ? (
              <div className="space-y-4">
                <button
                  onClick={() => setIsAddMoneyModalOpen(true)}
                  className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <IndianRupee className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-white">Add Money</span>
                  </div>
                  <span className="text-white/60">→</span>
                </button>

                <button
                  className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                      <Bank className="w-5 h-5 text-secondary" />
                    </div>
                    <span className="text-white">Withdraw</span>
                  </div>
                  <span className="text-white/60">→</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.type === 'credit'
                            ? 'bg-green-500/20 text-green-500'
                            : 'bg-red-500/20 text-red-500'
                        }`}
                      >
                        {transaction.type === 'credit' ? '+' : '-'}
                      </div>
                      <div>
                        <p className="text-white">{transaction.description}</p>
                        <p className="text-sm text-white/60">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`font-medium ${
                        transaction.type === 'credit' ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      ₹{transaction.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AddMoneyModal
        isOpen={isAddMoneyModalOpen}
        onClose={() => setIsAddMoneyModalOpen(false)}
      />
    </>
  );
}