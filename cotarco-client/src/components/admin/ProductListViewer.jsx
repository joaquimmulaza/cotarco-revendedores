import React, { useEffect, useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import api from '../../services/api';

// Definição das colunas
const columns = [
  {
    header: 'Imagem',
    accessorKey: 'image_url',
    cell: ({ getValue }) => (
      <img
        src={getValue() || ''}
        alt="Produto"
        className="h-12 w-12 object-cover rounded bg-gray-100"
      />
    ),
  },
  {
    header: 'Referencia',
    accessorKey: 'sku',
  },
  {
    header: 'Nome do Produto',
    accessorKey: 'name',
  },
  {
    header: 'Preço B2C',
    accessorKey: 'price_b2c',
    cell: ({ getValue }) =>
      getValue()
        ? `${(getValue() / 100).toLocaleString('pt-AO', {
            style: 'currency',
            currency: 'AOA',
          })}`
        : 'N/D',
  },
  {
    header: 'Preço B2B',
    accessorKey: 'price_b2b',
    cell: ({ getValue }) =>
      getValue()
        ? `${(getValue() / 100).toLocaleString('pt-AO', {
            style: 'currency',
            currency: 'AOA',
          })}`
        : 'N/D',
  },
  {
    header: 'Stock',
    accessorKey: 'stock_status',
  },
];

function deriveImageUrl(product) {
  // Similar ao backend ProductResource
  if (product?.image?.src) return product.image.src;
  if (Array.isArray(product?.images) && product.images.length > 0) {
    const first = product.images[0];
    if (first?.src) return first.src;
  }
  return '';
}

export default function ProductListViewer() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total_pages: 0,
    total_items: 0,
    has_next_page: false,
    has_prev_page: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const table = useReactTable({
    data,
    columns,
    state: {
      pagination: {
        pageIndex: (pagination.current_page || 1) - 1,
        pageSize: pagination.per_page || 10,
      },
    },
    manualPagination: true,
    pageCount: pagination.total_pages || -1,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater({
        pageIndex: (pagination.current_page || 1) - 1,
        pageSize: pagination.per_page || 10,
      }) : updater;
      // Carregar nova página do backend
      const nextPage = (next.pageIndex ?? 0) + 1;
      fetchProducts(nextPage, next.pageSize ?? pagination.per_page);
    },
  });

  const fetchProducts = async (page = 1, perPage = 10) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/products', {
        params: { page, per_page: perPage },
      });
      const payload = response.data || {};
      const items = Array.isArray(payload.data) ? payload.data : [];
      // Derivar image_url se não vier do backend
      const normalized = items.map((p) => ({
        ...p,
        image_url: p.image_url ?? deriveImageUrl(p),
      }));
      setData(normalized);
      if (payload.pagination) {
        setPagination(payload.pagination);
      } else {
        setPagination((prev) => ({ ...prev, current_page: page, per_page: perPage }));
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Erro ao carregar produtos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1, pagination.per_page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const headers = useMemo(() => table.getHeaderGroups(), [table]);
  const rows = useMemo(() => table.getRowModel().rows, [table]);

  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Produtos</h2>
        {isLoading && <p className="text-sm text-gray-500">A carregar...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <div className="overflow-x-auto border rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {headers.map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-sm text-gray-700">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>)
                )}
              </tr>
            ))}
            {rows.length === 0 && !isLoading && (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan={columns.length}>
                  Sem produtos para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Página {pagination.current_page} de {pagination.total_pages || 1}
        </div>
        <div className="space-x-2">
          <button
            className="px-3 py-2 rounded border text-sm disabled:opacity-50"
            onClick={() => table.previousPage()}
            disabled={!pagination.has_prev_page}
          >
            Anterior
          </button>
          <button
            className="px-3 py-2 rounded border text-sm disabled:opacity-50"
            onClick={() => table.nextPage()}
            disabled={!pagination.has_next_page}
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
}


