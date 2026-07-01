import React, { useEffect, useRef } from 'react';
import { personas } from '../../lib/debateData';
import { DebateMessage } from '../../lib/types';

type MessageListProps = {
  messages: DebateMessage[];
  generationMode: 'auto' | 'manual';
  resetDebate: () => void;
  givePoints: (id: string, count: number) => void;
  isGeneratingNext?: boolean;
  currentSpeakerId?: string | null;
  personaSides?: Record<string, 'for' | 'against' | 'neutral'>;
};

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  generationMode,
  resetDebate,
  givePoints,
  isGeneratingNext = false,
  currentSpeakerId = null,
  personaSides = {},
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever messages list grows or generation status changes
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isGeneratingNext]);

  const getPersonaData = (id: string) => personas.find((p) => p.id === id);

  // Render messages chronologically (oldest at the top, newest at the bottom)
  const chronologicalMessages = [...messages].reverse();

  return (
    <div className="chat-container" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      overflowY: 'auto',
      maxHeight: '520px',
      padding: '1.25rem',
      borderRadius: 'var(--radius-lg)',
      backgroundColor: 'var(--bg-base)',
      border: '1px solid var(--border-default)',
      scrollBehavior: 'smooth',
      minHeight: '280px',
    }}>
      {messages.length === 0 && !isGeneratingNext ? (
        <div style={{
          color: 'var(--text-secondary)',
          textAlign: 'center',
          padding: '60px 10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          flex: 1,
        }}>
          <span style={{ fontSize: '3rem', animation: 'bounce 2s infinite' }}>🎤</span>
          <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>
            Arena is ready. Click <strong>{generationMode === 'auto' ? 'Play / Resume' : 'Next Turn'}</strong> to initiate the opening arguments.
          </span>
        </div>
      ) : (
        <>
          {chronologicalMessages.map((m) => {
            const isWinner = m.id.startsWith('winner');
            if (isWinner) {
              return (
                <div
                  key={m.id}
                  className="winner-banner fade-in-up"
                  style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)',
                    border: '2px dashed var(--side-neutral)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '1.5rem',
                    textAlign: 'center',
                    marginTop: '1.5rem',
                    boxShadow: 'var(--shadow-md)',
                    animation: 'pulse-border 2s infinite',
                  }}
                >
                  <h3 style={{ fontSize: '1.35rem', color: 'var(--side-neutral)', fontWeight: 'bold', margin: 0 }}>
                    🏆 Debate Finished
                  </h3>
                  <p style={{ marginTop: '0.75rem', lineHeight: '1.6', fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {m.argument}
                  </p>
                  <button
                    className="btn-secondary"
                    onClick={resetDebate}
                    style={{ margin: '1rem auto 0', display: 'inline-flex', alignSelf: 'center' }}
                  >
                    Start New Debate
                  </button>
                </div>
              );
            }

            const p = getPersonaData(m.personaId);
            const stanceBadge = { for: 'Side A', against: 'Side B', neutral: 'Neutral' }[m.stance];

            return (
              <div
                key={m.id}
                className={`message-wrapper stance-${m.stance} fade-in-up`}
                style={{
                  display: 'flex',
                  justifyContent: m.stance === 'for' ? 'flex-start' : m.stance === 'against' ? 'flex-end' : 'center',
                  width: '100%',
                }}
              >
                <div
                  className="chat-bubble animate-msg-in"
                  style={{
                    maxWidth: '85%',
                    width: 'fit-content',
                    backgroundColor: m.stance === 'for' ? 'var(--side-a-glow)' : m.stance === 'against' ? 'var(--side-b-glow)' : 'var(--side-neutral-glow)',
                    border: `1px solid ${m.stance === 'for' ? 'var(--side-a)' : m.stance === 'against' ? 'var(--side-b)' : 'var(--side-neutral)'}30`,
                    borderRadius: 'var(--radius-lg)',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    boxShadow: 'var(--shadow-xs)',
                    borderLeft: `4px solid ${m.stance === 'for' ? 'var(--side-a)' : m.stance === 'against' ? 'var(--side-b)' : 'var(--side-neutral)'}`,
                  }}
                >
                  <div
                    className="bubble-header"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem',
                      fontSize: '0.8rem',
                      borderBottom: '1px solid var(--border-subtle)',
                      paddingBottom: '0.25rem',
                    }}
                  >
                    <div className="bubble-meta" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="speaker-name" style={{ color: p?.color, fontWeight: 700 }}>
                        {p?.emoji} {m.personaName}
                      </span>
                      <span
                        className={`side-badge ${m.stance}`}
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '0.1rem 0.35rem',
                          borderRadius: '4px',
                          backgroundColor: m.stance === 'for' ? 'var(--side-a)' : m.stance === 'against' ? 'var(--side-b)' : 'var(--side-neutral)',
                          color: '#fff',
                        }}
                      >
                        {stanceBadge}
                      </span>
                      {m.isRealtime && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--accent-primary)', fontWeight: 800, background: 'rgba(99, 102, 241, 0.1)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>
                          ⚡ GROQ
                        </span>
                      )}
                      {m.subtopic && (
                        <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 700, background: 'rgba(16, 185, 129, 0.1)', padding: '0.1rem 0.35rem', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.2)' }} title="Assigned subtopic focus">
                          🎯 {m.subtopic}
                        </span>
                      )}
                      {m.style && (
                        <span style={{ fontSize: '0.65rem', color: '#fbbf24', fontWeight: 700, background: 'rgba(251, 191, 36, 0.1)', padding: '0.1rem 0.35rem', borderRadius: '4px', border: '1px solid rgba(251, 191, 36, 0.2)' }} title="Active turn debate style">
                          🎭 {m.style}
                        </span>
                      )}
                    </div>
                    <span className="bubble-time" style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                      {new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  
                  <div className="bubble-content" style={{ fontSize: '0.925rem', lineHeight: '1.5', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                    {m.argument}
                  </div>

                  <div className="bubble-footer" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                    <button
                      className="vote-bubble-btn"
                      onClick={() => givePoints(m.personaId, 1)}
                      title={`Vote for ${m.personaName}'s argument`}
                    >
                      👍 Vote +1 Point
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator for active speaker */}
          {isGeneratingNext && currentSpeakerId && (() => {
            const p = getPersonaData(currentSpeakerId);
            if (!p) return null;
            const stance = personaSides[currentSpeakerId] || 'neutral';
            const stanceLabel = { for: 'Side A', against: 'Side B', neutral: 'Neutral' }[stance];

            return (
              <div
                className={`message-wrapper stance-${stance} fade-in-up`}
                style={{
                  display: 'flex',
                  justifyContent: stance === 'for' ? 'flex-start' : stance === 'against' ? 'flex-end' : 'center',
                  width: '100%',
                }}
              >
                <div
                  className="chat-bubble"
                  style={{
                    maxWidth: '85%',
                    width: 'fit-content',
                    backgroundColor: stance === 'for' ? 'var(--side-a-glow)' : stance === 'against' ? 'var(--side-b-glow)' : 'var(--side-neutral-glow)',
                    border: `1px solid ${stance === 'for' ? 'var(--side-a)' : stance === 'against' ? 'var(--side-b)' : 'var(--side-neutral)'}30`,
                    borderRadius: 'var(--radius-lg)',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    boxShadow: 'var(--shadow-xs)',
                    borderLeft: `4px solid ${stance === 'for' ? 'var(--side-a)' : stance === 'against' ? 'var(--side-b)' : 'var(--side-neutral)'}`,
                    opacity: 0.85,
                  }}
                >
                  <div
                    className="bubble-header"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem',
                      fontSize: '0.8rem',
                      borderBottom: '1px solid var(--border-subtle)',
                      paddingBottom: '0.25rem',
                    }}
                  >
                    <div className="bubble-meta" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="speaker-name" style={{ color: p.color, fontWeight: 700 }}>
                        {p.emoji} {p.name}
                      </span>
                      <span
                        className={`side-badge ${stance}`}
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '0.1rem 0.35rem',
                          borderRadius: '4px',
                          backgroundColor: stance === 'for' ? 'var(--side-a)' : stance === 'against' ? 'var(--side-b)' : 'var(--side-neutral)',
                          color: '#fff',
                        }}
                      >
                        {stanceLabel}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <span>{p.typingPhrase || 'thinking...'}</span>
                    <div className="typing-loader">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </>
      )}
      <div ref={bottomRef} />
    </div>
  );
};
