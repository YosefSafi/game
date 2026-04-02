"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { Stars, OrbitControls, Float, MeshDistortMaterial } from "@react-three/drei";
import { AlertCircle, Volume2, VolumeX, Terminal } from "lucide-react";

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
      <Canvas>
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Float speed={2} rotationIntensity={1} floatIntensity={1}>
          <mesh position={[0, 0, -5]}>
            <sphereGeometry args={[2, 64, 64]} />
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
        <div className="absolute w-full h-full border-2 border-white rounded-full opacity-50 animate-ping" />
        <div className="absolute w-full h-full border-2 border-blue-400 rounded-full" />
        <div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]" />
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
        ...prev.slice(-10),
        {
          id: Date.now(),
          x: Math.random() * window.innerWidth,
          y: -50,
          size: 20 + Math.random() * 40,
        },
      ]);
    }, 1000);

    const fragmentInterval = setInterval(() => {
      setFragments((prev) => [
        ...prev.slice(-5),
        {
          id: Date.now(),
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
        },
      ]);
    }, 2000);

    const movementInterval = setInterval(() => {
      setObstacles((prev) =>
        prev.map((o) => ({ ...o, y: o.y + 5 })).filter((o) => o.y < window.innerHeight + 50)
      );
    }, 16);

    return () => {
      clearInterval(obstacleInterval);
      clearInterval(fragmentInterval);
      clearInterval(movementInterval);
    };
  }, [isGameOver]);

  // Collision Detection
  useEffect(() => {
    if (isGameOver) return;

    // Hit obstacles
    obstacles.forEach((o) => {
      const dx = mousePos.x - o.x;
      const dy = mousePos.y - o.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < o.size / 2 + 10) {
        handleGameOver();
      }
    });

    // Collect fragments
    fragments.forEach((f) => {
      const dx = mousePos.x - f.x;
      const dy = mousePos.y - f.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 30) {
        setScore((s) => s + 100);
        setFragments((prev) => prev.filter((item) => item.id !== f.id));
      }
    });
  }, [mousePos, obstacles, fragments, isGameOver]);

  const handleGameOver = () => {
    setIsGlitching(true);
    setTimeout(() => {
      setIsGameOver(true);
      setIsGlitching(false);
    }, 1500);
  };

  if (isGameOver) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center font-mono p-8 overflow-hidden">
        <div className="w-full max-w-2xl border border-green-900 bg-black/50 p-6 rounded shadow-[0_0_20px_#14532d]">
          <div className="flex items-center gap-2 text-green-500 mb-4 animate-pulse">
            <AlertCircle size={20} />
            <span>SYSTEM_CRITICAL_FAILURE</span>
          </div>
          <div className="text-green-400 space-y-2 text-sm md:text-base">
            <p>CORE_INTEGRITY: 0.00%</p>
            <p>MEM_DUMP: FATAL_EXCEPTION_AT_0x004F3B</p>
            <p>DATA_NODES_CAPTURED: {score}</p>
            <p className="mt-8 text-xs opacity-50">
              [SYSTEM_HALTED] - PLEASE REBOOT ENVIRONMENT (REFRESH) TO RESTORE NEURAL LINK.
            </p>
          </div>
        </div>
        {/* Matrix-like rain effect could go here */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute top-0 text-green-500 text-[10px]"
              initial={{ y: -100, x: `${Math.random() * 100}%` }}
              animate={{ y: "100vh" }}
              transition={{ duration: 2 + Math.random() * 5, repeat: Infinity, ease: "linear" }}
            >
              {Math.random().toString(2).substring(2, 10)}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 cursor-none select-none transition-colors duration-[1500ms] ${isGlitching ? 'bg-black opacity-50' : ''}`}>
      <Background />
      <CustomCursor position={mousePos} />

      {/* UI Elements */}
      <div className="absolute top-8 left-8 text-white font-mono flex flex-col gap-2">
        <div className="text-xs text-blue-400 opacity-70">SENSING_CORE_PROTOCOL</div>
        <div className="text-3xl font-bold tracking-tighter shadow-blue-500">
          SCORE: {score.toString().padStart(6, "0")}
        </div>
      </div>

      <div className="absolute top-8 right-8 flex gap-4 items-center">
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className="p-2 border border-white/20 rounded-full hover:bg-white/10 transition-colors text-white"
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

      {/* Game Entities */}
      <AnimatePresence>
        {obstacles.map((o) => (
          <motion.div
            key={o.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1, y: o.y }}
            exit={{ opacity: 0, scale: 2 }}
            className="absolute rounded-lg border border-white/30 bg-white/5 backdrop-blur-sm pointer-events-none"
            style={{
              left: o.x - o.size / 2,
              top: 0,
              width: o.size,
              height: o.size,
              rotate: o.id % 360,
            }}
          >
             <div className="w-full h-full flex items-center justify-center">
                <div className="w-1/2 h-1/2 border border-white/20" />
             </div>
          </motion.div>
        ))}

        {fragments.map((f) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 2 }}
            className="absolute pointer-events-none"
            style={{ left: f.x - 15, top: f.y - 15 }}
          >
            <div className="relative w-[30px] h-[30px] flex items-center justify-center">
               <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-md animate-pulse" />
               <Terminal className="text-blue-400" size={16} />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Glitch Overlay */}
      {isGlitching && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0, 1, 0, 1] }}
          className="fixed inset-0 z-[200] bg-white mix-blend-difference pointer-events-none"
        />
      )}

      {/* Instructions */}
      {score === 0 && !isGameOver && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed bottom-12 left-1/2 -translate-x-1/2 text-white/50 font-mono text-xs tracking-widest uppercase"
        >
          Navigate Core • Harvest Fragments • Avoid Shards
        </motion.div>
      )}
    </div>
  );
}
