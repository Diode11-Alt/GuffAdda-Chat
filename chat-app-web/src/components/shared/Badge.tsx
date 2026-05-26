interface BadgeProps {
  count: number;
  className?: string;
}

export default function Badge({ count, className = '' }: BadgeProps) {
  if (count <= 0) return null;

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold text-white rounded-full animate-badge-bounce ${className}`}
      style={{ background: 'var(--accent-blue)' }}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
