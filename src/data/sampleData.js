// Sample data loaded on first run (and by "Reset sample data").
// Campaign 1 is complete and shows "Ready".
// Campaign 2 is deliberately incomplete so the validation errors are visible straight away.

import { createAd, createAdSet, createCampaign } from '../logic/helpers.js';

// Tiny generated image so the sample ads have a real creative without any files.
function svgCreative(label, from, to) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>` +
    `<rect width="600" height="600" fill="url(#g)"/>` +
    `<text x="300" y="320" font-family="Arial" font-size="48" font-weight="700" fill="#fff" text-anchor="middle">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function createSampleData() {
  const schedule = { start: '2026-11-20', end: '2026-12-05' };
  const complete = (name, headline, text, label, from, to, extra = {}) =>
    createAd({
      name,
      headline,
      primaryText: text,
      creative: svgCreative(label, from, to),
      creativeName: `${label}.svg`,
      cta: 'Shop Now',
      landingUrl: 'https://example.com/diwali-sale',
      ...extra,
    });

  const diwali = createCampaign({
    name: 'Diwali Sale – Sales',
    objective: 'Sales',
    budgetType: 'Daily',
    adSets: [
      createAdSet({
        name: 'Metro Shoppers 25-40',
        budget: 1500,
        schedule,
        targeting: { ageMin: 25, ageMax: 40, gender: 'All', locations: ['India'], interests: 'Shopping, Fashion' },
        ads: [
          complete('Festive Hero', 'Up to 50% Off', 'Light up your Diwali with our biggest sale of the year.', 'Diwali Sale', '#f59e0b', '#dc2626'),
          complete('Free Shipping', 'Free Shipping Today', 'Order before midnight and get free delivery across India.', 'Free Shipping', '#2563eb', '#7c3aed'),
          complete('Gift Sets', 'Gift Sets from ₹499', 'Find the perfect gift for family and friends.', 'Gift Sets', '#059669', '#0ea5e9', { cta: 'Get Offer' }),
        ],
      }),
      createAdSet({
        name: 'Retargeting – Cart Abandoners',
        budget: 800,
        schedule,
        targeting: { ageMin: 21, ageMax: 55, gender: 'All', locations: ['India'], interests: '' },
        ads: [complete('Cart Reminder', 'Still Thinking It Over?', 'Your cart is waiting. Complete your order and save 10%.', 'Cart Reminder', '#be185d', '#9333ea')],
      }),
    ],
  });

  const winter = createCampaign({
    name: 'Winter Collection – Traffic',
    objective: 'Traffic',
    budgetType: 'Lifetime',
    adSets: [
      createAdSet({
        name: 'Cold Audience',
        budget: 0,
        schedule: { start: '', end: '' },
        targeting: { ageMin: 40, ageMax: 25, gender: 'Women', locations: [], interests: 'Winter wear' },
        ads: [
          createAd({
            name: 'Winter Hero Banner',
            headline: '',
            primaryText: 'Layer up with our new winter range.',
            creative: '',
            cta: 'Learn More',
            landingUrl: 'winter-sale',
          }),
        ],
      }),
      createAdSet({
        name: 'Lookalike 1%',
        budget: 1000,
        schedule: { start: '2026-11-25', end: '' },
        targeting: { ageMin: 22, ageMax: 45, gender: 'All', locations: ['India'], interests: '' },
        ads: [],
      }),
    ],
  });

  return [diwali, winter];
}
