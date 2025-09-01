document.addEventListener('DOMContentLoaded', function() {
    const marketTable = document.querySelector('.market-table');
    const tableBody = document.getElementById('market-data-body');
    const loadingSpinner = document.getElementById('loadingSpinner');

    // --- The core function to fetch and display data ---
    async function fetchMarketData() {
        // This is the CoinGecko API endpoint for market data.
        // It fetches the top 100 coins, ordered by market cap, in USD.
        const apiUrl = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false';

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }
            const data = await response.json();
            
            displayData(data);

        } catch (error) {
            console.error("Failed to fetch market data:", error);
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: #ff6b6b;">Could not load market data. Please try again later.</td></tr>`;
        } finally {
            // Hide spinner and show table
            loadingSpinner.style.display = 'none';
            marketTable.style.display = 'table';
        }
    }

    // --- Function to format numbers and render data in the table ---
    function displayData(coins) {
        // Clear any previous data
        tableBody.innerHTML = ''; 

        coins.forEach(coin => {
            const row = document.createElement('tr');

            // Determine color for the 24h price change
            const priceChangeClass = coin.price_change_percentage_24h >= 0 ? 'price-positive' : 'price-negative';
            
            // Format numbers for better readability
            const formatCurrency = (num) => `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            const formatLargeNumber = (num) => `$${num.toLocaleString('en-US')}`;

            row.innerHTML = `
                <td>${coin.market_cap_rank}</td>
                <td>
                    <div class="coin-info">
                        <img src="${coin.image}" alt="${coin.name}">
                        <div>
                            <div class="coin-name">${coin.name}</div>
                            <div class="coin-symbol">${coin.symbol}</div>
                        </div>
                    </div>
                </td>
                <td>${formatCurrency(coin.current_price)}</td>
                <td class="${priceChangeClass}">${coin.price_change_percentage_24h.toFixed(2)}%</td>
                <td>${formatLargeNumber(coin.market_cap)}</td>
                <td>${formatLargeNumber(coin.total_volume)}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    // --- Initial call to fetch data when the page loads ---
    fetchMarketData();
});
