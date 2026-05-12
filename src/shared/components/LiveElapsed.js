"use client";

import { useState, useEffect, useRef } from "react";

function formatElapsed(ms) {
  if (ms < 0) return "0s";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m < 60) return `${m}m ${sec}s`;
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h}h ${min}m ${sec}s`;
}

export default function LiveElapsed({ since, className }) {
  const [elapsed, setElapsed] = useState(0);
  const sinceRef = useRef(since);

  useEffect(() => {
    sinceRef.current = since;
    setElapsed(Date.now() - since);
  }, [since]);

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Date.now() - sinceRef.current);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className={className} title={`running for ${formatElapsed(elapsed)}`}>
      {formatElapsed(elapsed)}
    </span>
  );
}
