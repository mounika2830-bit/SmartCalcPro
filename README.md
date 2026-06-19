# SmartCalc Pro

Accuracy-first calculator app with a centralized calculation engine.

## Run

```powershell
npm test
npm start
```

Open `http://localhost:4173`.

## Accuracy Model

- All calculators call `src/calculation-engine.js`.
- Inputs are validated before calculation.
- Internal calculations keep full JavaScript double precision.
- Results are rounded only by display formatters in the UI.
- Invalid values throw `CalculationError` with user-facing messages.
- The app never displays `NaN`, `Infinity`, `undefined`, or blank results from the UI path.
- Currency conversion uses the live Frankfurter API and does not store fallback exchange rates.
- Tax slabs live in `tax-slabs.json` so financial years and regimes can be updated without editing formula code.

## Test Coverage

The suite covers formula validation, edge cases, boundaries, large numbers, decimal precision, calendar leap-year behavior, tax slab breakdowns, and mocked live currency conversion.

Known examples included:

- EMI: `1000000`, `8.5%`, `20 years`
- SIP: `5000/month`, `12%`, `20 years`
- Compound interest: `100000`, `10%`, `5 years`
