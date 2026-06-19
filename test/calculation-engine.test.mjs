import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  CalculationError,
  calculateAge,
  calculateBmi,
  calculateBmr,
  calculateCompoundInterest,
  calculateDateDifference,
  calculateEmi,
  calculateGst,
  calculatePercentage,
  calculateSimpleInterest,
  calculateSip,
  calculateTax,
  convertCurrency
} from "../src/calculation-engine.js";

const taxConfig = JSON.parse(await readFile(new URL("../tax-slabs.json", import.meta.url), "utf8"));

function closeTo(actual, expected, tolerance = 0.01) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} expected within ${tolerance} of ${expected}`);
}

test("EMI matches standard reducing-balance example", () => {
  const { values } = calculateEmi({ principal: 1000000, annualRate: 8.5, years: 20 });
  closeTo(values.emi, 8678.23);
  closeTo(values.totalInterest, 1082775.76);
  closeTo(values.totalAmount, 2082775.76);
});

test("SIP matches monthly compounded due-annuity example", () => {
  const { values } = calculateSip({ monthlyInvestment: 5000, annualReturnRate: 12, years: 20 });
  closeTo(values.investedAmount, 1200000);
  closeTo(values.wealthGained, 3795739.60);
  closeTo(values.futureValue, 4995739.60);
});

test("compound interest validates annual compounding example", () => {
  const { values } = calculateCompoundInterest({ principal: 100000, annualRate: 10, frequency: 1, years: 5 });
  closeTo(values.finalAmount, 161051);
  closeTo(values.interestEarned, 61051);
});

test("simple interest formula uses decimal inputs precisely enough for money display", () => {
  const { values } = calculateSimpleInterest({ principal: 12345.67, annualRate: 7.25, years: 2.5 });
  closeTo(values.interest, 2237.6526875, 0.0000001);
  closeTo(values.totalAmount, 14583.3226875, 0.0000001);
});

test("GST exclusive and inclusive formulas produce expected values", () => {
  closeTo(calculateGst({ amount: 1000, rate: 18, mode: "exclusive" }).values.gstAmount, 180);
  const inclusive = calculateGst({ amount: 1180, rate: 18, mode: "inclusive" }).values;
  closeTo(inclusive.originalAmount, 1000);
  closeTo(inclusive.gstAmount, 180);
  closeTo(inclusive.finalAmount, 1180);
});

test("percentage rejects zero denominator and calculates ordinary values", () => {
  closeTo(calculatePercentage({ part: 25, total: 200 }).values.percentage, 12.5);
  assert.throws(() => calculatePercentage({ part: 1, total: 0 }), CalculationError);
});

test("age calculation handles leap-day birth dates", () => {
  assert.deepEqual(calculateAge({ birthDate: "2000-02-29", asOfDate: "2024-02-29" }).values, {
    years: 24,
    months: 0,
    days: 0
  });
  assert.deepEqual(calculateAge({ birthDate: "2000-02-29", asOfDate: "2023-02-28" }).values, {
    years: 23,
    months: 0,
    days: 0
  });
});

test("date difference reports calendar span and absolute totals", () => {
  const { values } = calculateDateDifference({ startDate: "2020-02-29", endDate: "2026-06-17" });
  assert.deepEqual(values, { years: 6, months: 3, weeks: 328, days: 19, totalDays: 2300, hours: 55200 });
});

test("BMI follows WHO categories", () => {
  closeTo(calculateBmi({ weightKg: 70, heightCm: 175 }).values.bmi, 22.857142857, 0.0000001);
  assert.equal(calculateBmi({ weightKg: 70, heightCm: 175 }).values.category, "Normal");
  assert.equal(calculateBmi({ weightKg: 95, heightCm: 170 }).values.category, "Obese");
});

test("BMR uses Mifflin-St Jeor equations", () => {
  closeTo(calculateBmr({ weightKg: 70, heightCm: 175, age: 30, sex: "male" }).values.bmr, 1648.75);
  closeTo(calculateBmr({ weightKg: 60, heightCm: 165, age: 30, sex: "female" }).values.bmr, 1320.25);
});

test("currency converter uses injected live-rate provider without hardcoded rates", async () => {
  const result = await convertCurrency({
    amount: 100,
    from: "USD",
    to: "INR",
    rateProvider: async (from, to) => ({ rate: 83.1234, lastUpdated: "2026-06-17T00:00:00Z", source: `${from}/${to} mock` })
  });
  closeTo(result.values.convertedAmount, 8312.34);
  assert.equal(result.values.source, "USD/INR mock");
});

test("tax calculator uses external slab configuration and breakdown rows", () => {
  const { values } = calculateTax({ grossIncome: 1200000, deductions: 0, country: "India", financialYear: "FY2025-26", regime: "new" }, taxConfig);
  closeTo(values.deductions, 75000);
  closeTo(values.taxableIncome, 1125000);
  closeTo(values.totalTax, 52500);
  closeTo(values.effectiveTaxRate, 4.375);
  assert.equal(values.slabBreakdown.length, 7);
});

test("input validation covers negative values, zero rates, missing fields, and invalid date order", () => {
  assert.throws(() => calculateEmi({ principal: -1, annualRate: 8, years: 1 }), /Negative Values Not Allowed/);
  assert.throws(() => calculateSip({ monthlyInvestment: 5000, annualReturnRate: 0, years: 1 }), /Interest Rate Cannot Be Zero/);
  assert.throws(() => calculateCompoundInterest({ principal: "", annualRate: 10, frequency: 1, years: 1 }), /Please Enter Required Fields/);
  assert.throws(() => calculateDateDifference({ startDate: "2026-01-01", endDate: "2025-01-01" }), /End Date Must Be Greater Than Start Date/);
});

test("large numbers remain finite and do not expose NaN or Infinity", () => {
  const { values } = calculateEmi({ principal: 999999999999, annualRate: 6.75, years: 30 });
  assert.ok(Number.isFinite(values.emi));
  assert.ok(Number.isFinite(values.totalAmount));
  assert.ok(!Number.isNaN(values.totalInterest));
});
