const GRADIENTS = [
  'linear-gradient(135deg, #FF6B6B 0%, #EE5A24 100%)',
  'linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)',
  'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
  'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
  'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
  'linear-gradient(135deg, #06B6D4 0%, #8B5CF6 100%)',
];

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: number;
  online?: boolean;
  className?: string;
}

export default function Avatar({ name, src, size = 44, online, className = '' }: AvatarProps) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const gradientIndex = name.charCodeAt(0) % GRADIENTS.length;

  const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : "http://" + window.location.hostname + ":3000";
  const fullSrc = src && !src.startsWith('http') && !src.startsWith('data:') ? `${baseUrl}${src}` : src;

  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      {fullSrc ? (
        <img
          src={fullSrc}
          alt={name}
          className="w-full h-full rounded-full object-cover"
          style={{ width: size, height: size }}
        />
      ) : (
        <div
          className="w-full h-full rounded-full flex items-center justify-center text-white font-semibold select-none"
          style={{
            background: GRADIENTS[gradientIndex],
            fontSize: size * 0.36,
            width: size,
            height: size,
          }}
        >
          {initials}
        </div>
      )}

      {online !== undefined && (
        <div
          className={`absolute bottom-0 right-0 rounded-full border-2 border-[var(--bg-secondary)] ${
            online ? 'bg-[var(--status-online)] animate-online-pulse' : 'bg-[var(--status-offline)]'
          }`}
          style={{
            width: Math.max(size * 0.27, 10),
            height: Math.max(size * 0.27, 10),
          }}
        />
      )}
    </div>
  );
}
