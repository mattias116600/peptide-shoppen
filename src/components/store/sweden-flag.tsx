// Delad svensk flagga – används i sidhuvudet, sidfoten och ålderskontrollen
export function SwedenFlag() {
  return (
    <svg viewBox="0 0 16 10" role="img" aria-label="Sveriges flagga" style={{ width: '100%', height: '100%', display: 'block' }}>
      <rect width="16" height="10" fill="#0065a4" />
      <rect width="2" height="10" x="5" fill="#fecc02" />
      <rect width="16" height="2" y="4" fill="#fecc02" />
    </svg>
  );
}
