export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 mt-2 mb-1 ml-1">
      <div
        className="flex items-center gap-1 px-4 py-3 rounded-2xl"
        style={{ background: 'var(--bubble-in)' }}
      >
        <div className="typing-dot w-[6px] h-[6px] rounded-full" style={{ background: 'var(--text-secondary)' }} />
        <div className="typing-dot w-[6px] h-[6px] rounded-full" style={{ background: 'var(--text-secondary)' }} />
        <div className="typing-dot w-[6px] h-[6px] rounded-full" style={{ background: 'var(--text-secondary)' }} />
      </div>
    </div>
  );
}
