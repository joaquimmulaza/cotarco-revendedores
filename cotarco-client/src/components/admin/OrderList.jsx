import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    header: 'ID da Encomenda',
    accessorKey: 'id',
    cell: ({ getValue }) => `#${getValue().substring(0, 8)}`,
  },
  {
    header: 'Parceiro',
    accessorKey: 'user.name',
  },
  {
    header: 'Valor Total',
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
      const status = getValue()?.toLowerCase();
      let variant;
      let translatedStatus;

      switch (status) {
        case 'paid':
        case 'success':
          variant = 'success';
          translatedStatus = 'Sucesso';
          break;
        case 'failed':
          variant = 'destructive';
          translatedStatus = 'Falhou';
          break;
        case 'pending':
          variant = 'secondary';
          translatedStatus = 'Pendente';
          break;
        default:
          variant = 'secondary';
          translatedStatus = status;
      }

      return (
        <Badge variant={variant} className="w-20 justify-center">
          {translatedStatus}
        </Badge>
      );
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
  const navigate = useNavigate();
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '' para 'Todos'

  const fetchOrders = async () => {
    const params = {
      page: pagination.pageIndex + 1,
      per_page: pagination.pageSize,
      search: globalFilter,
    };
    if (statusFilter) {
      params.status = statusFilter;
    }
    const response = await api.get('/admin/orders', { params });
    return response.data;
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['adminOrders', pagination, statusFilter, globalFilter],
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
    pageCount: data?.last_page ?? 0,
    onPaginationChange: setPagination,
    state: {
      pagination,
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  const handleRowClick = (orderId) => {
    navigate(`/admin/dashboard/orders/${orderId}`);
  };

  if (isError) {
    return <div>Erro ao carregar encomendas: {error.message}</div>;
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Encomendas</h2>
        <div className="flex justify-between items-center mt-2">
          <div className="flex space-x-2">
            <button
              onClick={() => setStatusFilter('')}
              className={`px-3 py-1 text-sm rounded-md ${
                statusFilter === ''
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1 text-sm rounded-md ${
                statusFilter === 'pending'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Pendente
            </button>
            <button
              onClick={() => setStatusFilter('success')}
              className={`px-3 py-1 text-sm rounded-md ${
                statusFilter === 'success'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Sucesso
            </button>
            <button
              onClick={() => setStatusFilter('failed')}
              className={`px-3 py-1 text-sm rounded-md ${
                statusFilter === 'failed'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Falhou
            </button>
          </div>
          <Input
            placeholder="Filtrar por nome do parceiro..."
            value={globalFilter ?? ''}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
        </div>
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
                <tr
                  key={row.id}
                  onClick={() => handleRowClick(row.original.id)}
                  className="cursor-pointer hover:bg-muted/50"
                >
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
