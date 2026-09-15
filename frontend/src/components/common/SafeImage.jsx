import { useState } from 'react';

export default function SafeImage({ src, alt, onError, ...props }) {
  const [failedSource, setFailedSource] = useState(null);
  const fallback = !src || src === failedSource;
  return (
    <img
      {...props}
      src={fallback ? '/property-placeholder.svg' : src}
      alt={fallback ? (alt || 'Property') + ' — photo unavailable' : alt}
      onError={(event) => {
        if (!fallback) setFailedSource(src);
        onError?.(event);
      }}
    />
  );
}
