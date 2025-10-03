import React from 'react';

export default function QuantityInput({ value, onChange, min = 0, step = 1, className = '' }) {
  const safeNumber = (num) => (Number.isNaN(num) ? 0 : num);

  const handleDecrement = () => {
    const next = safeNumber(Number(value)) - step;
    const clamped = Math.max(min, next);
    onChange?.(clamped);
  };

  const handleIncrement = () => {
    const next = safeNumber(Number(value)) + step;
    onChange?.(next);
  };

  const handleInputChange = (e) => {
    const raw = e.target.value;
    const parsed = parseInt(raw, 10);
    const safe = safeNumber(parsed);
    const clamped = Math.max(min, safe);
    onChange?.(clamped);
  };

  return (
    <div className={`inline-flex items-center rounded-md border border-gray-300 overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={handleDecrement}
        className="px-3 py-2 text-lg select-none hover:bg-gray-100"
        aria-label="Diminuir quantidade"
      >
        −
      </button>
      <input
        type="number"
        className="w-16 text-center outline-none py-2"
        value={value}
        min={min}
        step={step}
        onChange={handleInputChange}
        aria-label="Quantidade"
      />
      <button
        type="button"
        onClick={handleIncrement}
        className="px-3 py-2 text-lg select-none hover:bg-gray-100"
        aria-label="Aumentar quantidade"
      >
        +
      </button>
    </div>
  );
}