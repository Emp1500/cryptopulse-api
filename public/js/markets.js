document.addEventListener('DOMContentLoaded', function () {
  var tableBody = document.getElementById('market-data-body');
  var loadingIndicator = document.getElementById('loading-indicator');

  function formatCurrency(num) {
    if (num === null || num === undefined) return 'N/A';
    return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatLargeNumber(num) {
    if (num === null || num === undefined) return 'N/A';
    if (num >= 1e12) return '$' + (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return '$' + (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return '$' + (num / 1e6).toFixed(2) + 'M';
    return '$' + num.toLocaleString('en-US');
  }

  function renderTrendingCards(coins) {
    var container = document.getElementById('trending-cards');
    if (!container) return;
    var top3 = coins.slice(0, 3);
    container.innerHTML = top3.map(function (coin, i) {
      var change = coin.price_change_percentage_24h || 0;
      var badgeClass = change >= 0 ? 'badge-up' : 'badge-down';
      var sign = change >= 0 ? '+' : '';
      return '<div class="trending-card">' +
        '<img class="trending-logo" src="' + coin.image + '" alt="' + coin.name + '">' +
        '<div class="trending-info">' +
          '<span class="trending-badge">🔥 Trending #' + (i + 1) + '</span>' +
          '<div class="trending-name">' + coin.name + '</div>' +
          '<div class="trending-symbol">' + coin.symbol.toUpperCase() + '</div>' +
        '</div>' +
        '<div class="trending-price">' +
          '<span class="trending-price-value">' + formatCurrency(coin.current_price) + '</span>' +
          '<span class="' + badgeClass + '">' + sign + change.toFixed(2) + '%</span>' +
        '</div>' +
        '</div>';
    }).join('');
  }

  function buildRow(coin, index) {
    var change = coin.price_change_percentage_24h || 0;
    var badgeClass = change >= 0 ? 'badge-up' : 'badge-down';
    var sign = change >= 0 ? '+' : '';
    return '<tr>' +
      '<td class="td-rank">' + (index + 1) + '</td>' +
      '<td><div class="coin-info">' +
        '<img src="' + coin.image + '" alt="' + coin.name + '">' +
        '<div>' +
          '<div class="coin-name">' + coin.name + '</div>' +
          '<div class="coin-symbol">' + coin.symbol.toUpperCase() + '</div>' +
        '</div>' +
      '</div></td>' +
      '<td class="td-right">' + formatCurrency(coin.current_price) + '</td>' +
      '<td class="td-right"><span class="' + badgeClass + '">' + sign + change.toFixed(2) + '%</span></td>' +
      '<td class="td-right">' + formatLargeNumber(coin.market_cap) + '</td>' +
      '<td class="td-right">' + formatLargeNumber(coin.total_volume) + '</td>' +
    '</tr>';
  }

  async function fetchMarketData() {
    try {
      var response = await fetch('/api/markets');
      if (!response.ok) throw new Error('HTTP ' + response.status);
      var data = await response.json();

      loadingIndicator.style.display = 'none';

      renderTrendingCards(data);

      tableBody.innerHTML = '';
      data.forEach(function (coin, index) {
        tableBody.insertAdjacentHTML('beforeend', buildRow(coin, index));
      });
    } catch (error) {
      console.error('Error fetching market data:', error);
      loadingIndicator.innerHTML =
        '<p style="color:var(--color-down)">Failed to load market data.</p>' +
        '<button onclick="location.reload()" style="margin-top:0.5rem;padding:0.5rem 1rem;background:var(--primary);color:var(--primary-foreground);border:none;border-radius:var(--radius);cursor:pointer;">Retry</button>';
    }
  }

  fetchMarketData();
});
