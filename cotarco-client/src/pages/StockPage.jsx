import StockFileDownloader from '../components/StockFileDownloader';
import { FileSpreadsheet } from 'lucide-react';

const StockPage = () => {
  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Mapa de Stock</h1>
          <p className="text-sm text-slate-500">Descarregue os ficheiros de stock disponíveis</p>
        </div>
      </div>

      <StockFileDownloader />
    </div>
  );
};

export default StockPage;
