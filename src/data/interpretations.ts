import { DiscStyle } from "../types";

export const styleNames: Record<DiscStyle, string> = {
  D: "D 주도형",
  i: "i 사교형",
  S: "S 안정형",
  C: "C 신중형"
};

export const interpretations: Record<DiscStyle, {
  summary: string;
  strengths: string[];
  watchouts: string[];
  motivators: string[];
  stress: string;
  communication: string;
  growth: string;
}> = {
  D: {
    summary: "결과와 속도를 중시하며, 문제가 생기면 직접 해결하려는 경향이 강합니다.",
    strengths: ["빠른 의사결정", "목표 집중", "도전 상황에서의 추진력"],
    watchouts: ["상대의 속도를 놓칠 수 있음", "충분한 설명 없이 결론으로 갈 수 있음"],
    motivators: ["권한", "도전적인 목표", "명확한 성과"],
    stress: "통제권이 없거나 결정이 지연될 때 답답함을 느끼기 쉽습니다.",
    communication: "핵심과 결론을 먼저 제시하고 선택지를 간결하게 보여주는 방식이 효과적입니다.",
    growth: "결정 전에 이해관계자의 관점과 실행 여건을 한 번 더 확인하면 영향력이 커집니다."
  },
  i: {
    summary: "사람과 분위기를 움직이는 데 강점이 있으며, 긍정적인 상호작용에서 에너지를 얻습니다.",
    strengths: ["관계 형성", "분위기 전환", "설득과 참여 유도"],
    watchouts: ["세부사항을 놓칠 수 있음", "불편한 피드백을 미룰 수 있음"],
    motivators: ["인정", "참여 기회", "활기 있는 환경"],
    stress: "거절이나 무관심, 지나치게 차가운 분위기에서 위축될 수 있습니다.",
    communication: "아이디어를 듣고 인정한 뒤 일정과 책임을 함께 정리하면 실행력이 좋아집니다.",
    growth: "좋은 아이디어를 구체적인 일정, 기준, 후속 행동으로 연결하는 습관이 도움이 됩니다."
  },
  S: {
    summary: "안정성과 협력을 중시하며, 팀이 흔들리지 않도록 꾸준히 지원하는 경향이 있습니다.",
    strengths: ["경청", "협력", "일관성과 신뢰감"],
    watchouts: ["변화에 시간이 필요할 수 있음", "갈등을 피하다가 의견을 늦게 말할 수 있음"],
    motivators: ["안정적인 관계", "명확한 역할", "충분한 시간"],
    stress: "갑작스러운 변화나 압박적인 대화에서 부담을 크게 느낄 수 있습니다.",
    communication: "변화의 이유와 기대되는 도움을 차분히 설명하고 충분한 준비 시간을 주는 것이 좋습니다.",
    growth: "불편한 의견도 초기에 작게 표현하면 협력 관계를 더 건강하게 유지할 수 있습니다."
  },
  C: {
    summary: "정확성과 기준을 중시하며, 충분한 근거를 바탕으로 안정적인 결정을 내리려 합니다.",
    strengths: ["분석", "품질 관리", "위험 점검"],
    watchouts: ["완벽을 기다리다 속도가 늦어질 수 있음", "감정보다 오류에 먼저 반응할 수 있음"],
    motivators: ["명확한 기준", "충분한 자료", "전문성 인정"],
    stress: "근거 없는 결정이나 잦은 변경, 모호한 지시에서 스트레스를 받기 쉽습니다.",
    communication: "목적, 기준, 자료, 마감일을 명확히 제시하면 안정적으로 몰입할 수 있습니다.",
    growth: "충분히 좋은 수준에서 먼저 공유하고 피드백으로 완성도를 높이는 방식이 도움이 됩니다."
  }
};
