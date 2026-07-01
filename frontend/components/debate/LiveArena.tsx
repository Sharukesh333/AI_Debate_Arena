import React from 'react';
import { DebateTopic, DebateMessage, StanceConfig } from '../../lib/types';
import { MessageList } from './MessageList';
import { Scoreboard } from './Scoreboard';

type LiveArenaProps = {
  topic: DebateTopic;
  sideA: StanceConfig;
  sideB: StanceConfig;
  neutralStance: StanceConfig;
  selectedIds: string[];
  personaSides: Record<string, 'for' | 'against' | 'neutral'>;
  messages: DebateMessage[];
  scores: Record<string, number>;
  battlePoints: number;
  isRunning: boolean;
  isGeneratingNext: boolean;
  generationMode: 'auto' | 'manual';
  apiStatus: 'idle' | 'realtime' | 'error';
  apiErrorMessage: string;
  currentSpeakerId: string | null;
  stopDebate: () => void;
  resumeDebate: () => void;
  stepDebate: () => void;
  resetDebate: () => void;
  givePoints: (id: string, count: number) => void;
};

export const LiveArena: React.FC<LiveArenaProps> = ({
  topic,
  sideA,
  sideB,
  neutralStance,
  selectedIds,
  personaSides,
  messages,
  scores,
  battlePoints,
  isRunning,
  isGeneratingNext,
  generationMode,
  apiStatus,
  apiErrorMessage,
  currentSpeakerId,
  stopDebate,
  resumeDebate,
  stepDebate,
  resetDebate,
  givePoints,
}) => {
  return (
    <div className="dashboard-grid animate-fade-in">
      {/* Main Left Debate Chat */}
      <section className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem' }}>💬 Live Debate Arena</h2>
              {isRunning && (
                <span className="live-badge">
                  <span className="live-dot" /> LIVE
                </span>
              )}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem', marginBottom: 0 }}>
              Topic: <strong>"{topic.title}"</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Play/Pause synchronized debate controls */}
            {generationMode === 'auto' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-elevated)', padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)' }}>
                {isRunning ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--side-neutral)', paddingRight: '0.4rem' }}>
                    <span className="live-dot" style={{ width: '8px', height: '8px', background: 'var(--side-neutral)', animation: 'pulse 1s infinite' }} />
                    PLAYING
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', paddingRight: '0.4rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--text-muted)' }} />
                    PAUSED
                  </span>
                )}
                
                <button
                  className="btn-primary"
                  onClick={resumeDebate}
                  disabled={isRunning || isGeneratingNext}
                  style={{
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.75rem',
                    boxShadow: 'none',
                    borderRadius: 'var(--radius-md)',
                    opacity: (isRunning || isGeneratingNext) ? 0.4 : 1,
                    cursor: (isRunning || isGeneratingNext) ? 'not-allowed' : 'pointer',
                    background: 'linear-gradient(135deg, var(--side-neutral) 0%, #10b981 100%)',
                    border: 'none',
                  }}
                  title="Play/Resume automatic debate turns"
                >
                  ▶️ Play
                </button>
                <button
                  className="btn-primary"
                  onClick={stopDebate}
                  disabled={!isRunning}
                  style={{
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.75rem',
                    boxShadow: 'none',
                    borderRadius: 'var(--radius-md)',
                    opacity: !isRunning ? 0.4 : 1,
                    cursor: !isRunning ? 'not-allowed' : 'pointer',
                    backgroundColor: '#ef4444',
                    backgroundImage: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                    border: 'none',
                    color: '#ffffff'
                  }}
                  title="Pause automatic debate turns"
                >
                  ⏸️ Pause
                </button>
              </div>
            )}

            {/* Manual Next Turn button */}
            {(generationMode === 'manual' || !isRunning) && (
              <button
                className="btn-primary"
                onClick={stepDebate}
                disabled={isGeneratingNext || (generationMode === 'auto' && isRunning)}
                style={{
                  boxShadow: 'var(--shadow-sm)',
                  padding: '0.55rem 1.1rem',
                  fontSize: '0.85rem',
                  background: 'linear-gradient(135deg, var(--accent-primary) 0%, #4f46e5 100%)',
                  border: 'none',
                }}
              >
                {isGeneratingNext ? '🎤 Speaking...' : '➡️ Next Turn'}
              </button>
            )}

            <button
              className="btn-secondary"
              onClick={resetDebate}
              style={{
                color: '#ef4444',
                borderColor: 'rgba(239, 68, 68, 0.2)',
                padding: '0.55rem 1.1rem',
                fontSize: '0.85rem',
              }}
            >
              ↩️ Exit Arena
            </button>
          </div>
        </div>

        {/* Display Active Status / Error / Fallback warnings */}
        {apiStatus !== 'idle' && (
          <div
            className={`system-alert ${apiStatus === 'error' ? 'system-alert-error' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              padding: '1rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: apiStatus === 'error' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(99, 102, 241, 0.08)',
              border: `1px solid ${apiStatus === 'error' ? '#ef4444' : 'var(--accent-primary)'}30`,
              marginTop: '0.25rem'
            }}
          >
            <span style={{ fontSize: '1.25rem', marginTop: '2px' }}>
              {apiStatus === 'realtime' ? '⚡' : '⚠️'}
            </span>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
              <strong style={{ display: 'block', fontSize: '0.85rem', color: apiStatus === 'error' ? '#f87171' : 'var(--text-primary)' }}>
                {apiStatus === 'realtime' ? 'Dynamic Realtime Debate Engine (Groq API)' : 'Debate Engine Error'}
              </strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                {apiStatus === 'realtime'
                  ? 'Arguments are being synthesized on the fly using live LLM reasoning.'
                  : apiErrorMessage || 'An unexpected error occurred during live generation.'}
              </span>
            </div>
          </div>
        )}

        {/* Stances visual index bar */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          background: 'var(--bg-elevated)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Stance Positions:</span>
          <span style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--side-a)' }} />
            <strong>Side A:</strong> {sideA.title || 'Pro'}
          </span>
          <span style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--side-b)' }} />
            <strong>Side B:</strong> {sideB.title || 'Con'}
          </span>
          <span style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--side-neutral)' }} />
            <strong>Neutral Stance</strong>
          </span>
        </div>

        {/* Chat Box Area */}
        <MessageList
          messages={messages}
          generationMode={generationMode}
          resetDebate={resetDebate}
          givePoints={givePoints}
          isGeneratingNext={isGeneratingNext}
          currentSpeakerId={currentSpeakerId}
          personaSides={personaSides}
        />
      </section>

      {/* Right Section: Scoreboard sidebar */}
      <Scoreboard
        selectedIds={selectedIds}
        scores={scores}
        battlePoints={battlePoints}
        currentSpeakerId={currentSpeakerId}
        isRunning={isRunning}
        personaSides={personaSides}
        sideA={sideA}
        sideB={sideB}
        givePoints={givePoints}
      />
    </div>
  );
};
