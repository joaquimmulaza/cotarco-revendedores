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
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [pageCount, setPageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: pageCount,
    onPaginationChange: setPagination,
    state: { pagination },
  });

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get('/admin/products', {
          params: { page: pagination.pageIndex + 1, per_page: pagination.pageSize },
        });

        // Extrai apenas o array de produtos para a tabela
        const items = Array.isArray(response?.data?.data) ? response.data.data : [];
        const normalized = items.map((p) => ({
          ...p,
          image_url: p.image_url ?? deriveImageUrl(p),
        }));
        setData(normalized);

        // Guarda os metadados da paginação (compatível com meta.last_page ou pagination.total_pages)
        const lastPage = response?.data?.meta?.last_page ?? response?.data?.pagination?.total_pages ?? 0;
        setPageCount(Number(lastPage) || 0);
      } catch (err) {
        setError(err?.response?.data?.message || 'Erro ao carregar produtos');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [pagination.pageIndex, pagination.pageSize]);

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
          Página {pagination.pageIndex + 1} de {pageCount || 1}
        </div>
        <div className="space-x-2">
          <button
            className="px-3 py-2 rounded border text-sm disabled:opacity-50"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </button>
          <button
            className="px-3 py-2 rounded border text-sm disabled:opacity-50"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
}


