
import React from 'react';

interface AutoplayToggleProps {
  isOn: boolean;
  onToggle: () => void;
}

export const AutoplayToggle: React.FC<AutoplayToggleProps> = ({ isOn, onToggle }) => {
  return (
    <div className="flex items-center space-x-2 cursor-pointer" onClick={onToggle}>
      <span className="font-semibold text-sm text-youtube-text-primary">Autoplay</span>
      <div
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 ease-in-out ${
          isOn ? 'bg-blue-500' : 'bg-youtube-dark-tertiary'
        }`}
      >
        <span
          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ease-in-out ${
            isOn ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </div>
    </div>
  );
};
