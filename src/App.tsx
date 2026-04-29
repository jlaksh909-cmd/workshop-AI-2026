/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import SnakeGame from './components/SnakeGame';
import MusicPlayer from './components/MusicPlayer';
import { motion } from 'motion/react';

export default function App() {
  return (
    <div className="h-screen w-full bg-[#050505] text-cyan-50 selection:bg-cyan-500/30 overflow-hidden flex flex-col font-mono relative">
      {/* Dynamic Scanline Layer */}
      <div className="absolute inset-0 scanlines opacity-5 mix-blend-overlay pointer-events-none" />
      
      {/* Static Grain Backdrop */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <MusicPlayer>
        {(scoreInfo) => (
          <>
            <header className="relative z-20 flex items-center justify-between px-8 py-5 border-b-2 border-cyan-500 bg-black shrink-0">
              <div className="absolute inset-0 scanlines opacity-30 pointer-events-none" />
              <div className="flex items-center gap-4 relative z-10 shrink-0">
                <div className="w-8 h-8 border-2 border-cyan-500 flex items-center justify-center relative glitch-border">
                  <div className="w-3 h-3 bg-white" />
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-[0.4em] uppercase italic text-glitch" data-text="SYS_TERM_01">SYS_TERM_01</h1>
                  <p className="text-[6px] text-cyan-500 tracking-[0.6em] uppercase font-bold mt-1">NEURAL_INTERFACE_STABLE [READY]</p>
                </div>
              </div>
              
              <div className="flex gap-12 sm:gap-20 relative z-30 ml-4">
                <div className="text-right">
                  <p className="text-[8px] uppercase tracking-[0.5em] text-cyan-500/60 mb-1 font-black">LOCAL_BUFFER</p>
                  <p className="text-2xl sm:text-3xl font-black text-cyan-400 leading-none tabular-nums tracking-tighter drop-shadow-[0_0_10px_#00ffff44]">
                    {scoreInfo.score.toString().padStart(6, '0')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] uppercase tracking-[0.5em] text-magenta-500/60 mb-1 font-black" style={{ color: '#ff00ff99' }}>GLOBAL_RECORD</p>
                  <p className="text-2xl sm:text-3xl font-black leading-none tabular-nums tracking-tighter drop-shadow-[0_0_10px_#ff00ff44]" style={{ color: '#ff00ff' }}>
                    {scoreInfo.highScore.toString().padStart(6, '0')}
                  </p>
                </div>
              </div>
            </header>

            <main className="relative z-10 flex-1 p-4 sm:p-6 flex flex-col min-h-0 overflow-hidden">
               <SnakeGame 
                  onScoreUpdate={scoreInfo.updateScore} 
                  difficulty={scoreInfo.difficulty}
                  audioData={scoreInfo.audioData}
               />
            </main>
          </>
        )}
      </MusicPlayer>
    </div>
  );
}

