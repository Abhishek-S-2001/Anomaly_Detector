'use client';

import { useState } from 'react';
import { useKeystrokes } from '@/hooks/useKeystrokes';
import Header from '@/components/Header';
import InteractiveConsole from '@/components/InteractiveConsole';
import PerformanceDashboard from '@/components/PerformanceDashboard';

const TARGET_PASSPHRASE = "secure_KDE_login";
const REQUIRED_SAMPLES = 5;

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function KeystrokeAuthenticator() {
  const [isTestingAsGenuine, setIsTestingAsGenuine] = useState<boolean>(true);
  const [mode, setMode] = useState<'registration' | 'live'>('registration');
  const [samplesCaptured, setSamplesCaptured] = useState(0);
  const [authStatus, setAuthStatus] = useState<'idle' | 'analyzing' | 'success' | 'failed'>('idle');
  const [sampleData, setSampleData] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
 

  const {
    inputValue,
    handleKeyDown,
    handleKeyUp,
    handleChange,
    calculateFeatures,
    resetKeystrokes,
  } = useKeystrokes();

  // Helper to cleanly wipe state on tab switch
  const handleResetState = () => {
    resetKeystrokes();
    setSampleData([]);
    setSamplesCaptured(0);
    setAuthStatus('idle');
  };

  const onKeyDownWrapper = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    handleKeyDown(e);

    if (e.key === 'Enter') {
      e.preventDefault();

      if (inputValue !== TARGET_PASSPHRASE) {
        alert("Passphrase does not match. Please try again.");
        resetKeystrokes();
        return;
      }

      const features = calculateFeatures();
      resetKeystrokes();

      if (mode === 'registration') {
        const newSamples = [...sampleData, features];
        setSampleData(newSamples);
        setSamplesCaptured(newSamples.length);

        if (newSamples.length === REQUIRED_SAMPLES) {
          try {
            const response = await fetch(`${API_URL}/api/register`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                username: "admin_user",
                passphrase: TARGET_PASSPHRASE,
                samples: newSamples,
                // is_actual_genuine: isTestingAsGenuine
              })
            });

            const result = await response.json();
            alert(`Registration Complete! Security Threshold set to: ${result.security_threshold.toFixed(2)}`);
            setRefreshTrigger(prev => prev + 1);
            
            handleResetState();
            setMode('live');
            
          } catch (error) {
            console.error("Registration failed:", error);
            alert("Failed to reach the KDE backend.");
          }
        }
      } else if (mode === 'live') {
        setAuthStatus('analyzing');
        
        try {
          const response = await fetch(`${API_URL}/api/authenticate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: "admin_user",
              passphrase: TARGET_PASSPHRASE,
              sample: features,
              is_actual_genuine: isTestingAsGenuine

            })
          });

          const result = await response.json();
          
          if (result.predicted_genuine) {
            setAuthStatus('success');
          } else {
            setAuthStatus('failed');
          }
          setRefreshTrigger(prev => prev + 1);
        } catch (error) {
          console.error("Authentication failed:", error);
          setAuthStatus('idle');
          alert("Failed to reach the KDE backend.");
        }
      }
    }
  };

  return (
        <div className="min-h-screen w-full bg-[#0b0f19] text-slate-300 font-mono tracking-tight">
          <div className="max-w-8xl mx-auto p-8 md:p-16 space-y-12">
            
            <Header />

            {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> */}
              
              <InteractiveConsole 
                mode={mode}
                setMode={setMode}
                inputValue={inputValue}
                handleChange={handleChange}
                onKeyDownWrapper={onKeyDownWrapper}
                handleKeyUp={handleKeyUp}
                resetState={handleResetState}
                samplesCaptured={samplesCaptured}
                requiredSamples={REQUIRED_SAMPLES}
                targetPassphrase={TARGET_PASSPHRASE}
                authStatus={authStatus}
                isTestingAsGenuine={isTestingAsGenuine}
                setIsTestingAsGenuine={setIsTestingAsGenuine}
              />

              <PerformanceDashboard refreshTrigger={refreshTrigger} />

            </div>

          </div>
        // </div>
  );
}