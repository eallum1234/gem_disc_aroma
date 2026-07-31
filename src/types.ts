export type DiscStyle = "D" | "i" | "S" | "C";

export type QuestionOption = {
  id: string;
  label: string;
  style: DiscStyle;
};

export type Question = {
  id: number;
  options: QuestionOption[];
};

export type Answer = {
  questionId: number;
  most?: string;
  least?: string;
};

export type Participant = {
  id: string;
  name: string;
  team: string;
  createdAt: string;
  answers: Answer[];
};

export type Session = {
  id: string;
  title: string;
  date: string;
  participants: Participant[];
};

export type StyleScores = Record<DiscStyle, number>;

export type ScoringResult = {
  most: StyleScores;
  least: StyleScores;
  graph3: StyleScores;
  primary: DiscStyle;
  secondary: DiscStyle;
  completed: boolean;
  missingQuestions: number[];
};
