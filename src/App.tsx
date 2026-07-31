import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  Clipboard,
  Download,
  FileDown,
  Plus,
  Printer,
  Save,
  Trash2,
  Upload,
  Users
} from "lucide-react";
import { ProfileGraph } from "./components/ProfileGraph";
import { ScoreBars } from "./components/ScoreBars";
import { interpretations, styleNames } from "./data/interpretations";
import { questionnaire } from "./data/questionnaire";
import { dominantCounts, participantScore, teamAverage } from "./lib/scoring";
import { downloadText, loadSessions, loadSharedSessions, saveSharedSessions } from "./lib/storage";
import { Answer, DiscStyle, Participant, Session } from "./types";

const styles: DiscStyle[] = ["D", "i", "S", "C"];
const INSTRUCTOR_PASSWORD = import.meta.env.VITE_INSTRUCTOR_PASSWORD || "1234";
const INSTRUCTOR_AUTH_KEY = "pps-disc-instructor-authenticated";

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function defaultAnswers(): Answer[] {
  return questionnaire.map((question) => ({ questionId: question.id }));
}

function sampleSession(): Session {
  return {
    id: uid("session"),
    title: "샘플 검사",
    date: new Date().toISOString().slice(0, 10),
    participants: [
      {
        id: uid("participant"),
        name: "김샘플",
        team: "교육팀",
        createdAt: new Date().toISOString(),
        answers: questionnaire.map((question) => ({
          questionId: question.id,
          most: question.options[question.id % 4].id,
          least: question.options[(question.id + 2) % 4].id
        }))
      }
    ]
  };
}

function readView(): { mode: "instructor" | "take"; sessionId?: string } {
  const params = new URLSearchParams(window.location.search);
  return {
    mode: params.get("mode") === "take" ? "take" : "instructor",
    sessionId: params.get("session") || undefined
  };
}

function setUrl(mode: "instructor" | "take", sessionId?: string) {
  const params = new URLSearchParams();
  params.set("mode", mode);
  if (sessionId) params.set("session", sessionId);
  window.history.pushState({}, "", `${window.location.pathname}?${params.toString()}`);
}

function linkFor(mode: "instructor" | "take", sessionId: string) {
  const url = new URL(window.location.href);
  url.search = "";
  url.searchParams.set("mode", mode);
  url.searchParams.set("session", sessionId);
  return url.toString();
}

