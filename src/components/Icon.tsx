// Small stroke icon set used across the app.
const paths: Record<string, string> = {
  bag: "M5 8h14l-1.2 12H6.2L5 8zM9 8V7a3 3 0 0 1 6 0v1",
  back: "M15 6l-6 6 6 6",
  close: "M6 6l12 12M18 6L6 18",
  chevron: "M9 6l6 6-6 6",
  home: "M4 11l8-7 8 7v9H4z",
  chart: "M5 20V10M12 20V4M19 20v-7",
  face: "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM9 14c1.5 1.5 4.5 1.5 6 0",
  truck: "M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2",
  image: "M3 5h18v14H3zM8.5 11a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 16l-5-5-8 8",
  share: "M12 4v11M7 9l5-5 5 5M5 14v5h14v-5",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4",
  minus: "M6 12h12",
  plus: "M12 6v12M6 12h12",
};
export default function Icon({ name, size = 22, className = "" }: { name: keyof typeof paths | string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d={paths[name]} />
    </svg>
  );
}
