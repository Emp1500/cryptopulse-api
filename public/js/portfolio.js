// Portfolio JavaScript

let selectedCoin = null;
let editingHoldingId = null;
let deleteHoldingId = null;
let searchTimeout = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    const coinSearch = document.getElementById('coinSearch');
    if (coinSearch) {
        coinSearch.addEventListener('input', handleCoinSearch);
        coinSearch.addEventListener('focus', function() {
            if (this.value.length > 0) {
                document.getElementById('searchResults').classList.add('show');
            }
        });
    }

    // Close search results when clicking outside
    document.addEventListener('click', function(e) {
        const searchWrapper = document.querySelector('.search-wrapper');
        if (searchWrapper && !searchWrapper.contains(e.target)) {
            document.getElementById('searchResults').classList.remove('show');
        }
    });

    // Set default date to today
    const dateInput = document.getElementById('purchaseDate');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
});

// Handle coin search
async function handleCoinSearch(e) {
    const query = e.target.value.trim();
    const resultsDiv = document.getElementById('searchResults');

    if (query.length < 1) {
        resultsDiv.classList.remove('show');
        return;
    }

    // Debounce
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
        try {
            const response = await fetch(`/api/coins/search?q=${encodeURIComponent(query)}`);
            const coins = await response.json();

            if (coins.length === 0) {
                resultsDiv.innerHTML = '<div class="search-result-item"><span class="name">No coins found</span></div>';
            } else {
                resultsDiv.innerHTML = coins.map(coin => `
                    <div class="search-result-item" onclick="selectCoin(${JSON.stringify(coin).replace(/"/g, '&quot;')})">
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

// Select a coin from search results
function selectCoin(coin) {
    selectedCoin = coin;

    // Update hidden fields
    document.getElementById('coinId').value = coin.id;
    document.getElementById('coinImage').value = coin.image;

    // Show selected coin
    document.getElementById('selectedCoin').style.display = 'flex';
    document.getElementById('selectedCoinImage').src = coin.image;
    document.getElementById('selectedCoinName').textContent = `${coin.name} (${coin.symbol})`;

    // Hide search
    document.getElementById('coinSearch').value = '';
    document.getElementById('coinSearch').style.display = 'none';
    document.getElementById('searchResults').classList.remove('show');

    // Set current price as default
    if (coin.current_price) {
        document.getElementById('purchasePrice').value = coin.current_price;
    }
}

// Clear coin selection
function clearCoinSelection() {
    selectedCoin = null;
    document.getElementById('coinId').value = '';
    document.getElementById('coinImage').value = '';
    document.getElementById('selectedCoin').style.display = 'none';
    document.getElementById('coinSearch').style.display = 'block';
    document.getElementById('coinSearch').value = '';
}

// Use current price
async function useCurrentPrice() {
    if (!selectedCoin) {
        showToast('Please select a coin first', 'error');
        return;
    }

    try {
        const response = await fetch(`/api/coins/price/${selectedCoin.id}`);
        const data = await response.json();

        if (data[selectedCoin.id]?.usd) {
            document.getElementById('purchasePrice').value = data[selectedCoin.id].usd;
        }
    } catch (error) {
        console.error('Error fetching price:', error);
        showToast('Failed to fetch current price', 'error');
    }
}

// Open add modal
function openAddModal() {
    editingHoldingId = null;
    selectedCoin = null;

    // Reset form
    document.getElementById('holdingForm').reset();
    document.getElementById('holdingId').value = '';
    document.getElementById('coinId').value = '';
    document.getElementById('coinImage').value = '';
    document.getElementById('selectedCoin').style.display = 'none';
    document.getElementById('coinSearch').style.display = 'block';
    document.getElementById('purchaseDate').value = new Date().toISOString().split('T')[0];

    // Update modal title and button
    document.getElementById('modalTitle').textContent = 'Add New Holding';
    document.getElementById('saveBtn').textContent = 'Add Holding';

    // Show modal
    document.getElementById('holdingModal').style.display = 'flex';
}

// Open edit modal
function openEditModal(holding) {
    editingHoldingId = holding.id;
    selectedCoin = {
        id: holding.coinId,
        symbol: holding.symbol,
        name: holding.name,
        image: holding.image
    };

    // Fill form
    document.getElementById('holdingId').value = holding.id;
    document.getElementById('coinId').value = holding.coinId;
    document.getElementById('coinImage').value = holding.image;
    document.getElementById('quantity').value = holding.quantity;
    document.getElementById('purchasePrice').value = holding.purchasePrice;
    document.getElementById('purchaseDate').value = holding.purchaseDate;
    document.getElementById('notes').value = holding.notes || '';

    // Show selected coin
    document.getElementById('selectedCoin').style.display = 'flex';
    document.getElementById('selectedCoinImage').src = holding.image;
    document.getElementById('selectedCoinName').textContent = `${holding.name} (${holding.symbol})`;
    document.getElementById('coinSearch').style.display = 'none';

    // Update modal title and button
    document.getElementById('modalTitle').textContent = 'Edit Holding';
    document.getElementById('saveBtn').textContent = 'Save Changes';

    // Show modal
    document.getElementById('holdingModal').style.display = 'flex';
}

// Close modal
function closeModal() {
    document.getElementById('holdingModal').style.display = 'none';
}

// Save holding (add or edit)
async function saveHolding(event) {
    event.preventDefault();

    const coinId = document.getElementById('coinId').value;
    const quantity = document.getElementById('quantity').value;
    const purchasePrice = document.getElementById('purchasePrice').value;

    if (!coinId || !selectedCoin) {
        showToast('Please select a coin', 'error');
        return;
    }

    if (!quantity || parseFloat(quantity) <= 0) {
        showToast('Please enter a valid quantity', 'error');
        return;
    }

    if (!purchasePrice || parseFloat(purchasePrice) <= 0) {
        showToast('Please enter a valid purchase price', 'error');
        return;
    }

    const data = {
        coinId: selectedCoin.id,
        symbol: selectedCoin.symbol,
        name: selectedCoin.name,
        image: selectedCoin.image,
        quantity: parseFloat(quantity),
        purchasePrice: parseFloat(purchasePrice),
        purchaseDate: document.getElementById('purchaseDate').value,
        notes: document.getElementById('notes').value
    };

    try {
        let response;
        if (editingHoldingId) {
            // Edit existing
            response = await fetch(`/portfolio/holdings/${editingHoldingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } else {
            // Add new
            response = await fetch('/portfolio/holdings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        }

        const result = await response.json();

        if (result.success) {
            showToast(editingHoldingId ? 'Holding updated successfully' : 'Holding added successfully', 'success');
            closeModal();
            // Reload page to show updated data
            setTimeout(() => location.reload(), 500);
        } else {
            showToast(result.error || 'Failed to save holding', 'error');
        }
    } catch (error) {
        console.error('Error saving holding:', error);
        showToast('Failed to save holding', 'error');
    }
}

// Delete holding
function deleteHolding(id) {
    deleteHoldingId = id;
    document.getElementById('deleteModal').style.display = 'flex';

    // Set up confirm button
    document.getElementById('confirmDeleteBtn').onclick = confirmDelete;
}

// Close delete modal
function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    deleteHoldingId = null;
}

// Confirm delete
async function confirmDelete() {
    if (!deleteHoldingId) return;

    try {
        const response = await fetch(`/portfolio/holdings/${deleteHoldingId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            showToast('Holding deleted successfully', 'success');
            closeDeleteModal();
            // Reload page
            setTimeout(() => location.reload(), 500);
        } else {
            showToast(result.error || 'Failed to delete holding', 'error');
        }
    } catch (error) {
        console.error('Error deleting holding:', error);
        showToast('Failed to delete holding', 'error');
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    // Create new toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Show toast
    setTimeout(() => toast.classList.add('show'), 10);

    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Close modals on escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
        closeDeleteModal();
    }
});

// Close modals on overlay click
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        closeModal();
        closeDeleteModal();
    }
});
