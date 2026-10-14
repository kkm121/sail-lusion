import { useTransitionNavigate } from './TransitionProvider';

export default function TransitionLink({ href, color, text, label, onClick, children, ...rest }) {
  const go = useTransitionNavigate();
  return (
    <a
      href={href}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        go(href, { color, text, label });
      }}
    >
      {children}
    </a>
  );
}