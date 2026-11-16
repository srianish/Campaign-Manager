import { describe, expect, it } from 'vitest';
import { createSampleData } from '../data/sampleData.js';
import { createAd, createAdSet, createCampaign } from './helpers.js';
import {
  collectIssues,
  getReadiness,
  isValidHttpUrl,
  planStatusChange,
  sentence,
  validateAd,
  validateAdSet,
  validateBulkValue,
} from './validation.js';

describe('validateAd', () => {
  it('reports every missing field on a blank ad', () => {
    const messages = validateAd(createAd({ name: '' })).map((p) => p.message);
    expect(messages).toContain('ad name is missing');
    expect(messages).toContain('headline is missing');
    expect(messages).toContain('primary text is missing');
    expect(messages).toContain('creative is not uploaded');
    expect(messages).toContain('landing page URL is missing');
  });

  it('rejects an invalid landing page URL and an over-long headline', () => {
    const ad = createAd({ headline: 'x'.repeat(41), landingUrl: 'not-a-url' });
    const messages = validateAd(ad).map((p) => p.message);
    expect(messages).toContain('headline is longer than 40 characters');
    expect(messages).toContain('landing page URL is not a valid http(s) link');
  });

  it('formats the sentence like the assignment example', () => {
    expect(sentence('ad', ['headline is missing', 'creative is not uploaded'])).toBe(
      'Ad cannot be launched: headline is missing, creative is not uploaded.'
    );
  });
});

describe('validateAdSet', () => {
  const ad = createAd();
  it('flags zero budget, missing start date and no ads', () => {
    const messages = validateAdSet(createAdSet({ budget: 0 })).map((p) => p.message);
    expect(messages).toContain('budget must be greater than zero');
    expect(messages).toContain('start date is missing');
    expect(messages).toContain('it has no ads');
  });

  it('flags end before start, bad ages and no locations', () => {
    const adSet = createAdSet({
      ads: [ad],
      schedule: { start: '2026-12-10', end: '2026-12-01' },
      targeting: { ageMin: 50, ageMax: 20, gender: 'All', locations: [], interests: '' },
    });
    const messages = validateAdSet(adSet).map((p) => p.message);
    expect(messages).toContain('end date is before the start date');
    expect(messages).toContain('minimum age is higher than the maximum age');
    expect(messages).toContain('no location selected');
  });

  it('requires an end date for lifetime budgets only', () => {
    const adSet = createAdSet({ ads: [ad], schedule: { start: '2026-12-01', end: '' } });
    expect(validateAdSet(adSet, { budgetType: 'Lifetime' }).map((p) => p.message)).toContain(
      'end date is required for a lifetime budget'
    );
    expect(validateAdSet(adSet, { budgetType: 'Daily' }).map((p) => p.message)).not.toContain(
      'end date is required for a lifetime budget'
    );
  });
});

describe('readiness on the sample data', () => {
  const [ready, broken] = createSampleData();
  it('first sample campaign is ready', () => {
    expect(getReadiness(ready).ready).toBe(true);
  });
  it('second sample campaign has issues at every level', () => {
    const issues = collectIssues(broken);
    expect(issues.length).toBeGreaterThan(5);
    expect(new Set(issues.map((i) => i.type))).toEqual(new Set(['adset', 'ad']));
  });
  it('ignores archived items', () => {
    expect(collectIssues({ ...broken, status: 'Archived' })).toEqual([]);
  });
});

describe('planStatusChange', () => {
  const campaigns = createSampleData();
  it('blocks activating an incomplete campaign but allows a complete one', () => {
    const plan = planStatusChange(campaigns, [campaigns[0].id, campaigns[1].id], 'Active');
    expect(plan.applicable).toEqual([campaigns[0].id]);
    expect(plan.skipped.map((s) => s.id)).toEqual([campaigns[1].id]);
  });
  it('always allows pausing', () => {
    expect(planStatusChange(campaigns, [campaigns[1].id], 'Paused').applicable).toEqual([campaigns[1].id]);
  });
});

describe('small helpers', () => {
  it('isValidHttpUrl', () => {
    expect(isValidHttpUrl('https://example.com/a')).toBe(true);
    expect(isValidHttpUrl('ftp://example.com')).toBe(false);
    expect(isValidHttpUrl('example.com')).toBe(false);
  });
  it('validateBulkValue', () => {
    expect(validateBulkValue('budget', '0')).toMatch(/greater than zero/);
    expect(validateBulkValue('budget', '500')).toBe('');
    expect(validateBulkValue('landingUrl', 'nope')).toMatch(/valid/);
    expect(validateBulkValue('headline', '')).toMatch(/Enter a value/);
  });
  it('createCampaign has an empty ad set list', () => {
    expect(createCampaign().adSets).toEqual([]);
  });
});
