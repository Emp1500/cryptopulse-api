document.addEventListener('DOMContentLoaded', function () {
  var tableBody = document.getElementById('market-data-body');
  var loadingIndicator = document.getElementById('loading-indicator');
  var activeCategory = 'all';

  var CATEGORIES = {
    bitcoin: 'layer1', ethereum: 'layer1', solana: 'layer1', cardano: 'layer1',
    polkadot: 'layer1', avalanche: 'layer1', 'near-protocol': 'layer1',
    'cosmos': 'layer1', 'algorand': 'layer1', 'tron': 'layer1',
    uniswap: 'defi', aave: 'defi', chainlink: 'defi', 'pancakeswap-token': 'defi',
    'maker': 'defi', 'compound-governance-token': 'defi', 'curve-dao-token': 'defi',
    tether: 'stable', 'usd-coin': 'stable', dai: 'stable', 'binance-usd': 'stable',
    'true-usd': 'stable', 'frax': 'stable',
    dogecoin: 'meme', 'shiba-inu': 'meme', pepe: 'meme', 'floki': 'meme',
    'bonk': 'meme', 'dogwifcoin': 'meme'
  };

  function formatCurrency(num) {
    if (num === null || num === undefined) return 'N/A';
    return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatLargeNumber(num) {
    if (num === null || num === undefined) return 'N/A';
    if (num >= 1e12) return '$' + (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9)  return '$' + (num / 1e9).toFixed(2)  + 'B';
    if (num >= 1e6)  return '$' + (num / 1e6).toFixed(2)  + 'M';
    return '$' + num.toLocaleString('en-US');
  }

  function arrowSVG(up) {
    return up
      ? '<svg class="change-arrow" width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true"><path d="M5 1l4 6H1l4-6z"/></svg>'
      : '<svg class="change-arrow" width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true"><path d="M5 9L1 3h8L5 9z"/></svg>';
  }

  function renderSparkline(sparklineData) {
    var prices = sparklineData && sparklineData.price;
    if (!prices || prices.length < 2) {
      return '<span class="sparkline-na">—</span>';
    }
    var W = 80, H = 32;
    var min = Math.min.apply(null, prices);
    var max = Math.max.apply(null, prices);
    var range = max - min || 1;
    var step = W / (prices.length - 1);
    var pts = prices.map(function (p, i) {
      var x = (i * step).toFixed(1);
      var y = (H - ((p - min) / range) * H).toFixed(1);
      return x + ',' + y;
    }).join(' ');
    var isUp = prices[prices.length - 1] >= prices[0];
    var color = isUp ? '#22c55e' : '#ef4444';
    return '<svg class="sparkline-svg" width="' + W + '" height="' + H +
      '" viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<polyline points="' + pts + '" fill="none" stroke="' + color +
      '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>';
  }

  function renderTrendingCards(coins) {
    var container = document.getElementById('trending-cards');
    if (!container) return;
    var top3 = coins.slice(0, 3);
    container.innerHTML = top3.map(function (coin, i) {
      var change = coin.price_change_percentage_24h || 0;
      var isUp = change >= 0;
      var badgeClass = isUp ? 'badge-up' : 'badge-down';
      var sign = isUp ? '+' : '';
      return '<div class="trending-card">' +
        '<img class="trending-logo" src="' + coin.image + '" alt="' + coin.name + '" width="40" height="40">' +
        '<div class="trending-info">' +
          '<span class="trending-badge">Trending #' + (i + 1) + '</span>' +
          '<div class="trending-name">' + coin.name + '</div>' +
          '<div class="trending-symbol">' + coin.symbol.toUpperCase() + '</div>' +
        '</div>' +
        '<div class="trending-right">' +
          '<span class="trending-price-value">' + formatCurrency(coin.current_price) + '</span>' +
          '<span class="' + badgeClass + '">' + arrowSVG(isUp) + sign + change.toFixed(2) + '%</span>' +
          renderSparkline(coin.sparkline_in_7d) +
        '</div>' +
        '</div>';
    }).join('');
  }

  function buildRow(coin, index) {
    var change = coin.price_change_percentage_24h || 0;
    var isUp = change >= 0;
    var badgeClass = isUp ? 'badge-up' : 'badge-down';
    var sign = isUp ? '+' : '';
    var cat = CATEGORIES[coin.id] || 'layer1';
    return '<tr data-category="' + cat + '">' +
      '<td class="td-rank">' + (index + 1) + '</td>' +
      '<td><div class="coin-info">' +
        '<img src="' + coin.image + '" alt="' + coin.name + '" width="28" height="28">' +
        '<div>' +
          '<div class="coin-name">' + coin.name + '</div>' +
          '<div class="coin-symbol">' + coin.symbol.toUpperCase() + '</div>' +
        '</div>' +
      '</div></td>' +
      '<td class="td-right td-mono">' + formatCurrency(coin.current_price) + '</td>' +
      '<td class="td-right"><span class="' + badgeClass + '">' + arrowSVG(isUp) + sign + change.toFixed(2) + '%</span></td>' +
      '<td class="td-right td-mono">' + formatLargeNumber(coin.market_cap) + '</td>' +
      '<td class="td-right td-mono">' + formatLargeNumber(coin.total_volume) + '</td>' +
    '</tr>';
  }

  function applyFilter() {
    document.querySelectorAll('#market-data-body tr').forEach(function (row) {
      var cat = row.dataset.category;
      var matchesCategory = activeCategory === 'all' || cat === activeCategory;
      var searchVal = document.getElementById('market-search').value.toLowerCase();
      var matchesSearch = !searchVal || row.textContent.toLowerCase().includes(searchVal);
      row.style.display = matchesCategory && matchesSearch ? '' : 'none';
    });
  }

  // Category filter tabs
  document.querySelectorAll('.cat-tab').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.cat-tab').forEach(function (b) { b.classList.remove('cat-tab--active'); });
      btn.classList.add('cat-tab--active');
      activeCategory = btn.dataset.cat;
      applyFilter();
    });
  });

  // Search — replace old inline handler
  var searchInput = document.getElementById('market-search');
  if (searchInput) {
    searchInput.addEventListener('input', applyFilter);
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

      applyFilter();
    } catch (error) {
      console.error('Error fetching market data:', error);
      loadingIndicator.innerHTML =
        '<p style="color:var(--color-down)">Failed to load market data.</p>' +
        '<button onclick="location.reload()" style="margin-top:0.5rem;padding:0.5rem 1rem;background:var(--primary);color:var(--primary-foreground);border:none;border-radius:var(--radius);cursor:pointer;">Retry</button>';
    }
  }

  fetchMarketData();
});