export function App() {
  const initialView = readView();
  const [mode, setMode] = useState<"instructor" | "take">(initialView.mode);
  const [sessions, setSessions] = useState<Session[]>(() => loadSessions());
  const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>(() => initialView.sessionId || loadSessions()[0]?.id);
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | undefined>();
  const [newTitle, setNewTitle] = useState("새 PPS 검사");
  const [participantName, setParticipantName] = useState("");
  const [participantTeam, setParticipantTeam] = useState("");
  const [joinedParticipantId, setJoinedParticipantId] = useState<string | undefined>();
  const [copied, setCopied] = useState("");
  const [sharedStatus, setSharedStatus] = useState<"checking" | "connected" | "local">("checking");
  const [loadedSharedData, setLoadedSharedData] = useState(false);
  const [instructorUnlocked, setInstructorUnlocked] = useState(() => sessionStorage.getItem(INSTRUCTOR_AUTH_KEY) === "true");

  useEffect(() => {
    let alive = true;
    loadSharedSessions().then((shared) => {
      if (!alive) return;
      if (shared) {
        setSessions(shared);
        setSelectedSessionId((current) => initialView.sessionId || current || shared[0]?.id);
        setSharedStatus("connected");
      } else {
        setSharedStatus("local");
      }
      setLoadedSharedData(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!loadedSharedData) return;
    saveSharedSessions(sessions).then((ok) => setSharedStatus(ok ? "connected" : "local"));
  }, [sessions, loadedSharedData]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      loadSharedSessions().then((shared) => {
        if (!shared) {
          setSharedStatus("local");
          return;
        }
        setSharedStatus("connected");
        setSessions((current) => {
          const currentText = JSON.stringify(current);
          const sharedText = JSON.stringify(shared);
          return currentText === sharedText ? current : shared;
        });
      });
    }, 3000);
    return () => window.clearInterval(timer);
  }, []);

  const selectedSession = sessions.find((session) => session.id === selectedSessionId);
  const selectedParticipant = selectedSession?.participants.find((participant) => participant.id === selectedParticipantId);
  const joinedParticipant = selectedSession?.participants.find((participant) => participant.id === joinedParticipantId);

  const completedCount = selectedSession?.participants.filter((participant) => participantScore(participant).completed).length ?? 0;
  const teamCounts = useMemo(() => dominantCounts(selectedSession?.participants ?? []), [selectedSession]);
  const teamScores = useMemo(() => teamAverage(selectedSession?.participants ?? []), [selectedSession]);

  function switchMode(nextMode: "instructor" | "take", sessionId = selectedSessionId) {
    setMode(nextMode);
    setSelectedSessionId(sessionId);
    setSelectedParticipantId(undefined);
    setJoinedParticipantId(undefined);
    setUrl(nextMode, sessionId);
  }

  function updateSession(next: Session) {
    setSessions((current) => current.map((session) => (session.id === next.id ? next : session)));
  }

  function createSession() {
    const session: Session = {
      id: uid("session"),
      title: newTitle.trim() || "새 PPS 검사",
      date: new Date().toISOString().slice(0, 10),
      participants: []
    };
    setSessions((current) => [session, ...current]);
    setSelectedSessionId(session.id);
    setSelectedParticipantId(undefined);
    setNewTitle("새 PPS 검사");
    setUrl("instructor", session.id);
  }

  function deleteSession(id: string) {
    const next = sessions.filter((session) => session.id !== id);
    setSessions(next);
    if (selectedSessionId === id) {
      setSelectedSessionId(next[0]?.id);
      setSelectedParticipantId(undefined);
      setUrl("instructor", next[0]?.id);
    }
  }

  function addSample() {
    const session = sampleSession();
    setSessions((current) => [session, ...current]);
    setSelectedSessionId(session.id);
    setSelectedParticipantId(session.participants[0].id);
    setUrl("instructor", session.id);
  }

  function createParticipant(name: string, team: string) {
    if (!selectedSession) return undefined;
    const participant: Participant = {
      id: uid("participant"),
      name: name.trim() || "이름 없음",
      team: team.trim(),
      createdAt: new Date().toISOString(),
      answers: defaultAnswers()
    };
    updateSession({ ...selectedSession, participants: [participant, ...selectedSession.participants] });
    return participant;
  }

  function addParticipantForInstructor() {
    const participant = createParticipant(participantName, participantTeam);
    if (!participant) return;
    setSelectedParticipantId(participant.id);
    setParticipantName("");
    setParticipantTeam("");
  }

  function joinAsParticipant() {
    const participant = createParticipant(participantName, participantTeam);
    if (!participant) return;
    setJoinedParticipantId(participant.id);
    setParticipantName("");
    setParticipantTeam("");
  }

  function deleteParticipant(id: string) {
    if (!selectedSession) return;
    updateSession({ ...selectedSession, participants: selectedSession.participants.filter((item) => item.id !== id) });
    if (selectedParticipantId === id) setSelectedParticipantId(undefined);
  }

  function setParticipantAnswer(participantId: string, questionId: number, field: "most" | "least", optionId: string) {
    if (!selectedSession) return;
    const participant = selectedSession.participants.find((item) => item.id === participantId);
    if (!participant) return;

    const answers = participant.answers.map((answer) => {
      if (answer.questionId !== questionId) return answer;
      const otherField = field === "most" ? "least" : "most";
      return {
        ...answer,
        [field]: optionId,
        [otherField]: answer[otherField] === optionId ? undefined : answer[otherField]
      };
    });

    updateSession({
      ...selectedSession,
      participants: selectedSession.participants.map((item) => (item.id === participantId ? { ...item, answers } : item))
    });
  }

  async function copyLink(kind: "instructor" | "take") {
    if (!selectedSession) return;
    const text = linkFor(kind, selectedSession.id);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind === "take" ? "참여자 주소를 복사했어요." : "강사용 주소를 복사했어요.");
    } catch {
      window.prompt("이 주소를 복사하세요.", text);
    }
  }

  function exportJson() {
    downloadText("pps-disc-backup.json", JSON.stringify(sessions, null, 2), "application/json;charset=utf-8");
  }

  function importJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      const parsed = JSON.parse(text) as Session[];
      if (!Array.isArray(parsed)) return;
      setSessions(parsed);
      setSelectedSessionId(parsed[0]?.id);
      setSelectedParticipantId(undefined);
      setJoinedParticipantId(undefined);
    });
  }

  function exportCsv() {
    if (!selectedSession) return;
    const rows = [
      ["name", "team", "completed", "primary", "secondary", "D", "i", "S", "C"],
      ...selectedSession.participants.map((participant) => {
        const result = participantScore(participant);
        return [
          participant.name,
          participant.team,
          result.completed ? "Y" : "N",
          result.completed ? result.primary : "",
          result.completed ? result.secondary : "",
          result.graph3.D,
          result.graph3.i,
          result.graph3.S,
          result.graph3.C
        ];
      })
    ];
    downloadText(`${selectedSession.title}-participants.csv`, rows.map((row) => row.join(",")).join("\n"), "text/csv;charset=utf-8");
  }

  return (
    <main>
      <header className="app-header">
        <div>
          <p className="eyebrow">PPS DiSC internal prototype</p>
          <h1>{mode === "take" ? "참여자 검사 화면" : "강사용 검사 관리 화면"}</h1>
        </div>
        <div className="header-actions">
          {mode === "instructor" && (
            <>
              {selectedSession && <button onClick={() => switchMode("take", selectedSession.id)}><Users size={18} /> 참여자 화면</button>}
              <button onClick={exportJson}><Download size={18} /> 백업</button>
              <label className="button-like">
                <Upload size={18} /> 복원
                <input type="file" accept="application/json" onChange={importJson} />
              </label>
            </>
          )}
          <button onClick={() => window.print()}><Printer size={18} /> 인쇄</button>
        </div>
      </header>

      {mode === "take" ? (
        <ParticipantMode
          session={selectedSession}
          participant={joinedParticipant}
          participantName={participantName}
          participantTeam={participantTeam}
          setParticipantName={setParticipantName}
          setParticipantTeam={setParticipantTeam}
          onJoin={joinAsParticipant}
          onAnswer={(questionId, field, optionId) => {
            if (joinedParticipant) setParticipantAnswer(joinedParticipant.id, questionId, field, optionId);
          }}
        />
      ) : !instructorUnlocked ? (
        <InstructorPasswordGate
          onUnlock={() => {
            sessionStorage.setItem(INSTRUCTOR_AUTH_KEY, "true");
            setInstructorUnlocked(true);
          }}
        />
      ) : (
        <InstructorMode
          sessions={sessions}
          selectedSession={selectedSession}
          selectedParticipant={selectedParticipant}
          selectedSessionId={selectedSessionId}
          selectedParticipantId={selectedParticipantId}
          newTitle={newTitle}
          participantName={participantName}
          participantTeam={participantTeam}
          completedCount={completedCount}
          teamCounts={teamCounts}
          teamScores={teamScores}
          copied={copied}
          sharedStatus={sharedStatus}
          setNewTitle={setNewTitle}
          setSelectedSessionId={(id) => {
            setSelectedSessionId(id);
            setSelectedParticipantId(sessions.find((session) => session.id === id)?.participants[0]?.id);
            setUrl("instructor", id);
          }}
          setSelectedParticipantId={setSelectedParticipantId}
          setParticipantName={setParticipantName}
          setParticipantTeam={setParticipantTeam}
          createSession={createSession}
          deleteSession={deleteSession}
          addSample={addSample}
          addParticipant={addParticipantForInstructor}
          deleteParticipant={deleteParticipant}
          updateSession={updateSession}
          exportCsv={exportCsv}
          copyLink={copyLink}
          onAnswer={(questionId, field, optionId) => {
            if (selectedParticipant) setParticipantAnswer(selectedParticipant.id, questionId, field, optionId);
          }}
        />
      )}
    </main>
  );
}

function InstructorPasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password === INSTRUCTOR_PASSWORD) {
      setError("");
      onUnlock();
      return;
    }
    setError("비밀번호가 맞지 않습니다.");
  }

  return (
    <section className="join-screen">
      <form className="join-card" onSubmit={submit}>
        <p className="eyebrow">Instructor access</p>
        <h2>강사용 화면 비밀번호</h2>
        <p>참여자 현황과 팀 분석을 보려면 강사용 비밀번호를 입력하세요.</p>
        <input
          autoFocus
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="비밀번호"
        />
        {error && <p className="error-text">{error}</p>}
        <button className="primary" type="submit">강사용 화면 열기</button>
      </form>
    </section>
  );
}

function InstructorMode(props: {
  sessions: Session[];
  selectedSession?: Session;
  selectedParticipant?: Participant;
  selectedSessionId?: string;
  selectedParticipantId?: string;
  newTitle: string;
  participantName: string;
  participantTeam: string;
  completedCount: number;
  teamCounts: Record<DiscStyle, number>;
  teamScores: Record<DiscStyle, number>;
  copied: string;
  sharedStatus: "checking" | "connected" | "local";
  setNewTitle: (value: string) => void;
  setSelectedSessionId: (id: string) => void;
  setSelectedParticipantId: (id: string) => void;
  setParticipantName: (value: string) => void;
  setParticipantTeam: (value: string) => void;
  createSession: () => void;
  deleteSession: (id: string) => void;
  addSample: () => void;
  addParticipant: () => void;
  deleteParticipant: (id: string) => void;
  updateSession: (session: Session) => void;
  exportCsv: () => void;
  copyLink: (kind: "instructor" | "take") => void;
  onAnswer: (questionId: number, field: "most" | "least", optionId: string) => void;
}) {
  const {
    sessions,
    selectedSession,
    selectedParticipant,
    selectedSessionId,
    selectedParticipantId,
    newTitle,
    participantName,
    participantTeam,
    completedCount,
    teamCounts,
    teamScores,
    copied,
    sharedStatus
  } = props;

  return (
    <>
      <section className="notice">
        강사는 여기에서 검사 방을 만들고, 참여자용 주소를 안내합니다. 참여자는 참여자 화면에서 자기 검사만 진행하고, 강사는 이 화면에서 전체 완료 현황과 팀 분석을 봅니다.
        <br />
        저장 상태: {sharedStatus === "connected" ? "공유 저장소 연결됨" : sharedStatus === "checking" ? "공유 저장소 확인 중" : "이 브라우저에만 저장 중"}
      </section>

      <div className="layout">
        <aside className="sidebar">
          <section className="panel">
            <h2>검사 방 만들기</h2>
            <input value={newTitle} onChange={(event) => props.setNewTitle(event.target.value)} placeholder="예: A회사 리더십 과정" />
            <button className="primary" onClick={props.createSession}><Plus size={18} /> 새 검사 방</button>
            <button onClick={props.addSample}><Save size={18} /> 샘플 보기</button>
          </section>

          <section className="panel">
            <h2>검사 목록</h2>
            <p className="helper-text">교육 일정이나 단체별로 나누어 관리하는 검사 방입니다.</p>
            <div className="session-list">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  className={session.id === selectedSessionId ? "session active" : "session"}
                  onClick={() => props.setSelectedSessionId(session.id)}
                >
                  <span>{session.title}</span>
                  <small>{session.participants.length}명 참여</small>
                </button>
              ))}
              {!sessions.length && <p className="muted">아직 만든 검사 방이 없습니다.</p>}
            </div>
          </section>
        </aside>

        <section className="content">
          {!selectedSession && (
            <section className="empty-state">
              <h2>새 검사 방을 만들면 참여자 주소와 강사용 현황판이 생깁니다.</h2>
            </section>
          )}

          {selectedSession && (
            <>
              <section className="panel session-header">
                <div>
                  <input
                    className="title-input"
                    value={selectedSession.title}
                    onChange={(event) => props.updateSession({ ...selectedSession, title: event.target.value })}
                  />
                  <p>{selectedSession.date} · 전체 {selectedSession.participants.length}명 · 완료 {completedCount}명</p>
                  {copied && <p className="success-text">{copied}</p>}
                </div>
                <div className="row-actions">
                  <button onClick={() => props.copyLink("take")}><Clipboard size={18} /> 참여자 주소 복사</button>
                  <button onClick={() => props.copyLink("instructor")}><Clipboard size={18} /> 강사용 주소 복사</button>
                  <button onClick={props.exportCsv}><FileDown size={18} /> CSV</button>
                  <button className="danger" onClick={() => props.deleteSession(selectedSession.id)}><Trash2 size={18} /> 삭제</button>
                </div>
              </section>

              <section className="flow-grid">
                <div className="flow-step">
                  <strong>1</strong>
                  <span>강사가 검사 방 생성</span>
                </div>
                <div className="flow-step">
                  <strong>2</strong>
                  <span>참여자 주소 공유</span>
                </div>
                <div className="flow-step">
                  <strong>3</strong>
                  <span>참여자는 자기 검사만 진행</span>
                </div>
                <div className="flow-step">
                  <strong>4</strong>
                  <span>강사는 전체 결과 확인</span>
                </div>
              </section>

              <section className="grid two">
                <section className="panel">
                  <h2>참여자 현황</h2>
                  <p className="helper-text">직접 입력도 가능하고, 참여자 화면에서 들어온 사람도 여기에 쌓입니다.</p>
                  <div className="form-grid">
                    <input value={participantName} onChange={(event) => props.setParticipantName(event.target.value)} placeholder="이름" />
                    <input value={participantTeam} onChange={(event) => props.setParticipantTeam(event.target.value)} placeholder="소속 / 팀" />
                    <button className="primary" onClick={props.addParticipant}><Plus size={18} /> 직접 추가</button>
                  </div>
                  <div className="participant-list">
                    {selectedSession.participants.map((participant) => {
                      const result = participantScore(participant);
                      return (
                        <button
                          key={participant.id}
                          className={participant.id === selectedParticipantId ? "participant active" : "participant"}
                          onClick={() => props.setSelectedParticipantId(participant.id)}
                        >
                          <span>{participant.name}</span>
                          <small>{result.completed ? `${styleNames[result.primary]} / ${styleNames[result.secondary]}` : `미완료 ${result.missingQuestions.length}문항`}</small>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="panel">
                  <h2>팀 분석</h2>
                  <div className="stat-grid">
                    {styles.map((style) => (
                      <div className="stat" key={style}>
                        <strong>{teamCounts[style]}</strong>
                        <span>{styleNames[style]}</span>
                      </div>
                    ))}
                  </div>
                  <ScoreBars title="팀 평균 Graph III" scores={teamScores} />
                </section>
              </section>

              {selectedParticipant && (
                <ParticipantWorkspace
                  participant={selectedParticipant}
                  showAdminTools
                  onDelete={() => props.deleteParticipant(selectedParticipant.id)}
                  onAnswer={props.onAnswer}
                />
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}

function ParticipantMode(props: {
  session?: Session;
  participant?: Participant;
  participantName: string;
  participantTeam: string;
  setParticipantName: (value: string) => void;
  setParticipantTeam: (value: string) => void;
  onJoin: () => void;
  onAnswer: (questionId: number, field: "most" | "least", optionId: string) => void;
}) {
  if (!props.session) {
    return (
      <section className="empty-state">
        <h2>검사 주소가 올바르지 않습니다.</h2>
        <p className="helper-text">강사에게 받은 참여자 주소로 다시 접속해 주세요.</p>
      </section>
    );
  }

  if (!props.participant) {
    return (
      <section className="join-screen">
        <div className="join-card">
          <p className="eyebrow">참여자용 검사</p>
          <h2>{props.session.title}</h2>
          <p>이 화면에서는 본인 이름으로 검사만 진행합니다. 다른 사람의 응답이나 팀 결과는 보이지 않습니다.</p>
          <input value={props.participantName} onChange={(event) => props.setParticipantName(event.target.value)} placeholder="이름" />
          <input value={props.participantTeam} onChange={(event) => props.setParticipantTeam(event.target.value)} placeholder="소속 / 팀" />
          <button className="primary" onClick={props.onJoin}>검사 시작</button>
        </div>
      </section>
    );
  }

  const result = participantScore(props.participant);

  return (
    <section className="content single-column">
      <section className="notice">
        {props.participant.name}님 검사 화면입니다. 각 문항에서 나와 가장 가까운 단어 Most 하나, 가장 먼 단어 Least 하나를 선택하세요.
      </section>
      <ParticipantWorkspace participant={props.participant} onAnswer={props.onAnswer} />
      {result.completed && (
        <section className="panel completion-message">
          <h2>검사가 완료되었습니다.</h2>
          <p>강사는 강사용 화면에서 전체 참여자 현황과 팀 분석을 확인할 수 있습니다.</p>
        </section>
      )}
    </section>
  );
}

function ParticipantWorkspace({
  participant,
  onDelete,
  onAnswer,
  showAdminTools = false
}: {
  participant: Participant;
  onDelete?: () => void;
  onAnswer: (questionId: number, field: "most" | "least", optionId: string) => void;
  showAdminTools?: boolean;
}) {
  const result = participantScore(participant);
  const interpretation = interpretations[result.primary];

  return (
    <section className="participant-workspace">
      <section className="panel participant-summary">
        <div>
          <p className="eyebrow">{showAdminTools ? "강사용 개인 결과" : "내 검사 진행 상황"}</p>
          <h2>{participant.name}</h2>
          <p>{participant.team || "소속 없음"} · {result.completed ? "응답 완료" : `미완료 ${result.missingQuestions.length}문항`}</p>
        </div>
        {showAdminTools && onDelete && (
          <button className="danger" onClick={onDelete}><Trash2 size={18} /> 참여자 삭제</button>
        )}
      </section>

      <section className="answer-grid">
        {questionnaire.map((question) => {
          const answer = participant.answers.find((item) => item.questionId === question.id);
          return (
            <article className="question-card" key={question.id}>
              <h3>{question.id}</h3>
              <div className="option-table">
                <div className="table-head">
                  <span>단어</span>
                  <span>Most</span>
                  <span>Least</span>
                </div>
                {question.options.map((option) => (
                  <label className="option-row" key={option.id}>
                    <span>{option.label}</span>
                    <input
                      type="radio"
                      name={`${participant.id}-${question.id}-most`}
                      checked={answer?.most === option.id}
                      onChange={() => onAnswer(question.id, "most", option.id)}
                    />
                    <input
                      type="radio"
                      name={`${participant.id}-${question.id}-least`}
                      checked={answer?.least === option.id}
                      onChange={() => onAnswer(question.id, "least", option.id)}
                    />
                  </label>
                ))}
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid three print-results">
        <ProfileGraph graphKey="I" graphLabel="그래프 I" title="Most" scores={result.most} />
        <ProfileGraph graphKey="II" graphLabel="그래프 II" title="Least" scores={result.least} />
        <ProfileGraph graphKey="III" graphLabel="그래프 III" title="Most - Least" scores={result.graph3} />
      </section>

      <section className="panel interpretation">
        <p className="eyebrow">프로토타입 판정</p>
        <h2>{styleNames[result.primary]} · 보조 {styleNames[result.secondary]}</h2>
        <p>{interpretation.summary}</p>
        <div className="interpretation-grid">
          <div>
            <h3>강점</h3>
            <ul>{interpretation.strengths.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <div>
            <h3>주의점</h3>
            <ul>{interpretation.watchouts.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <div>
            <h3>동기요인</h3>
            <ul>{interpretation.motivators.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <div>
            <h3>스트레스</h3>
            <p>{interpretation.stress}</p>
          </div>
          <div>
            <h3>소통법</h3>
            <p>{interpretation.communication}</p>
          </div>
          <div>
            <h3>성장 방향</h3>
            <p>{interpretation.growth}</p>
          </div>
        </div>
      </section>
    </section>
  );
}
