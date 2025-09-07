document.addEventListener("DOMContentLoaded", function() {
    const marketTable = document.querySelector("#market-table tbody");
    const tableBody = document.getElementById("market-data-body");
    const loadingIndicator = document.getElementById("loading-indicator");

    async function fetchMarketData() {

        const apiUrl = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false';

        try {
            const response = await fetch(apiUrl);
            const data = await response.json();

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
                                    <div class="coin-symbol">${coin.symbol}</div>
                                </div>
                            </div>
                        </td>
                    <td>${coin.current_price}</td>
                    <td>${coin.market_cap}</td>
                    <td>${coin.total_volume}</td>
                `;
                tableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error fetching market data:', error);
        }
    }

    // Initial fetch
    fetchMarketData();
});