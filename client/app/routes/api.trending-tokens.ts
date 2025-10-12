import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { getTrendingTokens } from '~/services/coingecko.server';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const result = await getTrendingTokens();
    console.log('📈 API trending result:', { result, tokensLength: result?.tokens?.length });
    
    return json({
      success: true,
      tokens: result?.tokens || [],
      source: result?.source || 'unknown',
    });
  } catch (error) {
    console.error('Error fetching trending tokens:', error);
    return json({ error: 'Failed to fetch trending tokens' }, { status: 500 });
  }
};
