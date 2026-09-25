/* LayoffMath engine - how long does the money actually last. Pure math, no DOM. */
(function (root) {
  'use strict';

  function num(v, name) {
    var n = typeof v === 'string' ? parseFloat(v) : v;
    if (typeof n !== 'number' || !isFinite(n) || isNaN(n)) throw new Error(name + ' must be a number');
    return n;
  }
  function money(v, name, max) {
    var n = num(v, name);
    if (n < 0 || n > (max || 10000000)) throw new Error(name + ' must be in [0, ' + (max || 10000000) + ']');
    return n;
  }
  function round2(x) { return Math.round(x * 100) / 100; }

  var WEEKS_PER_MONTH = 52 / 12; // 4.333

  // Piecewise monthly simulation: UI income for the first uiWeeks weeks, then nothing.
  // Returns months until cash < 0 (fractional), or 600+ as "indefinite".
  function runwayMonths(cash, monthlyBurn, uiWeekly, uiWeeks) {
    if (monthlyBurn <= 0) return Infinity;
    var uiMonthly = uiWeekly * WEEKS_PER_MONTH;
    var uiMonths = uiWeeks / WEEKS_PER_MONTH;
    var c = cash, m = 0;
    // phase 1: while UI pays
    var drain1 = monthlyBurn - uiMonthly;
    if (drain1 <= 0) {
      m = uiMonths; // cash grows or holds through UI window
    } else {
      var burnThrough = c / drain1;
      if (burnThrough <= uiMonths) return burnThrough;
      c -= drain1 * uiMonths;
      m = uiMonths;
    }
    // phase 2: after UI
    return m + c / monthlyBurn;
  }

  // Max monthly burn that survives `months` with the given cash + UI income.
  function survivableBurn(cash, monthlyBurn, uiWeekly, uiWeeks, months) {
    var uiMonthly = uiWeekly * WEEKS_PER_MONTH;
    var uiMonths = Math.min(uiWeeks / WEEKS_PER_MONTH, months);
    var income = uiMonthly * uiMonths;
    var maxBurn = (cash + income) / months;
    return Math.max(0, maxBurn);
  }

  function analyze(o) {
    if (!o || typeof o !== 'object') throw new Error('options required');
    var savings = money(o.savings === undefined ? 8000 : o.savings, 'savings');
    var weeklyPay = money(o.weeklyPay === undefined ? 1200 : o.weeklyPay, 'weeklyPay', 100000);
    var severanceWeeks = num(o.severanceWeeks === undefined ? 4 : o.severanceWeeks, 'severanceWeeks');
    if (severanceWeeks < 0 || severanceWeeks > 104) throw new Error('severanceWeeks must be in [0, 104]');
    var uiWeekly = money(o.uiWeekly === undefined ? 450 : o.uiWeekly, 'uiWeekly', 5000);
    var uiWeeks = num(o.uiWeeks === undefined ? 26 : o.uiWeeks, 'uiWeeks');
    if (uiWeeks < 0 || uiWeeks > 99) throw new Error('uiWeeks must be in [0, 99]');
    var essentials = money(o.essentials === undefined ? 2400 : o.essentials, 'essentials', 1000000);
    var extras = money(o.extras === undefined ? 900 : o.extras, 'extras', 1000000);
    var monthsToLand = num(o.monthsToLand === undefined ? 5 : o.monthsToLand, 'monthsToLand');
    if (monthsToLand < 1 || monthsToLand > 36) throw new Error('monthsToLand must be in [1, 36]');

    var severance = weeklyPay * severanceWeeks;
    var cash = savings + severance;
    var burnFull = essentials + extras;
    var burnLean = essentials;

    var runwayFull = runwayMonths(cash, burnFull, uiWeekly, uiWeeks);
    var runwayLean = runwayMonths(cash, burnLean, uiWeekly, uiWeeks);

    var survivesFull = runwayFull >= monthsToLand;
    var survivesLean = runwayLean >= monthsToLand;
    var maxBurnFull = survivableBurn(cash, burnFull, uiWeekly, uiWeeks, monthsToLand);
    var requiredCut = Math.max(0, burnFull - maxBurnFull);
    // If even essentials don't survive, how short is the lean plan?
    var leanGap = survivesLean ? 0 : round2((burnLean - survivableBurn(cash, burnLean, uiWeekly, uiWeeks, monthsToLand)) * monthsToLand);

    return {
      severance: round2(severance),
      cashAtDay0: round2(cash),
      burnFull: round2(burnFull),
      burnLean: round2(burnLean),
      uiMonthly: round2(uiWeekly * WEEKS_PER_MONTH),
      uiMonths: round2(uiWeeks / WEEKS_PER_MONTH),
      runwayFull: runwayFull === Infinity ? null : round2(runwayFull),
      runwayLean: runwayLean === Infinity ? null : round2(runwayLean),
      monthsToLand: monthsToLand,
      survivesFull: survivesFull,
      survivesLean: survivesLean,
      requiredMonthlyCut: round2(requiredCut),
      leanGap: leanGap
    };
  }

  var api = { analyze: analyze, runwayMonths: runwayMonths, survivableBurn: survivableBurn, WEEKS_PER_MONTH: WEEKS_PER_MONTH };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.LayoffMathEngine = api;
})(typeof self !== 'undefined' ? self : this);
