import { DiscStyle, StyleScores } from "../types";
import { profileStrength } from "../data/profileGraphScales";

const styles: DiscStyle[] = ["D", "i", "S", "C"];
const xPositions = [92, 166, 240, 314];

type Props = {
  graphKey: "I" | "II" | "III";
  graphLabel: string;
  title: string;
  scores: StyleScores;
};

export function ProfileGraph({ graphKey, graphLabel, title, scores }: Props) {
  const width = 380;
  const height = 430;
  const top = 82;
  const bottom = 340;
  const ticks = [28, 25, 21, 17, 13, 9, 5, 1];

  function yForStrength(strength: number) {
    return bottom - ((strength - 1) / 27) * (bottom - top);
  }

  const points = styles.map((style, index) => ({
    style,
    value: scores[style],
    x: xPositions[index],
    y: yForStrength(profileStrength(graphKey, style, scores[style]))
  }));

  const linePoints = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <section className="profile-graph-card">
      <div className="profile-graph-title">
        <span>{graphLabel}</span>
        <strong>{title}</strong>
      </div>
      <svg className="profile-graph-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${graphLabel} ${title}`}>
        <rect x="22" y="18" width="336" height="392" rx="4" className="graph-frame" />

        {styles.map((style, index) => (
          <g key={style}>
              <rect x={xPositions[index] - 28} y="32" width="56" height="36" rx="3" className="disc-header" />
              <text x={xPositions[index]} y="58" className="disc-header-text">{style}</text>
              <line x1={xPositions[index]} x2={xPositions[index]} y1={top} y2={bottom} className="graph-column-line" />
          </g>
        ))}

        {ticks.map((tick, index) => {
          const y = yForStrength(tick);
          const isBand = index > 0 && index < ticks.length - 1;
          return (
            <g key={tick}>
              <line x1="54" x2="344" y1={y} y2={y} className={isBand ? "graph-grid dashed" : "graph-grid"} />
            </g>
          );
        })}

        <polyline points={linePoints} className="profile-line" />
        {points.map((point) => (
          <g key={point.style}>
            <circle cx={point.x} cy={point.y} r="7" className={`profile-dot dot-${point.style}`} />
          </g>
        ))}

        <g>
          <text x="48" y="372" className="score-box-label">구분</text>
          {points.map((point) => (
            <g key={point.style}>
              <rect x={point.x - 28} y="354" width="56" height="28" rx="2" className="score-box" />
            </g>
          ))}
        </g>
        <text x="190" y="404" className="profile-note">유형</text>
      </svg>
    </section>
  );
}
