// Pure helpers for creating, finding, cloning and updating items in the
// Campaign -> Ad set -> Ad tree. No React in here, so everything is easy to test.

let counter = 0;

/** Unique id, e.g. "adset_lq3k1x0a". */
export const uid = (prefix) =>
  `${prefix}_${Date.now().toString(36)}${(counter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const createAd = (overrides = {}) => ({
  id: uid('ad'),
  type: 'ad',
  name: 'New ad',
  creative: '', // image URL or data URL
  creativeName: '',
  primaryText: '',
  headline: '',
  description: '',
  cta: 'Shop Now',
  landingUrl: '',
  status: 'Draft',
  ...overrides,
});

export const createAdSet = (overrides = {}) => ({
  id: uid('adset'),
  type: 'adset',
  name: 'New ad set',
  budget: 500,
  schedule: { start: '', end: '' },
  targeting: { ageMin: 18, ageMax: 45, gender: 'All', locations: ['India'], interests: '' },
  status: 'Draft',
  ads: [],
  ...overrides,
});

export const createCampaign = (overrides = {}) => ({
  id: uid('campaign'),
  type: 'campaign',
  name: 'New campaign',
  objective: 'Traffic',
  budgetType: 'Daily',
  status: 'Draft',
  adSets: [],
  ...overrides,
});

/** Children of any node (campaign -> adSets, adset -> ads, ad -> none). */
export const childrenOf = (item) =>
  item.type === 'campaign' ? item.adSets : item.type === 'adset' ? item.ads : [];

/** Every id in the tree (used to expand everything). */
export function allIds(campaigns) {
  const ids = [];
  campaigns.forEach((c) => {
    ids.push(c.id);
    c.adSets.forEach((a) => {
      ids.push(a.id);
      a.ads.forEach((ad) => ids.push(ad.id));
    });
  });
  return ids;
}

/** Find an item and its ancestors. Returns null when the id does not exist. */
export function findItem(campaigns, id) {
  for (const campaign of campaigns) {
    if (campaign.id === id) return { item: campaign, campaign, adSet: null };
    for (const adSet of campaign.adSets) {
      if (adSet.id === id) return { item: adSet, campaign, adSet };
      for (const ad of adSet.ads) {
        if (ad.id === id) return { item: ad, campaign, adSet };
      }
    }
  }
  return null;
}

/** Apply fn to every node (parents first). fn must return a node with the same children. */
export function mapItems(campaigns, fn) {
  return campaigns.map((c) => {
    const nc = fn(c);
    return {
      ...nc,
      adSets: nc.adSets.map((a) => {
        const na = fn(a);
        return { ...na, ads: na.ads.map((ad) => fn(ad)) };
      }),
    };
  });
}

/**
 * Deep-copy an item for the "Duplicate" button: every setting is carried over,
 * every node (including children) gets a brand new id, and the top-level
 * name gets " (Copy)" appended.
 */
export function cloneWithNewIds(item) {
  const copy = structuredClone(item);
  const reId = (node) => {
    node.id = uid(node.type);
    if (node.type === 'campaign') node.adSets.forEach(reId);
    if (node.type === 'adset') node.ads.forEach(reId);
  };
  reId(copy);
  delete copy.launchedAt;
  copy.name = `${item.name} (Copy)`;
  return copy;
}

// Sets a status on an item and all its descendants. Archived children stay
// archived unless the new status is Archived (archive wins, unarchive is explicit).
function cascade(item, status, isRoot = true) {
  if (!isRoot && item.status === 'Archived' && status !== 'Archived') return item;
  const next = { ...item, status };
  if (item.type === 'campaign') next.adSets = item.adSets.map((a) => cascade(a, status, false));
  if (item.type === 'adset') next.ads = item.ads.map((a) => cascade(a, status, false));
  return next;
}

/** Bulk status change (pause / activate / archive) with cascading to children. */
export function applyStatus(campaigns, ids, status) {
  const set = new Set(ids);
  const walk = (item) => {
    if (set.has(item.id)) return cascade(item, status);
    if (item.type === 'campaign') return { ...item, adSets: item.adSets.map(walk) };
    if (item.type === 'adset') return { ...item, ads: item.ads.map(walk) };
    return item;
  };
  return campaigns.map(walk);
}

/** Apply one bulk-edit field to a single item (some fields live in nested objects). */
export function applyBulkField(item, key, value) {
  switch (key) {
    case 'budget':
      return { ...item, budget: Number(value) };
    case 'gender':
      return { ...item, targeting: { ...item.targeting, gender: value } };
    case 'startDate':
      return { ...item, schedule: { ...item.schedule, start: value } };
    case 'endDate':
      return { ...item, schedule: { ...item.schedule, end: value } };
    case 'creative':
      return { ...item, creative: value, creativeName: 'Swapped creative' };
    default:
      return { ...item, [key]: value };
  }
}
