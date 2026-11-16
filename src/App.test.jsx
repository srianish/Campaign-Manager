import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import App from './App.jsx';

// Smoke test: the whole app renders (with no localStorage, as in Node) without crashing.
describe('App', () => {
  it('renders the sample campaigns and their readiness badges', () => {
    const html = renderToString(<App />);
    expect(html).toContain('Campaign Manager');
    expect(html).toContain('Diwali Sale');
    expect(html).toContain('Winter Collection');
    expect(html).toContain('Ready');
    expect(html).toContain('issue');
  });

  it('starts on campaign cards without showing the edit panels', () => {
    const html = renderToString(<App />);
    expect(html).toContain('Open Diwali Sale – Sales');
    expect(html).toContain('Open Winter Collection – Traffic');
    expect(html).not.toContain('Campaign settings');
    expect(html).not.toContain('Campaign tree');
  });
});
