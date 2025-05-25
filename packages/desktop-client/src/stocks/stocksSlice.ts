import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { type Stock } from '../components/stocks/StocksPage';

const sliceName = 'stocks';

interface StocksState {
  watchedStocks: Stock[];
  loading: boolean;
  error: string | null;
}

const initialState: StocksState = {
  watchedStocks: [],
  loading: false,
  error: null
};

export const fetchStockData = createAsyncThunk(
  'stocks/fetchStockData',
  async (symbol: string) => {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=YOUR_API_KEY`
    );
    const data = await response.json();
    
    if (data['Global Quote']) {
      const quote = data['Global Quote'];
      return {
        symbol,
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        lastUpdated: new Date().toISOString()
      };
    }
    throw new Error('Invalid response from API');
  }
);

const stocksSlice = createSlice({
  name: sliceName,
  initialState,
  reducers: {
    removeStock: (state, action) => {
      state.watchedStocks = state.watchedStocks.filter(
        stock => stock.symbol !== action.payload
      );
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchStockData.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStockData.fulfilled, (state, action) => {
        state.loading = false;
        state.watchedStocks.push(action.payload);
      })
      .addCase(fetchStockData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch stock data';
      });
  }
});

export const { removeStock, clearError } = stocksSlice.actions;
export const { name, reducer } = stocksSlice; 