import { useState, useEffect } from 'react';
import { useFetcher } from '@remix-run/react';
import TokenSelectDropdown from './TokenSelectDropdown';

interface Token {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  image: string;
}

interface AddTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: any;
  tokens?: any;
  preFilledToken?: any; // Pre-filled token data from trending
}

export default function AddTokenModal({ isOpen, onClose, user, tokens, preFilledToken }: AddTokenModalProps) {
  console.log('AddTokenModal rendered with:', { isOpen, user, tokens, preFilledToken });
  
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [formData, setFormData] = useState({
    quantity: '',
    purchasePrice: '',
    notes: '',
  });
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state === 'submitting';

  // Reset form when modal opens/closes or pre-filled token changes
  useEffect(() => {
    if (isOpen) {
      if (preFilledToken) {
        // Pre-fill with trending token data
        setSelectedToken({
          id: preFilledToken.tokenId,
          name: preFilledToken.tokenName,
          symbol: preFilledToken.tokenSymbol,
          current_price: preFilledToken.currentPrice,
          market_cap: 0,
          market_cap_rank: 0,
          price_change_percentage_24h: 0,
          image: ''
        });
        setFormData({
          quantity: preFilledToken.quantity?.toString() || '1',
          purchasePrice: preFilledToken.purchasePrice?.toString() || '',
          notes: preFilledToken.notes || '',
        });
      } else {
        // Reset to empty form
        setSelectedToken(null);
        setFormData({
          quantity: '',
          purchasePrice: '',
          notes: '',
        });
      }
    }
  }, [isOpen, preFilledToken]);

  // Xử lý response từ fetcher
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      const data = fetcher.data as { success?: boolean; message?: string };
      if (data.success) {
        console.log('Token added successfully:', data);
        onClose();
        // Reset form
        setFormData({ quantity: '', purchasePrice: '', notes: '' });
        // Refresh page
        window.location.reload();
      } else {
        console.error('Error adding token:', data.message);
        alert(`Error adding token: ${data.message || 'Unknown error'}`);
      }
    }
  }, [fetcher.state, fetcher.data, onClose]);

  const handleTokenSelect = (token: Token) => {
    setSelectedToken(token);
    // Auto-fill purchase price with current market price
    setFormData(prev => ({
      ...prev,
      purchasePrice: token.current_price ? token.current_price.toString() : ''
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('AddTokenModal handleSubmit called');
    console.log('selectedToken:', selectedToken);
    
    if (!selectedToken) {
      console.log('No selectedToken, returning');
      return;
    }

    const submitData = {
      tokenId: selectedToken.id,
      tokenName: selectedToken.name,
      tokenSymbol: selectedToken.symbol,
      quantity: parseFloat(formData.quantity),
      purchasePrice: parseFloat(formData.purchasePrice),
      currentPrice: selectedToken.current_price || 0,
      notes: formData.notes,
    };

    console.log('submitData:', submitData);

    // Sử dụng fetcher.submit thay vì fetcher function
    const formDataToSubmit = new FormData();
    formDataToSubmit.append('action', 'add-token');
    formDataToSubmit.append('tokenId', submitData.tokenId);
    formDataToSubmit.append('tokenName', submitData.tokenName);
    formDataToSubmit.append('tokenSymbol', submitData.tokenSymbol);
    formDataToSubmit.append('quantity', submitData.quantity.toString());
    formDataToSubmit.append('purchasePrice', submitData.purchasePrice.toString());
    formDataToSubmit.append('currentPrice', submitData.currentPrice.toString());
    formDataToSubmit.append('notes', submitData.notes);

    fetcher.submit(formDataToSubmit, { method: 'post' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Add Token to Portfolio</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Token Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Token
            </label>
            <TokenSelectDropdown
              selectedToken={selectedToken}
              onTokenSelect={handleTokenSelect}
              placeholder="Search and select a token..."
            />
          </div>

          <form onSubmit={(e) => {
            console.log('Form submitted');
            handleSubmit(e);
          }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                step="any"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter quantity"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Price (USD)
              </label>
              <input
                type="number"
                step="any"
                required
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter purchase price"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Add notes about this investment"
                rows={3}
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Add to Portfolio'}
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
} 