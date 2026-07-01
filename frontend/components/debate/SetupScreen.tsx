import React from 'react';
import { personas } from '../../lib/debateData';
import { StanceConfig } from '../../lib/types';

type SetupScreenProps = {
  topicText: string;
  setTopicText: (val: string) => void;
  sideA: StanceConfig;
  setSideA: (val: StanceConfig) => void;
  sideB: StanceConfig;
  setSideB: (val: StanceConfig) => void;
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  personaSides: Record<string, 'for' | 'against' | 'neutral'>;
  setPersonaSides: React.Dispatch<React.SetStateAction<Record<string, 'for' | 'against' | 'neutral'>>>;
  generationMode: 'auto' | 'manual';
  setGenerationMode: (val: 'auto' | 'manual') => void;
  tickMs: number;
  setTickMs: (val: number) => void;
  battlePoints: number;
  setBattlePoints: (val: number) => void;
  startDebate: () => void;
};

export const SetupScreen: React.FC<SetupScreenProps> = ({
  topicText,
  setTopicText,
  sideA,
  setSideA,
  sideB,
  setSideB,
  selectedIds,
  setSelectedIds,
  personaSides,
  setPersonaSides,
  generationMode,
  setGenerationMode,
  tickMs,
  setTickMs,
  battlePoints,
  setBattlePoints,
  startDebate,
}) => {
  return (
    <section className="glass-panel animate-fade-in">
      <div className="hero-title-section">
        <h1>Host engaging debates between AI personas.</h1>
        <p className="hero-desc">
          Define the topic, specify Side A and Side B positions, assign famous public figures to their stances, and watch a dynamic debate unfold.
        </p>
      </div>

      <div className="input-group">
        <label className="label-premium">📌 Debate Topic</label>
        <input
          className="input-premium"
          value={topicText}
          onChange={(e) => setTopicText(e.target.value)}
          placeholder="Enter any debate topic (e.g. Is colonizing Mars worth it?)"
        />
      </div>

      <div className="setup-grid">
        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--side-a)', gap: '1rem' }}>
          <div className="input-group">
            <label className="label-premium" style={{ color: 'var(--side-a)' }}>🔵 Side A Name / Stance</label>
            <input
              className="input-premium"
              value={sideA.title}
              onChange={(e) => setSideA({ ...sideA, title: e.target.value })}
              placeholder="Enter Side A name (e.g. Pro-Colonization)"
            />
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--side-b)', gap: '1rem' }}>
          <div className="input-group">
            <label className="label-premium" style={{ color: 'var(--side-b)' }}>🔴 Side B Name / Stance</label>
            <input
              className="input-premium"
              value={sideB.title}
              onChange={(e) => setSideB({ ...sideB, title: e.target.value })}
              placeholder="Enter Side B name (e.g. Anti-Colonization)"
            />
          </div>
        </div>
      </div>

      {/* AI Debaters Selection */}
      <div className="input-group">
        <label className="label-premium">🎭 Select AI Debaters & Stance Positions ({selectedIds.length} Selected)</label>
        <div className="persona-selector-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
          {personas.map((p) => {
            const isSelected = selectedIds.includes(p.id);
            const assignedSide = personaSides[p.id] || 'neutral';
            return (
              <div key={p.id} className={`persona-label-card ${isSelected ? 'active' : ''}`} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '1rem',
                border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: isSelected ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                transition: 'all 0.2s ease',
              }}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  style={{ cursor: 'pointer', width: '18px', height: '18px', marginTop: '3px' }}
                  onChange={(e) => {
                    setSelectedIds((curr) =>
                      e.target.checked ? [...curr, p.id] : curr.filter((id) => id !== p.id)
                    );
                  }}
                />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontWeight: 600, color: p.color, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span>{p.emoji}</span>
                    <span>{p.name}</span>
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.tone}</span>

                  {/* Side selection dropdown — shown only when persona is checked */}
                  {isSelected && (
                    <select
                      className="input-premium select-premium"
                      style={{ padding: '0.25rem 0.5rem', marginTop: '0.4rem', fontSize: '0.8rem', borderRadius: '8px' }}
                      value={assignedSide}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const newSide = e.target.value as 'for' | 'against' | 'neutral';
                        setPersonaSides(prev => ({ ...prev, [p.id]: newSide }));
                      }}
                    >
                      <option value="for">Side A {sideA.title ? `(${sideA.title})` : ''}</option>
                      <option value="against">Side B {sideB.title ? `(${sideB.title})` : ''}</option>
                      <option value="neutral">Neutral</option>
                    </select>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Generation Mode + Inline Settings */}
      <div className="setup-grid">
        <div className="input-group">
          <label className="label-premium">⚡ Generation Mode</label>
          <div className="toggle-group" style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-elevated)', padding: '0.25rem', borderRadius: 'var(--radius-lg)' }}>
            <button
              type="button"
              className={`toggle-btn ${generationMode === 'auto' ? 'active' : ''}`}
              style={{
                flex: 1,
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.875rem',
                transition: 'all 0.2s ease',
                background: generationMode === 'auto' ? 'var(--accent-primary)' : 'transparent',
                color: generationMode === 'auto' ? '#fff' : 'var(--text-secondary)',
              }}
              onClick={() => setGenerationMode('auto')}
            >
              Auto Play
            </button>
            <button
              type="button"
              className={`toggle-btn ${generationMode === 'manual' ? 'active' : ''}`}
              style={{
                flex: 1,
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.875rem',
                transition: 'all 0.2s ease',
                background: generationMode === 'manual' ? 'var(--accent-primary)' : 'transparent',
                color: generationMode === 'manual' ? '#fff' : 'var(--text-secondary)',
              }}
              onClick={() => setGenerationMode('manual')}
            >
              Manual Turns
            </button>
          </div>
        </div>

        <div className="input-group">
          <label className="label-premium">⏱️ Auto Turn Speed (ms)</label>
          <input
            type="number"
            min={1500}
            step={500}
            className="input-premium"
            value={tickMs}
            onChange={(e) => setTickMs(Number(e.target.value))}
            placeholder="8000"
          />
        </div>

        <div className="input-group">
          <label className="label-premium">🏆 Battle Points to Win</label>
          <input
            type="number"
            min={1}
            className="input-premium"
            value={battlePoints}
            onChange={(e) => setBattlePoints(Number(e.target.value))}
            placeholder="5"
          />
        </div>
      </div>

      <button className="btn-primary" onClick={startDebate} style={{ marginTop: '1rem', width: '100%' }}>
        🎙️ Start Live Debate Arena
      </button>
    </section>
  );
};
