import { useEffect, useRef, useState } from 'react';
import { glSupported, registerMedia } from '../lib/glmedia';

export default function GLMedia({ src, fallback, video = false, radius = 16, className = '', style, alt = '', poster, children, boxRef, ...rest }) {
  const local = useRef(null);
  const media = useRef(null);
  const [cur, setCur] = useState(src);

  useEffect(() => setCur(src), [src]);

  useEffect(() => {
    const box = boxRef?.current || local.current;
    if (!box || !media.current || !glSupported()) return undefined;
    return registerMedia({ box, media: media.current, video });
  }, [video, boxRef]);

  const onError = () => {
    if (fallback && cur !== fallback) setCur(fallback);
  };

  return (
    <div ref={boxRef || local} className={`glm ${className}`} style={{ '--r': `${radius}px`, ...style }} {...rest}>
      {video ? (
        <video ref={media} className="glm-el" src={cur} poster={poster} muted loop autoPlay playsInline preload="auto" onError={onError} />
      ) : (
        <img ref={media} className="glm-el" src={cur} alt={alt} decoding="async" onError={onError} />
      )}
      {children}
    </div>
  );
}
