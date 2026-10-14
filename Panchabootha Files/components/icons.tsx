import type { Element, Alignment, EstablishmentType } from "@/lib/types";

type IconProps = { className?: string };

const S = ({ children, className }: IconProps & { children: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
    {children}
  </svg>
);

const ELEMENT_GLYPH: Record<Element, React.ReactNode> = {
  Earth: <path d="M1 21 6.5 9 10.5 15.5 13 15.5 18 6 23 21Z" />,
  Water: (
    <g fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
      <path d="M3 7q4-3.5 8 0t8 0" />
      <path d="M3 12q4-3.5 8 0t8 0" />
      <path d="M3 17q4-3.5 8 0t8 0" />
    </g>
  ),
  Fire: (
    <path d="M13 2c1.2 4.2-2 6-3.2 8.2C8.7 8.4 8.6 6.4 8.6 6.4S3.8 10.5 5 15.6a7 7 0 0 0 13.9-1.4c0-5.2-5.9-8.9-5.9-12.2Z" />
  ),
  Air: (
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      d="M20 12a8 8 0 1 1-8-8 6 6 0 0 1 6 6 4 4 0 0 1-4 4 2 2 0 0 1-2-2"
    />
  ),
  Akasha: (
    <path d="M12 1.5c1.1 6.3 4.2 9.4 10.5 10.5C16.2 13.1 13.1 16.2 12 22.5 10.9 16.2 7.8 13.1 1.5 12 7.8 10.9 10.9 7.8 12 1.5Z" />
  )
};

const ALIGN_GLYPH: Record<Alignment, React.ReactNode> = {
  Deva: (
    <>
      <circle cx="12" cy="12" r="5" />
      <g fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
        <path d="M12 1v3.2M12 19.8V23M1 12h3.2M19.8 12H23M4.2 4.2l2.3 2.3M17.5 17.5l2.3 2.3M19.8 4.2l-2.3 2.3M6.5 17.5l-2.3 2.3" />
      </g>
    </>
  ),
  Asura: (
    <g fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22V8M9 22h6M6 6c0 6.5 12 6.5 12 0" />
      <path d="M6 6.5V3l1.6 1.6M6 3 4.4 4.6M12 8V2l1.6 1.6M12 2l-1.6 1.6M18 6.5V3l1.6 1.6M18 3l-1.6 1.6" />
    </g>
  )
};

const PIECE_GLYPH: Record<EstablishmentType | "ruins", React.ReactNode> = {
  House: (
    <>
      <path d="M3 11 12 3l9 8v10H3Z" />
      <path fillOpacity={0.35} d="M10 14h4v7h-4z" />
    </>
  ),
  City: (
    <>
      <path d="M2 21V10h5V6h6v4h5v3h4v8Z" />
      <path fillOpacity={0.3} d="M4 13h2v3H4zm5 0h2v3H9zm5-1h2v3h-2z" />
    </>
  ),
  Temple: (
    <>
      <path d="M12 2l7 6h-2v2h2l-2 3h2l-3 4H7l-3-4h2l-2-3h2V8H4Z" />
      <circle cx="12" cy="2.5" r="1.1" />
    </>
  ),
  Fort: (
    <>
      <path d="M3 21V9h2V6h3v3h2V6h4v3h2V6h3v3h2v12Z" />
      <path fillOpacity={0.35} d="M10 21v-5a2 2 0 0 1 4 0v5Z" />
    </>
  ),
  ruins: (
    <>
      <path d="M5 21V11l3-1v11Zm9 0V9l3 2v10Z" />
      <path d="M2 21h20" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </>
  )
};

export function ElementIcon({ element, className }: { element: Element } & IconProps) {
  return <S className={className}>{ELEMENT_GLYPH[element]}</S>;
}

export function AlignIcon({ alignment, className }: { alignment: Alignment } & IconProps) {
  return <S className={className}>{ALIGN_GLYPH[alignment]}</S>;
}

export function PieceIcon({
  type,
  className
}: { type: EstablishmentType | "ruins" } & IconProps) {
  return <S className={className}>{PIECE_GLYPH[type]}</S>;
}

export function TrophyIcon({ className }: IconProps) {
  return (
    <S className={className}>
      <path d="M6 4h12v3a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4Z" fill="none" stroke="currentColor" strokeWidth={2} />
      <path d="M6 5H3v2a3 3 0 0 0 3 3M18 5h3v2a3 3 0 0 1-3 3M10 12h4M12 12v4M8 20h8M9 20l1-4h4l1 4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </S>
  );
}

export function WarnIcon({ className }: IconProps) {
  return (
    <S className={className}>
      <path d="M12 3 22 20H2Z" fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" />
      <path d="M12 9v5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      <circle cx="12" cy="17" r="1" />
    </S>
  );
}

export function DhootaIcon({ className }: IconProps) {
  return (
    <S className={className}>
      <path d="M4 12h11M9 7l-5 5 5 5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="19" cy="12" r="2.4" />
    </S>
  );
}

export const ELEMENT_CLASS: Record<Element, string> = {
  Earth: "text-earth",
  Water: "text-water",
  Fire: "text-fire",
  Air: "text-air",
  Akasha: "text-akasha"
};

export const SEAT_TEXT = ["text-p0", "text-p1", "text-p2", "text-p3"];
export const SEAT_BORDER = ["border-p0", "border-p1", "border-p2", "border-p3"];
export const SEAT_BG = ["bg-p0", "bg-p1", "bg-p2", "bg-p3"];
export const SEAT_VAR = ["var(--p0)", "var(--p1)", "var(--p2)", "var(--p3)"];
