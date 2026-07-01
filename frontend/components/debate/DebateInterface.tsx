"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { personas } from '../../lib/debateData';
import { Persona, DebateTopic, DebateMessage, StanceConfig } from '../../lib/types';
import { debateStore } from '../../store/debateStore';
import { ThemeToggle } from './ThemeToggle';
import { SetupScreen } from './SetupScreen';
import { LiveArena } from './LiveArena';

export default function DebateInterface() {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Debate Settings
  const [topicText, setTopicText] = useState('');
  const [sideA, setSideA] = useState<StanceConfig>({ title: '', description: '' });
  const [sideB, setSideB] = useState<StanceConfig>({ title: '', description: '' });
  const [neutralStance, setNeutralStance] = useState<StanceConfig>({ title: '', description: '' });

  // Persona selections and sides
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [personaSides, setPersonaSides] = useState<Record<string, 'for' | 'against' | 'neutral'>>({});

  // Operational Settings
  const [battlePoints, setBattlePoints] = useState<number>(5);
  const [tickMs, setTickMs] = useState<number>(8000);
  const [generationMode, setGenerationMode] = useState<'auto' | 'manual'>('auto');
  const [apiStatus, setApiStatus] = useState<'idle' | 'realtime' | 'error'>('idle');
  const [apiErrorMessage, setApiErrorMessage] = useState<string>('');

  // Debate State
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
  ): Promise<{ argument: string; isRealtime: boolean; subtopic?: string; style?: string }> {
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
        selectedIds,
        personaSides,
        history: history.map(m => ({
          personaId: m.personaId,
          personaName: m.personaName,
          stance: m.stance,
          argument: m.argument,
          subtopic: m.subtopic,
          style: m.style
        }))
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData?.message || errData?.error || 'Failed to generate live debate response');
    }

    const data = await response.json();
    setApiStatus('realtime');
    return { 
      argument: data.argument, 
      isRealtime: true,
      subtopic: data.subtopic,
      style: data.style
    };
  }

  async function stepDebate() {
    if (!selectedIds.length || !topicText.trim() || isGeneratingNext) return;

    try {
      setIsGeneratingNext(true);
      setApiErrorMessage('');

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
        isRealtime: result.isRealtime,
        subtopic: result.subtopic,
        style: result.style
      };

      setMessages((m) => [msg, ...m]);
      activeIndex.current += 1;
    } catch (error: any) {
      console.error('❌ Debate Error:', error);
      setIsRunning(false);
      debateStore.endDebate();
      setApiStatus('error');
      setApiErrorMessage(error?.message || 'Connection to debate engine failed.');
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
    // Re-arm the store if it ended, otherwise just resume
    if (!debateStore.isRunning()) {
      debateStore.initializeDebate(topicText.trim(), selectedIds);
    }
    setIsRunning(true);
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

  const currentSpeakerId = useMemo(() => {
    if (!hasStarted || selectedIds.length === 0) return null;
    // Re-derive from messages.length so it updates after each turn
    return selectedIds[activeIndex.current % selectedIds.length] ?? null;
  }, [hasStarted, selectedIds, messages.length]);

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
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        </div>
      </header>

      {/* Main Panel views */}
      {!hasStarted ? (
        <SetupScreen
          topicText={topicText}
          setTopicText={setTopicText}
          sideA={sideA}
          setSideA={setSideA}
          sideB={sideB}
          setSideB={setSideB}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          personaSides={personaSides}
          setPersonaSides={setPersonaSides}
          generationMode={generationMode}
          setGenerationMode={setGenerationMode}
          tickMs={tickMs}
          setTickMs={setTickMs}
          battlePoints={battlePoints}
          setBattlePoints={setBattlePoints}
          startDebate={startDebate}
        />
      ) : (
        <LiveArena
          topic={topic}
          sideA={sideA}
          sideB={sideB}
          neutralStance={neutralStance}
          selectedIds={selectedIds}
          personaSides={personaSides}
          messages={messages}
          scores={scores}
          battlePoints={battlePoints}
          isRunning={isRunning}
          isGeneratingNext={isGeneratingNext}
          generationMode={generationMode}
          apiStatus={apiStatus}
          apiErrorMessage={apiErrorMessage}
          currentSpeakerId={currentSpeakerId}
          stopDebate={stopDebate}
          resumeDebate={resumeDebate}
          stepDebate={stepDebate}
          resetDebate={resetDebate}
          givePoints={givePoints}
        />
      )}
    </div>
  );
}
