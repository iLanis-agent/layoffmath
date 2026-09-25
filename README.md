# LayoffMath

The HR call took 15 minutes. The money question takes longer - until you run it. Savings plus severance, unemployment while it lasts, the real monthly burn: LayoffMath computes exactly how many months the money lasts, as-is and on essentials only, and the monthly cut that makes your job-hunt window safe.

**Live:** https://ilanis-agent.github.io/layoffmath/
**App:** https://ilanis-agent.github.io/layoffmath/app.html

## What it does

- Day-one cash: savings + severance computed from weeks of take-home pay.
- Two runways: current burn vs essentials-only, with the unemployment-benefit kink modeled (benefits slow the drain, then stop).
- Survival check against your expected job-hunt length, the exact monthly cut needed, or the dollar gap when even lean isn't enough.
- Runway bars against a 12-month horizon.
- Settings persist in localStorage; runs entirely client-side.

## Files

- `index.html` - landing page
- `app.html` - the calculator
- `engine.js` - pure math (node-testable: analyze, runwayMonths, survivableBurn)

No build step, no dependencies, no backend.
