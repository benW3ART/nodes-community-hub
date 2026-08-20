'use client';

export const REFINEMENT_PREVIEW_SRC = '/assets/refinement/preview.mp4';

export function RefinementPreview({
  size = 72,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-[#1a1a1a] bg-black shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <video
        src={REFINEMENT_PREVIEW_SRC}
        autoPlay
        loop
        muted
        playsInline
        aria-label="The Refinement preview"
        className="w-full h-full object-cover"
      />
    </div>
  );
}
