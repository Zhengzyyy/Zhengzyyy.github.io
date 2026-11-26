/**
 * 原创几何构成。
 * 只用矩形、圆、直线与有限的三种颜色，向至上主义致意，
 * 但构图比例与位置都是为本站点单独设计的。
 */

export function logoSvg(className = "logo") {
  return `<svg class="${className}" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
    <rect x="2" y="2" width="22" height="36" fill="currentColor"/>
    <rect x="20" y="20" width="18" height="18" fill="var(--red, #c8332b)"/>
    <rect x="27" y="5" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".38"/>
  </svg>`;
}

/** 首页主构成：黑色竖块、红色斜杆、白方块、圆与细线。 */
export function heroArt() {
  return `<svg class="art-svg" viewBox="0 0 620 740" role="presentation" aria-hidden="true" focusable="false">
    <g stroke="currentColor" stroke-width="1" opacity=".28">
      <line x1="596" y1="18" x2="596" y2="700"/>
      <line x1="58" y1="700" x2="596" y2="700"/>
    </g>
    <line x1="452" y1="52" x2="318" y2="680" stroke="currentColor" stroke-width="2.5" opacity=".85"/>
    <rect x="108" y="88" width="148" height="474" fill="currentColor"/>
    <g transform="rotate(-9 300 360)">
      <rect x="36" y="338" width="436" height="46" fill="var(--red, #c8332b)"/>
    </g>
    <circle cx="498" cy="178" r="88" fill="none" stroke="currentColor" stroke-width="2.5"/>
    <rect x="318" y="258" width="152" height="152" fill="var(--paper, #f3f0e9)" stroke="currentColor" stroke-width="1.6"/>
    <circle cx="506" cy="532" r="24" fill="currentColor"/>
    <rect x="470" y="392" width="44" height="44" fill="none" stroke="var(--red, #c8332b)" stroke-width="2.5"/>
    <rect x="92" y="606" width="38" height="38" fill="var(--red, #c8332b)"/>
  </svg>`;
}

/** 关于页 / 关于摘要构成：横块、实心红圆、细线。 */
export function aboutArt() {
  return `<svg class="art-svg" viewBox="0 0 460 540" role="presentation" aria-hidden="true" focusable="false">
    <g stroke="currentColor" stroke-width="1" opacity=".25">
      <line x1="30" y1="500" x2="430" y2="500"/>
      <line x1="430" y1="36" x2="430" y2="500"/>
    </g>
    <line x1="112" y1="24" x2="112" y2="508" stroke="currentColor" stroke-width="2" opacity=".8"/>
    <rect x="30" y="72" width="330" height="118" fill="currentColor"/>
    <circle cx="332" cy="280" r="92" fill="var(--red, #c8332b)"/>
    <rect x="58" y="300" width="150" height="150" fill="var(--paper, #f3f0e9)" stroke="currentColor" stroke-width="1.6"/>
    <rect x="342" y="430" width="42" height="42" fill="currentColor"/>
    <line x1="330" y1="380" x2="414" y2="408" stroke="currentColor" stroke-width="2" opacity=".55"/>
  </svg>`;
}

/** 404：留白、一个空方框、一个红点。 */
export function voidArt() {
  return `<svg class="art-svg" viewBox="0 0 460 380" role="presentation" aria-hidden="true" focusable="false">
    <g stroke="currentColor" stroke-width="1" opacity=".22">
      <line x1="20" y1="340" x2="440" y2="340"/>
      <line x1="440" y1="20" x2="440" y2="340"/>
    </g>
    <rect x="62" y="58" width="252" height="252" fill="none" stroke="currentColor" stroke-width="2"/>
    <line x1="62" y1="58" x2="396" y2="340" stroke="currentColor" stroke-width="1.5" opacity=".6"/>
    <circle cx="356" cy="286" r="34" fill="var(--red, #c8332b)"/>
    <rect x="24" y="24" width="34" height="34" fill="currentColor"/>
  </svg>`;
}
