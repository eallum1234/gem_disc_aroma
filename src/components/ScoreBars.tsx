import { styleNames } from "../data/interpretations";
import { DiscStyle, StyleScores } from "../types";

const styles: DiscStyle[] = ["D", "i", "S", "C"];

type Props = {
  title: string;
  scores: StyleScores;
  min?: number;
  max?: number;
};

export function ScoreBars({ title, scores, min = -28, max = 28 }: Props) {
  const range = max - min;

  return (
    <section className="panel">
      <h3>{title}</h3>
      <div className="bars">
        {styles.map((style) => {
          const percent = ((scores[style] - min) / range) * 100;
          return (
            <div className="bar-row" key={style}>
              <span>{styleNames[style]}</span>
              <div className="bar-track">
                <div className={`bar-fill style-${style}`} style={{ width: `${Math.max(4, percent)}%` }} />
              </div>
              <strong>{scores[style]}</strong>
            </div>
          );
        })}
      </div>
    </section>
  );
}
