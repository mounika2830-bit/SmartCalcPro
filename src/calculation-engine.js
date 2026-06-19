const MS_PER_DAY = 24 * 60 * 60 * 1000;

export class CalculationError extends Error {
  constructor(message, code = "INVALID_INPUT") {
    super(message);
    this.name = "CalculationError";
    this.code = code;
  }
}

function numberValue(value, label) {
  if (value === "" || value === null || value === undefined) {
    throw new CalculationError("Please Enter Required Fields", "REQUIRED_FIELD");
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new CalculationError(`Invalid Input: ${label}`, "INVALID_INPUT");
  }
  return parsed;
}

function nonNegative(value, label) {
  const parsed = numberValue(value, label);
  if (parsed < 0) {
    throw new CalculationError("Negative Values Not Allowed", "NEGATIVE_VALUE");
  }
  return parsed;
}

function positive(value, label) {
  const parsed = nonNegative(value, label);
  if (parsed === 0) {
    throw new CalculationError(`${label} must be greater than zero`, "ZERO_VALUE");
  }
  return parsed;
}

function positiveRate(value, label = "Interest Rate") {
  const parsed = nonNegative(value, label);
  if (parsed === 0) {
    throw new CalculationError("Interest Rate Cannot Be Zero", "ZERO_RATE");
  }
  return parsed;
}

function dateValue(value, label) {
  if (!value) {
    throw new CalculationError("Please Enter Required Fields", "REQUIRED_FIELD");
  }
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    throw new CalculationError(`Invalid Input: ${label}`, "INVALID_DATE");
  }
  return date;
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function addMonthsClamped(date, months) {
  const result = new Date(date.getTime());
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  result.setDate(Math.min(day, daysInMonth(result.getFullYear(), result.getMonth())));
  return result;
}

function wholeMonthsBetween(start, end) {
  let months = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
  if (addMonthsClamped(start, months) > end) {
    months -= 1;
  }
  return months;
}

export const formatters = {
  currency(value, currency = "INR") {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
  },
  number(value, maximumFractionDigits = 2) {
    return new Intl.NumberFormat("en-IN", { maximumFractionDigits }).format(value);
  },
  percent(value) {
    return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value) + "%";
  }
};

export function calculateEmi({ principal, annualRate, years }) {
  const P = positive(principal, "Loan Amount");
  const annual = positiveRate(annualRate);
  const loanYears = positive(years, "Loan Tenure");
  const r = annual / 100 / 12;
  const n = loanYears * 12;
  const factor = Math.pow(1 + r, n);
  const emi = (P * r * factor) / (factor - 1);
  const totalAmount = emi * n;
  const totalInterest = totalAmount - P;
  return {
    values: { emi, totalInterest, totalAmount },
    steps: [
      `Monthly rate = ${annual} / 100 / 12 = ${r}`,
      `Months = ${loanYears} x 12 = ${n}`,
      `EMI = P x r x (1+r)^n / ((1+r)^n - 1) = ${emi}`,
      `Total interest = EMI x n - P = ${totalInterest}`
    ]
  };
}

export function calculateSip({ monthlyInvestment, annualReturnRate, years }) {
  const P = positive(monthlyInvestment, "Monthly Investment");
  const annual = positiveRate(annualReturnRate, "Return Rate");
  const investmentYears = positive(years, "Investment Years");
  const r = annual / 100 / 12;
  const n = investmentYears * 12;
  const futureValue = P * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  const investedAmount = P * n;
  const wealthGained = futureValue - investedAmount;
  return {
    values: { investedAmount, wealthGained, futureValue },
    steps: [
      `Monthly return = ${annual} / 100 / 12 = ${r}`,
      `Months = ${investmentYears} x 12 = ${n}`,
      `FV = P x (((1+r)^n - 1) / r) x (1+r) = ${futureValue}`,
      `Wealth gained = FV - invested amount = ${wealthGained}`
    ]
  };
}

