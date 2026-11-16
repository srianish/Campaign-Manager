// Main screen: tree on the left, editor on the right, bulk bar on top.
// All state changes go through the reducer; all rules live in logic/validation.js.

import { useCallback, useEffect, useReducer, useState } from 'react';
import { reducer } from './logic/reducer.js';
import { loadCampaigns, saveCampaigns } from './logic/storage.js';
import { createSampleData } from './data/sampleData.js';
import {
  allIds,
  childrenOf,
  cloneWithNewIds,
  createAd,
  createAdSet,
  createCampaign,
  findItem,
} from './logic/helpers.js';
import { LEVEL_LABEL, collectIssues, planStatusChange } from './logic/validation.js';
import Tree from './components/Tree.jsx';
import BulkBar from './components/BulkBar.jsx';
import CampaignForm from './components/CampaignForm.jsx';
import AdSetForm from './components/AdSetForm.jsx';
import AdForm from './components/AdForm.jsx';
import IssuePanel from './components/IssuePanel.jsx';
import ReadinessBadge from './components/ReadinessBadge.jsx';
import ConfirmModal from './components/ConfirmModal.jsx';
import CampaignHome from './components/CampaignHome.jsx';

let toastCounter = 0;

export default function App() {
  const [loaded] = useState(loadCampaigns);
  const [campaigns, dispatch] = useReducer(reducer, loaded.campaigns, (saved) => saved ?? createSampleData());
  const [toasts, setToasts] = useState(() =>
    loaded.warning ? [{ id: ++toastCounter, kind: 'error', text: loaded.warning }] : []
  );
  const [storageOk, setStorageOk] = useState(true);
  const [activeId, setActiveId] = useState(() => campaigns[0]?.id ?? null);
  const [isEditing, setIsEditing] = useState(false);
  const [focusedCampaignId, setFocusedCampaignId] = useState(null);
  const [treePinned, setTreePinned] = useState(false);
  const [treeHovered, setTreeHovered] = useState(false);
  const [expanded, setExpanded] = useState(() => new Set(allIds(campaigns)));
  const [selection, setSelection] = useState({ level: null, ids: [] });
  const [confirm, setConfirm] = useState(null);

  const toast = useCallback((text, kind = 'info') => {
    const id = ++toastCounter;
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);

  // Save after every change. If the browser refuses (storage full), tell the user.
  useEffect(() => {
    setStorageOk(saveCampaigns(campaigns));
  }, [campaigns]);

  // Drop selected ids that no longer exist (e.g. after a delete).
  useEffect(() => {
    setSelection((s) => {
      const ids = s.ids.filter((id) => findItem(campaigns, id));
      if (ids.length === s.ids.length) return s;
      return { level: ids.length ? s.level : null, ids };
    });
  }, [campaigns]);

  const expand = (...ids) => setExpanded((prev) => new Set([...prev, ...ids]));
  const toggleExpand = (id) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // ---- actions -------------------------------------------------------------

  const addCampaign = () => {
    const item = createCampaign();
    dispatch({ type: 'ADD_CAMPAIGN', item });
    setActiveId(item.id);
    setFocusedCampaignId(item.id);
    setIsEditing(true);
  };

  const addChild = (parent) => {
    if (parent.type === 'campaign') {
      const item = createAdSet();
      dispatch({ type: 'ADD_ADSET', parentId: parent.id, item });
      expand(parent.id);
      setActiveId(item.id);
      setFocusedCampaignId(parent.id);
    } else {
      const item = createAd();
      dispatch({ type: 'ADD_AD', parentId: parent.id, item });
      const campaignId = findItem(campaigns, parent.id).campaign.id;
      expand(parent.id, campaignId);
      setActiveId(item.id);
      setFocusedCampaignId(campaignId);
    }
    setIsEditing(true);
  };

  const update = (id, changes) => dispatch({ type: 'UPDATE', id, changes });

  const duplicate = (id) => {
    const found = findItem(campaigns, id);
    if (!found) return;
    const copy = cloneWithNewIds(found.item);
    dispatch({ type: 'DUPLICATE', id, copy });
    expand(found.campaign.id, ...(found.adSet ? [found.adSet.id] : []), copy.id);
    setActiveId(copy.id);
    setFocusedCampaignId(found.campaign.id);
    setIsEditing(true);
    toast(`Duplicated “${found.item.name}” with all settings.`, 'success');
  };

  const remove = (item) =>
    setConfirm({
      title: `Delete ${LEVEL_LABEL[item.type].toLowerCase()}?`,
      message: `“${item.name || '(unnamed)'}” ${childrenOf(item).length ? 'and everything inside it ' : ''}will be permanently deleted.`,
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: () => {
        dispatch({ type: 'DELETE', id: item.id });
        toast('Deleted.', 'info');
      },
    });

  const runStatus = (ids, status) => {
    const plan = planStatusChange(campaigns, ids, status);
    if (plan.applicable.length) {
      dispatch({ type: 'BULK_STATUS', ids: plan.applicable, status });
      toast(`${plan.applicable.length} item(s) set to ${status}.`, 'success');
    }
    if (plan.skipped.length) {
      const first = plan.skipped[0];
      toast(
        `${plan.skipped.length} item(s) not activated: “${first.name}” still has ${first.count} issue(s). Fix them first.`,
        'error'
      );
    }
  };

  const changeStatus = (ids, status) => {
    if (status === 'Archived') {
      setConfirm({
        title: 'Archive selected items?',
        message: `Archive ${ids.length} item(s) and everything inside them? Archived items are left out of launch checks.`,
        confirmLabel: 'Archive',
        danger: true,
        onConfirm: () => runStatus(ids, status),
      });
    } else {
      runStatus(ids, status);
    }
  };

  const select = (item) =>
    setSelection((s) => {
      if (s.level !== item.type) return { level: item.type, ids: [item.id] }; // one level at a time
      const ids = s.ids.includes(item.id) ? s.ids.filter((x) => x !== item.id) : [...s.ids, item.id];
      return { level: ids.length ? item.type : null, ids };
    });

  const bulkApply = (key, value) => {
    dispatch({ type: 'BULK_UPDATE', ids: selection.ids, key, value });
    toast(`Updated ${selection.ids.length} item(s).`, 'success');
  };

  const launch = (campaign) => {
    const issues = collectIssues(campaign);
    if (issues.length) return toast(`Cannot launch: ${issues.length} issue(s) to fix.`, 'error');
    dispatch({ type: 'LAUNCH', id: campaign.id, at: new Date().toISOString() });
    toast('Campaign launched (simulated: nothing was sent to Meta).', 'success');
  };

  const resetSample = () =>
    setConfirm({
      title: 'Reset sample data?',
      message: 'This replaces everything with the original sample campaigns.',
      confirmLabel: 'Reset',
      danger: true,
      onConfirm: () => {
        const fresh = createSampleData();
        dispatch({ type: 'RESET', campaigns: fresh });
        setActiveId(fresh[0].id);
        setFocusedCampaignId(null);
        setIsEditing(false);
        setExpanded(new Set(allIds(fresh)));
        setSelection({ level: null, ids: [] });
      },
    });

  // ---- derived values for rendering ---------------------------------------

  const found = activeId ? findItem(campaigns, activeId) : null;
  const item = found?.item;
  const issues = found ? collectIssues(item, { budgetType: found.campaign.budgetType }) : [];
  const goTo = (id) => {
    const target = findItem(campaigns, id);
    if (target) expand(target.campaign.id, ...(target.adSet ? [target.adSet.id] : []));
    setActiveId(id);
  };
  const openCampaign = (id) => {
    setActiveId(id);
    setFocusedCampaignId(id);
    setExpanded((previous) => new Set([...previous, id]));
    setIsEditing(true);
  };
  const visibleCampaigns = focusedCampaignId
    ? campaigns.filter((campaign) => campaign.id === focusedCampaignId)
    : campaigns;
  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-title">
          <h1>Campaign Manager</h1>
          <p>Plan and manage your campaigns with ease.</p>
        </div>
        {!isEditing && (
          <div className="topbar-actions">
            <button className="btn" onClick={resetSample}>
              Reset sample data
            </button>
            <button className="btn primary" onClick={addCampaign}>
              + New campaign
            </button>
          </div>
        )}
      </header>

      {!storageOk && (
        <div className="banner" role="alert">
          ⚠ Your browser could not save changes (storage may be full or blocked). Your work will be lost on refresh.
        </div>
      )}

      {isEditing && selection.ids.length > 0 && (
        <BulkBar
          key={selection.level}
          selection={selection}
          onApply={bulkApply}
          onStatus={(status) => changeStatus(selection.ids, status)}
          onClear={() => setSelection({ level: null, ids: [] })}
          onToast={toast}
        />
      )}

      {!isEditing ? (
        <CampaignHome campaigns={campaigns} onOpen={openCampaign} />
      ) : (
      <>
      <div className="edit-toolbar">
        <button className="btn" onClick={() => setIsEditing(false)}>Back to campaigns</button>
      </div>
      <div className={`layout${treePinned ? ' nav-pinned' : ''}${treeHovered ? ' nav-hovered' : ''}`}>
        <aside
          className="tree-sidebar"
          onMouseEnter={() => setTreeHovered(true)}
          onMouseLeave={() => setTreeHovered(false)}
          onFocus={() => setTreeHovered(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setTreeHovered(false);
          }}
        >
          <div className="tree-sidebar-rail">
            <button
              className="tree-sidebar-toggle"
              type="button"
              aria-label={treePinned ? 'Collapse campaign navigator' : 'Pin campaign navigator open'}
              aria-pressed={treePinned}
              title={treePinned ? 'Collapse campaign navigator' : 'Pin campaign navigator open'}
              onClick={() => setTreePinned((pinned) => !pinned)}
            >
              <span className="tree-sidebar-chevron" aria-hidden="true">{treePinned ? '‹' : '›'}</span>
            </button>
            <span className="tree-sidebar-caption">Move here for campaigns</span>
          </div>
          <div className="panel tree-panel">
            <Tree
              campaigns={visibleCampaigns}
              activeId={activeId}
              selection={selection}
              expanded={expanded}
              onToggle={toggleExpand}
              onActivate={setActiveId}
              onSelect={select}
              onAddChild={addChild}
              onDuplicate={duplicate}
              onDelete={remove}
            />
          </div>
        </aside>

        <main className="panel editor-panel">
          {!found ? (
            <div className="empty">Select a campaign, ad set or ad in the tree to edit it.</div>
          ) : (
            <>
              <nav className="crumbs" aria-label="Breadcrumb">
                <button className="link-btn" onClick={() => setActiveId(found.campaign.id)}>
                  {found.campaign.name || '(unnamed)'}
                </button>
                {found.adSet && (
                  <>
                    <span>›</span>
                    <button className="link-btn" onClick={() => setActiveId(found.adSet.id)}>
                      {found.adSet.name || '(unnamed)'}
                    </button>
                  </>
                )}
                {item.type === 'ad' && (
                  <>
                    <span>›</span>
                    <span>{item.name || '(unnamed)'}</span>
                  </>
                )}
              </nav>

              <div className="editor-head">
                <h2>
                  {LEVEL_LABEL[item.type]} settings <ReadinessBadge count={issues.length} archived={item.status === 'Archived'} />
                </h2>
              </div>
              {item.launchedAt && item.type === 'campaign' && (
                <p className="muted">Last launched {new Date(item.launchedAt).toLocaleString()} (simulated).</p>
              )}

              <IssuePanel issues={issues} onGoTo={goTo} />

              {item.type === 'campaign' && (
                <CampaignForm item={item} onChange={(c) => update(item.id, c)} onStatus={(s) => changeStatus([item.id], s)} />
              )}
              {item.type === 'adset' && (
                <AdSetForm
                  item={item}
                  campaign={found.campaign}
                  onChange={(c) => update(item.id, c)}
                  onStatus={(s) => changeStatus([item.id], s)}
                />
              )}
              {item.type === 'ad' && (
                <AdForm
                  item={item}
                  onChange={(c) => update(item.id, c)}
                  onStatus={(s) => changeStatus([item.id], s)}
                  onToast={toast}
                />
              )}
              {item.type === 'campaign' && (
                <div className="campaign-editor-footer">
                  <button
                    className="btn primary"
                    disabled={issues.length > 0}
                    title={issues.length ? `Fix ${issues.length} issue(s) first` : 'Launch this campaign'}
                    onClick={() => launch(item)}
                  >
                    {item.launchedAt ? 'Launch again' : 'Launch campaign'}
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
      </>
      )}

      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`}>
            {t.text}
            <button aria-label="Dismiss" onClick={() => setToasts((all) => all.filter((x) => x.id !== t.id))}>
              ×
            </button>
          </div>
        ))}
      </div>

      {confirm && <ConfirmModal {...confirm} onCancel={() => setConfirm(null)} />}
    </div>
  );
}
