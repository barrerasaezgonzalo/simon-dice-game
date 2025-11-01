"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

const colors = ["green", "red", "yellow", "blue"] as const;
type Color = (typeof colors)[number];

const frequencies: Record<Color, number> = {
  green: 329.63,
  red: 261.63,
  yellow: 392.0,
  blue: 440.0,
};

export default function SimonDice() {
  const [sequence, setSequence] = useState<Color[]>([]);
  const [playerSequence, setPlayerSequence] = useState<Color[]>([]);
  const [level, setLevel] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [message, setMessage] = useState("");
  const [activeButton, setActiveButton] = useState<Color | null>(null);
  const [speed, setSpeed] = useState(600);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const playSound = (color: Color) => {
    if (!audioContextRef.current) return;

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);

    oscillator.frequency.value = frequencies[color];
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContextRef.current.currentTime + 0.3,
    );

    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + 0.3);
  };

  const flashButton = async (color: Color) => {
    setActiveButton(color);
    playSound(color);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setActiveButton(null);
    await new Promise((resolve) => setTimeout(resolve, 200));
  };

  const showSequence = async () => {
    setIsShowingSequence(true);
    setMessage("¡Observa la secuencia!");

    await new Promise((resolve) => setTimeout(resolve, 800));

    for (const color of sequence) {
      await flashButton(color);
    }

    setIsShowingSequence(false);
    setMessage("¡Tu turno!");
  };

  const nextLevel = () => {
    const newLevel = level + 1;
    setLevel(newLevel);
    setPlayerSequence([]);

    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newSequence = [...sequence, randomColor];
    setSequence(newSequence);
  };

  useEffect(() => {
    if (sequence.length > 0 && isPlaying) {
      showSequence();
    }
  }, [sequence]);

  const handlePlayerClick = async (color: Color) => {
    if (isShowingSequence || !isPlaying) return;

    const newPlayerSequence = [...playerSequence, color];
    setPlayerSequence(newPlayerSequence);

    setActiveButton(color);
    playSound(color);
    await new Promise((resolve) => setTimeout(resolve, 300));
    setActiveButton(null);

    const currentIndex = newPlayerSequence.length - 1;

    if (newPlayerSequence[currentIndex] !== sequence[currentIndex]) {
      gameOver();
      return;
    }

    if (newPlayerSequence.length === sequence.length) {
      setMessage("¡Correcto! 🎉");
      setTimeout(() => {
        nextLevel();
      }, 1000);
    }
  };

  const gameOver = () => {
    setIsPlaying(false);
    setMessage(`Game Over! Llegaste al nivel ${level}`);

    if (audioContextRef.current) {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      oscillator.frequency.value = 100;
      oscillator.type = "sawtooth";
      gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContextRef.current.currentTime + 0.5,
      );
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + 0.5);
    }
  };

  const startGame = () => {
    setSequence([]);
    setPlayerSequence([]);
    setLevel(0);
    setIsPlaying(true);
    setMessage("¡Comenzando!");
    setTimeout(() => {
      nextLevel();
    }, 500);
  };

  const resetGame = () => {
    setSequence([]);
    setPlayerSequence([]);
    setLevel(0);
    setIsPlaying(false);
    setMessage("");
    setActiveButton(null);
  };

  const getButtonClasses = (color: Color) => {
    const baseClasses =
      "w-36 h-36 rounded-2xl cursor-pointer transition-all duration-100 shadow-lg";
    const colorClasses = {
      green: "bg-green-500",
      red: "bg-red-500",
      yellow: "bg-yellow-400",
      blue: "bg-blue-500",
    };
    const activeClasses = {
      green:
        "bg-green-300 shadow-[0_0_40px_#4CAF50,0_0_60px_#4CAF50] scale-110",
      red: "bg-red-300 shadow-[0_0_40px_#f44336,0_0_60px_#f44336] scale-110",
      yellow:
        "bg-yellow-200 shadow-[0_0_40px_#ffeb3b,0_0_60px_#ffeb3b] scale-110",
      blue: "bg-blue-300 shadow-[0_0_40px_#2196F3,0_0_60px_#2196F3] scale-110",
    };

    const isActive = activeButton === color;
    const isDisabled = isShowingSequence;

    return `${baseClasses} ${colorClasses[color]} 
      ${isActive ? activeClasses[color] : ""} 
      ${isDisabled ? "opacity-70 cursor-not-allowed" : "hover:scale-105 active:scale-95"}`;
  };

  return (
    <div className="min-h-screen bg-[#F2F6F9] flex items-start justify-center p-5">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-black mb-5 inline-block mt-4">
          <Image
            src="/simon-dice.png"
            alt="Simon Dice"
            width={100}
            height={100}
            style={{ display: "inline" }}
          />{" "}
          SIMON DICE!
        </h1>

        <p className="text-lg text-black text-[1rem]">
          Observa la secuencia de colores, memorízala y repítela correctamente
        </p>

        <div className="text-2xl text-black mb-4 mt-4 font-semibold">
          Nivel: {level}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8 p-5 bg-white/10 rounded-3xl backdrop-blur-sm mx-auto w-fit">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => handlePlayerClick(color)}
              className={getButtonClasses(color)}
              disabled={isShowingSequence || !isPlaying}
            />
          ))}
        </div>

        <div className="flex gap-4 justify-center flex-wrap mb-5">
          <button
            onClick={startGame}
            disabled={isPlaying}
            className="px-8 py-4 text-xl font-bold rounded-xl bg-[#FE8111] text-white shadow-lg hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {level === 0 ? "Iniciar Juego" : "Jugar de Nuevo"}
          </button>

          <button
            onClick={resetGame}
            className="px-8 py-4 text-xl font-bold rounded-xl bg-[#277BFF] text-white shadow-lg hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 transition-all"
          >
            Reiniciar
          </button>
        </div>

        <div className="mb-5">
          <label className="text-black text-lg mr-3">Velocidad:</label>
          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="px-4 py-2 text-lg text-black rounded-lg border-none cursor-pointer"
            disabled={isPlaying}
          >
            <option value={1000}>Lenta</option>
            <option value={600}>Normal</option>
            <option value={400}>Rápida</option>
          </select>
        </div>

        <div className="text-black text-xl font-bold min-h-10 ">{message}</div>

        <footer className="mt-10 text-black text-center">
          <p>Creado a las 3 AM cuando el café ya no hacía efecto ☕💻</p>

          <Link href="https://chilehub.cl">
            <Image
              src="/chilehub.png"
              alt="Logo de Sopa de Letras"
              width={200}
              height={80}
              style={{
                width: "200px",
                height: "80px",
                objectFit: "contain",
                marginTop: "1rem",
                marginLeft: "auto",
                marginRight: "auto",
              }}
            />
          </Link>
        </footer>
      </div>
    </div>
  );
}
