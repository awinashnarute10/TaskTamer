import { useState, useEffect } from 'react';

function PomodoroSettingsModal({ isOpen, onClose, pomodoro }) {
  const [tempDuration, setTempDuration] = useState(25);
  const [isCustom, setIsCustom] = useState(false);

  const presetDurations = [
    { label: '15 minutes', value: 15 },
    { label: '25 minutes (Classic)', value: 25 },
    { label: '30 minutes', value: 30 },
    { label: '45 minutes', value: 45 },
    { label: '60 minutes', value: 60 },
  ];

  useEffect(() => {
    if (isOpen) {
      const currentMinutes = pomodoro.getDefaultDurationMinutes();
      setTempDuration(currentMinutes);
      
      // Check if current duration matches any preset
      const matchesPreset = presetDurations.some(preset => preset.value === currentMinutes);
      setIsCustom(!matchesPreset);
    }
  }, [isOpen, pomodoro]);

  const handleSave = () => {
    const newDurationInSeconds = tempDuration * 60;
    pomodoro.updateDuration(newDurationInSeconds);
    onClose();
  };

  const handlePresetSelect = (minutes) => {
    setTempDuration(minutes);
    setIsCustom(false);
  };

  const handleCustomToggle = () => {
    setIsCustom(!isCustom);
    if (!isCustom) {
      setTempDuration(25); // Reset to default when switching to custom
    }
  };

  const handleCustomChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= 120) {
      setTempDuration(value);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-200">
            🍅 Pomodoro Settings
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 text-xl"
            title="Close"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Select Duration
            </label>
            <div className="grid grid-cols-1 gap-2">
              {presetDurations.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handlePresetSelect(preset.value)}
                  className={`text-left px-3 py-2 rounded border transition-colors ${
                    !isCustom && tempDuration === preset.value
                      ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                      : 'border-neutral-600 bg-neutral-700/50 text-neutral-300 hover:border-neutral-500 hover:bg-neutral-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-neutral-600 pt-4">
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={isCustom}
                onChange={handleCustomToggle}
                className="w-4 h-4 accent-blue-500"
              />
              <label className="text-sm font-medium text-neutral-300">
                Custom Duration
              </label>
            </div>

            {isCustom && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={tempDuration}
                  onChange={handleCustomChange}
                  className="w-20 px-2 py-1 bg-neutral-700 border border-neutral-600 rounded text-neutral-200 text-sm"
                />
                <span className="text-sm text-neutral-400">minutes</span>
              </div>
            )}
          </div>

          <div className="text-xs text-neutral-500 bg-neutral-700/30 p-2 rounded">
            💡 Tip: The classic Pomodoro technique uses 25-minute focused work sessions
            followed by 5-minute breaks.
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-neutral-300 border border-neutral-600 rounded hover:bg-neutral-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default PomodoroSettingsModal;