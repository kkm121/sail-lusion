import { Children, cloneElement, isValidElement, useEffect, useRef } from 'react';
import { whenShown } from '../lib/ready';

// type: up | fade | scale | clip | left | right | rise (rise = children come up together)
export default function Reveal({ as: Tag = 'div', type = 'up', delay = 0, stagger = 0, y, className = '', children, cols = 2, threshold = 0.14, margin = '0px 0px -7% 0px', style: userStyle, ...rest }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let cancel = () => {};
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        cancel = whenShown(() => el.classList.add('is-in'), 40);
      },
      { rootMargin: margin, threshold }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancel();
    };
  }, [margin, threshold]);

  const style = { '--rd': `${delay}ms`, ...(y !== undefined ? { '--ry': typeof y === 'number' ? `${y}px` : y } : null) };
  const grouped = stagger > 0 || type === 'rise';
  let kids = children;
  if (grouped) {
    let i = 0;
    kids = Children.map(children, (child) => {
      if (!isValidElement(child)) return child;
      const idx = i++;
      return cloneElement(child, {
        className: `${child.props.className || ''} sl-rc`.trim(),
        style: { ...child.props.style, '--i': idx, '--dir': cols > 1 ? ((idx % cols) - (cols - 1) / 2) / ((cols - 1) / 2) : 0, '--rs': `${stagger}ms` },
      });
    });
  }

  return (
    <Tag ref={ref} className={`${grouped ? 'sl-rg' : `sl-r sl-r--${type}`} ${className}`.trim()} style={{ ...style, ...userStyle }} {...rest}>
      {kids}
    </Tag>
  );
}
