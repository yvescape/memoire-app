// ── LOGO ÉLYSE ────────────────────────────────────────────────────────────────
function ElyseeLogo({ onClick, variant = "dark" }) {
  const gold = "#d7bd88";
  const navy = variant === "dark" ? "#10214b" : "#ebe7e1";
  const muted = variant === "dark" ? "#8a7f78" : "rgba(235,231,225,0.55)";

  return (
    <div
      onClick={onClick}
      style={{ cursor:"pointer", display:"flex", alignItems:"center", gap:"0.7rem", animation:"logoReveal .8s ease both" }}
    >
      {/* Flacon SVG */}
      <svg width="26" height="34" viewBox="0 0 26 34" fill="none">
        {/* Bague dorée du col */}
        <rect x="9" y="0" width="8" height="2" rx="1" fill={gold}/>
        {/* Col */}
        <rect x="10.5" y="2" width="5" height="3.5" rx=".5" fill={navy} opacity=".9"/>
        {/* Bouchon avec reflet */}
        <rect x="7.5" y="5.5" width="11" height="3.5" rx=".8" fill={navy}/>
        <rect x="9" y="6" width="8" height="1" rx=".5" fill={gold} opacity=".3"/>
        {/* Corps du flacon */}
        <path d="M7.5 9 C4.5 10.5 3 13.5 3 16 L3 28.5 Q3 32.5 7 32.5 L19 32.5 Q23 32.5 23 28.5 L23 16 C23 13.5 21.5 10.5 18.5 9 Z" fill={navy}/>
        {/* Reflet latéral gauche */}
        <path d="M6 15.5 C5.2 17 5 19 5 21 L5 28 Q5 31 6.5 31.5 Z" fill={gold} opacity=".12"/>
        {/* Ligne dorée horizontale décorative */}
        <line x1="3" y1="25" x2="23" y2="25" stroke={gold} strokeWidth=".7" opacity=".4"/>
        {/* Reflet brillant */}
        <ellipse cx="9.5" cy="15" rx="1.2" ry="3.5" fill="white" opacity=".1"/>
        {/* Petite étiquette */}
        <rect x="7" y="18" width="12" height="5.5" rx=".5" fill={gold} opacity=".12"/>
        <line x1="8.5" y1="20" x2="17.5" y2="20" stroke={gold} strokeWidth=".5" opacity=".4"/>
        <line x1="9.5" y1="22" x2="16.5" y2="22" stroke={gold} strokeWidth=".4" opacity=".25"/>
      </svg>

      {/* Wordmark */}
      <div style={{ display:"flex", flexDirection:"column", gap:"1px", lineHeight:1 }}>
        <span style={{
          fontFamily:"'Cormorant Garamond', Georgia, serif",
          fontSize:"1.45rem",
          fontWeight:300,
          letterSpacing:".32em",
          color: navy,
          lineHeight:1,
          display:"block",
        }}>
          ÉLYSE
        </span>
        <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
          <div style={{ flex:1, height:"0.5px", background: gold, opacity:.7 }}/>
          <span style={{
            fontFamily:"'Jost', sans-serif",
            fontSize:".48rem",
            fontWeight:400,
            letterSpacing:".38em",
            color: muted,
            textTransform:"uppercase",
            lineHeight:1,
          }}>
            PARFUMS
          </span>
          <div style={{ flex:1, height:"0.5px", background: gold, opacity:.7 }}/>
        </div>
      </div>
    </div>
  );
}

export default ElyseeLogo;