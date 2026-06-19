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
  convertCurrency,
  formatters
} from "./src/calculation-engine.js";

const calculators = [
  {
    id: "emi",
    title: "EMI Calculator",
    note: "Uses the standard reducing-balance EMI formula.",
    fields: [
      ["principal", "Loan Amount", "number", "1000000"],
      ["annualRate", "Annual Interest Rate (%)", "number", "8.5"],
      ["years", "Tenure (Years)", "number", "20"]
    ],
    run: (data) => calculateEmi(data),
    metrics: [
      ["emi", "EMI", "currency"],
      ["totalInterest", "Total Interest", "currency"],
      ["totalAmount", "Total Amount Payable", "currency"]
    ]
  },
  {
    id: "sip",
    title: "SIP Calculator",
    note: "Assumes monthly investment at monthly compounded return.",
    fields: [
      ["monthlyInvestment", "Monthly Investment", "number", "5000"],
      ["annualReturnRate", "Annual Return Rate (%)", "number", "12"],
      ["years", "Investment Period (Years)", "number", "20"]
    ],
    run: (data) => calculateSip(data),
    metrics: [
      ["investedAmount", "Invested Amount", "currency"],
      ["wealthGained", "Wealth Gained", "currency"],
      ["futureValue", "Future Value", "currency"]
    ]
  },
  {
    id: "compound",
    title: "Compound Interest",
    note: "Supports configurable compounding frequency.",
    fields: [
      ["principal", "Principal", "number", "100000"],
      ["annualRate", "Annual Interest Rate (%)", "number", "10"],
      ["frequency", "Compounding Frequency / Year", "number", "1"],
      ["years", "Years", "number", "5"]
    ],
    run: (data) => calculateCompoundInterest(data),
    metrics: [
      ["principal", "Principal", "currency"],
      ["interestEarned", "Interest Earned", "currency"],
      ["finalAmount", "Final Amount", "currency"]
    ]
  },
  {
    id: "simple",
    title: "Simple Interest",
    note: "Uses SI = P x R x T / 100.",
    fields: [
      ["principal", "Principal", "number", "100000"],
      ["annualRate", "Annual Interest Rate (%)", "number", "10"],
      ["years", "Years", "number", "5"]
    ],
    run: (data) => calculateSimpleInterest(data),
    metrics: [
      ["principal", "Principal", "currency"],
      ["interest", "Interest", "currency"],
      ["totalAmount", "Total Amount", "currency"]
    ]
  },
  {
    id: "gst",
    title: "GST Calculator",
    note: "Handles exclusive and inclusive GST amounts.",
    fields: [
      ["amount", "Amount", "number", "1000"],
      ["rate", "GST Rate (%)", "number", "18"],
      ["mode", "GST Mode", "select", "exclusive", [["exclusive", "Exclusive"], ["inclusive", "Inclusive"]]]
    ],
    run: (data) => calculateGst(data),
    metrics: [
      ["originalAmount", "Original Amount", "currency"],
      ["gstAmount", "GST Amount", "currency"],
      ["finalAmount", "Final Amount", "currency"]
    ]
  },
  {
    id: "percentage",
    title: "Percentage Calculator",
    note: "Safely rejects zero totals.",
    fields: [
      ["part", "Part", "number", "25"],
      ["total", "Total", "number", "200"]
    ],
    run: (data) => calculatePercentage(data),
    metrics: [["percentage", "Percentage", "percent"]]
  },
  {
    id: "age",
    title: "Age Calculator",
    note: "Uses actual calendar arithmetic with leap years and month lengths.",
    fields: [
      ["birthDate", "Birth Date", "date", "2000-02-29"],
      ["asOfDate", "As Of Date", "date", "2026-06-17"]
    ],
    run: (data) => calculateAge(data),
    metrics: [
      ["years", "Years", "number"],
      ["months", "Months", "number"],
      ["days", "Days", "number"]
    ]
  },
  {
    id: "date",
    title: "Date Difference",
    note: "Returns exact calendar span plus total weeks, days, and hours.",
    fields: [
      ["startDate", "Start Date", "date", "2020-02-29"],
      ["endDate", "End Date", "date", "2026-06-17"]
    ],
    run: (data) => calculateDateDifference(data),
    metrics: [
      ["years", "Years", "number"],
      ["months", "Months", "number"],
      ["weeks", "Weeks", "number"],
      ["days", "Remainder Days", "number"],
      ["totalDays", "Total Days", "number"],
      ["hours", "Hours", "number"]
    ]
  },
  {
    id: "bmi",
    title: "BMI Calculator",
    note: "Categories follow WHO adult BMI standards.",
    fields: [
      ["weightKg", "Weight (kg)", "number", "70"],
      ["heightCm", "Height (cm)", "number", "175"]
    ],
    run: (data) => calculateBmi(data),
    metrics: [
      ["bmi", "BMI", "number"],
      ["category", "Category", "text"]
    ]
  },
  {
    id: "bmr",
    title: "BMR Calculator",
    note: "Uses the Mifflin-St Jeor equation.",
    fields: [
      ["weightKg", "Weight (kg)", "number", "70"],
      ["heightCm", "Height (cm)", "number", "175"],
      ["age", "Age", "number", "30"],
      ["sex", "Sex", "select", "male", [["male", "Male"], ["female", "Female"]]]
    ],
    run: (data) => calculateBmr(data),
    metrics: [["bmr", "BMR", "number"]]
  },
  {
    id: "currency",
    title: "Currency Converter",
    note: "Fetches live rates and shows source metadata.",
    fields: [
      ["amount", "Amount", "number", "1000"],
      ["from", "From Currency", "text", "USD"],
      ["to", "To Currency", "text", "INR"]
    ],
    run: (data) => convertCurrency(data),
    metrics: [
      ["convertedAmount", "Converted Amount", "number"],
      ["rate", "Exchange Rate", "number"],
      ["lastUpdated", "Last Updated Time", "text"],
      ["source", "Source of Exchange Rate", "text"]
    ]
  },
  {
    id: "tax",
    title: "Tax Calculator",
    note: "Uses configurable slabs from a separate tax-slabs.json file.",
    fields: [
      ["grossIncome", "Gross Income", "number", "1200000"],
      ["deductions", "Deductions", "number", "0"],
      ["country", "Country", "select", "India", [["India", "India"]]],
      ["financialYear", "Financial Year", "select", "FY2025-26", [["FY2025-26", "FY2025-26"], ["FY2024-25", "FY2024-25"]]],
      ["regime", "Tax Regime", "select", "new", [["new", "New"], ["old", "Old"]]]
    ],
    run: async (data) => calculateTax(data, await loadTaxConfig()),
    metrics: [
      ["grossIncome", "Gross Income", "currency"],
      ["deductions", "Deductions", "currency"],
      ["taxableIncome", "Taxable Income", "currency"],
      ["totalTax", "Total Tax", "currency"],
      ["effectiveTaxRate", "Effective Tax Rate", "percent"]
    ],
    table: true
  }
];

