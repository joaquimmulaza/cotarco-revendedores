import React from 'react';

export default function ButtonSwatch({ label, selected, onClick, disabled }) {
    return (
        <button
            onClick={!disabled ? onClick : undefined}
            disabled={disabled}
            className={`
        px-3 py-1.5 rounded-md text-sm font-medium border transition-all duration-200
        ${selected
                    ? 'border-primary bg-primary/5 text-primary ring-primary'
                    : 'border-gray-200 text-gray-700 hover:border-gray-400 bg-white'
                }
        ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}
      `}
        >
            {label}
        </button>
    );
}
