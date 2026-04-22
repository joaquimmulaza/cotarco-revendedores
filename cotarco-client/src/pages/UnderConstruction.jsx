import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Hammer } from 'lucide-react';

const UnderConstruction = ({ title = "Página" }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <Hammer className="w-10 h-10 text-gray-400 animate-pulse" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{title} em Construção</h1>
      <p className="text-gray-600 mb-8 max-w-md">
        Estamos a trabalhar arduamente para trazer esta funcionalidade para si. Por favor, volte mais tarde.
      </p>
      <button
        onClick={() => navigate(-1)}
        className="px-6 py-2 bg-[#f22f1d] text-white rounded-lg hover:bg-[#c32517] transition-colors font-medium"
      >
        Voltar Atrás
      </button>
    </div>
  );
};

export default UnderConstruction;