export function calculateCompoundInterest({ principal, annualRate, frequency, years }) {
  const P = positive(principal, "Principal");
  const r = positiveRate(annualRate) / 100;
  const n = positive(frequency, "Compounding Frequency");
  const t = positive(years, "Years");
  const finalAmount = P * Math.pow(1 + r / n, n * t);
  const interestEarned = finalAmount - P;
  return {
    values: { principal: P, interestEarned, finalAmount },
    steps: [
      `Rate as decimal = ${r}`,
      `A = P x (1 + r/n)^(n x t) = ${finalAmount}`,
      `Interest earned = A - P = ${interestEarned}`
    ]
  };
}

export function calculateSimpleInterest({ principal, annualRate, years }) {
  const P = positive(principal, "Principal");
  const R = positiveRate(annualRate);
  const T = positive(years, "Years");
  const interest = (P * R * T) / 100;
  return {
    values: { principal: P, interest, totalAmount: P + interest },
    steps: [`SI = (P x R x T) / 100 = ${interest}`, `Total amount = P + SI = ${P + interest}`]
  };
}

export function calculateGst({ amount, rate, mode = "exclusive" }) {
  const value = positive(amount, "Amount");
  const gstRate = positiveRate(rate, "GST Rate");
  if (!["exclusive", "inclusive"].includes(mode)) {
    throw new CalculationError("Invalid Input: GST Mode", "INVALID_MODE");
  }
  const gstAmount = mode === "inclusive" ? (value * gstRate) / (100 + gstRate) : (value * gstRate) / 100;
  const originalAmount = mode === "inclusive" ? value - gstAmount : value;
  const finalAmount = mode === "inclusive" ? value : value + gstAmount;
  return {
    values: { originalAmount, gstAmount, finalAmount },
    steps: [
      mode === "inclusive"
        ? `Inclusive GST = Amount x GST Rate / (100 + GST Rate) = ${gstAmount}`
        : `GST = Amount x GST Rate / 100 = ${gstAmount}`,
      `Final amount = ${finalAmount}`
    ]
  };
}

export function calculatePercentage({ part, total }) {
  const numerator = nonNegative(part, "Part");
  const denominator = positive(total, "Total");
  const percentage = (numerator / denominator) * 100;
  return {
    values: { percentage },
    steps: [`Percentage = (Part / Total) x 100 = ${percentage}`]
  };
}

export function calculateAge({ birthDate, asOfDate = new Date().toISOString().slice(0, 10) }) {
  const start = dateValue(birthDate, "Birth Date");
  const end = dateValue(asOfDate, "As Of Date");
  if (end < start) {
    throw new CalculationError("End Date Must Be Greater Than Start Date", "DATE_ORDER");
  }
  const totalMonths = wholeMonthsBetween(start, end);
  const anchor = addMonthsClamped(start, totalMonths);
  const days = Math.floor((end - anchor) / MS_PER_DAY);
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  return {
    values: { years, months, days },
    steps: [`Calendar months between dates = ${totalMonths}`, `Age = ${years} years, ${months} months, ${days} days`]
  };
}

export function calculateDateDifference({ startDate, endDate }) {
  const start = dateValue(startDate, "Start Date");
  const end = dateValue(endDate, "End Date");
  if (end <= start) {
    throw new CalculationError("End Date Must Be Greater Than Start Date", "DATE_ORDER");
  }
  const totalDays = Math.floor((end - start) / MS_PER_DAY);
  const totalWeeks = Math.floor(totalDays / 7);
  const totalHours = totalDays * 24;
  const totalMonths = wholeMonthsBetween(start, end);
  const anchor = addMonthsClamped(start, totalMonths);
  const days = Math.floor((end - anchor) / MS_PER_DAY);
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  return {
    values: { years, months, weeks: totalWeeks, days, totalDays, hours: totalHours },
    steps: [
      `Exact calendar span = ${years} years, ${months} months, ${days} days`,
      `Total days = ${totalDays}`,
      `Weeks = floor(total days / 7) = ${totalWeeks}`,
      `Hours = total days x 24 = ${totalHours}`
    ]
  };
}

export function calculateBmi({ weightKg, heightCm }) {
  const weight = positive(weightKg, "Weight");
  const heightM = positive(heightCm, "Height") / 100;
  const bmi = weight / Math.pow(heightM, 2);
  const category = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese";
  return {
    values: { bmi, category },
    steps: [`Height in meters = ${heightM}`, `BMI = Weight (kg) / Height^2 (m) = ${bmi}`, `WHO category = ${category}`]
  };
}

