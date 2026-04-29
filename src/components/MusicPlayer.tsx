/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Music as MusicIcon, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

const TRACKS = [
  {
    id: 1,
    title: "Neon Pulse",
    artist: "SynthWave Pro",
    cover: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    mood: Difficulty.MEDIUM
  },
  {
    id: 2,
    title: "Midnight Drive",
    artist: "Electro Drift",
    cover: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    mood: Difficulty.HARD
  },
  {
    id: 3,
    title: "Cyber City",
    artist: "Glitch Master",
    cover: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=2070&auto=format&fit=crop",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    mood: Difficulty.EASY
  }
];

interface ScoreInfo {
  score: number;
  highScore: number;
  updateScore: (score: number, highScore: number) => void;
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  audioData: Uint8Array | null;
}

interface MusicPlayerProps {
  children: (info: ScoreInfo) => ReactNode;
}

export default function MusicPlayer({ children }: MusicPlayerProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scores, setScores] = useState({ score: 0, highScore: 0 });
  const [audioData, setAudioData] = useState<Uint8Array | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>(0);

  // Filter tracks by difficulty-mood
  const filteredTracks = useMemo(() => {
    const preferred = TRACKS.find(t => t.mood === difficulty);
    return preferred ? [preferred, ...TRACKS.filter(t => t.id !== preferred.id)] : TRACKS;
  }, [difficulty]);

  useEffect(() => {
    // When difficulty changes, switch to the mood-matching track
    const match = TRACKS.findIndex(t => t.mood === difficulty);
    if (match !== -1 && match !== currentTrackIndex) {
       setCurrentTrackIndex(match);
    }
  }, [difficulty]);

  const currentTrack = TRACKS[currentTrackIndex];

  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      if (!audioContextRef.current) {
        const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
        const ctx = new AudioContextClass();
        const source = ctx.createMediaElementSource(audioRef.current);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyser.connect(ctx.destination);
        
        audioContextRef.current = ctx;
        analyserRef.current = analyser;
      }

      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      audioRef.current.play().catch(e => console.log("Audio play blocked", e));
      
      const updateData = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          setAudioData(new Uint8Array(dataArray)); // Force new array for state trigger
        }
        animationFrameRef.current = requestAnimationFrame(updateData);
      };
      updateData();
    } else {
      audioRef.current.pause();
      cancelAnimationFrame(animationFrameRef.current);
    }

    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [isPlaying, currentTrackIndex]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const handleNext = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const updateScore = useCallback((s: number, hs: number) => {
    setScores(prev => {
      if (prev.score === s && prev.highScore === hs) return prev;
      return { score: s, highScore: hs };
    });
  }, []);

  const updateProgress = () => {
    if (audioRef.current) {
      const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(p || 0);
    }
  };

  const renderInfo = useMemo(() => ({
    ...scores,
    difficulty,
    setDifficulty,
    audioData,
    updateScore
  }), [scores, difficulty, audioData, updateScore]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <audio 
        ref={audioRef} 
        src={currentTrack.url} 
        onTimeUpdate={updateProgress} 
        onEnded={handleNext}
        crossOrigin="anonymous"
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {children(renderInfo)}
      </div>

      <footer className="relative z-20 px-4 pb-4 mt-auto shrink-0">
        <div className="bg-black border-t-2 border-cyan-500 p-2.5 flex items-center shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 scanlines opacity-30 pointer-events-none" />
          
          <div className="flex items-center gap-3 w-1/4 relative z-10">
            <div className="relative shrink-0 grayscale group-hover:grayscale-0 transition-all duration-700">
               <motion.img 
                key={currentTrack.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                src={currentTrack.cover} 
                className="w-10 h-10 rounded-none border border-white/40 object-cover"
              />
              {isPlaying && (
                <div className="absolute inset-0 border-2 border-cyan-500 animate-pulse" />
              )}
            </div>
            <div className="min-w-0 pr-2">
              <p className="text-[9px] font-black text-white leading-none mb-0.5 truncate uppercase tracking-tighter italic text-glitch" data-text={`AUDIO::${currentTrack.title.replace(/\s+/g, '_').toUpperCase()}`}>AUDIO::{currentTrack.title.replace(/\s+/g, '_').toUpperCase()}</p>
              <p className="text-[6px] text-cyan-500 font-mono uppercase tracking-[0.3em] truncate opacity-60">ID_REF::{currentTrack.artist.toUpperCase()}</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center gap-1.5 relative z-10">
            <div className="flex items-center gap-8">
              <button 
                onClick={handlePrev} 
                className="text-slate-600 hover:text-cyan-400 transition-colors bg-white/5 border border-white/10 p-1.5 hover:border-cyan-500"
              >
                <SkipBack size={12} fill="currentColor" />
              </button>
              <button 
                onClick={togglePlay}
                className="w-10 h-10 border-2 border-cyan-500 text-cyan-500 flex items-center justify-center hover:bg-cyan-500 hover:text-black transition-all shadow-[0_0_15px_rgba(0,255,255,0.2)]"
              >
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
              </button>
              <button 
                onClick={handleNext} 
                className="text-slate-600 hover:text-cyan-400 transition-colors bg-white/5 border border-white/10 p-1.5 hover:border-cyan-500"
              >
                <SkipForward size={12} fill="currentColor" />
              </button>
            </div>
            <div className="w-full max-w-xs flex items-center gap-3">
              <span className="text-[6px] font-mono text-cyan-500/30 w-8 text-right tabular-nums">
                {audioRef.current ? Math.floor(audioRef.current.currentTime / 60) + ":" + Math.floor(audioRef.current.currentTime % 60).toString().padStart(2, '0') : "0:00"}
              </span>
              <div className="flex-1 h-0.5 bg-white/5 relative">
                <motion.div 
                   className="absolute h-full bg-cyan-500 shadow-[0_0_10px_#00ffff]"
                   animate={{ width: `${progress}%` }}
                   transition={{ type: "spring", bounce: 0, duration: 0.2 }}
                />
              </div>
              <span className="text-[6px] font-mono text-cyan-500/30 w-8 tabular-nums">
                {audioRef.current && isFinite(audioRef.current.duration) ? Math.floor(audioRef.current.duration / 60) + ":" + Math.floor(audioRef.current.duration % 60).toString().padStart(2, '0') : "3:45"}
              </span>
            </div>
          </div>

          <div className="w-1/4 flex justify-end items-center gap-6 relative z-10">
            <div className="flex gap-1 p-0.5 border border-cyan-500/30 bg-black">
               {Object.values(Difficulty).map((d) => (
                 <button
                   key={d}
                   onClick={() => setDifficulty(d)}
                   className={`px-3 py-0.5 text-[7px] font-black tracking-[0.2em] transition-all border ${difficulty === d ? 'bg-cyan-500 border-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'border-transparent text-slate-700 hover:text-white hover:border-white/20'}`}
                 >
                   {d[0]}
                 </button>
               ))}
            </div>
            <div className="hidden xl:flex items-center gap-3 border-l border-white/10 pl-5 py-1">
              <Activity size={12} className="text-cyan-500/20" />
              <div className="w-12 h-0.5 bg-white/5 relative overflow-hidden">
                <div className="h-full w-2/3 bg-cyan-500/20"></div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
