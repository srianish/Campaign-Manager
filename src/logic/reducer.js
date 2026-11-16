// One reducer owns every change to the campaign tree.
// State is simply the array of campaigns.

import { applyBulkField, applyStatus, mapItems } from './helpers.js';

function removeById(campaigns, id) {
  return campaigns
    .filter((c) => c.id !== id)
    .map((c) => ({
      ...c,
      adSets: c.adSets
        .filter((a) => a.id !== id)
        .map((a) => ({ ...a, ads: a.ads.filter((ad) => ad.id !== id) })),
    }));
}

// Insert `copy` right after the item with `id`, in whichever list it lives in.
function insertAfter(campaigns, id, copy) {
  const put = (list) => {
    const i = list.findIndex((x) => x.id === id);
    if (i < 0) return null;
    const next = [...list];
    next.splice(i + 1, 0, copy);
    return next;
  };
  const top = put(campaigns);
  if (top) return top;
  return campaigns.map((c) => {
    const sets = put(c.adSets);
    if (sets) return { ...c, adSets: sets };
    return {
      ...c,
      adSets: c.adSets.map((a) => {
        const ads = put(a.ads);
        return ads ? { ...a, ads } : a;
      }),
    };
  });
}

export function reducer(state, action) {
  switch (action.type) {
    case 'ADD_CAMPAIGN':
      return [...state, action.item];

    case 'ADD_ADSET':
      return state.map((c) =>
        c.id === action.parentId ? { ...c, adSets: [...c.adSets, action.item] } : c
      );

    case 'ADD_AD':
      return state.map((c) => ({
        ...c,
        adSets: c.adSets.map((a) =>
          a.id === action.parentId ? { ...a, ads: [...a.ads, action.item] } : a
        ),
      }));

    case 'UPDATE':
      return mapItems(state, (it) => (it.id === action.id ? { ...it, ...action.changes } : it));

    case 'DELETE':
      return removeById(state, action.id);

    case 'DUPLICATE':
      return insertAfter(state, action.id, action.copy);

    case 'BULK_UPDATE': {
      const ids = new Set(action.ids);
      return mapItems(state, (it) => (ids.has(it.id) ? applyBulkField(it, action.key, action.value) : it));
    }

    case 'BULK_STATUS':
      return applyStatus(state, action.ids, action.status);

    case 'LAUNCH': {
      const launched = applyStatus(state, [action.id], 'Active');
      return mapItems(launched, (it) => (it.id === action.id ? { ...it, launchedAt: action.at } : it));
    }

    case 'RESET':
      return action.campaigns;

    default:
      return state;
  }
}