export function calculateBmr({ weightKg, heightCm, age, sex }) {
  const W = positive(weightKg, "Weight");
  const H = positive(heightCm, "Height");
  const A = positive(age, "Age");
  if (!["male", "female"].includes(sex)) {
    throw new CalculationError("Invalid Input: Sex", "INVALID_INPUT");
  }
  const bmr = sex === "male" ? 10 * W + 6.25 * H - 5 * A + 5 : 10 * W + 6.25 * H - 5 * A - 161;
  return {
    values: { bmr },
    steps: [`Mifflin-St Jeor (${sex}) = ${bmr}`]
  };
}

export async function convertCurrency({ amount, from, to, rateProvider = defaultRateProvider }) {
  const value = positive(amount, "Amount");
  if (!from || !to) {
    throw new CalculationError("Please Enter Required Fields", "REQUIRED_FIELD");
  }
  const quote = await rateProvider(String(from).toUpperCase(), String(to).toUpperCase());
  const rate = positive(quote.rate, "Exchange Rate");
  const convertedAmount = value * rate;
  return {
    values: { convertedAmount, rate, lastUpdated: quote.lastUpdated, source: quote.source },
    steps: [`Exchange rate (${from} to ${to}) = ${rate}`, `Converted amount = Amount x Rate = ${convertedAmount}`]
  };
}

export async function defaultRateProvider(from, to) {
  const response = await fetch(`https://api.frankfurter.app/latest?amount=1&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
  if (!response.ok) {
    throw new CalculationError("Unable to fetch live exchange rates. Please try again later.", "RATE_PROVIDER_ERROR");
  }
  const data = await response.json();
  if (!data.rates || !Number.isFinite(Number(data.rates[to]))) {
    throw new CalculationError("Exchange rate unavailable for selected currencies.", "RATE_UNAVAILABLE");
  }
  return {
    rate: Number(data.rates[to]),
    lastUpdated: data.date || new Date().toISOString(),
    source: "Frankfurter API / European Central Bank reference rates"
  };
}

export function calculateTax({ grossIncome, deductions = 0, country = "India", financialYear, regime }, taxConfig) {
  const gross = nonNegative(grossIncome, "Gross Income");
  const claimedDeductions = nonNegative(deductions, "Deductions");
  if (!taxConfig?.[country]?.[financialYear]?.[regime]) {
    throw new CalculationError("Invalid Input: Tax slab configuration not found", "TAX_CONFIG_NOT_FOUND");
  }
  const selected = taxConfig[country][financialYear][regime];
  const totalDeductions = claimedDeductions + nonNegative(selected.standardDeduction || 0, "Standard Deduction");
  const taxableIncome = Math.max(0, gross - totalDeductions);
  let previousLimit = 0;
  let totalTax = 0;
  const slabBreakdown = selected.slabs.map((slab) => {
    const upperLimit = slab.upTo === null ? taxableIncome : Math.min(taxableIncome, nonNegative(slab.upTo, "Slab Limit"));
    const taxableBySlab = Math.max(0, upperLimit - previousLimit);
    const tax = (taxableBySlab * nonNegative(slab.rate, "Slab Rate")) / 100;
    totalTax += tax;
    const row = { from: previousLimit, to: slab.upTo, rate: slab.rate, taxableAmount: taxableBySlab, tax };
    previousLimit = slab.upTo === null ? taxableIncome : Math.max(previousLimit, slab.upTo);
    return row;
  });
  const effectiveTaxRate = gross === 0 ? 0 : (totalTax / gross) * 100;
  return {
    values: { grossIncome: gross, deductions: totalDeductions, taxableIncome, slabBreakdown, totalTax, effectiveTaxRate },
    steps: [
      `Taxable income = gross income - deductions = ${taxableIncome}`,
      `Total tax = sum of slab tax = ${totalTax}`,
      `Effective tax rate = total tax / gross income x 100 = ${effectiveTaxRate}`
    ]
  };
}
