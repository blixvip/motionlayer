export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand-mark" aria-label="MotionLayer">
      <svg viewBox="0 0 28 28" aria-hidden="true">
        <path d="M4 5h12l8 8v10H12l-8-8V5Z" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path d="M9 9h8l5 5v5h-8l-5-5V9Z" fill="currentColor" opacity=".9" />
      </svg>
      {!compact && <span>MotionLayer</span>}
    </div>
  );
}
