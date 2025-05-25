import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from '@actual-app/components/view';
import { theme } from '@actual-app/components/theme';
import { Button } from '@actual-app/components/button';
import { Text } from '@actual-app/components/text';
import { Page } from '../Page';
import { useAccounts } from '@desktop-client/hooks/useAccounts';
import { send } from 'loot-core/platform/client/fetch';
import { useDispatch, useSelector } from '@desktop-client/redux';
import { fetchStockData, removeStock } from '../../stocks/stocksSlice';
import { v4 as uuidv4 } from 'uuid';

export type Stock = {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
};

type WatchedStock = Stock & {
  accountId?: string;
  shares?: number;
};

export function StocksPage() {
  const { t } = useTranslation();
  const accounts = useAccounts();
  const dispatch = useDispatch();
  const [searchSymbol, setSearchSymbol] = useState('');
  
  const watchedStocks = useSelector(state => state.stocks.watchedStocks);
  const loading = useSelector(state => state.stocks.loading);
  const error = useSelector(state => state.stocks.error);

  const addToWatchlist = async () => {
    if (searchSymbol) {
      try {
        await dispatch(fetchStockData(searchSymbol)).unwrap();
        setSearchSymbol('');
      } catch (error) {
        console.error('Error fetching stock data:', error);
      }
    }
  };

  const registerInAccount = async (stock: WatchedStock, accountId: string, shares: number) => {
    try {
      await send('transaction-add', {
        id: uuidv4(),
        payee: `Stock Purchase: ${stock.symbol}`,
        account: accountId,
        amount: -(stock.price * shares),
        notes: `Purchased ${shares} shares of ${stock.symbol} at ${stock.price} per share`,
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error registering stock transaction:', error);
    }
  };

  return (
    <Page
      header={t('Stocks')}
      style={{ backgroundColor: theme.pageBackground }}
    >
      <View style={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', marginBottom: 20 }}>
          <input
            type="text"
            value={searchSymbol}
            onChange={e => setSearchSymbol(e.target.value.toUpperCase())}
            placeholder={t('Enter stock symbol...')}
            style={{
              padding: 8,
              marginRight: 10,
              borderRadius: 4,
              border: `1px solid ${theme.buttonMenuBorder}`
            }}
          />
          <Button
            onClick={addToWatchlist}
            isDisabled={loading || !searchSymbol}
          >
            {loading ? t('Loading...') : t('Add to Watchlist')}
          </Button>
        </View>

        {error && (
          <Text style={{ color: theme.errorText, marginBottom: 10 }}>
            {error}
          </Text>
        )}

        <View style={{ marginTop: 20 }}>
          {watchedStocks.map(stock => (
            <View
              key={stock.symbol}
              style={{
                padding: 15,
                marginBottom: 10,
                borderRadius: 4,
                backgroundColor: theme.tableBackground,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <View>
                <Text style={{ fontWeight: 'bold' }}>{stock.symbol}</Text>
                <Text>${stock.price.toFixed(2)}</Text>
                <Text
                  style={{
                    color: stock.change >= 0 ? theme.formInputText : theme.errorText
                  }}
                >
                  {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <select
                  style={{
                    marginRight: 10,
                    padding: 5,
                    borderRadius: 4,
                    border: `1px solid ${theme.buttonMenuBorder}`
                  }}
                  onChange={e => {
                    const shares = window.prompt(t('Enter number of shares:'));
                    if (shares && !isNaN(Number(shares))) {
                      registerInAccount(stock, e.target.value, Number(shares));
                    }
                  }}
                >
                  <option value="">{t('Register in Account...')}</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
                
                <Button
                  onClick={() => {
                    dispatch(removeStock(stock.symbol));
                  }}
                >
                  {t('Remove')}
                </Button>
              </View>
            </View>
          ))}
        </View>
      </View>
    </Page>
  );
} 