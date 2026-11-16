// Validation rules. Every function is pure: give it an item, get back a list of
// problems. The UI calls these on every render, which is what makes the
// feedback "real time" (no waiting for a launch attempt like in a spreadsheet).

import { LIMITS } from '../data/constants.js';
import { findItem } from './helpers.js';

export const LEVEL_LABEL = { campaign: 'Campaign', adset: 'Ad set', ad: 'Ad' };

const blank = (v) => v === undefined || v === null || String(v).trim() === '';
const problem = (field, message) => ({ field, message });

export function isValidHttpUrl(value) {
  try {
    const url = new URL(String(value).trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateAd(ad) {
  const e = [];
  if (blank(ad.name)) e.push(problem('name', 'ad name is missing'));
  if (blank(ad.headline)) e.push(problem('headline', 'headline is missing'));
  else if (ad.headline.length > LIMITS.headline)
    e.push(problem('headline', `headline is longer than ${LIMITS.headline} characters`));
  if (blank(ad.primaryText)) e.push(problem('primaryText', 'primary text is missing'));
  if (blank(ad.creative)) e.push(problem('creative', 'creative is not uploaded'));
  if (blank(ad.cta)) e.push(problem('cta', 'call to action is not selected'));
  if (blank(ad.landingUrl)) e.push(problem('landingUrl', 'landing page URL is missing'));
  else if (!isValidHttpUrl(ad.landingUrl))
    e.push(problem('landingUrl', 'landing page URL is not a valid http(s) link'));
  if (!blank(ad.description) && ad.description.length > LIMITS.description)
    e.push(problem('description', `description is longer than ${LIMITS.description} characters`));
  return e;
}

/** ctx.budgetType comes from the parent campaign (lifetime budgets need an end date). */
export function validateAdSet(adSet, ctx = {}) {
  const e = [];
  const t = adSet.targeting || {};
  const s = adSet.schedule || {};

  if (blank(adSet.name)) e.push(problem('name', 'ad set name is missing'));

  const budget = Number(adSet.budget);
  if (blank(adSet.budget) || Number.isNaN(budget)) e.push(problem('budget', 'budget is missing'));
  else if (budget <= 0) e.push(problem('budget', 'budget must be greater than zero'));

  if (blank(s.start)) e.push(problem('startDate', 'start date is missing'));
  if (!blank(s.start) && !blank(s.end) && s.end < s.start)
    e.push(problem('endDate', 'end date is before the start date'));
  if (ctx.budgetType === 'Lifetime' && blank(s.end))
    e.push(problem('endDate', 'end date is required for a lifetime budget'));

  const min = Number(t.ageMin);
  const max = Number(t.ageMax);
  if (blank(t.ageMin) || blank(t.ageMax) || Number.isNaN(min) || Number.isNaN(max))
    e.push(problem('age', 'age range is incomplete'));
  else if (min < LIMITS.minAge || max > LIMITS.maxAge)
    e.push(problem('age', `age range must be between ${LIMITS.minAge} and ${LIMITS.maxAge}`));
  else if (min > max) e.push(problem('age', 'minimum age is higher than the maximum age'));

  if (!t.locations || t.locations.length === 0) e.push(problem('locations', 'no location selected'));

  if (adSet.ads.filter((a) => a.status !== 'Archived').length === 0)
    e.push(problem('ads', 'it has no ads'));
  return e;
}

export function validateCampaign(campaign) {
  const e = [];
  if (blank(campaign.name)) e.push(problem('name', 'campaign name is missing'));
  if (blank(campaign.objective)) e.push(problem('objective', 'objective is not selected'));
  if (blank(campaign.budgetType)) e.push(problem('budgetType', 'budget type is not selected'));
  if (campaign.adSets.filter((a) => a.status !== 'Archived').length === 0)
    e.push(problem('adSets', 'it has no ad sets'));
  return e;
}

/** Problems with this one item only (not its children). */
export function validateItem(item, ctx = {}) {
  if (item.type === 'campaign') return validateCampaign(item);
  if (item.type === 'adset') return validateAdSet(item, ctx);
  return validateAd(item);
}

/** { fieldName: firstMessage } so a form can show one error under each input. */
export function fieldErrors(item, ctx = {}) {
  const map = {};
  validateItem(item, ctx).forEach((p) => {
    if (!map[p.field]) map[p.field] = p.message;
  });
  return map;
}

/** "Ad cannot be launched: headline is missing, creative is not uploaded." */
export function sentence(type, messages, name) {
  const who = name ? `${LEVEL_LABEL[type]} “${name}”` : LEVEL_LABEL[type];
  return `${who} cannot be launched: ${messages.join(', ')}.`;
}

/**
 * Every problem in an item and everything below it, as a flat list.
 * Archived items are skipped: they are not part of a launch.
 */
export function collectIssues(item, ctx = {}) {
  if (item.status === 'Archived') return [];
  const own = validateItem(item, ctx).map((p) => ({
    ...p,
    id: item.id,
    type: item.type,
    name: item.name || '(unnamed)',
  }));
  if (item.type === 'campaign') {
    const childCtx = { budgetType: item.budgetType };
    return own.concat(...item.adSets.map((a) => collectIssues(a, childCtx)));
  }
  if (item.type === 'adset') return own.concat(...item.ads.map((a) => collectIssues(a, ctx)));
  return own;
}

/** Summary for the "readiness" indicator. */
export function getReadiness(campaign) {
  const issues = collectIssues(campaign);
  return { ready: issues.length === 0, issueCount: issues.length, issues };
}

/**
 * Decide which ids can really get a new status. Activating something that
 * still has issues is blocked (like Meta, you cannot publish an incomplete ad).
 */
export function planStatusChange(campaigns, ids, status) {
  const applicable = [];
  const skipped = [];
  ids.forEach((id) => {
    const found = findItem(campaigns, id);
    if (!found) return;
    if (status === 'Active') {
      const issues = collectIssues(found.item, { budgetType: found.campaign.budgetType });
      if (issues.length > 0) {
        skipped.push({ id, name: found.item.name || '(unnamed)', count: issues.length });
        return;
      }
    }
    applicable.push(id);
  });
  return { applicable, skipped };
}

/** Check a value typed into the bulk-edit bar before applying it to many items. */
export function validateBulkValue(key, value) {
  if (blank(value)) return 'Enter a value first.';
  if (key === 'budget' && !(Number(value) > 0)) return 'Budget must be greater than zero.';
  if (key === 'landingUrl' && !isValidHttpUrl(value)) return 'Enter a valid http(s) URL.';
  if (key === 'headline' && String(value).length > LIMITS.headline)
    return `Headline must be ${LIMITS.headline} characters or fewer.`;
  return '';
}
