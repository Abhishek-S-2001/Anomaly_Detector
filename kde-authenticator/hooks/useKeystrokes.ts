'use client';

import { useState, useRef, useCallback } from 'react';

interface KeyEvent {
  key: string;
  type: 'down' | 'up';
  timestamp: number;
}

export function useKeystrokes() {
  const [inputValue, setInputValue] = useState('');
  const eventsRef = useRef<KeyEvent[]>([]);

  // Capture sub-millisecond timestamps on key press/release
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Ignore meta keys to keep the data clean
    if (['Shift', 'Control', 'Alt', 'Meta', 'Backspace'].includes(e.key)) return;
    
    eventsRef.current.push({
      key: e.key,
      type: 'down',
      timestamp: performance.now(),
    });
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['Shift', 'Control', 'Alt', 'Meta', 'Backspace'].includes(e.key)) return;

    eventsRef.current.push({
      key: e.key,
      type: 'up',
      timestamp: performance.now(),
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Process the raw events into the arrays your Python model requires
  const calculateFeatures = useCallback(() => {
    const events = eventsRef.current;
    const dwellTimes: number[] = [];
    const flightTimes: number[] = [];
    const holdTimes: number[] = []; // Down-Down time

    let lastKeyDownTime: number | null = null;
    let lastKeyUpTime: number | null = null;

    events.forEach((event, index) => {
      if (event.type === 'down') {
        // Calculate Hold Time (DD: Down-Down)
        if (lastKeyDownTime !== null) {
          holdTimes.push(event.timestamp - lastKeyDownTime);
        }
        
        // Calculate Flight Time (UD: Up-Down)
        if (lastKeyUpTime !== null) {
          flightTimes.push(event.timestamp - lastKeyUpTime);
        }
        
        lastKeyDownTime = event.timestamp;
      }

      if (event.type === 'up') {
        // Calculate Dwell Time (Press to Release for the same key)
        // Find the corresponding 'down' event by looking backward
        for (let i = index - 1; i >= 0; i--) {
          if (events[i].type === 'down' && events[i].key === event.key) {
            dwellTimes.push(event.timestamp - events[i].timestamp);
            break;
          }
        }
        lastKeyUpTime = event.timestamp;
      }
    });

    return { dwell_time: dwellTimes, hold_time: holdTimes, flight_time: flightTimes };
  }, []);

  const resetKeystrokes = useCallback(() => {
    setInputValue('');
    eventsRef.current = [];
  }, []);

  return {
    inputValue,
    handleKeyDown,
    handleKeyUp,
    handleChange,
    calculateFeatures,
    resetKeystrokes,
  };
}