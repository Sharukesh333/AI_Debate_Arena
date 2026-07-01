import React from 'react';
import { personas } from '../../lib/debateData';
import { StanceConfig } from '../../lib/types';

type ScoreboardProps = {
  selectedIds: string[];
  scores: Record<string, number>;
  battlePoints: number;
  currentSpeakerId: string | null;
  isRunning: boolean;
  personaSides: Record<string, 'for' | 'against' | 'neutral'>;
  sideA: StanceConfig;
  sideB: StanceConfig;
  givePoints: (id: string, count: number) => void;
};

export const Scoreboard: React.FC<ScoreboardProps> = ({
  selectedIds,
  scores,
  battlePoints,
  currentSpeakerId,
  isRunning,
  personaSides,
  sideA,
  sideB,
  givePoints,
}) => {
  const getPersonaData = (id: string) => personas.find((p) => p.id === id);

  // Helper to determine stance color
  const getStanceColor = (side: 'for' | 'against' | 'neutral') => {
    if (side === 'for') return 'var(--side-a)';
    if (side === 'against') return 'var(--side-b)';
    return 'var(--side-neutral)';
  };

  return (
    <section className="glass-panel" style={{ height: 'fit-content' }}>
      <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
        📊 Debater Scoreboard
      </h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0.25rem 0 0.75rem 0' }}>
        First to <strong>{battlePoints} points</strong> wins the debate!
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {selectedIds.map((id) => {
          const p = getPersonaData(id);
          if (!p) return null;
          const score = scores[id] ?? 0;
          const progressPercent = Math.min((score / battlePoints) * 100, 100);
          const isCurrent = currentSpeakerId === id;
          const assignedSide = personaSides[id] || 'neutral';
          const stanceColor = getStanceColor(assignedSide);

          const sideText = assignedSide === 'for'
            ? `Side A${sideA.title ? ` · ${sideA.title}` : ''}`
            : assignedSide === 'against'
              ? `Side B${sideB.title ? ` · ${sideB.title}` : ''}`
              : 'Neutral';

          return (
            <div
              key={id}
              className={`score-card-item ${isCurrent && isRunning ? 'active-speaker-ring' : ''}`}
              style={{
                padding: '0.875rem',
                border: `1px solid ${isCurrent && isRunning ? p.color : 'var(--border-default)'}`,
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--bg-elevated)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                boxShadow: isCurrent && isRunning ? `0 0 0 2px ${p.color}40` : 'none',
              }}
            >
              <div className="score-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="score-card-identity" style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', minWidth: 0 }}>
                  <span
                    className="score-card-name"
                    style={{ color: p.color, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    <span>{p.emoji}</span>
                    <span>{p.name}</span>
                    {isCurrent && isRunning && (
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, animation: 'pulse 1s infinite', color: p.color, background: `${p.color}18`, padding: '0.1rem 0.4rem', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                        🎤 Speaking
                      </span>
                    )}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: stanceColor, fontWeight: 600 }}>
                    {sideText}
                  </span>
                </div>

                <div className="score-display-panel" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0, marginLeft: '0.5rem' }}>
                  <span
                    className="score-digits"
                    style={{
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      color: score > 0 ? p.color : 'var(--text-muted)',
                      fontVariantNumeric: 'tabular-nums',
                      minWidth: '1.5ch',
                      textAlign: 'right',
                      lineHeight: 1,
                    }}
                  >
                    {score}
                  </span>
                  <button
                    className="vote-bubble-btn"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', flexShrink: 0 }}
                    onClick={() => givePoints(id, 1)}
                    title={`Give 1 point to ${p.name}`}
                  >
                    +1
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ width: '100%', height: '5px', background: 'var(--border-subtle)', borderRadius: '99px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${progressPercent}%`,
                    backgroundColor: p.color,
                    borderRadius: '99px',
                    transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              </div>

              {/* Score fraction label */}
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'right', lineHeight: 1 }}>
                {score} / {battlePoints} pts
              </span>
            </div>
          );
        })}
      </div>

      {/* Quick point award panel */}
      {selectedIds.length > 0 && (
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-default)' }}>
          <label className="label-premium" style={{ marginBottom: '0.5rem', display: 'block' }}>🏅 Award Points</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <select id="quick-vote-target" className="input-premium select-premium" style={{ padding: '0.5rem 1rem' }}>
              {selectedIds.map((id) => {
                const p = getPersonaData(id);
                return (
                  <option key={id} value={id}>
                    {p?.emoji} {p?.name}
                  </option>
                );
              })}
            </select>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn-secondary"
                style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }}
                onClick={() => {
                  const select = document.getElementById('quick-vote-target') as HTMLSelectElement;
                  if (select?.value) givePoints(select.value, 1);
                }}
              >
                +1 Point
              </button>
              <button
                className="btn-secondary"
                style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }}
                onClick={() => {
                  const select = document.getElementById('quick-vote-target') as HTMLSelectElement;
                  if (select?.value) givePoints(select.value, 3);
                }}
              >
                +3 Points
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
