const {
  calculateProfitLoss,
  calculatePortfolioTotals,
  calculateAllocation
} = require('../../utils/portfolio');

describe('calculateProfitLoss', () => {
  test('returns correct values when in profit', () => {
    const result = calculateProfitLoss(2, 1000, 1500);
    expect(result.currentValue).toBe(3000);
    expect(result.investedValue).toBe(2000);
    expect(result.profitLoss).toBe(1000);
    expect(result.profitLossPercent).toBeCloseTo(50);
  });

  test('returns negative values when at a loss', () => {
    const result = calculateProfitLoss(1, 500, 400);
    expect(result.profitLoss).toBe(-100);
    expect(result.profitLossPercent).toBeCloseTo(-20);
  });

  test('returns zero P/L when price unchanged', () => {
    const result = calculateProfitLoss(5, 200, 200);
    expect(result.profitLoss).toBe(0);
    expect(result.profitLossPercent).toBe(0);
  });

  test('returns zero profitLossPercent when purchasePrice is 0', () => {
    const result = calculateProfitLoss(1, 0, 100);
    expect(result.profitLossPercent).toBe(0);
  });
});

describe('calculatePortfolioTotals', () => {
  const holdings = [
    { currentValue: 3000, investedValue: 2000 },
    { currentValue: 500, investedValue: 600 }
  ];

  test('sums totalValue correctly', () => {
    expect(calculatePortfolioTotals(holdings).totalValue).toBe(3500);
  });

  test('sums totalInvested correctly', () => {
    expect(calculatePortfolioTotals(holdings).totalInvested).toBe(2600);
  });

  test('calculates totalProfitLoss correctly', () => {
    expect(calculatePortfolioTotals(holdings).totalProfitLoss).toBeCloseTo(900);
  });

  test('calculates totalProfitLossPercent correctly', () => {
    expect(calculatePortfolioTotals(holdings).totalProfitLossPercent).toBeCloseTo(34.62, 1);
  });

  test('returns zero percent when totalInvested is 0', () => {
    expect(calculatePortfolioTotals([]).totalProfitLossPercent).toBe(0);
  });
});

describe('calculateAllocation', () => {
  const holdings = [
    { currentValue: 750 },
    { currentValue: 250 }
  ];

  test('calculates allocation percentages', () => {
    const result = calculateAllocation(holdings, 1000);
    expect(result[0].allocationPercent).toBeCloseTo(75);
    expect(result[1].allocationPercent).toBeCloseTo(25);
  });

  test('returns 0 allocation when totalValue is 0', () => {
    const result = calculateAllocation(holdings, 0);
    expect(result[0].allocationPercent).toBe(0);
  });
});