const tabs = document.querySelector("#calculatorTabs");
const title = document.querySelector("#calculatorTitle");
const note = document.querySelector("#calculatorNote");
const form = document.querySelector("#calculatorForm");
const resultPanel = document.querySelector("#resultPanel");
let active = calculators[0];
let taxConfigPromise;

function loadTaxConfig() {
  taxConfigPromise ||= fetch("./tax-slabs.json").then((response) => {
    if (!response.ok) throw new CalculationError("Tax configuration could not be loaded.", "TAX_CONFIG_LOAD_ERROR");
    return response.json();
  });
  return taxConfigPromise;
}

function renderTabs() {
  tabs.innerHTML = calculators
    .map((calc) => `<button type="button" class="tab${calc.id === active.id ? " active" : ""}" data-id="${calc.id}">${calc.title}</button>`)
    .join("");
}

function renderForm() {
  title.textContent = active.title;
  note.textContent = active.note;
  form.innerHTML =
    active.fields
      .map(([name, label, type, value, options]) => {
        if (type === "select") {
          return `<div class="field"><label for="${name}">${label}</label><select id="${name}" name="${name}">${options
            .map(([optionValue, optionLabel]) => `<option value="${optionValue}"${optionValue === value ? " selected" : ""}>${optionLabel}</option>`)
            .join("")}</select></div>`;
        }
        return `<div class="field"><label for="${name}">${label}</label><input id="${name}" name="${name}" type="${type}" step="any" value="${value}"></div>`;
      })
      .join("") + `<button class="submit" type="submit">Calculate</button>`;
  resultPanel.innerHTML = "";
}

function collectData() {
  return Object.fromEntries(new FormData(form).entries());
}

function formatValue(value, type) {
  if (type === "currency") return formatters.currency(value);
  if (type === "percent") return formatters.percent(value);
  if (type === "number") return formatters.number(value, 6);
  return String(value);
}

function renderResult(result) {
  const metrics = active.metrics
    .map(([key, label, type]) => `<div class="metric"><span>${label}</span><strong>${formatValue(result.values[key], type)}</strong></div>`)
    .join("");
  const steps = result.steps.map((step) => `<li>${step}</li>`).join("");
  const table = active.table ? renderTaxTable(result.values.slabBreakdown) : "";
  resultPanel.innerHTML = `<div class="metric-grid">${metrics}</div>${table}<ol class="steps">${steps}</ol>`;
}

function renderTaxTable(rows) {
  const body = rows
    .map(
      (row) =>
        `<tr><td>${formatters.currency(row.from)} - ${row.to === null ? "Above" : formatters.currency(row.to)}</td><td>${formatters.percent(row.rate)}</td><td>${formatters.currency(row.taxableAmount)}</td><td>${formatters.currency(row.tax)}</td></tr>`
    )
    .join("");
  return `<table><thead><tr><th>Slab</th><th>Rate</th><th>Taxable</th><th>Tax</th></tr></thead><tbody>${body}</tbody></table>`;
}

async function calculate() {
  resultPanel.innerHTML = "";
  try {
    const result = await active.run(collectData());
    renderResult(result);
  } catch (error) {
    const message = error instanceof CalculationError ? error.message : "Unable to calculate. Please check inputs and try again.";
    resultPanel.innerHTML = `<p class="error">${message}</p>`;
  }
}

tabs.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-id]");
  if (!button) return;
  active = calculators.find((calc) => calc.id === button.dataset.id);
  renderTabs();
  renderForm();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  calculate();
});

renderTabs();
renderForm();
