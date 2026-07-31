import { questionnaire } from "../data/questionnaire";
import { Answer, DiscStyle, Participant, ScoringResult, StyleScores } from "../types";

const styles: DiscStyle[] = ["D", "i", "S", "C"];

export function emptyScores(): StyleScores {
  return { D: 0, i: 0, S: 0, C: 0 };
}

function optionStyle(questionId: number, optionId?: string): DiscStyle | undefined {
  const question = questionnaire.find((item) => item.id === questionId);
  return question?.options.find((option) => option.id === optionId)?.style;
}

export function scoreAnswers(answers: Answer[]): ScoringResult {
  const most = emptyScores();
  const least = emptyScores();
  const missingQuestions: number[] = [];

  for (const question of questionnaire) {
    const answer = answers.find((item) => item.questionId === question.id);
    if (!answer?.most || !answer.least) {
      missingQuestions.push(question.id);
      continue;
    }

    const mostStyle = optionStyle(question.id, answer.most);
    const leastStyle = optionStyle(question.id, answer.least);

    if (mostStyle) most[mostStyle] += 1;
    if (leastStyle) least[leastStyle] += 1;
  }

  const graph3 = styles.reduce((acc, style) => {
    acc[style] = most[style] - least[style];
    return acc;
  }, emptyScores());

  const ranked = [...styles].sort((a, b) => graph3[b] - graph3[a] || most[b] - most[a]);

  return {
    most,
    least,
    graph3,
    primary: ranked[0],
    secondary: ranked[1],
    completed: missingQuestions.length === 0,
    missingQuestions
  };
}

export function participantScore(participant: Participant): ScoringResult {
  return scoreAnswers(participant.answers);
}

export function teamAverage(participants: Participant[]): StyleScores {
  const completed = participants.filter((participant) => participantScore(participant).completed);
  if (!completed.length) return emptyScores();

  const totals = completed.reduce((acc, participant) => {
    const result = participantScore(participant);
    styles.forEach((style) => {
      acc[style] += result.graph3[style];
    });
    return acc;
  }, emptyScores());

  styles.forEach((style) => {
    totals[style] = Number((totals[style] / completed.length).toFixed(1));
  });

  return totals;
}

export function dominantCounts(participants: Participant[]): StyleScores {
  return participants.reduce((acc, participant) => {
    const result = participantScore(participant);
    if (result.completed) acc[result.primary] += 1;
    return acc;
  }, emptyScores());
}
