"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { Stars, Float, MeshDistortMaterial } from "@react-three/drei";
import { AlertCircle, Volume2, VolumeX, Terminal, Cpu } from "lucide-react";
import { Howl } from "howler";

// --- Types ---
interface Obstacle {
  id: number;
  x: number;
  y: number;
  size: number;
}

interface Fragment {
  id: number;
  x: number;
  y: number;
}

// --- Components ---

const Background = () => {
  return (
    <div className="fixed inset-0 z-[-1] bg-[#0a0a0c]">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Float speed={2} rotationIntensity={1} floatIntensity={1}>
          <mesh position={[0, 0, -5]}>
            <sphereGeometry args={[2.5, 64, 64]} />
            <MeshDistortMaterial color="#1e3a8a" speed={3} distort={0.4} />
          </mesh>
        </Float>
      </Canvas>
    </div>
  );
};

const CustomCursor = ({ position }: { position: { x: number; y: number } }) => {
  return (
    <motion.div
      className="fixed top-0 left-0 w-8 h-8 pointer-events-none z-[100]"
      animate={{ x: position.x - 16, y: position.y - 16 }}
      transition={{ type: "spring", damping: 20, stiffness: 400, mass: 0.1 }}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="absolute w-full h-full border-2 border-white rounded-full opacity-30 animate-ping" />
        <div className="absolute w-full h-full border border-blue-400 rounded-full" />
        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_15px_#3b82f6]" />
        
        {/* Orbits */}
        <motion.div 
            className="absolute w-12 h-12 border border-white/10 rounded-full" 
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
      </div>
    </motion.div>
  );
};

