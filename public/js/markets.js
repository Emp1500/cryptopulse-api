document.addEventListener("DOMContentLoaded", function() {
    const tableBody = document.getElementById("market-data-body");
    const loadingIndicator = document.getElementById("loading-indicator");

    // Format number as currency
    function formatCurrency(num) {
        if (num === null || num === undefined) return 'N/A';
        return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // Format large numbers (market cap, volume)
    function formatLargeNumber(num) {
        if (num === null || num === undefined) return 'N/A';
        return '$' + num.toLocaleString('en-US');
    }

    async function fetchMarketData() {
        const apiUrl = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false';

        try {
            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Hide loading indicator
            loadingIndicator.style.display = 'none';

            // Clear existing table rows
            tableBody.innerHTML = '';

            // Populate table with new data
            data.forEach(coin => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${coin.market_cap_rank}</td>
                    <td>
                        <div class="coin-info">
                            <img src="${coin.image}" alt="${coin.name}">
                            <div>
                                <div class="coin-name">${coin.name}</div>
                                <div class="coin-symbol">${coin.symbol.toUpperCase()}</div>
                            </div>
                        </div>
                    </td>
                    <td>${formatCurrency(coin.current_price)}</td>
                    <td>${formatLargeNumber(coin.market_cap)}</td>
                    <td>${formatLargeNumber(coin.total_volume)}</td>
                `;
                tableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error fetching market data:', error);

            // Show error message to user
            loadingIndicator.innerHTML = `
                <p class="text-danger">Failed to load market data. Please try again later.</p>
                <button class="btn btn-warning mt-2" onclick="location.reload()">Retry</button>
            `;
        }
    }

    // Initial fetch
    fetchMarketData();
});
