import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { searchTokens } from '~/services/coingecko.server';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const query = url.searchParams.get('query');

  if (!query) {
    return json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    const result = await searchTokens(query);
    console.log('🔍 API search result:', { query, result, tokensLength: result?.tokens?.length });
    
    return json({
      success: true,
      tokens: result?.tokens || [],
      source: result?.source || 'unknown',
      query: query,
    });
  } catch (error) {
    console.error('Error searching tokens:', error);
    return json({ error: 'Failed to search tokens' }, { status: 500 });
  }
};
