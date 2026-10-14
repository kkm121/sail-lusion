import { useEffect, useRef } from 'react';
import { attachStage, glSupported } from '../lib/glmedia';

export default function GLStage() {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !glSupported()) return undefined;
    return attachStage(ref.current);
  }, []);
  return <canvas className="sl-glstage" ref={ref} aria-hidden="true" />;
}
