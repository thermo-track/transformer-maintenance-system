import { useState, useEffect } from "react";

export default function SearchBar({
  initialBy = "transformerNo",
  initialQuery = "",
  initialRange = "all",
  onSearch,
  onReset,
}) {
  const [by, setBy] = useState(initialBy);
  const [query, setQuery] = useState(initialQuery);
  const [range, setRange] = useState(initialRange);

  useEffect(() => setBy(initialBy), [initialBy]);
  useEffect(() => setQuery(initialQuery), [initialQuery]);
  useEffect(() => setRange(initialRange), [initialRange]);

  function submit(e) {
    e.preventDefault();
    onSearch?.({ by, query: query.trim(), range });
  }

  function reset() {
    setBy("transformerNo");
    setQuery("");
    setRange("all");
    onReset?.();
  }

  return (
    <form className="searchbar" onSubmit={submit}>
      {/* left capsule: select + input */}
      <div className="searchbar-capsule">
        <select
          value={by}
          onChange={(e) => setBy(e.target.value)}
          className="searchbar-select"
        >
          <option value="transformerNo">By Transformer No</option>
          <option value="poleNo">By Pole No</option>
        </select>

        <div className="searchbar-divider" />

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="searchbar-input"
          placeholder="Search Transformer"
        />
      </div>

      {/* round search button */}
      <button className="searchbar-go" type="submit" title="Search">
        {/* simple magnifier (no lib) */}
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
          <path d="M10.5 3a7.5 7.5 0 015.7 12.4l4 4a1 1 0 01-1.4 1.4l-4-4A7.5 7.5 0 1110.5 3zm0 2a5.5 5.5 0 100 11 5.5 5.5 0 000-11z" />
        </svg>
      </button>

      {/* right capsule: date range + reset */}
      <div className="searchbar-right">
        <div className="searchbar-capsule">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="searchbar-select"
          >
            <option value="all">All Time</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>

        <button
          type="button"
          className="searchbar-reset"
          onClick={reset}
          title="Reset filters"
        >
          Reset Filters
        </button>
      </div>
    </form>
  );
}
