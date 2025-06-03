import { NextRequest, NextResponse } from 'next/server';

/**
 * API route handler for fetching transactions by address
 * This server-side route proxies requests to the Tendermint RPC endpoint
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters from the request
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');
    const type = searchParams.get('type') || 'all';
    
    if (!address) {
      return NextResponse.json({ error: 'Address parameter is required' }, { status: 400 });
    }
    
    console.log(`[API Route] Fetching ${type} transactions for address ${address}`);
    
    // Function to fetch transactions with the exact URL format that works
    const fetchTransactionsPage = async (queryType: string, page: number = 1, perPage: number = 100) => {
      // Build the exact query parameter format that works
      let queryParam = '';
      
      if (queryType === 'message') {
        queryParam = `%22message.sender%3D%27${address}%27%22`;
      } else if (queryType === 'transfer.sender') {
        queryParam = `%22transfer.sender%3D%27${address}%27%22`;
      } else {
        queryParam = `%22transfer.recipient%3D%27${address}%27%22`;
      }
      
      // Build the complete URL with all parameters
      const url = `https://zigscan.net/tx_search?query=${queryParam}&prove=true&page=${page}&per_page=${perPage}&order_by=%22desc%22`;
      
      console.log(`[API Route] Making request to: ${url}`);
      
      // Make the request with a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        txs: data?.result?.txs || [],
        totalCount: parseInt(data?.result?.total_count || '0')
      };
    };
    
    // Fetch transactions based on type
    let result;
    if (type === 'sent') {
      const sentResult = await fetchTransactionsPage('transfer.sender');
      result = formatResult(sentResult);
    } else if (type === 'received') {
      const receivedResult = await fetchTransactionsPage('transfer.recipient');
      result = formatResult(receivedResult);
    } else {
      // Fetch both sent and received transactions
      const sentResult = await fetchTransactionsPage('transfer.sender');
      const receivedResult = await fetchTransactionsPage('transfer.recipient');
      const messageResult = await fetchTransactionsPage('message');
      
      // Combine all transactions and remove duplicates by hash
      const allTxs = [...sentResult.txs, ...receivedResult.txs, ...messageResult.txs];
      const uniqueTxs = allTxs.filter((tx, index, self) =>
        index === self.findIndex(t => t.hash === tx.hash)
      );
      
      // Calculate the total unique transactions (approximately)
      const totalUniqueTxs = Math.max(
        sentResult.totalCount,
        receivedResult.totalCount,
        messageResult.totalCount
      );
      
      result = {
        result: {
          txs: uniqueTxs,
          total_count: totalUniqueTxs.toString(),
          pagination_info: {
            fetched_count: uniqueTxs.length,
            total_count: totalUniqueTxs,
            has_more: uniqueTxs.length < totalUniqueTxs,
            max_pages_fetched: 1
          }
        }
      };
    }
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API Route Error]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper to format the result
function formatResult({ txs, totalCount }: { txs: any[]; totalCount: number }) {
  return {
    result: {
      txs,
      total_count: totalCount.toString(),
      pagination_info: {
        fetched_count: txs.length,
        total_count: totalCount,
        has_more: txs.length < totalCount,
        max_pages_fetched: 1
      }
    }
  };
}
