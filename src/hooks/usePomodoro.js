import { useState, useEffect, useRef, useCallback } from 'react';

export function usePomodoro() {
  // Default 25 minutes in seconds
  const [defaultDuration, setDefaultDuration] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(defaultDuration);
  const [messageId, setMessageId] = useState(null); // Track which message started the timer
  const intervalRef = useRef(null);
  const notificationShownRef = useRef(false);

  // Load settings from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('tasktamer.pomodoro.duration');
      if (stored) {
        const duration = parseInt(stored, 10);
        if (duration > 0) {
          setDefaultDuration(duration);
          setTimeLeft(duration);
        }
      }
    } catch (error) {
      console.warn('Failed to load Pomodoro settings:', error);
    }
  }, []);

  // Save duration to localStorage when it changes
  const updateDuration = useCallback((newDuration) => {
    setDefaultDuration(newDuration);
    setTimeLeft(newDuration);
    try {
      localStorage.setItem('tasktamer.pomodoro.duration', newDuration.toString());
    } catch (error) {
      console.warn('Failed to save Pomodoro settings:', error);
    }
  }, []);

  // Start timer for a specific message
  const startTimer = useCallback((msgId) => {
    setMessageId(msgId);
    setIsActive(true);
    setTimeLeft(defaultDuration);
    notificationShownRef.current = false;
  }, [defaultDuration]);

  // Stop timer
  const stopTimer = useCallback(() => {
    setIsActive(false);
    setMessageId(null);
    setTimeLeft(defaultDuration);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [defaultDuration]);

  // Toggle timer
  const toggleTimer = useCallback((msgId) => {
    if (isActive && messageId === msgId) {
      stopTimer();
    } else {
      startTimer(msgId);
    }
  }, [isActive, messageId, startTimer, stopTimer]);

  // Handle timer countdown
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer completed
            setIsActive(false);
            setMessageId(null);
            
            // Show notification if supported
            if ('Notification' in window && !notificationShownRef.current) {
              notificationShownRef.current = true;
              if (Notification.permission === 'granted') {
                new Notification('TaskTamer Pomodoro', {
                  body: 'Pomodoro session completed! Time for a break.',
                  icon: '/favicon.ico'
                });
              } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                  if (permission === 'granted') {
                    new Notification('TaskTamer Pomodoro', {
                      body: 'Pomodoro session completed! Time for a break.',
                      icon: '/favicon.ico'
                    });
                  }
                });
              }
            }
            
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, timeLeft]);

  // Format time for display
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    isActive,
    timeLeft,
    messageId,
    defaultDuration,
    formatTime,
    startTimer,
    stopTimer,
    toggleTimer,
    updateDuration,
    isTimerForMessage: (msgId) => isActive && messageId === msgId,
    getDisplayTime: () => formatTime(timeLeft),
    getDefaultDurationMinutes: () => Math.floor(defaultDuration / 60),
  };
}