import { json, type ActionFunctionArgs } from '@remix-run/node';
import { getLargeTransactions } from '~/services/transactionHistory.server';

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { tokenAddress, blockchain, limit, page, minValueUsd } = await request.json();
    
    if (!tokenAddress || !blockchain) {
      return json({ error: 'tokenAddress and blockchain are required' }, { status: 400 });
    }

    const data = await getLargeTransactions(tokenAddress, blockchain, {
      limit: limit || 20,
      page: page || 1,
      minValueUsd: minValueUsd || 100000
    });
    
    return json({
      success: true,
      transactions: data?.transactions || [],
      pagination: data?.pagination || {},
    });
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return json({ error: 'Failed to fetch transaction history' }, { status: 500 });
  }
};