export default function Game() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isGlitching, setIsGlitching] = useState(false);
  
  const sounds = useRef<{
    collect: Howl | null;
    crash: Howl | null;
    bg: Howl | null;
  }>({ collect: null, crash: null, bg: null });

  // Initialize Audio
  useEffect(() => {
    sounds.current.collect = new Howl({
      src: ['https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'], // Digital chime
      volume: 0.5
    });
    sounds.current.crash = new Howl({
      src: ['https://assets.mixkit.co/active_storage/sfx/2641/2641-preview.mp3'], // Glitch/Error
      volume: 0.7
    });
    sounds.current.bg = new Howl({
      src: ['https://assets.mixkit.co/active_storage/sfx/123/123-preview.mp3'], // Low hum/drone
      loop: true,
      volume: 0.2
    });

    sounds.current.bg.play();

    return () => {
      sounds.current.bg?.stop();
    };
  }, []);

  useEffect(() => {
    if (sounds.current.bg) {
      sounds.current.bg.mute(isMuted || isGameOver);
    }
  }, [isMuted, isGameOver]);

  // Mouse Movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Game Loop
  useEffect(() => {
    if (isGameOver) return;

    const obstacleInterval = setInterval(() => {
      setObstacles((prev) => [
        ...prev.slice(-15),
        {
          id: Date.now(),
          x: Math.random() * window.innerWidth,
          y: -100,
          size: 30 + Math.random() * 50,
        },
      ]);
    }, 800);

    const fragmentInterval = setInterval(() => {
      setFragments((prev) => [
        ...prev.slice(-8),
        {
          id: Date.now(),
          x: Math.random() * (window.innerWidth - 100) + 50,
          y: Math.random() * (window.innerHeight - 100) + 50,
        },
      ]);
    }, 1500);

    const movementInterval = setInterval(() => {
      setObstacles((prev) =>
        prev.map((o) => ({ ...o, y: o.y + (5 + score / 5000) })).filter((o) => o.y < window.innerHeight + 100)
      );
    }, 16);

    return () => {
      clearInterval(obstacleInterval);
      clearInterval(fragmentInterval);
      clearInterval(movementInterval);
    };
  }, [isGameOver, score]);

  // Collision Detection
  useEffect(() => {
    if (isGameOver || isGlitching) return;

    // Hit obstacles
    obstacles.forEach((o) => {
      const dx = mousePos.x - o.x;
      const dy = mousePos.y - o.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < o.size / 2 + 8) {
        handleGameOver();
      }
    });

    // Collect fragments
    fragments.forEach((f) => {
      const dx = mousePos.x - f.x;
      const dy = mousePos.y - f.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 25) {
        setScore((s) => s + 250);
        sounds.current.collect?.play();
        setFragments((prev) => prev.filter((item) => item.id !== f.id));
      }
    });
  }, [mousePos, obstacles, fragments, isGameOver, isGlitching]);

  const handleGameOver = () => {
    setIsGlitching(true);
    sounds.current.crash?.play();
    setTimeout(() => {
      setIsGameOver(true);
      setIsGlitching(false);
    }, 2000);
  };

  if (isGameOver) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center font-mono p-8 overflow-hidden">
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl border border-green-900 bg-black/80 p-8 rounded shadow-[0_0_40px_rgba(20,83,45,0.3)] z-10"
        >
          <div className="flex items-center gap-3 text-green-500 mb-6">
            <AlertCircle size={24} className="animate-pulse" />
            <span className="text-xl tracking-[0.2em] font-bold">SYSTEM_KERNEL_PANIC</span>
          </div>
          <div className="text-green-400 space-y-4 text-sm md:text-base leading-relaxed border-t border-green-900/50 pt-6">
            <div className="grid grid-cols-2 gap-4">
               <div>CORE_STATUS: <span className="text-red-900 bg-red-500/10 px-1 font-bold">TERMINATED</span></div>
               <div>RECOVERY: <span className="opacity-50">IMPOSSIBLE</span></div>
            </div>
            <p>DIAGNOSTIC: UNRECOVERABLE_COLLISION_DETECTED</p>
            <p className="text-2xl font-bold mt-4 text-green-300">
               NODES_RETRIEVED: {score.toLocaleString()}
            </p>
            <div className="mt-12 p-4 bg-green-950/20 border border-green-900/30 rounded">
               <p className="text-xs opacity-60">
                [LOG] CONNECTION LOST. NEURAL LINK DISCONNECTED. 
                <br/>[ACTION] PLEASE RE-INITIALIZE MANUALLY VIA BROWSER REFRESH.
               </p>
            </div>
          </div>
        </motion.div>
        
        {/* Glitchy Code Rain */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          {[...Array(40)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute top-0 text-green-500 text-[8px] font-bold"
              initial={{ y: -200, x: `${Math.random() * 100}%` }}
              animate={{ y: "110vh" }}
              transition={{ duration: 1.5 + Math.random() * 4, repeat: Infinity, ease: "linear" }}
            >
              {Math.random().toString(36).substring(2, 15).toUpperCase()}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 cursor-none select-none transition-all duration-[2000ms] overflow-hidden ${isGlitching ? 'grayscale contrast-[2] scale-110' : ''}`}>
      <Background />
      <CustomCursor position={mousePos} />

      {/* UI Elements */}
      <div className="absolute top-10 left-10 text-white font-mono flex flex-col gap-1 pointer-events-none">
        <div className="flex items-center gap-2 text-[10px] text-blue-400 opacity-60 tracking-[0.3em]">
            <Cpu size={12} />
            NEURAL_CORE_LINK [ACTIVE]
        </div>
        <div className="text-5xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] italic">
          {score.toString().padStart(6, "0")}
        </div>
      </div>

      <div className="absolute top-10 right-10 flex gap-4 items-center z-[200]">
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className="p-3 border border-white/10 rounded-full hover:bg-white/10 transition-all text-white backdrop-blur-md"
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </div>

      {/* Game Entities */}
      <AnimatePresence>
        {obstacles.map((o) => (
          <motion.div
            key={o.id}
            initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
            animate={{ opacity: 1, scale: 1, y: o.y, rotate: o.id % 360 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="absolute border-t border-l border-white/40 bg-white/5 backdrop-blur-[2px] pointer-events-none"
            style={{
              left: o.x - o.size / 2,
              top: 0,
              width: o.size,
              height: o.size,
              clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)'
            }}
          >
             <div className="w-full h-full flex items-center justify-center opacity-20">
                <div className="w-2/3 h-2/3 border border-white/50 rotate-45" />
             </div>
          </motion.div>
        ))}

        {fragments.map((f) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 0, scale: 0, rotate: -45 }}
            animate={{ opacity: 1, scale: 1, rotate: 45 }}
            exit={{ opacity: 0, scale: 3, filter: 'blur(10px)' }}
            className="absolute pointer-events-none"
            style={{ left: f.x - 20, top: f.y - 20 }}
          >
            <div className="relative w-[40px] h-[40px] flex items-center justify-center">
               <div className="absolute inset-0 bg-blue-500/30 rounded shadow-[0_0_20px_#3b82f6] animate-pulse" />
               <Terminal className="text-white drop-shadow-lg" size={20} />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Glitch Overlay */}
      {isGlitching && (
        <div className="fixed inset-0 z-[300] pointer-events-none">
            <motion.div
                animate={{ opacity: [0, 0.5, 0, 0.8, 0.2, 1] }}
                transition={{ duration: 0.2, repeat: Infinity }}
                className="absolute inset-0 bg-red-500/20 mix-blend-overlay"
            />
            <motion.div
                animate={{ x: [-10, 10, -5, 5, 0] }}
                transition={{ duration: 0.1, repeat: Infinity }}
                className="absolute inset-0 border-[20px] border-white/10"
            />
        </div>
      )}

      {/* Scanner Lines */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />

      {/* Instructions */}
      <AnimatePresence>
        {score < 500 && !isGameOver && (
            <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-16 left-1/2 -translate-x-1/2 text-white/40 font-mono text-[10px] tracking-[0.5em] uppercase text-center"
            >
            <span className="text-blue-400">Warning:</span> Avoid Shards • <span className="text-blue-400">Task:</span> Collect Data Fragments
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
