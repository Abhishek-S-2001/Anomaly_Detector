'use client';

import { useState, useRef, useCallback } from 'react';

interface KeyEvent {
  key: string;
  type: 'down' | 'up';
  timestamp: number;
}

interface KeystrokeFeatures {
  dwell_time: number[];
  hold_time: number[];
  flight_time: number[];
}

export function useKeystrokes(chunkSize = 45, onChunkReady?: (features: KeystrokeFeatures) => void) {
  const [inputValue, setInputValue] = useState('');
  const eventsRef = useRef<KeyEvent[]>([]);
  const validKeysCountRef = useRef(0);

  // Process the raw events into the arrays your Python model requires
  const calculateFeatures = useCallback((): KeystrokeFeatures => {
    const events = eventsRef.current;
    const dwellTimes: number[] = [];
    const flightTimes: number[] = [];
    const holdTimes: number[] = []; // Down-Down time

    let lastKeyDownTime: number | null = null;
    let lastKeyUpTime: number | null = null;

    // Any keystroke interval longer than this is considered a "pause" (e.g. thinking, moving hands)
    // and must be discarded so it doesn't corrupt the Gaussian anomaly model.
    const MAX_RHYTHM_MS = 2000; 

    events.forEach((event, index) => {
      // A rhythm break (e.g. Backspace or Enter) drops the previous chain.
      if (event.key === 'RHYTHM_BREAK') {
        lastKeyDownTime = null;
        lastKeyUpTime = null;
        return;
      }

      if (event.type === 'down') {
        if (lastKeyDownTime !== null) {
          const ht = event.timestamp - lastKeyDownTime;
          if (ht > 0 && ht <= MAX_RHYTHM_MS) holdTimes.push(ht);
        }
        if (lastKeyUpTime !== null) {
          const ft = event.timestamp - lastKeyUpTime;
          // Flight time can be slightly negative due to high-speed rollover
          if (ft > -1000 && ft <= MAX_RHYTHM_MS) flightTimes.push(ft);
        }
        lastKeyDownTime = event.timestamp;
      }

      if (event.type === 'up') {
        // Find the corresponding 'down' event by looking backward
        for (let i = index - 1; i >= 0; i--) {
          if (events[i].type === 'down' && events[i].key === event.key) {
            const dt = event.timestamp - events[i].timestamp;
            if (dt > 0 && dt <= MAX_RHYTHM_MS) dwellTimes.push(dt);
            break;
          }
        }
        lastKeyUpTime = event.timestamp;
      }
    });

    return { dwell_time: dwellTimes, hold_time: holdTimes, flight_time: flightTimes };
  }, []);

  const resetKeystrokes = useCallback(() => {
    eventsRef.current = [];
    validKeysCountRef.current = 0;
  }, []);

  // Capture sub-millisecond timestamps on key press/release
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Intentional break in rhythm (drops the chain, averting backspace penalties & cold start lag)
    if (e.key === 'Backspace' || e.key === 'Enter') {
      eventsRef.current.push({
        key: 'RHYTHM_BREAK',
        type: 'down',
        timestamp: performance.now(),
      });
      return; 
    }

    // Ignore meta keys to keep the data clean
    if (['Shift', 'Control', 'Alt', 'Meta', 'Tab', 'CapsLock'].includes(e.key)) return;
    
    eventsRef.current.push({
      key: e.key,
      type: 'down',
      timestamp: performance.now(),
    });
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (['Shift', 'Control', 'Alt', 'Meta', 'Backspace', 'Enter', 'Tab', 'CapsLock'].includes(e.key)) return;

    eventsRef.current.push({
      key: e.key,
      type: 'up',
      timestamp: performance.now(),
    });

    validKeysCountRef.current += 1;

    // Check if we hit the chunk limit for continuous authentication
    if (validKeysCountRef.current >= chunkSize) {
      const features = calculateFeatures();
      
      // Dispatch payload to callback
      if (onChunkReady) {
        onChunkReady(features);
      }

      // Clear the local keystroke buffer to start collecting the next window
      resetKeystrokes();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  return {
    inputValue,
    setInputValue,
    handleKeyDown,
    handleKeyUp,
    handleChange,
    calculateFeatures,
    resetKeystrokes,
  };
}