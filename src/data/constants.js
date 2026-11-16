// Dropdown values and field configuration.
// Names follow Meta Ads Manager terminology so the prototype feels familiar.

export const OBJECTIVES = ['Awareness', 'Traffic', 'Engagement', 'Leads', 'App promotion', 'Sales'];
export const BUDGET_TYPES = ['Daily', 'Lifetime'];
export const STATUSES = ['Draft', 'Active', 'Paused', 'Archived'];
export const CTAS = [
  'Shop Now',
  'Learn More',
  'Sign Up',
  'Book Now',
  'Contact Us',
  'Download',
  'Get Offer',
  'Apply Now',
];
export const GENDERS = ['All', 'Men', 'Women'];
export const LOCATIONS = ['India', 'United States', 'United Kingdom', 'UAE', 'Singapore'];

// Limits used by validation (character counts follow Meta's recommended lengths).
export const LIMITS = {
  headline: 40,
  primaryText: 125,
  description: 30,
  minAge: 13,
  maxAge: 65,
};

export const STORAGE_KEY = 'meta-campaign-ui:v1';

// Fields that can be changed on many selected items at once, per level.
export const BULK_FIELDS = {
  campaign: [
    { key: 'objective', label: 'Objective', type: 'select', options: OBJECTIVES },
    { key: 'budgetType', label: 'Budget type', type: 'select', options: BUDGET_TYPES },
  ],
  adset: [
    { key: 'budget', label: 'Budget (₹)', type: 'number' },
    { key: 'gender', label: 'Gender', type: 'select', options: GENDERS },
    { key: 'startDate', label: 'Start date', type: 'date' },
    { key: 'endDate', label: 'End date', type: 'date' },
  ],
  ad: [
    { key: 'cta', label: 'Call to action', type: 'select', options: CTAS },
    { key: 'headline', label: 'Headline', type: 'text' },
    { key: 'primaryText', label: 'Primary text', type: 'text' },
    { key: 'landingUrl', label: 'Landing page URL', type: 'url' },
    { key: 'creative', label: 'Creative (swap image)', type: 'image' },
  ],
};
