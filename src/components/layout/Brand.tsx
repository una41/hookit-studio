export function Brand({ light = false }: { light?: boolean }) {
  return (
    <span className={`brand ${light ? 'brand-light' : ''}`} role="img" aria-label="HOOKIT STUDIO">
      <span className="brand-word" aria-hidden="true">
        HO
        <svg className="brand-ring" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="14" stroke="#292d38" strokeWidth="10" />
          <path
            d="M20 6a14 14 0 1 1-14 14"
            stroke="#205bff"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <circle cx="6" cy="20" r="4.5" fill="#f8f9fc" />
        </svg>
        KIT
      </span>
      <span className="brand-studio" aria-hidden="true">
        STUDIO
      </span>
    </span>
  );
}
