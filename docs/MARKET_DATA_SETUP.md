# Market Data Integration Guide

This guide explains the IBM Stock Price and PHP to USD exchange rate features added to the Overview section.

## Features Added

### 1. IBM Stock Price Card
- Displays current IBM stock price in USD
- Shows price change and percentage change (color-coded: green for positive, red for negative)
- Real-time data from Finnhub.io API

### 2. PHP to USD Exchange Rate Card
- Displays current Philippine Peso to US Dollar exchange rate
- Shows last update timestamp
- Real-time data from ExchangeRate-API

### 3. IBM Stock Historical Chart
- Interactive chart showing IBM stock price history
- Adjustable timeframes:
  - 1 Day (5-minute intervals)
  - 5 Days
  - 1 Month (default)
  - 3 Months
  - 6 Months
  - 1 Year
- Hover over chart points to see exact prices

## API Setup

### Finnhub.io API (IBM Stock Data)

1. **Get a Free API Key:**
   - Visit: https://finnhub.io/register
   - Sign up for a free account (no credit card required)
   - Copy your API key from the dashboard
   - Free tier includes: 60 API calls/minute

2. **Update the Code:**
   - Open `script.js`
   - Find the `fetchIBMStockData` function (around line 606)
   - Replace `const API_KEY = 'demo';` with your actual API key:
     ```javascript
     const API_KEY = 'YOUR_FINNHUB_API_KEY_HERE';
     ```

3. **Why Finnhub?**
   - Official API with proper CORS support
   - No CORS errors in browser
   - Real-time stock data
   - Reliable and well-documented
   - Free tier is generous for personal use

4. **API Limitations:**
   - Free tier: 60 requests/minute
   - Demo key has limited functionality
   - Real-time data during market hours
   - Historical data available for all timeframes

### ExchangeRate-API (Currency Data)

1. **No API Key Required:**
   - The free tier of ExchangeRate-API doesn't require authentication
   - Current implementation uses the free endpoint
   - Provides 1,500 requests per month
   - Updates daily with latest exchange rates

2. **Optional: Get API Key for More Features:**
   - Visit: https://www.exchangerate-api.com/
   - Sign up for free to get 100,000 requests/month
   - Update the fetch URL in `fetchPHPtoUSDRate` function if needed
   - Paid plans offer more frequent updates and additional features

## How It Works

### Data Fetching
- Data is fetched when the Overview module initializes
- IBM stock data refreshes when you change the timeframe selector
- Currency rate is fetched once per session

### Error Handling
- If API calls fail, cards will display "N/A"
- Error messages are logged to console
- User-friendly notifications appear for API issues

### Caching
- No caching is currently implemented
- Data is fetched fresh on each page load
- Consider implementing localStorage caching to reduce API calls

## Quick Start

1. **Get Finnhub API Key** (takes 1 minute):
   - Go to https://finnhub.io/register
   - Enter your email and create password
   - Verify email and login
   - Copy your API key from the dashboard

2. **Update script.js**:
   - Open `script.js` in your editor
   - Search for `const API_KEY = 'demo';`
   - Replace `'demo'` with your actual API key
   - Save the file

3. **Refresh Dashboard**:
   - Open your dashboard in browser
   - Stock data will load automatically
   - Currency rate loads without any setup

## Customization

### Change Stock Symbol
To track a different stock instead of IBM:

1. Open `script.js`
2. Find `fetchIBMStockData` function
3. Change `const symbol = 'IBM';` to your desired stock symbol (e.g., `const symbol = 'AAPL';` for Apple)
4. Update the card title in `index.html` accordingly

### Change Currency Pair
To track a different currency pair:

1. Open `script.js`
2. Find `fetchPHPtoUSDRate` function
3. Modify the API endpoint to use different base currency
4. Update the display logic for the new currency

### Adjust Chart Appearance
Chart styling can be modified in the `createIBMStockChart` function:
- Colors: Change `borderColor` and `backgroundColor`
- Line style: Adjust `tension` for curve smoothness
- Point size: Modify `pointRadius` and `pointHoverRadius`

## Troubleshooting

### "Unable to fetch data" Error
- Check your internet connection
- Verify API key is correct (for Alpha Vantage)
- Check browser console for detailed error messages
- Ensure you haven't exceeded API rate limits

### Chart Not Displaying
- Verify Chart.js library is loaded (check browser console)
- Ensure canvas element exists in HTML
- Check that data is being fetched successfully

### Slow Loading
- API calls are made asynchronously
- Initial load may take 2-3 seconds
- Consider implementing loading indicators
- Cache data in localStorage to improve performance

## Future Enhancements

Potential improvements:
1. Add more stock symbols (portfolio tracking)
2. Implement data caching with localStorage
3. Add refresh button for manual updates
4. Show more detailed stock information (volume, market cap, etc.)
5. Add cryptocurrency prices
6. Implement real-time updates with WebSocket
7. Add price alerts/notifications
8. Export historical data to Excel

## API Documentation

- **Alpha Vantage:** https://www.alphavantage.co/documentation/
- **ExchangeRate-API:** https://www.exchangerate-api.com/docs/overview

## Support

For issues or questions:
1. Check browser console for error messages
2. Verify API keys are correctly configured
3. Review API documentation for rate limits
4. Test with demo data first before using production keys