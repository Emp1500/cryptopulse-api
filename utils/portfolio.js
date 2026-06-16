function calculateProfitLoss(quantity, purchasePrice, currentPrice) {
  const currentValue = quantity * currentPrice;
  const investedValue = quantity * purchasePrice;
  const profitLoss = currentValue - investedValue;
  const profitLossPercent = purchasePrice > 0
    ? ((currentPrice - purchasePrice) / purchasePrice) * 100
    : 0;
  return { currentValue, investedValue, profitLoss, profitLossPercent };
}

function calculatePortfolioTotals(holdings) {
  const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalInvested = holdings.reduce((sum, h) => sum + h.investedValue, 0);
  const totalProfitLoss = totalValue - totalInvested;
  const totalProfitLossPercent = totalInvested > 0
    ? (totalProfitLoss / totalInvested) * 100
    : 0;
  return { totalValue, totalInvested, totalProfitLoss, totalProfitLossPercent };
}

function calculateAllocation(holdings, totalValue) {
  return holdings.map(h => ({
    ...h,
    allocationPercent: totalValue > 0 ? (h.currentValue / totalValue) * 100 : 0
  }));
}

module.exports = { calculateProfitLoss, calculatePortfolioTotals, calculateAllocation };
