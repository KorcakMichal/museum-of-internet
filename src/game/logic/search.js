import {
  looksLikeUrl,
  normalizeWebsiteInput,
  getSiteHost,
  fetchJson,
  extractDuckDuckGoResults,
  buildWebsiteCandidates,
} from '../utils';
import { makeCard, makeLink, makeButton, clearElement } from '../ui/helpers';

export async function runBrowserSearch(state, refs, query, { createHouseFromWebsiteUrl, setStatus, getActiveResultsContainer, setWebRoomResultsVisible, setDefaultWebRoomContent }) {
  const resultsContainer = getActiveResultsContainer();
  clearElement(resultsContainer);

  if (looksLikeUrl(query)) {
    const creationResult = createHouseFromWebsiteUrl(query);
    if (!creationResult) {
      setStatus('That does not look like a valid website address.');
      if (state.activeWebRoomHouse) {
        setDefaultWebRoomContent(state.activeWebRoomHouse);
      }
      return;
    }

    const { website, houseResult } = creationResult;

    resultsContainer.appendChild(
      makeCard({
        title: 'Direct URL detected',
        description: 'A new house has been summoned to the town for this address.',
        hero: true,
        actions: [
          makeLink('Open URL', website.url, 'button-primary'),
          makeButton('Show on Map', () => {
            if (houseResult.house) {
              setStatus(`Focused ${houseResult.house.name} on map.`);
            }
          }),
        ],
      }),
    );
    setWebRoomResultsVisible(true);
    return;
  }

  const encoded = encodeURIComponent(query);
  setStatus(`Searching websites for "${query}"...`);

  let apiResults = [];
  try {
    const apiData = await fetchJson(
      `https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&no_redirect=1&skip_disambig=1`,
    );
    apiResults = extractDuckDuckGoResults(apiData);
  } catch {
    apiResults = [];
  }

  const websiteCandidates = buildWebsiteCandidates(query, apiResults);

  if (websiteCandidates.length === 0) {
    resultsContainer.appendChild(
      makeCard({
        title: `No direct website matches for "${query}"`,
        description: 'Try a direct URL or more specific query.',
        hero: true,
      }),
    );
    setStatus('No direct matches found.');
  } else {
    resultsContainer.appendChild(
      makeCard({
        title: `Possible webpages for "${query}"`,
        description: 'Choose a website result and summon a house from it.',
        hero: true,
      }),
    );

    websiteCandidates.forEach((candidate) => {
      resultsContainer.appendChild(
        makeCard({
          title: candidate.host,
          description: candidate.description,
          actions: [
            makeLink('Open Website', candidate.url, 'button-primary'),
            makeButton('Summon House', () => {
              createHouseFromWebsiteUrl(candidate.url);
            }),
          ],
        }),
      );
    });

    setStatus(`Found ${websiteCandidates.length} possibilities.`);
  }

  setWebRoomResultsVisible(true);
}

export function isWebsiteShortcutHouse(house) {
  return house?.interactionType === 'website-shortcut';
}
