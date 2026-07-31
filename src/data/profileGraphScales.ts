import { DiscStyle } from "../types";

type GraphKey = "I" | "II" | "III";
type ScaleMap = Record<GraphKey, Record<DiscStyle, Record<number, number>>>;

export const graphScales: ScaleMap = {
  I: {
    D: { 0: 3, 1: 6, 2: 9, 3: 12, 4: 14, 5: 16, 6: 19, 7: 20, 8: 22, 9: 23, 10: 24, 11: 25, 12: 26, 27: 28 },
    i: { 0: 1, 1: 2, 2: 4, 3: 6, 4: 9, 5: 12, 6: 15, 7: 16, 8: 20, 9: 22, 10: 24, 11: 25, 12: 26, 28: 28 },
    S: { 0: 1, 1: 2, 2: 3, 3: 4, 4: 7, 5: 9, 6: 11, 7: 13, 8: 15, 9: 17, 10: 19, 11: 21, 12: 24, 13: 25, 14: 26, 26: 28 },
    C: { 0: 1, 1: 2, 2: 4, 3: 7, 4: 9, 5: 13, 6: 16, 7: 19, 8: 21, 9: 23, 10: 24, 11: 25, 12: 26, 24: 28 }
  },
  II: {
    D: { 0: 28, 1: 27, 2: 26, 3: 25, 4: 24, 5: 23, 6: 22, 7: 21, 8: 20, 9: 18, 10: 14, 11: 12, 12: 11, 13: 10, 14: 7, 15: 6, 16: 4, 17: 3, 27: 1 },
    i: { 0: 28, 1: 26, 2: 24, 3: 23, 4: 20, 5: 16, 6: 12, 7: 9, 8: 7, 9: 4, 10: 3, 26: 1 },
    S: { 0: 28, 1: 26, 2: 22, 3: 18, 4: 16, 5: 12, 6: 10, 7: 7, 8: 6, 9: 4, 10: 3, 27: 1 },
    C: { 0: 28, 1: 27, 2: 26, 3: 25, 4: 24, 5: 22, 6: 20, 7: 16, 8: 14, 9: 11, 10: 8, 11: 6, 12: 4, 13: 3, 26: 1 }
  },
  III: {
    D: { "-27": 1, "-16": 3, "-15": 4, "-14": 5, "-13": 7, "-12": 8, "-11": 9, "-10": 10, "-9": 11, "-8": 12, "-7": 13, "-6": 14, "-5": 15, "-4": 16, "-3": 17, "-2": 18, "-1": 19, 0: 20, 1: 21, 2: 22, 3: 23, 5: 24, 6: 25, 9: 26, 27: 28 },
    i: { "-26": 1, "-8": 3, "-6": 4, "-5": 6, "-4": 7, "-3": 8, "-2": 10, "-1": 11, 0: 12, 1: 14, 2: 15, 3: 17, 4: 19, 5: 20, 6: 22, 7: 24, 8: 25, 9: 26, 28: 28 },
    S: { "-27": 1, "-7": 3, "-5": 4, "-4": 5, "-3": 6, "-2": 7, "-1": 8, 0: 10, 1: 11, 2: 12, 3: 13, 4: 14, 5: 15, 6: 17, 7: 18, 8: 20, 9: 21, 10: 23, 11: 24, 12: 25, 14: 26, 26: 28 },
    C: { "-26": 1, "-11": 3, "-9": 4, "-8": 5, "-7": 7, "-6": 8, "-5": 10, "-4": 11, "-3": 12, "-2": 15, "-1": 16, 0: 17, 1: 18, 2: 20, 3: 22, 4: 23, 5: 24, 6: 25, 18: 26, 24: 28 }
  }
};

export function profileStrength(graph: GraphKey, style: DiscStyle, score: number): number {
  const scale = graphScales[graph][style];
  if (scale[score] !== undefined) return scale[score];

  const anchors = Object.entries(scale)
    .map(([raw, strength]) => ({ score: Number(raw), strength }))
    .sort((a, b) => a.score - b.score);

  const lower = [...anchors].reverse().find((anchor) => anchor.score <= score);
  const upper = anchors.find((anchor) => anchor.score >= score);

  if (!lower) return anchors[0].strength;
  if (!upper) return anchors[anchors.length - 1].strength;
  if (lower.score === upper.score) return lower.strength;

  const ratio = (score - lower.score) / (upper.score - lower.score);
  return lower.strength + (upper.strength - lower.strength) * ratio;
}
