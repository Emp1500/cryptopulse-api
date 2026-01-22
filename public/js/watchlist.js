// Watchlist JavaScript

let searchTimeout = null;
let removeCoinId = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('watchlistCoinSearch');
    if (searchInput) {
        searchInput.addEventListener('input', handleWatchlistSearch);
        searchInput.addEventListener('focus', function() {
            if (this.value.length > 0) {
                document.getElementById('watchlistSearchResults').classList.add('show');
            }
        });
    }

    // Close search results when clicking outside
    document.addEventListener('click', function(e) {
        const searchWrapper = document.querySelector('#addWatchlistModal .search-wrapper');
        if (searchWrapper && !searchWrapper.contains(e.target)) {
            document.getElementById('watchlistSearchResults').classList.remove('show');
        }
    });

    // Check for price alerts
    checkPriceAlerts();
});

// Handle coin search for watchlist
async function handleWatchlistSearch(e) {
    const query = e.target.value.trim();
    const resultsDiv = document.getElementById('watchlistSearchResults');

    if (query.length < 1) {
        resultsDiv.classList.remove('show');
        return;
    }

    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
        try {
            const response = await fetch(`/api/coins/search?q=${encodeURIComponent(query)}`);
            const coins = await response.json();

            if (coins.length === 0) {
                resultsDiv.innerHTML = '<div class="search-result-item"><span class="name">No coins found</span></div>';
            } else {
                resultsDiv.innerHTML = coins.map(coin => `
                    <div class="search-result-item" onclick="addToWatchlist('${coin.id}', '${coin.name}', '${coin.symbol}', '${coin.image}')">
                        <img src="${coin.image}" alt="${coin.name}">
                        <div>
                            <div class="name">${coin.name}</div>
                            <div class="symbol">${coin.symbol}</div>
                        </div>
                        <div class="price">$${coin.current_price?.toLocaleString() || 'N/A'}</div>
                    </div>
                `).join('');
            }

            resultsDiv.classList.add('show');
        } catch (error) {
            console.error('Error searching coins:', error);
        }
    }, 300);
}

// Add coin to watchlist
async function addToWatchlist(coinId, name, symbol, image) {
    try {
        const response = await fetch('/portfolio/watchlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ coinId, name, symbol, image })
        });

        const result = await response.json();

        if (result.success) {
            showToast('Added to watchlist!', 'success');
            closeAddWatchlistModal();
            setTimeout(() => location.reload(), 500);
        } else {
            showToast(result.error || 'Failed to add to watchlist', 'error');
        }
    } catch (error) {
        console.error('Error adding to watchlist:', error);
        showToast('Failed to add to watchlist', 'error');
    }
}

// Remove from watchlist
function removeFromWatchlist(coinId) {
    removeCoinId = coinId;
    document.getElementById('removeModal').style.display = 'flex';
    document.getElementById('confirmRemoveBtn').onclick = confirmRemove;
}

