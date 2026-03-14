import {
  looksLikeUrl,
  normalizeWebsiteInput,
  getSiteHost,
  fetchJson,
  extractDuckDuckGoResults,
  buildWebsiteCandidates,
} from '../utils';
import { makeCard, makeLink, makeButton, clearElement } from '../ui/helpers';

function getSearchStrings(locale) {
  if (locale === 'cs') {
    return {
      invalidWebsite: 'Tohle nevypada jako platna webova adresa.',
      searching: (q) => `Hledam weby pro "${q}"...`,
      noMatchesTitle: (q) => `Zadne prime shody webu pro "${q}"`,
      noMatchesDescription: 'Zkus primou URL nebo konkretnejsi dotaz.',
      noMatchesStatus: 'Nebyly nalezeny prime shody.',
      possiblePagesTitle: (q) => `Mozne webove stranky pro "${q}"`,
      possiblePagesDescription: 'Vyber vysledek webu a vyvolej z nej dum.',
      openWebsite: 'Otevrit Web',
      summonHouse: 'Vyvolat Dum',
      foundPossibilities: (count) => `Nalezeno moznosti: ${count}.`,
    };
  }

  return {
    invalidWebsite: 'That does not look like a valid website address.',
    searching: (q) => `Searching websites for "${q}"...`,
    noMatchesTitle: (q) => `No direct website matches for "${q}"`,
    noMatchesDescription: 'Try a direct URL or more specific query.',
    noMatchesStatus: 'No direct matches found.',
    possiblePagesTitle: (q) => `Possible webpages for "${q}"`,
    possiblePagesDescription: 'Choose a website result and summon a house from it.',
    openWebsite: 'Open Website',
    summonHouse: 'Summon House',
    foundPossibilities: (count) => `Found ${count} possibilities.`,
  };
}

export async function runBrowserSearch(state, refs, query, { createHouseFromWebsiteUrl, setStatus, getActiveResultsContainer, setWebRoomResultsVisible, setDefaultWebRoomContent, locale = 'en' }) {
  const t = getSearchStrings(locale);
  const resultsContainer = getActiveResultsContainer();
  clearElement(resultsContainer);

  if (looksLikeUrl(query)) {
    const creationResult = createHouseFromWebsiteUrl(query);
    if (!creationResult) {
      setStatus(t.invalidWebsite);
      if (state.activeWebRoomHouse) {
        setDefaultWebRoomContent(state.activeWebRoomHouse);
      }
      return;
    }

    const { website, houseResult } = creationResult;

    setWebRoomResultsVisible(false);
    return;
  }

  const encoded = encodeURIComponent(query);
  setStatus(t.searching(query));

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
        title: t.noMatchesTitle(query),
        description: t.noMatchesDescription,
        hero: true,
      }),
    );
    setStatus(t.noMatchesStatus);
  } else {
    resultsContainer.appendChild(
      makeCard({
        title: t.possiblePagesTitle(query),
        description: t.possiblePagesDescription,
        hero: true,
      }),
    );

    websiteCandidates.forEach((candidate) => {
      resultsContainer.appendChild(
        makeCard({
          title: candidate.host,
          description: candidate.description,
          actions: [
            makeLink(t.openWebsite, candidate.url, 'button-primary'),
            makeButton(t.summonHouse, () => {
              createHouseFromWebsiteUrl(candidate.url);
            }),
          ],
        }),
      );
    });

    setStatus(t.foundPossibilities(websiteCandidates.length));
  }

  setWebRoomResultsVisible(true);
}

export function isWebsiteShortcutHouse(house) {
  return house?.interactionType === 'website-shortcut';
}
