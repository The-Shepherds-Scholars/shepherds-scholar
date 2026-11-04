// The site mark, "Crook and Book": the Good Shepherd's crook rising out of an open Bible.
// Drawn in currentColor so it takes the color of whatever it sits on. The same shape is in
// public/favicon.svg (the browser tab icon); change both together.
export default function CrookBookMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M2.5 8.2C5.8 7.1 9 7.4 12 9c3-1.6 6.2-1.9 9.5-.8v10.4c-3.3-1.1-6.5-.8-9.5.8-3-1.6-6.2-1.9-9.5-.8z" />
      <path d="M12 21.6V4.6a2.1 2.1 0 1 1 3.1 1.85" />
    </svg>
  );
}
