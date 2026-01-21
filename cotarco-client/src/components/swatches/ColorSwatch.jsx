import React, { useMemo } from 'react';

const COLOR_MAP = {
    'navy': '#000080',
    'blue': '#0000FF',
    'silver': '#C0C0C0',
    'black': '#000000',
    'gray': '#808080',
    'pink': '#FFC0CB',
    'yellow': '#FFFF00',
    'green': '#008000',
    'phantom-black': '#000000',
    'phantom-silver': '#C0C0C0',
    // Add other Samsung specific colors here as needed
    'cinza': '#808080',
    'preto': '#000000',
    'azul': '#0000FF',
    'azul.': '#0000FF',
    'rosa': '#E5D4D6'
};

export default function ColorSwatch({ colorName, selected, onClick, disabled }) {
    const hex = useMemo(() => {
        const key = colorName?.toLowerCase();
        if (COLOR_MAP[key]) return COLOR_MAP[key];
        // Fallback: try using the name as color, works for standard html colors
        return key;
    }, [colorName]);

    return (
        <div
            onClick={!disabled ? onClick : undefined}
            className={`
        w-8 h-8 rounded-full cursor-pointer flex items-center justify-center border-1 transition-all duration-200
        ${selected ? 'border-primary  ring-primary ring-offset-2' : 'border-gray-200 hover:border-gray-400'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
            title={colorName}
        >
            <div
                className="w-6 h-6 rounded-full shadow-sm"
                style={{ backgroundColor: hex }}
            />
        </div>
    );
}
