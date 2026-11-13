"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useWedding, useWeddingPreview } from "./wedding-content";

type AudioControls = {
  isPlaying: boolean;
  startMusic: () => Promise<void>;
  pauseMusic: () => void;
};

const AudioContextValue = createContext<AudioControls | null>(null);

export function WeddingAudioProvider({ children }: { children: ReactNode }) {
  const wedding = useWedding();
  const preview = useWeddingPreview();
  const audioRef = useRef<HTMLAudioElement>(null);
  const graphRef = useRef<{ context: AudioContext; gain: GainNode } | null>(null);
  const requestRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const startMusic = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || preview) return;
    const request = ++requestRef.current;
    const volume = Math.max(0, Math.min(1, wedding.experience.audio.volume));

    try {
      audio.volume = volume;
      const AudioContextConstructor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!graphRef.current && AudioContextConstructor) {
        const context = new AudioContextConstructor();
        const gain = context.createGain();
        gain.gain.setValueAtTime(volume, context.currentTime);
        context.createMediaElementSource(audio).connect(gain);
        gain.connect(context.destination);
        graphRef.current = { context, gain };
        context.onstatechange = () => setIsPlaying(context.state === "running" && !audio.paused && !audio.ended);
      }
      const graph = graphRef.current;
      if (graph) audio.volume = 1;
      await Promise.all([audio.play(), graph?.context.resume()]);
      if (request === requestRef.current) setIsPlaying(!audio.paused);
    } catch {
      if (request === requestRef.current) setIsPlaying(false);
    }
  }, [preview, wedding.experience.audio.volume]);

  const pauseMusic = useCallback(() => {
    requestRef.current += 1;
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    return () => {
      const graph = graphRef.current;
      if (graph) {
        graph.context.onstatechange = null;
        void graph.context.close();
        graphRef.current = null;
      }
    };
  }, []);

  const value = useMemo(() => ({ isPlaying, startMusic, pauseMusic }), [isPlaying, startMusic, pauseMusic]);

  return <AudioContextValue.Provider value={value}>
    {children}
    {!preview && <audio ref={audioRef} src={wedding.experience.audio.src} preload="none" loop={wedding.experience.audio.loop} aria-hidden="true"
      onPlaying={() => setIsPlaying(!graphRef.current || graphRef.current.context.state === "running")}
      onPause={() => setIsPlaying(false)} onWaiting={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} onError={() => setIsPlaying(false)} />}
  </AudioContextValue.Provider>;
}

export function useWeddingAudio() {
  const controls = useContext(AudioContextValue);
  if (!controls) throw new Error("WeddingAudioProvider is required");
  return controls;
}
