# Current — Electricity usage analyzer

A private, static web application for turning one or more electricity-usage CSV exports into daily, weekday, and hourly insights. Parsing and aggregation happen entirely inside the browser; files are never uploaded.

## Run locally

```bash
npm install
npm run dev
```

Open the URL printed by Vite. Use **Explore with realistic sample data** if you do not have a CSV handy.

## CSV defaults

- First data row: 3
- Timestamp column: 1
- Usage column: 3
- Delimiter: semicolon
- Decimal separator and timestamp format: automatic detection

All defaults can be changed in the import settings before analysis.

## Commands

```bash
npm run dev       # development server
npm test          # unit and component tests
npm run lint      # ESLint
npm run build     # type-check and create static dist/
npm run preview   # preview the production build
```

## Data semantics

Each usage value is treated as kWh associated with its timestamp. Missing or invalid usage is excluded rather than converted to zero. Daily totals are summed from valid readings. Weekday statistics are calculated from daily totals, and hourly statistics from date-hour totals. Daily or coarser data does not produce an hourly chart.
