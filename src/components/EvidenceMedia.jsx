import React, { useEffect, useState } from 'react';
import { getEvidenceUrl } from '../lib/api';

// Evidence lives in a private Storage bucket; fetch a short-lived signed link only when it is shown.
function useSignedUrl(path) {
  const [state, setState] = useState({ url: null, error: false });
  useEffect(() => {
    let alive = true;
    if (!path) return undefined;
    getEvidenceUrl(path)
      .then((url) => alive && setState({ url, error: false }))
      .catch(() => alive && setState({ url: null, error: true }));
    return () => { alive = false; };
  }, [path]);
  return state;
}

export function EvidenceImage({ path, alt = 'Visual evidence' }) {
  const { url, error } = useSignedUrl(path);
  if (error) return <p className="text-xs text-rose-600">Could not load this image.</p>;
  if (!url) return <p className="text-xs text-slate-500">Loading image…</p>;
  return <img src={url} alt={alt} loading="lazy" className="max-h-56 rounded-lg border border-slate-300 mx-auto" />;
}

export function EvidenceAudio({ path }) {
  const { url, error } = useSignedUrl(path);
  if (error) return <p className="text-xs text-rose-600">Could not load this recording.</p>;
  if (!url) return <p className="text-xs text-slate-500">Loading recording…</p>;
  return <audio src={url} controls preload="none" className="w-full h-9" />;
}
