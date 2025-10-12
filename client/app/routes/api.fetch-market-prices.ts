import { json, type ActionFunctionArgs } from '@remix-run/node';
import { getMultiPrices } from '~/services/multiPricing.server';

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { tokenIds } = await request.json();
    
    if (!Array.isArray(tokenIds)) {
      return json({ error: 'tokenIds must be an array' }, { status: 400 });
    }

    const data = await getMultiPrices(tokenIds);
    
    return json({
      success: true,
      prices: data.prices,
      source: data.source,
    });
  } catch (error) {
    console.error('Error fetching market prices:', error);
    return json({ error: 'Failed to fetch market prices' }, { status: 500 });
  }
};
