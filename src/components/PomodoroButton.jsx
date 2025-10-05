import { useState } from 'react';

function PomodoroButton({ messageId, pomodoro, onShowSettings }) {
  const [isHovered, setIsHovered] = useState(false);
  
  const isActiveForThis = pomodoro.isTimerForMessage(messageId);
  const isAnyActive = pomodoro.isActive;
  
  const handleToggle = (e) => {
    e.preventDefault();
    if (isAnyActive && !isActiveForThis) {
      // Another timer is running, don't allow starting a new one
      return;
    }
    pomodoro.toggleTimer(messageId);
  };

  const handleSettingsClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onShowSettings?.();
  };

  return (
    <div 
      className="flex items-center gap-2 mt-3 p-2 bg-neutral-800/30 rounded-md border border-neutral-700/50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-2 flex-1">
        <input
          type="checkbox"
          checked={isActiveForThis}
          onChange={handleToggle}
          disabled={isAnyActive && !isActiveForThis}
          className={`w-4 h-4 rounded ${
            isActiveForThis 
              ? 'accent-green-500' 
              : isAnyActive 
                ? 'opacity-50 cursor-not-allowed' 
                : 'accent-blue-500 hover:accent-blue-600'
          }`}
          title={
            isActiveForThis 
              ? 'Stop Pomodoro' 
              : isAnyActive 
                ? 'Another Pomodoro is running' 
                : 'Start Pomodoro'
          }
        />
        
        <span className={`text-sm font-medium ${
          isActiveForThis ? 'text-green-400' : 'text-neutral-300'
        }`}>
          🍅 Pomodoro
        </span>
        
        {isActiveForThis && (
          <span className="text-sm font-mono text-neutral-900 bg-green-400 px-2 py-1 rounded font-semibold">
            {pomodoro.getDisplayTime()}
          </span>
        )}
        
        {!isActiveForThis && !isAnyActive && (
          <span className="text-xs text-neutral-500">
            {pomodoro.getDefaultDurationMinutes()}m
          </span>
        )}
        
        {isAnyActive && !isActiveForThis && (
          <span className="text-xs text-neutral-500 opacity-50">
            Timer running elsewhere
          </span>
        )}
      </div>

      {(isHovered || isActiveForThis) && (
        <button
          onClick={handleSettingsClick}
          className="text-xs text-neutral-400 hover:text-neutral-200 p-1 rounded transition-colors"
          title="Pomodoro Settings"
        >
          ⚙️
        </button>
      )}
    </div>
  );
}

export default PomodoroButton;