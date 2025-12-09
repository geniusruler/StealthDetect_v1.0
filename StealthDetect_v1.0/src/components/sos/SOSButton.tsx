import { useState, useRef, useCallback, useEffect } from 'react';
import { Phone } from 'lucide-react';
import { haptics } from '../../utils/native';

interface SOSButtonProps {
  onActivate: () => void;
  holdDuration?: number; // ms, default 1500
  disabled?: boolean;
}

export function SOSButton({
  onActivate,
  holdDuration = 1500,
  disabled = false
}: SOSButtonProps) {
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const startHold = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (disabled) return;

    setIsHolding(true);
    setProgress(0);
    haptics.impact('medium');

    const startTime = Date.now();

    // Update progress every 50ms
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(elapsed / holdDuration, 1);
      setProgress(newProgress);
    }, 50);

    // Trigger after hold duration
    holdTimerRef.current = setTimeout(() => {
      clearTimers();
      setIsHolding(false);
      setProgress(0);
      haptics.notification('success');
      onActivate();
    }, holdDuration);
  }, [disabled, holdDuration, onActivate, clearTimers]);

  const endHold = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    clearTimers();
    setIsHolding(false);
    setProgress(0);
  }, [clearTimers]);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  // Calculate the stroke-dashoffset for the progress ring
  const circumference = 2 * Math.PI * 28;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <button
      onTouchStart={startHold}
      onTouchEnd={endHold}
      onTouchCancel={endHold}
      onMouseDown={startHold}
      onMouseUp={endHold}
      onMouseLeave={endHold}
      disabled={disabled}
      style={{
        position: 'fixed',
        bottom: '100px',
        right: '20px',
        zIndex: 9999,
        width: '72px',
        height: '72px',
        borderRadius: '50%',
        backgroundColor: disabled ? '#9CA3AF' : '#DC2626',
        border: '4px solid #FFF',
        boxShadow: '0 4px 20px rgba(220, 38, 38, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transform: isHolding ? 'scale(1.1)' : 'scale(1)',
        transition: 'transform 0.2s ease',
        touchAction: 'none',
      }}
      aria-label="SOS Emergency Button - Hold to activate"
    >
      {/* Progress ring */}
      <svg
        style={{
          position: 'absolute',
          top: '-4px',
          left: '-4px',
          width: '80px',
          height: '80px',
          transform: 'rotate(-90deg)',
          pointerEvents: 'none',
        }}
        viewBox="0 0 80 80"
      >
        <circle
          cx="40"
          cy="40"
          r="28"
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="6"
        />
        <circle
          cx="40"
          cy="40"
          r="28"
          fill="none"
          stroke="#FFF"
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.05s linear' }}
        />
      </svg>

      {/* SOS Text and Icon */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        zIndex: 10,
      }}>
        <span style={{
          color: '#FFF',
          fontSize: '16px',
          fontWeight: 'bold',
          lineHeight: 1,
        }}>
          SOS
        </span>
        <Phone style={{ width: '16px', height: '16px', color: '#FFF', marginTop: '2px' }} />
      </div>

      {/* Pulse animation */}
      {!isHolding && !disabled && (
        <span
          style={{
            position: 'absolute',
            inset: '-4px',
            borderRadius: '50%',
            backgroundColor: '#DC2626',
            opacity: 0.3,
            animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
          }}
        />
      )}

      <style>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
      `}</style>
    </button>
  );
}