async function confirmRemove() {
    if (!removeCoinId) return;

    try {
        const response = await fetch(`/portfolio/watchlist/${removeCoinId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            showToast('Removed from watchlist', 'success');
            closeRemoveModal();
            setTimeout(() => location.reload(), 500);
        } else {
            showToast(result.error || 'Failed to remove from watchlist', 'error');
        }
    } catch (error) {
        console.error('Error removing from watchlist:', error);
        showToast('Failed to remove from watchlist', 'error');
    }
}

// Open Add Watchlist Modal
function openAddWatchlistModal() {
    document.getElementById('watchlistCoinSearch').value = '';
    document.getElementById('watchlistSearchResults').classList.remove('show');
    document.getElementById('addWatchlistModal').style.display = 'flex';
    document.getElementById('watchlistCoinSearch').focus();
}

// Close Add Watchlist Modal
function closeAddWatchlistModal() {
    document.getElementById('addWatchlistModal').style.display = 'none';
}

// Close Remove Modal
function closeRemoveModal() {
    document.getElementById('removeModal').style.display = 'none';
    removeCoinId = null;
}

// ==================== PRICE ALERTS ====================

// Open Alert Modal
function openAlertModal(coinId, name, symbol, currentPrice) {
    document.getElementById('alertCoinId').value = coinId;
    document.getElementById('alertCoinName').textContent = `${name} (${symbol})`;
    document.getElementById('alertCurrentPrice').textContent = `Current: $${currentPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: currentPrice < 1 ? 6 : 2})}`;

    // Load existing alerts from localStorage
    const alerts = JSON.parse(localStorage.getItem('priceAlerts') || '{}');
    const coinAlert = alerts[coinId];

    if (coinAlert) {
        document.getElementById('alertAboveEnabled').checked = coinAlert.above !== null;
        document.getElementById('alertAbovePrice').value = coinAlert.above || '';
        document.getElementById('alertBelowEnabled').checked = coinAlert.below !== null;
        document.getElementById('alertBelowPrice').value = coinAlert.below || '';
    } else {
        document.getElementById('alertAboveEnabled').checked = false;
        document.getElementById('alertAbovePrice').value = '';
        document.getElementById('alertBelowEnabled').checked = false;
        document.getElementById('alertBelowPrice').value = '';
    }

    document.getElementById('alertModal').style.display = 'flex';
}

// Close Alert Modal
function closeAlertModal() {
    document.getElementById('alertModal').style.display = 'none';
}

// Save Alert
function saveAlert() {
    const coinId = document.getElementById('alertCoinId').value;
    const aboveEnabled = document.getElementById('alertAboveEnabled').checked;
    const abovePrice = parseFloat(document.getElementById('alertAbovePrice').value);
    const belowEnabled = document.getElementById('alertBelowEnabled').checked;
    const belowPrice = parseFloat(document.getElementById('alertBelowPrice').value);

    const alerts = JSON.parse(localStorage.getItem('priceAlerts') || '{}');

    if (!aboveEnabled && !belowEnabled) {
        // Remove alert if both are disabled
        delete alerts[coinId];
    } else {
        alerts[coinId] = {
            above: aboveEnabled && abovePrice ? abovePrice : null,
            below: belowEnabled && belowPrice ? belowPrice : null
        };
    }

    localStorage.setItem('priceAlerts', JSON.stringify(alerts));
    showToast('Price alert saved!', 'success');
    closeAlertModal();
}

// Check Price Alerts
function checkPriceAlerts() {
    const alerts = JSON.parse(localStorage.getItem('priceAlerts') || '{}');
    const rows = document.querySelectorAll('.watchlist-table tbody tr');

    rows.forEach(row => {
        const coinId = row.dataset.coinId;
        const priceText = row.querySelector('.td-price')?.textContent;
        const currentPrice = parseFloat(priceText?.replace(/[$,]/g, ''));

        if (alerts[coinId] && currentPrice) {
            const alert = alerts[coinId];

            if (alert.above && currentPrice >= alert.above) {
                showAlertNotification(coinId, 'above', alert.above, currentPrice);
            }

            if (alert.below && currentPrice <= alert.below) {
                showAlertNotification(coinId, 'below', alert.below, currentPrice);
            }
        }
    });
}

// Show Alert Notification
function showAlertNotification(coinId, type, targetPrice, currentPrice) {
    const row = document.querySelector(`tr[data-coin-id="${coinId}"]`);
    const coinName = row?.querySelector('.coin-name')?.textContent || coinId;

    const message = type === 'above'
        ? `${coinName} is now above $${targetPrice.toLocaleString()} (Current: $${currentPrice.toLocaleString()})`
        : `${coinName} is now below $${targetPrice.toLocaleString()} (Current: $${currentPrice.toLocaleString()})`;

    // Show toast notification
    showToast(message, 'alert');

    // Mark as triggered (optional: remove or keep the alert)
    // For now, we'll keep it active
}

// ==================== QUICK ADD TO PORTFOLIO ====================

// Open Quick Add Modal
function quickAddToPortfolio(coinId, name, symbol, image, currentPrice) {
    document.getElementById('quickAddCoinId').value = coinId;
    document.getElementById('quickAddCoinSymbol').value = symbol;
    document.getElementById('quickAddCoinImageUrl').value = image;
    document.getElementById('quickAddCoinCurrentPrice').value = currentPrice;

    document.getElementById('quickAddCoinImage').src = image;
    document.getElementById('quickAddCoinName').textContent = `${name} (${symbol})`;
    document.getElementById('quickAddCoinPrice').textContent = `$${currentPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: currentPrice < 1 ? 6 : 2})}`;

    document.getElementById('quickAddQuantity').value = '';
    document.getElementById('quickAddPurchasePrice').value = currentPrice;

    document.getElementById('quickAddModal').style.display = 'flex';
}

// Close Quick Add Modal
function closeQuickAddModal() {
    document.getElementById('quickAddModal').style.display = 'none';
}

// Use current price for quick add
function useQuickAddCurrentPrice() {
    const currentPrice = document.getElementById('quickAddCoinCurrentPrice').value;
    document.getElementById('quickAddPurchasePrice').value = currentPrice;
}

// Submit Quick Add
async function submitQuickAdd() {
    const coinId = document.getElementById('quickAddCoinId').value;
    const symbol = document.getElementById('quickAddCoinSymbol').value;
    const image = document.getElementById('quickAddCoinImageUrl').value;
    const name = document.getElementById('quickAddCoinName').textContent.split(' (')[0];
    const quantity = parseFloat(document.getElementById('quickAddQuantity').value);
    const purchasePrice = parseFloat(document.getElementById('quickAddPurchasePrice').value);

    if (!quantity || quantity <= 0) {
        showToast('Please enter a valid quantity', 'error');
        return;
    }

    if (!purchasePrice || purchasePrice <= 0) {
        showToast('Please enter a valid purchase price', 'error');
        return;
    }

    try {
        const response = await fetch('/portfolio/holdings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                coinId,
                symbol,
                name,
                image,
                quantity,
                purchasePrice,
                purchaseDate: new Date().toISOString().split('T')[0],
                notes: 'Added from watchlist'
            })
        });

        const result = await response.json();

        if (result.success) {
            showToast('Added to portfolio!', 'success');
            closeQuickAddModal();
        } else {
            showToast(result.error || 'Failed to add to portfolio', 'error');
        }
    } catch (error) {
        console.error('Error adding to portfolio:', error);
        showToast('Failed to add to portfolio', 'error');
    }
}

// ==================== UTILITIES ====================

// Show toast notification
function showToast(message, type = 'success') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Close modals on escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeAddWatchlistModal();
        closeAlertModal();
        closeQuickAddModal();
        closeRemoveModal();
    }
});

// Close modals on overlay click
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        closeAddWatchlistModal();
        closeAlertModal();
        closeQuickAddModal();
        closeRemoveModal();
    }
});
