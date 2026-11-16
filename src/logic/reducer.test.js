import { describe, expect, it } from 'vitest';
import { createSampleData } from '../data/sampleData.js';
import { allIds, applyBulkField, cloneWithNewIds, createAd, createAdSet, findItem } from './helpers.js';
import { reducer } from './reducer.js';

const fresh = () => createSampleData();

describe('cloneWithNewIds', () => {
  it('copies every setting, renames, and gives every node a new id', () => {
    const [campaign] = fresh();
    const copy = cloneWithNewIds(campaign);
    expect(copy.name).toBe(`${campaign.name} (Copy)`);
    expect(copy.objective).toBe(campaign.objective);
    expect(copy.adSets[0].ads[0].headline).toBe(campaign.adSets[0].ads[0].headline);
    const before = new Set(allIds([campaign]));
    allIds([copy]).forEach((id) => expect(before.has(id)).toBe(false));
  });
});

describe('reducer', () => {
  it('DUPLICATE inserts the copy right after the original (ad set level)', () => {
    const state = fresh();
    const original = state[0].adSets[0];
    const copy = cloneWithNewIds(original);
    const next = reducer(state, { type: 'DUPLICATE', id: original.id, copy });
    expect(next[0].adSets).toHaveLength(3);
    expect(next[0].adSets[1].id).toBe(copy.id);
    expect(state[0].adSets).toHaveLength(2); // original state untouched
  });

  it('DUPLICATE works for ads and campaigns too', () => {
    const state = fresh();
    const ad = state[0].adSets[0].ads[0];
    const withAd = reducer(state, { type: 'DUPLICATE', id: ad.id, copy: cloneWithNewIds(ad) });
    expect(withAd[0].adSets[0].ads).toHaveLength(4);
    const withCampaign = reducer(state, { type: 'DUPLICATE', id: state[0].id, copy: cloneWithNewIds(state[0]) });
    expect(withCampaign).toHaveLength(3);
    expect(withCampaign[1].name).toMatch(/\(Copy\)$/);
  });

  it('BULK_UPDATE only changes the selected items', () => {
    const state = fresh();
    const [a, b] = state[0].adSets;
    const next = reducer(state, { type: 'BULK_UPDATE', ids: [a.id], key: 'budget', value: '2500' });
    expect(findItem(next, a.id).item.budget).toBe(2500);
    expect(findItem(next, b.id).item.budget).toBe(b.budget);
  });

  it('BULK_UPDATE can change a CTA on several ads at once', () => {
    const state = fresh();
    const ids = state[0].adSets[0].ads.map((x) => x.id);
    const next = reducer(state, { type: 'BULK_UPDATE', ids, key: 'cta', value: 'Learn More' });
    ids.forEach((id) => expect(findItem(next, id).item.cta).toBe('Learn More'));
  });

  it('BULK_STATUS cascades to children but leaves archived children alone', () => {
    const state = fresh();
    const adSet = state[0].adSets[0];
    const archivedAdId = adSet.ads[2].id;
    const archived = reducer(state, { type: 'BULK_STATUS', ids: [archivedAdId], status: 'Archived' });
    const paused = reducer(archived, { type: 'BULK_STATUS', ids: [adSet.id], status: 'Paused' });
    const result = findItem(paused, adSet.id).item;
    expect(result.status).toBe('Paused');
    expect(result.ads[0].status).toBe('Paused');
    expect(result.ads[2].status).toBe('Archived');
  });

  it('DELETE removes nested items', () => {
    const state = fresh();
    const ad = state[0].adSets[0].ads[0];
    const next = reducer(state, { type: 'DELETE', id: ad.id });
    expect(findItem(next, ad.id)).toBeNull();
    expect(next[0].adSets[0].ads).toHaveLength(2);
  });

  it('ADD_ADSET and ADD_AD attach to the right parent', () => {
    const state = fresh();
    const adSet = createAdSet();
    const ad = createAd();
    let next = reducer(state, { type: 'ADD_ADSET', parentId: state[1].id, item: adSet });
    next = reducer(next, { type: 'ADD_AD', parentId: adSet.id, item: ad });
    expect(findItem(next, adSet.id).campaign.id).toBe(state[1].id);
    expect(findItem(next, ad.id).adSet.id).toBe(adSet.id);
  });

  it('LAUNCH activates the campaign and stamps the time', () => {
    const state = fresh();
    const next = reducer(state, { type: 'LAUNCH', id: state[0].id, at: '2026-11-16T10:00:00Z' });
    expect(next[0].status).toBe('Active');
    expect(next[0].launchedAt).toBe('2026-11-16T10:00:00Z');
    expect(next[0].adSets[0].ads[0].status).toBe('Active');
  });

  it('ignores unknown actions', () => {
    const state = fresh();
    expect(reducer(state, { type: 'NOPE' })).toBe(state);
  });
});

describe('applyBulkField', () => {
  it('writes nested targeting and schedule fields', () => {
    const adSet = createAdSet();
    expect(applyBulkField(adSet, 'gender', 'Women').targeting.gender).toBe('Women');
    expect(applyBulkField(adSet, 'endDate', '2026-12-31').schedule.end).toBe('2026-12-31');
  });
});
