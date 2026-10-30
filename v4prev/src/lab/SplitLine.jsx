import { useEffect, useRef, useState } from 'react';

export default function SplitLine({ text, mode = 'char', delay = 0, stagger = mode === 'char' ? 28 : 22 }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -12% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const words = text.split(' ');
  let i = 0;
  return (
    <span ref={ref} className={`sl-split sl-split--${mode} ${shown ? 'in' : ''}`} aria-label={text} style={{ '--d': `${delay}ms`, '--s': `${stagger}ms` }}>
      <span aria-hidden="true">
        {words.map((word, wi) => (
          <span key={wi}>
            {mode === 'char' ? (
              <span className="wd">
                {[...word].map((c, ci) => (
                  <span className="clip" key={ci}>
                    <span className="ch" style={{ '--i': i++ }}>{c}</span>
                  </span>
                ))}
              </span>
            ) : (
              <span className="wd ch" style={{ '--i': i++ }}>{word}</span>
            )}
            {wi < words.length - 1 ? ' ' : null}
          </span>
        ))}
      </span>
    </span>
  );
}