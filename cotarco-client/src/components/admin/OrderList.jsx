import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table';
import api from '../../services/api';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';

const columns = [
  {
    header: 'Parceiro',
    accessorKey: 'user.name',
  },
  {
    header: 'Total da Encomenda',
    accessorKey: 'total_amount',
    cell: ({ getValue }) => {
      const value = getValue();
      if (value === null || value === undefined) return 'N/D';
      const num = Number(value);
      if (Number.isNaN(num)) return 'N/D';
      return num.toLocaleString('pt-AO', {
        style: 'currency',
        currency: 'AOA',
      });
    },
  },
  {
    header: 'Status',
    accessorKey: 'status',
    cell: ({ getValue }) => {
      const status = getValue();
      const variant =
        status === 'paid'
          ? 'success'
          : status === 'failed'
          ? 'destructive'
          : 'secondary';
      return <Badge variant={variant}>{status}</Badge>;
    },
  },
  {
    header: 'Data da Encomenda',
    accessorKey: 'created_at',
    cell: ({ getValue }) => {
      const date = new Date(getValue());
      return date.toLocaleDateString('pt-AO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    },
  },
];

const TableSkeleton = () => (
  <div className="overflow-x-auto border rounded-md">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          {columns.map((col) => (
            <th
              key={col.header}
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-100">
        {Array.from({ length: 6 }).map((_, i) => (
          <tr key={i}>
            {columns.map((_, j) => (
              <td key={j} className="px-4 py-3">
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const OrderList = () => {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [globalFilter, setGlobalFilter] = useState('');

  const fetchOrders = async () => {
    const params = {
      page: pagination.pageIndex + 1,
      per_page: pagination.pageSize,
    };
    const response = await api.get('/admin/orders', { params });
    return response.data;
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['adminOrders', pagination],
    queryFn: fetchOrders,
    keepPreviousData: true,
  });

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    pageCount: data?.meta?.last_page ?? 0,
    onPaginationChange: setPagination,
    state: {
      pagination,
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  if (isError) {
    return <div>Erro ao carregar encomendas: {error.message}</div>;
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Encomendas</h2>
        <Input
          placeholder="Filtrar por nome do parceiro..."
          value={globalFilter ?? ''}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm mt-2"
        />
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : (
        <div className="relative overflow-x-auto border rounded-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-3 text-sm text-gray-700"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              {table.getRowModel().rows.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-6 text-center text-sm text-gray-500"
                    colSpan={columns.length}
                  >
                    Nenhuma encomenda encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Página {pagination.pageIndex + 1} de {table.getPageCount() || 1}
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
};

export default OrderList;
