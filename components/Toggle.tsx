import React from 'react';

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

export const Toggle: React.FC<ToggleProps> = ({ enabled, onChange, label, description, icon }) => {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium text-slate-200">{label}</span>
        </div>
        {description && <span className="text-xs text-slate-400">{description}</span>}
      </div>
      <button
        type="button"
        className={`${
          enabled ? 'bg-yellow-500' : 'bg-slate-700'
        } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-slate-900`}
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
      >
        <span
          aria-hidden="true"
          className={`${
            enabled ? 'translate-x-5' : 'translate-x-0'
          } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
      </button>
    </div>
  );
};