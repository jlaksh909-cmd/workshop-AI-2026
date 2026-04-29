/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Trophy, RefreshCw, Play, Zap, Brain, Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { Difficulty } from './MusicPlayer';
import MusicVisualizer from './MusicVisualizer';

interface Point {
  x: number;
  y: number;
}

const GRID_SIZE = 20;
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION = { x: 0, y: -1 };

interface SnakeGameProps {
  onScoreUpdate: (score: number, highScore: number) => void;
  difficulty: Difficulty;
  audioData: Uint8Array | null;
}

const DIFFICULTY_CONFIG = {
  [Difficulty.EASY]: { initialSpeed: 200, speedStep: 1, minSpeed: 100, label: 'Easy', icon: Shield, color: 'text-emerald-400' },
  [Difficulty.MEDIUM]: { initialSpeed: 150, speedStep: 2, minSpeed: 60, label: 'Medium', icon: Brain, color: 'text-cyan-400' },
  [Difficulty.HARD]: { initialSpeed: 90, speedStep: 3, minSpeed: 40, label: 'Hard', icon: Zap, color: 'text-rose-400' },
};

export default function SnakeGame({ onScoreUpdate, difficulty, audioData }: SnakeGameProps) {
  const config = DIFFICULTY_CONFIG[difficulty];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speed, setSpeed] = useState(config.initialSpeed);

  const generateFood = useCallback((currentSnake: Point[]) => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      if (!currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
        break;
      }
    }
    return newFood;
  }, []);

  const startGame = () => {
    setHasStarted(true);
    setIsGameOver(false);
  };

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood(generateFood(INITIAL_SNAKE));
    setIsGameOver(false);
    setScore(0);
    setSpeed(config.initialSpeed);
    setHasStarted(true);
  };

  // Update speed when difficulty changes and game hasn't started or just reset
  useEffect(() => {
    if (!hasStarted || isGameOver) {
      setSpeed(DIFFICULTY_CONFIG[difficulty].initialSpeed);
    }
  }, [difficulty, hasStarted, isGameOver]);

  useEffect(() => {
    onScoreUpdate(score, highScore);
  }, [score, highScore]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hasStarted && !isGameOver) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
            startGame();
        }
      }
      switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          if (direction.y === 0) setDirection({ x: 0, y: -1 });
          break;
        case 'arrowdown':
        case 's':
          if (direction.y === 0) setDirection({ x: 0, y: 1 });
          break;
        case 'arrowleft':
        case 'a':
          if (direction.x === 0) setDirection({ x: -1, y: 0 });
          break;
        case 'arrowright':
        case 'd':
          if (direction.x === 0) setDirection({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, hasStarted, isGameOver]);

  useEffect(() => {
    if (isGameOver || !hasStarted) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        const newHead = {
          x: prevSnake[0].x + direction.x,
          y: prevSnake[0].y + direction.y,
        };

        if (
          newHead.x < 0 || newHead.x >= GRID_SIZE ||
          newHead.y < 0 || newHead.y >= GRID_SIZE ||
          prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)
        ) {
          setIsGameOver(true);
          setHighScore(prev => Math.max(prev, score));
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 10);
          setFood(generateFood(newSnake));
          setSpeed(prev => Math.max(prev - config.speedStep, config.minSpeed));
          return newSnake;
        } else {
          newSnake.pop();
          return newSnake;
        }
      });
    };

    const intervalId = setInterval(moveSnake, speed);
    return () => clearInterval(intervalId);
  }, [direction, food, isGameOver, generateFood, score, speed, hasStarted, config]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = canvas.width / GRID_SIZE;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Food (Pulse based on audio if available)
    const audioLevel = audioData ? audioData[10] / 255 : 0;
    const foodPulse = 0.8 + audioLevel * 0.5;

    ctx.fillStyle = '#ff00ff';
    ctx.shadowBlur = 15 + audioLevel * 25;
    ctx.shadowColor = '#ff00ff';
    ctx.fillRect(
      food.x * scale + scale * (1 - foodPulse) / 2,
      food.y * scale + scale * (1 - foodPulse) / 2,
      scale * foodPulse,
      scale * foodPulse
    );

    // Snake (Cyan)
    snake.forEach((segment, index) => {
      const isHead = index === 0;
      ctx.fillStyle = isHead ? '#ffffff' : `rgba(0, 255, 255, ${Math.max(0.4, 1 - index / snake.length)})`;
      ctx.shadowBlur = isHead ? 30 : 0;
      ctx.shadowColor = '#00ffff';
      
      const padding = isHead ? 1 : 2;
      ctx.fillRect(
        segment.x * scale + padding,
        segment.y * scale + padding,
        scale - padding * 2,
        scale - padding * 2
      );
    });
    
    ctx.shadowBlur = 0;
  }, [snake, food, audioData]);

  const ModeIcon = config.icon;

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 overflow-hidden">
      <section className="flex-1 flex flex-col gap-4 min-h-0 relative order-1">
        <div className="flex-1 bg-black border-2 border-cyan-500 shadow-[0_0_30px_rgba(0,255,255,0.1)] relative overflow-hidden flex items-center justify-center group">
          <div className="absolute inset-0 scanlines opacity-40 group-hover:opacity-60 transition-opacity pointer-events-none" />
          <div className="absolute inset-0 static-noise opacity-[0.15] mix-blend-screen pointer-events-none" />
          
          <canvas
            ref={canvasRef}
            width={500}
            height={500}
            className="w-full h-full max-w-[95%] max-h-[95%] aspect-square object-contain relative z-10 sepia-[0.1] contrast-[1.1]"
          />

          <div className="absolute top-4 left-6 flex flex-col gap-1 z-20">
            <div className="flex gap-2">
              <span className="px-2 py-0.5 bg-cyan-500 text-black text-[8px] font-black tracking-[0.4em] uppercase">LINK::WASD</span>
              <span className={`px-2 py-0.5 bg-black border border-white/20 text-[8px] font-black ${config.color} tracking-[0.4em] uppercase`}>MODE::{config.label.toUpperCase()}</span>
            </div>
            <div className="text-[6px] font-black text-cyan-500/40 tracking-[0.6em] pl-1 uppercase">BUFFER_ADDR::0x44BC_99</div>
          </div>

          <div className="absolute bottom-4 right-6 text-right z-20">
             <div className="text-[10px] font-black text-white/20 tracking-[0.3em] uppercase italic">ENCRYPTED_SIGNAL_STREAM</div>
             <div className="text-[6px] font-mono text-cyan-500/20 tracking-[0.5em] mt-1">LATENCY::{speed}MS</div>
          </div>

          {isGameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-40 animate-in fade-in duration-75">
              <div className="absolute inset-0 scanlines opacity-50" />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, rotate: -1 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                className="border-4 border-magenta-500 bg-black p-12 flex flex-col items-center shadow-[0_0_80px_rgba(255,0,255,0.3)] relative z-50 overflow-hidden"
                style={{ borderColor: '#ff00ff' }}
              >
                <div className="absolute inset-0 static-noise opacity-20" />
                <div className="absolute top-0 left-0 w-full h-1 bg-magenta-500 animate-pulse" style={{ backgroundColor: '#ff00ff' }} />
                
                <h2 className="text-6xl font-black text-white uppercase tracking-tighter mb-4 italic text-glitch" data-text="FATAL_ERROR">FATAL_ERROR</h2>
                <p className="text-[#ff00ff] font-black text-[10px] tracking-[0.8em] mb-12 uppercase animate-pulse">Connection_Lost_Retrying...</p>
                
                <div className="w-full flex justify-between items-center mb-12 border-y-2 border-white/10 py-6 bg-white/5 px-8">
                  <p className="text-slate-500 font-black text-[10px] tracking-[0.4em] uppercase">FINAL_VAL</p>
                  <p className="text-4xl font-black text-white tracking-[0.1em]">{score.toString().padStart(6, '0')}</p>
                </div>

                <button
                  onClick={resetGame}
                  className="w-full flex items-center justify-center gap-6 bg-magenta-500 text-black py-6 font-black text-[12px] uppercase tracking-[0.6em] transition-all hover:bg-white active:scale-95 shadow-[0_0_30px_rgba(255,0,255,0.4)]"
                  style={{ backgroundColor: '#ff00ff' }}
                >
                  <RefreshCw size={16} strokeWidth={3} /> REBOOT_LINK
                </button>
              </motion.div>
            </div>
          )}

          {!hasStarted && !isGameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-30 cursor-pointer group/start" onClick={startGame}>
              <div className="absolute inset-0 bg-cyan-500/5 group-hover:bg-cyan-500/10 transition-colors" />
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="bg-black border-2 border-cyan-500 p-16 flex flex-col items-center shadow-[0_0_60px_rgba(0,255,255,0.2)] relative z-10"
              >
                <div className="absolute inset-0 scanlines opacity-40" />
                <div className="w-24 h-24 bg-white/5 flex items-center justify-center mb-10 border-2 border-cyan-500/30 group-hover/start:border-cyan-400 transition-colors relative">
                    <div className="absolute inset-0 border border-cyan-400/20 animate-ping" />
                    <Play className="text-cyan-400 ml-1 group-hover/start:text-white transition-colors" fill="currentColor" size={40} />
                </div>
                <h2 className="text-5xl font-black text-white uppercase tracking-tighter mb-4 italic text-glitch" data-text="LINK_START">LINK_START</h2>
                <p className="text-cyan-500 font-black text-[9px] tracking-[0.7em] uppercase animate-pulse">Awaiting_Neural_Sync</p>
              </motion.div>
            </div>
          )}
        </div>
      </section>

      <aside className="w-80 hidden lg:flex flex-col gap-4 order-2">
        <div className="flex-1 bg-black border-2 border-white/5 p-6 flex flex-col shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 scanlines opacity-10 pointer-events-none" />
          <div className="absolute inset-0 static-noise opacity-[0.05] pointer-events-none" />
          
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] mb-10 flex items-center justify-between text-cyan-500 bg-white/5 p-3 border-l-4 border-cyan-500">
             <span>DIAGNOSTICS::{config.label.toUpperCase()}</span>
             <ModeIcon size={16} />
          </h2>

          <div className="flex-1 flex flex-col items-center justify-center gap-12 relative z-10">
             <div className="w-full space-y-4">
                <p className="text-[8px] text-white/30 uppercase tracking-[0.6em] font-black pl-1">DATA_VISUALIZER</p>
                <div className="w-full relative group">
                  <div className="absolute -inset-2 bg-cyan-500/10 blur group-hover:opacity-100 transition-opacity" />
                  <MusicVisualizer audioData={audioData} color="#00ffff" className="w-full h-20 border border-cyan-500/40 bg-black" />
                </div>
             </div>
             
             <div className="w-full border-t border-white/10 pt-8">
                <p className="text-[8px] text-white/30 uppercase tracking-[0.6em] mb-4 font-black pl-1">CLOCK_FREQ</p>
                <div className="px-6 py-4 bg-white/5 border border-white/10 relative overflow-hidden group">
                   <div className="absolute inset-0 bg-cyan-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                   <p className="text-3xl font-black text-white tracking-[0.2em] relative z-10 italic text-glitch" data-text={`${speed}MS`}>{speed}MS</p>
                </div>
             </div>
          </div>

          <div className="pt-10 mt-6 border-t-2 border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[8px] font-black uppercase tracking-[0.5em] text-white/20">LOGGED_SCORE</span>
              <span className="text-[14px] text-white font-black tabular-nums tracking-widest">{score.toString().padStart(6, '0')}</span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[8px] font-black uppercase tracking-[0.5em] text-white/20">BUFFER_STATUS</span>
              <span className="text-[12px] text-cyan-400 font-black italic tracking-widest">{Math.min(100, Math.floor(score / 5))}%</span>
            </div>
            <div className="w-full h-1 bg-white/5 relative overflow-hidden">
              <motion.div 
                className="h-full bg-cyan-500 shadow-[0_0_15px_#00ffff]"
                animate={{ width: `${Math.min(100, (score / 5))}%` }}
                initial={{ width: 0 }}
                transition={{ type: "spring", bounce: 0 }}
              />
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
