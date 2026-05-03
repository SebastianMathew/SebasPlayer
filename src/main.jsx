import React, { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API_BASE = "https://streamed.pk";

const SPORTS = [
  { id: "all", label: "Home", terms: [] },
  { id: "football", label: "Football", terms: ["football", "soccer", "premier", "laliga", "serie a", "bundesliga", "champions"] },
  { id: "basketball", label: "Basketball", terms: ["basketball", "nba", "wnba", "euroleague"] },
  { id: "baseball", label: "Baseball", terms: ["baseball", "mlb"] },
  { id: "hockey", label: "Hockey", terms: ["hockey", "nhl"] },
  { id: "combat", label: "Combat", terms: ["ufc", "boxing", "mma", "fight"] },
  { id: "racing", label: "Racing", terms: ["f1", "formula", "nascar", "motogp", "racing"] },
];

const SEBASTIAN_LINES = [
  "Sebastian just refreshed the page like it owes him money.",
  "Sebastian is scouting streams with suspiciously elite focus.",
  "Sebastian has entered full couch-manager mode.",
  "Sebastian believes buffering is a personal attack.",
  "Sebastian is one good replay away from calling himself an analyst.",
  "Sebastian's snack timing is world class today.",
  "Sebastian is watching respectfully, but the remote fears him.",
  "Sebastian has never met a live match he could not overthink.",
];

function imageUrl(path) {
  return `${API_BASE}${path}.webp`;
}

function routeFromLocation() {
  const path = window.location.pathname.replace(/^\/+/, "");
  return SPORTS.some((sport) => sport.id === path) ? path : "all";
}

function sportForMatch(match) {
  const haystack = `${match.category || ""} ${match.sport || ""} ${match.title || ""}`.toLowerCase();
  return SPORTS.find((sport) => sport.id !== "all" && sport.terms.some((term) => haystack.includes(term))) || null;
}

function filterBySport(matches, sportId) {
  if (sportId === "all") {
    return matches;
  }

  return matches.filter((match) => sportForMatch(match)?.id === sportId);
}

function App() {
  const [route, setRoute] = useState(routeFromLocation);
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [streams, setStreams] = useState([]);
  const [selectedStreamIndex, setSelectedStreamIndex] = useState(0);
  const [isPlayerLoading, setIsPlayerLoading] = useState(false);
  const [matchesMessage, setMatchesMessage] = useState("Loading live matches...");
  const [streamsMessage, setStreamsMessage] = useState("");
  const [query, setQuery] = useState("");
  const [blockPopups, setBlockPopups] = useState(false);
  const [banterIndex, setBanterIndex] = useState(0);

  const activeSport = SPORTS.find((sport) => sport.id === route) || SPORTS[0];
  const selectedStream = streams[selectedStreamIndex];

  const routedMatches = useMemo(() => filterBySport(matches, route), [matches, route]);
  const searchedMatches = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) {
      return routedMatches;
    }

    return routedMatches.filter((match) => `${match.title || ""} ${match.category || ""}`.toLowerCase().includes(term));
  }, [query, routedMatches]);

  const featuredMatch = selectedMatch || searchedMatches.find((match) => match.poster) || searchedMatches[0] || matches[0] || null;
  const popularMatches = searchedMatches.slice(0, 12);
  const withPosters = searchedMatches.filter((match) => match.poster).slice(0, 12);
  const upcomingStyle = searchedMatches.slice().reverse().slice(0, 12);

  const heroStyle = featuredMatch?.poster
    ? { backgroundImage: `linear-gradient(90deg, rgba(10, 10, 10, 0.96) 0%, rgba(10, 10, 10, 0.74) 38%, rgba(10, 10, 10, 0.18) 100%), url("${imageUrl(featuredMatch.poster)}")` }
    : undefined;

  useEffect(() => {
    function handlePopState() {
      setRoute(routeFromLocation());
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadMatches() {
      try {
        const response = await fetch(`${API_BASE}/api/matches/live`);
        const liveMatches = await response.json();

        if (!isMounted) {
          return;
        }

        setMatches(liveMatches);
        setMatchesMessage(liveMatches.length ? "" : "No live matches right now.");
      } catch (error) {
        if (isMounted) {
          setMatchesMessage("Could not load live matches.");
        }

        console.error("Failed to load matches:", error);
      }
    }

    loadMatches();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setBanterIndex((current) => (current + 1) % SEBASTIAN_LINES.length);
    }, 7000);

    return () => window.clearInterval(timer);
  }, []);

  function navigate(nextRoute) {
    const nextPath = nextRoute === "all" ? "/" : `/${nextRoute}`;
    window.history.pushState({}, "", nextPath);
    setRoute(nextRoute);
    setQuery("");
  }

  async function loadStreams(match) {
    setSelectedMatch(match);
    setStreams([]);
    setSelectedStreamIndex(0);
    setStreamsMessage("Finding streams...");
    setIsPlayerLoading(false);

    if (!match.sources?.length) {
      setStreamsMessage("No streams available.");
      return;
    }

    const source = match.sources[0];

    try {
      const response = await fetch(`${API_BASE}/api/stream/${source.source}/${source.id}`);
      const nextStreams = await response.json();

      if (!nextStreams.length) {
        setStreamsMessage("No streams available.");
        return;
      }

      setStreams(nextStreams);
      setStreamsMessage("");
      setIsPlayerLoading(true);
    } catch (error) {
      setStreamsMessage("Could not load streams.");
      console.error("Failed to load streams:", error);
    }
  }

  function selectStream(index) {
    setSelectedStreamIndex(index);
    setIsPlayerLoading(true);
  }

  return (
    <>
      <header className="topbar">
        <button className="brand" type="button" onClick={() => navigate("all")}>
          <span className="brand-mark">S</span>
          Sebasplayer
        </button>

        <nav className="nav-tabs" aria-label="Sports">
          {SPORTS.map((sport) => (
            <button
              key={sport.id}
              type="button"
              className={sport.id === route ? "active" : ""}
              onClick={() => navigate(sport.id)}
            >
              {sport.label}
            </button>
          ))}
        </nav>

        <label className="search">
          <span>Search</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="teams, leagues, sports" />
        </label>
      </header>

      <main>
        <section className="hero" style={heroStyle}>
          <div className="hero-copy">
            <p className="eyebrow"><span className="live-dot" />{activeSport.label} live now</p>
            <h1>{featuredMatch?.title || "Live sports, all in one place"}</h1>
            <p>
              Browse live events by sport, jump between streams, and keep the player ready while you explore the schedule.
            </p>
            <div className="hero-meta" aria-label="Featured match details">
              <span>{featuredMatch?.sources?.length || 0} sources</span>
              <span>{sportForMatch(featuredMatch || {})?.label || activeSport.label}</span>
              <span>Live broadcast</span>
            </div>
            <div className="hero-actions">
              <button type="button" disabled={!featuredMatch} onClick={() => featuredMatch && loadStreams(featuredMatch)}>
                Watch
              </button>
              <button type="button" className="secondary" onClick={() => document.getElementById("browse")?.scrollIntoView({ behavior: "smooth" })}>
                Browse
              </button>
            </div>
          </div>

          <div className="hero-panel">
            <Metric label="Live Matches" value={matches.length} />
            <Metric label="This Category" value={routedMatches.length} />
            <Metric label="With Artwork" value={withPosters.length} />
          </div>
        </section>

        <section className="watch-area" aria-label="Sebasplayer">
          <div className="player-container">
            <div className="player-aura" />
            <div className="player-bar">
              <span className="window-dot red" aria-hidden="true" />
              <span className="window-dot yellow" aria-hidden="true" />
              <span className="window-dot green" aria-hidden="true" />
              <strong>Sebasplayer</strong>
              <span className="player-quality">{selectedStream?.hd ? "HD" : selectedStream ? "SD" : "Ready"}</span>
            </div>
            <div className="screen-frame">
              {isPlayerLoading && (
                <div className="loader">
                  <span className="loader-ring" />
                  <span>Loading stream...</span>
                </div>
              )}
              <iframe
                key={`${selectedStream?.embedUrl || "empty"}-${blockPopups ? "shield" : "open"}`}
                className={selectedStream && !isPlayerLoading ? "loaded" : ""}
                src={selectedStream?.embedUrl || ""}
                title="Sebasplayer"
                sandbox={blockPopups ? "allow-scripts allow-same-origin allow-forms allow-presentation" : undefined}
                allowFullScreen
                onLoad={() => setIsPlayerLoading(false)}
              />
              {!selectedStream && (
                <div className="player-empty">
                  <span className="preview-play" aria-hidden="true" />
                  <h2>{selectedMatch?.title || "Pick a live match"}</h2>
                  <p>{streamsMessage || "Select any card or hit Watch on the featured event."}</p>
                </div>
              )}
              <div className="screen-vignette" />
            </div>
          </div>

          <aside className="now-playing">
            <p className="eyebrow"><span className="live-dot" />Sebasplayer</p>
            <h2>{selectedMatch?.title || "Choose a Sebasplayer"}</h2>
            <p>{streamsMessage || (streams.length ? `${streams.length} Sebasplayers available` : "Choose a match to load Sebasplayers.")}</p>
            <label className="popup-toggle">
              <input
                type="checkbox"
                checked={blockPopups}
                onChange={(event) => setBlockPopups(event.target.checked)}
              />
              <span>Block popups</span>
            </label>
            <div className="stream-buttons">
              {streams.map((stream, index) => (
                <button
                  key={`${stream.embedUrl}-${index}`}
                  type="button"
                  className={index === selectedStreamIndex ? "active" : ""}
                  onClick={() => selectStream(index)}
                >
                  Sebasplayer {index + 1}
                  <span>{stream.language} {stream.hd ? "HD" : "SD"}</span>
                </button>
              ))}
            </div>
          </aside>
        </section>

        <aside className="sebastian-banter" aria-live="polite">
          <span>Sebastian status</span>
          <p>{SEBASTIAN_LINES[banterIndex]}</p>
        </aside>

        <section id="browse" className="browse-grid">
          {matchesMessage && <p className="status-message">{matchesMessage}</p>}
          {!matchesMessage && !searchedMatches.length && <p className="status-message">No matches found for this route.</p>}

          <MatchRail title={`${activeSport.label} Picks`} matches={popularMatches} onSelect={loadStreams} />
          <MatchRail title="Poster Highlights" matches={withPosters} onSelect={loadStreams} />
          <MatchRail title="More Live Events" matches={upcomingStyle} onSelect={loadStreams} compact />
        </section>
      </main>
    </>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function MatchRail({ title, matches, onSelect, compact = false }) {
  if (!matches.length) {
    return null;
  }

  return (
    <section className="rail" aria-labelledby={`${title.replace(/\s+/g, "-").toLowerCase()}-heading`}>
      <div className="rail-heading">
        <h2 id={`${title.replace(/\s+/g, "-").toLowerCase()}-heading`}>{title}</h2>
        <span>{matches.length} live</span>
      </div>
      <div className={compact ? "row compact" : "row"}>
        {matches.map((match, index) => (
          <MatchCard key={`${match.id || match.title}-${index}`} match={match} onSelect={onSelect} compact={compact} />
        ))}
      </div>
    </section>
  );
}

function MatchCard({ match, onSelect, compact }) {
  const cardStyle = match.poster
    ? { backgroundImage: `linear-gradient(to top, rgba(0, 0, 0, 0.86), transparent 64%), url("${imageUrl(match.poster)}")` }
    : undefined;

  const homeBadge = match.teams?.home?.badge;
  const awayBadge = match.teams?.away?.badge;
  const sport = sportForMatch(match)?.label || match.category || "Live";

  return (
    <button className={compact ? "card compact-card" : "card"} type="button" style={cardStyle} onClick={() => onSelect(match)}>
      <span className="card-topline">
        <span>{sport}</span>
        <span>Live</span>
      </span>

      {(homeBadge || awayBadge) && (
        <span className="badges">
          {homeBadge && (
            <img src={`${API_BASE}/api/images/badge/${homeBadge}.webp`} alt="Home team badge" loading="lazy" />
          )}
          {awayBadge && (
            <img src={`${API_BASE}/api/images/badge/${awayBadge}.webp`} alt="Away team badge" loading="lazy" />
          )}
        </span>
      )}

      <span className="overlay">
        <strong>{match.title || "Untitled match"}</strong>
        <small>{match.sources?.length || 0} sources available</small>
      </span>
    </button>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
