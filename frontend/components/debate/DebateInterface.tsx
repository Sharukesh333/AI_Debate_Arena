"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { personas, Persona, DebateTopic, generateArgument } from '../../lib/debateData';
import { DebateContext } from '../../lib/debateContext';
import { debateStore } from '../../store/debateStore';

type DebateMessage = {
  id: string;
  personaId: string;
  personaName: string;
  argument: string;
  stance: 'for' | 'against' | 'neutral';
  time: number;
  refersToMessageId?: string;
  isRealtime?: boolean;
};

type StanceConfig = {
  title: string;
  description: string;
};

export default function DebateInterface() {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Debate Settings - all empty defaults (placeholder only)
  const [topicText, setTopicText] = useState('');
  const [sideA, setSideA] = useState<StanceConfig>({ title: '', description: '' });
  const [sideB, setSideB] = useState<StanceConfig>({ title: '', description: '' });
  const [neutralStance, setNeutralStance] = useState<StanceConfig>({ title: '', description: '' });

  // No default selections
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Persona side assignments
  const [personaSides, setPersonaSides] = useState<Record<string, 'for' | 'against' | 'neutral'>>({});

  // Settings - default 8 seconds, customizable inline
  const [battlePoints, setBattlePoints] = useState<number>(5);
  const [tickMs, setTickMs] = useState<number>(8000);
  const [generationMode, setGenerationMode] = useState<'auto' | 'manual'>('auto');
  const [apiStatus, setApiStatus] = useState<'idle' | 'realtime' | 'fallback'>('idle');
  const [apiErrorMessage, setApiErrorMessage] = useState<string>('');

  // Debate state
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isGeneratingNext, setIsGeneratingNext] = useState(false);

  const activeIndex = useRef(0);
  const intervalRef = useRef<number | null>(null);

  const topic: DebateTopic = useMemo(() => {
    return { id: 'custom', title: topicText.trim() || 'Custom debate topic', description: '' };
  }, [topicText]);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('arena-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  // Sync scores structure with selected IDs
  useEffect(() => {
    const initial: Record<string, number> = {};
    selectedIds.forEach((id) => {
      initial[id] = scores[id] ?? 0;
    });
    setScores(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds.join(',')]);

  // Handle auto generation timer
  useEffect(() => {
    if (isRunning && generationMode === 'auto') {
      intervalRef.current = window.setInterval(() => {
        stepDebate();
      }, tickMs);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, tickMs, generationMode, selectedIds, topicText, personaSides, sideA, sideB, neutralStance]);

  // Toggle theme handler
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('arena-theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  async function generateNextArgument(
    speaker: Persona,
    speakerSide: 'for' | 'against' | 'neutral',
    history: DebateMessage[]
  ): Promise<{ argument: string; isRealtime: boolean }> {
    try {
      setApiErrorMessage('');
      const response = await fetch('/api/debate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic.title,
          sideA,
          sideB,
          neutralStance,
          speaker: {
            id: speaker.id,
            name: speaker.name,
            tone: speaker.tone,
            side: speakerSide
          },
          history: history.map(m => ({
            personaName: m.personaName,
            stance: m.stance,
            argument: m.argument
          }))
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData?.message || errData?.error || 'Failed to call debate API');
      }

      const data = await response.json();
      setApiStatus('realtime');
      return { argument: data.argument, isRealtime: true };
    } catch (err: any) {
      console.warn('Realtime generation failed. Falling back to templates. Reason:', err?.message || err);
      if (err?.message && err.message.includes('API_KEY_MISSING')) {
        setApiErrorMessage('No API Key configured on server. Using local English templates.');
      } else {
        setApiErrorMessage(`API Error: ${err?.message || 'Connection failed'}. Using local English templates.`);
      }

      setApiStatus('fallback');

      // Local fallback generation
      const argument = generateArgument(topic, speaker, {
        topic: topic.title,
        messages: history.map((m, idx) => ({
          id: m.id,
          personaId: m.personaId,
          personaName: m.personaName,
          stance: m.stance,
          argument: m.argument,
          refersToMessageId: m.refersToMessageId,
          timestamp: m.time
        })),
        currentSpeakerId: speaker.id,
        previousSpeakerId: history.length > 0 ? history[0].personaId : undefined,
        round: Math.floor(history.length / (selectedIds.length || 1)) + 1
      } as DebateContext, speakerSide);

      return { argument, isRealtime: false };
    }
  }

  async function stepDebate() {
    if (!selectedIds.length || !topicText.trim() || isGeneratingNext) return;

    try {
      setIsGeneratingNext(true);

      if (!debateStore.isRunning()) {
        setIsRunning(false);
        setIsGeneratingNext(false);
        return;
      }

      if (!debateStore.verifyPersonalityList(selectedIds)) {
        throw new Error('Selected personalities changed during debate. Stopping...');
      }

      const nextSpeakerId = debateStore.getNextSpeaker(activeIndex.current);
      debateStore.validateSpeaker(nextSpeakerId);

      const persona = personas.find((p) => p.id === nextSpeakerId) as Persona;
      if (!persona) {
        throw new Error(`Persona ${nextSpeakerId} not found in authorized list`);
      }

      debateStore.recordSpeaker(nextSpeakerId);

      const speakerSide = personaSides[nextSpeakerId] || 'neutral';

      const result = await generateNextArgument(persona, speakerSide, messages);

      const msg: DebateMessage = {
        id: `${persona.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        personaId: persona.id,
        personaName: persona.name,
        argument: result.argument,
        stance: speakerSide,
        time: Date.now(),
        refersToMessageId: messages.length > 0 ? messages[0].id : undefined,
        isRealtime: result.isRealtime
      };

      setMessages((m) => [msg, ...m]);
      activeIndex.current += 1;
    } catch (error) {
      console.error('❌ Debate Error:', error);
      setIsRunning(false);
      debateStore.endDebate();
      if (error instanceof Error) {
        alert(`Debate stopped: ${error.message}`);
      }
    } finally {
      setIsGeneratingNext(false);
    }
  }

  function checkWinner(nextScores: Record<string, number>) {
    const winner = Object.entries(nextScores).find(([, v]) => v >= battlePoints);
    if (winner) {
      const id = winner[0];

      try {
        debateStore.validateSpeaker(id);
      } catch (error) {
        console.error('❌ SECURITY: Non-selected personality attempted to win:', id);
        return;
      }

      setIsRunning(false);
      debateStore.endDebate();

      const p = personas.find((pp) => pp.id === id);
      const winMsg: DebateMessage = {
        id: `winner-${Date.now()}`,
        personaId: id,
        personaName: p?.name ?? id,
        argument: `🏆 ${p?.name ?? id} wins the debate with ${nextScores[id]} points!`,
        stance: 'neutral',
        time: Date.now()
      };
      setMessages((m) => [winMsg, ...m]);
    }
  }

  function startDebate() {
    if (!topicText.trim()) return alert('Please enter a debate topic.');
    if (selectedIds.length < 2) return alert('Select at least 2 AIs to start the debate.');

    try {
      debateStore.initializeDebate(topicText.trim(), selectedIds);

      const initialScores: Record<string, number> = {};
      selectedIds.forEach((id) => (initialScores[id] = 0));
      setScores(initialScores);
      setMessages([]);
      activeIndex.current = 0;
      setHasStarted(true);
      setApiStatus('idle');

      if (generationMode === 'auto') {
        setIsRunning(true);
      } else {
        setIsRunning(false);
      }
    } catch (error) {
      console.error('Failed to start debate:', error);
      alert(`Failed to start debate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  function stopDebate() {
    setIsRunning(false);
  }

  function resumeDebate() {
    setIsRunning(true);
    debateStore.initializeDebate(topicText.trim(), selectedIds);
  }

  function resetDebate() {
    setIsRunning(false);
    setHasStarted(false);
    setMessages([]);
    debateStore.reset();
  }

  function givePoints(id: string, count: number = 1) {
    try {
      debateStore.validateSpeaker(id);
      setScores((s) => {
        const next = { ...s, [id]: (s[id] || 0) + count };
        checkWinner(next);
        return next;
      });
    } catch (err: any) {
      alert(`Cannot award points: ${err?.message || 'Unauthorized speaker'}`);
    }
  }

  const getPersonaData = (id: string) => personas.find(p => p.id === id);

  const currentSpeakerId = useMemo(() => {
    if (!hasStarted || selectedIds.length === 0) return null;
    return debateStore.getNextSpeaker(activeIndex.current);
  }, [hasStarted, activeIndex.current, selectedIds]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Top Navbar */}
      <header className="navbar">
        <div className="brand-section">
          <span style={{ fontSize: '2rem' }}>🎙️</span>
          <div>
            <h1 className="brand-logo">AI Debate Arena</h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Realtime Production Sandbox</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            className="btn-theme"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* Setup screen if debate hasn't started */}
      {!hasStarted ? (
        <section className="glass-panel">
          <div className="hero-title-section">
            <h1>Host engaging debates between AI personas.</h1>
            <p className="hero-desc">
              Define the topic, specify Side A, Side B, and Neutral stances, assign AI debaters to their positions, and watch a dynamic debate unfold.
            </p>
          </div>

          <div className="input-group">
            <label className="label-premium">📌 Debate Topic</label>
            <input
              className="input-premium"
              value={topicText}
              onChange={(e) => setTopicText(e.target.value)}
              placeholder="Enter any debate topic"
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
                  placeholder="Enter Side A name"
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
                  placeholder="Enter Side B name"
                />
              </div>
            </div>
          </div>



          {/* AI Debaters Selection */}
          <div className="input-group">
            <label className="label-premium">🎭 Select AI Debaters & Stance Positions ({selectedIds.length} Selected)</label>
            <div className="persona-selector-grid">
              {personas.map((p) => {
                const isSelected = selectedIds.includes(p.id);
                const assignedSide = personaSides[p.id] || 'neutral';
                return (
                  <div key={p.id} className={`persona-label-card ${isSelected ? 'active' : ''}`}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      onChange={(e) => {
                        setSelectedIds((curr) =>
                          e.target.checked ? [...curr, p.id] : curr.filter((id) => id !== p.id)
                        );
                      }}
                    />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <span style={{ fontWeight: 600, color: p.color }}>{p.name}</span>
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
                          <option value="for">Side A{sideA.title ? ` (${sideA.title})` : ''}</option>
                          <option value="against">Side B{sideB.title ? ` (${sideB.title})` : ''}</option>
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
              <div className="toggle-group">
                <button
                  className={`toggle-btn ${generationMode === 'auto' ? 'active' : ''}`}
                  onClick={() => setGenerationMode('auto')}
                >
                  Auto Play
                </button>
                <button
                  className={`toggle-btn ${generationMode === 'manual' ? 'active' : ''}`}
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
      ) : (
        /* Live Arena Grid */
        <div className="dashboard-grid">

          {/* Main Left Debate Chat */}
          <section className="glass-panel">
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
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                  Topic: <strong>"{topic.title}"</strong>
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {generationMode === 'auto' ? (
                  <button className="btn-secondary" onClick={stopDebate} disabled={!isRunning}>
                    ⏸️ Pause
                  </button>
                ) : null}
                {generationMode === 'auto' && !isRunning ? (
                  <button className="btn-primary" onClick={resumeDebate} style={{ boxShadow: 'none' }}>
                    ▶️ Play
                  </button>
                ) : null}

                {/* Manual Next Turn button */}
                {(generationMode === 'manual' || !isRunning) && (
                  <button
                    className="btn-primary"
                    onClick={stepDebate}
                    disabled={isGeneratingNext}
                    style={{ boxShadow: 'none' }}
                  >
                    {isGeneratingNext ? 'Generating...' : '➡️ Next Turn'}
                  </button>
                )}

                <button className="btn-secondary" onClick={resetDebate} style={{ color: '#ef4444' }}>
                  ↩️ Exit
                </button>
              </div>
            </div>

            {/* Display Active Status / Error / Fallback warnings */}
            {apiStatus !== 'idle' && (
              <div className={`system-alert ${apiStatus === 'fallback' ? 'system-alert-error' : ''}`}>
                <span style={{ fontSize: '1.2rem' }}>{apiStatus === 'realtime' ? '⚡' : '⚠️'}</span>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.85rem' }}>
                    {apiStatus === 'realtime' ? 'Dynamic Realtime Debate Engine (Gemini 2.0 Flash Lite)' : 'Fallback Mode Active'}
                  </strong>
                  <span style={{ fontSize: '0.8rem' }}>
                    {apiStatus === 'realtime'
                      ? 'Arguments are being synthesized on the fly using live LLM reasoning.'
                      : apiErrorMessage || 'Using localized fallback templates in English.'}
                  </span>
                </div>
              </div>
            )}

            {/* Stances visual index bar */}
            <div style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem', background: 'var(--status-bar-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Stance Positions:</span>
              <span style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--side-a)' }} />
                <strong>Side A:</strong> {sideA.title || 'Pro'}
              </span>
              <span style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--side-b)' }} />
                <strong>Side B:</strong> {sideB.title || 'Con'}
              </span>
              <span style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--side-neutral)' }} />
                <strong>Neutral Stance</strong>
              </span>
            </div>

            {/* Chat Box Area */}
            <div className="chat-container">
              {messages.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 10px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <span style={{ fontSize: '2.5rem' }}>🎤</span>
                  <span>Arena is ready. Click <strong>{generationMode === 'auto' ? 'Play' : 'Next Turn'}</strong> to initiate the opening arguments.</span>
                </div>
              ) : (
                messages.map((m) => {
                  const isWinner = m.id.startsWith('winner');
                  if (isWinner) {
                    return (
                      <div key={m.id} className="winner-banner">
                        <h3 style={{ fontSize: '1.25rem', color: 'var(--side-neutral)', fontWeight: 'bold' }}>🏆 Debate Finished</h3>
                        <p style={{ marginTop: '0.5rem', lineHeight: '1.6', fontSize: '1rem' }}>{m.argument}</p>
                        <button className="btn-secondary" onClick={resetDebate} style={{ margin: '1rem auto 0', width: 'auto' }}>
                          Start New Debate
                        </button>
                      </div>
                    );
                  }

                  const p = getPersonaData(m.personaId);
                  const stanceBadge = { for: 'Side A', against: 'Side B', neutral: 'Neutral' }[m.stance];

                  return (
                    <div key={m.id} className={`message-wrapper stance-${m.stance}`}>
                      <div className="chat-bubble">
                        <div className="bubble-header">
                          <div className="bubble-meta">
                            <span className="speaker-name" style={{ color: p?.color }}>{m.personaName}</span>
                            <span className={`side-badge ${m.stance}`}>{stanceBadge}</span>
                            {m.isRealtime && <span style={{ fontSize: '0.7rem', color: 'var(--primary-accent)', fontWeight: 800 }}>⚡ LIVE</span>}
                          </div>
                          <span className="bubble-time">{new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        </div>
                        <div className="bubble-content">{m.argument}</div>

                        <div className="bubble-footer">
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
                })
              )}
            </div>
          </section>

          {/* Right Section: Authorized Debaters Scoreboard */}
          <section className="glass-panel" style={{ height: 'fit-content' }}>
            <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📊 Debater Scoreboard
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Points are awarded manually. Watch the bars fill towards the target of <strong>{battlePoints} points</strong>!
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
              {selectedIds.map((id) => {
                const p = getPersonaData(id);
                if (!p) return null;
                const score = scores[id] ?? 0;
                const progressPercent = Math.min((score / battlePoints) * 100, 100);
                const isCurrent = currentSpeakerId === id;
                const assignedSide = personaSides[id] || 'neutral';
                const sideText = assignedSide === 'for'
                  ? `Side A${sideA.title ? ` (${sideA.title})` : ''}`
                  : assignedSide === 'against'
                    ? `Side B${sideB.title ? ` (${sideB.title})` : ''}`
                    : 'Neutral';

                return (
                  <div
                    key={id}
                    className={`score-card-item ${isCurrent && isRunning ? 'active-speaker-ring' : ''}`}
                    style={{
                      '--accent': p.color,
                      borderColor: isCurrent && isRunning ? p.color : 'var(--card-border)'
                    } as any}
                  >
                    <div className="score-card-header">
                      <div className="score-card-identity">
                        <span className="score-card-name" style={{ color: p.color }}>
                          {p.name} {isCurrent && isRunning && <span style={{ fontSize: '0.75rem', animation: 'pulse 1s infinite' }}>🎤 Speaking...</span>}
                        </span>
                        <span className="score-card-tone">
                          Tone: {p.tone} • <span style={{ fontWeight: 'bold' }}>{sideText}</span>
                        </span>
                      </div>

                      <div className="score-display-panel">
                        <span className="score-digits" style={{ color: score > 0 ? p.color : 'var(--text-secondary)' }}>
                          {score}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <button
                            className="vote-bubble-btn"
                            style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}
                            onClick={() => givePoints(id, 1)}
                          >
                            +1
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bar-container">
                      <div
                        className="bar-fill"
                        style={{
                          width: `${progressPercent}%`,
                          '--accent': p.color
                        } as any}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick point adjustment widget */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--card-border)' }}>
              <label className="label-premium" style={{ marginBottom: '0.5rem' }}>🏅 Arbitrary Points Panel</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <select id="quick-vote-target" className="input-premium select-premium" style={{ padding: '0.55rem 1rem' }}>
                  {selectedIds.map((id) => (
                    <option key={id} value={id}>
                      {getPersonaData(id)?.name}
                    </option>
                  ))}
                </select>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => {
                      const select = document.getElementById('quick-vote-target') as HTMLSelectElement;
                      if (select?.value) givePoints(select.value, 1);
                    }}
                  >
                    +1 Point
                  </button>
                  <button
                    className="btn-secondary"
                    style={{ flex: 1 }}
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
          </section>
        </div>
      )}
    </div>
  );
}
