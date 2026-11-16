import { collectIssues } from '../logic/validation.js';
import ReadinessBadge from './ReadinessBadge.jsx';

export default function CampaignHome({ campaigns, onOpen }) {
  if (campaigns.length === 0) {
    return <div className="empty panel">No campaigns yet. Click “+ New campaign” to start.</div>;
  }

  return (
    <section className="campaign-home" aria-label="Campaigns">
      {campaigns.map((campaign) => {
        const adSetCount = campaign.adSets.length;
        const adCount = campaign.adSets.reduce((total, adSet) => total + adSet.ads.length, 0);

        return (
          <button
            className="campaign-home-card"
            key={campaign.id}
            onClick={() => onOpen(campaign.id)}
            aria-label={`Open ${campaign.name || 'unnamed campaign'}`}
          >
            <div className="campaign-home-card-top">
              <span className="campaign-home-mark" aria-hidden="true">C</span>
              <ReadinessBadge
                count={collectIssues(campaign).length}
                archived={campaign.status === 'Archived'}
              />
            </div>
            <h2>{campaign.name || '(unnamed campaign)'}</h2>
            <p>{campaign.objective} campaign</p>
            <div className="campaign-home-card-footer">
              <span>{adSetCount} ad sets</span>
              <span>{adCount} ads</span>
              <span className="campaign-home-open">Open campaign <span aria-hidden="true">→</span></span>
            </div>
          </button>
        );
      })}
    </section>
  );
}
