import { WOC_MAINNET_URL, EXCHANGE_RATE_CACHE_TTL } from '@1sat/actions';
import { sendMessageAsync } from './chromeHelpers';
import { YoursEventName } from '../inject';

let exchangeRateCache: { rate: number; timestamp: number } | null = null;

export async function fetchExchangeRate(chain: string, wocApiKey?: string): Promise<number> {
  if (exchangeRateCache && Date.now() - exchangeRateCache.timestamp < EXCHANGE_RATE_CACHE_TTL) {
    return exchangeRateCache.rate;
  }
  const baseUrl = WOC_MAINNET_URL;
  const headers: Record<string, string> = {};
  if (wocApiKey) headers['woc-api-key'] = wocApiKey;
  try {
    const response = await fetch(`${baseUrl}/exchangerate`, { headers });
    if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
    const data = await response.json();
    const rate = Number(data.rate.toFixed(2));
    const nextCache = { rate, timestamp: Date.now() };
    // Module-level cache written after fetch; not a concurrent alias of the same binding.
    // eslint-disable-next-line require-atomic-updates
    exchangeRateCache = nextCache;
    return nextCache.rate;
  } catch {
    return exchangeRateCache?.rate ?? 0;
  }
}

export async function getWalletBalance(): Promise<number> {
  const response = await sendMessageAsync<{ success: boolean; data?: number; error?: string }>({
    action: YoursEventName.GET_BALANCE,
  });
  if (!response.success) {
    throw new Error(response.error || 'Failed to get balance');
  }
  return response.data ?? 0;
}
