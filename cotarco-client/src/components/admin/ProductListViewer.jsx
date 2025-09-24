import React, { useEffect, useState } from 'react';
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
    cell: ({ getValue }) => {
      const value = getValue();
      if (value === null || value === undefined) return 'N/D';
      const num = Number(value);
      if (Number.isNaN(num)) return 'N/D';
      return num.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    },
  },
  {
    header: 'Preço B2B',
    accessorKey: 'price_b2b',
    cell: ({ getValue }) => {
      const value = getValue();
      if (value === null || value === undefined) return 'N/D';
      const num = Number(value);
      if (Number.isNaN(num)) return 'N/D';
      return num.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    },
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
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

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

  const fetchProducts = async (
    pageIndex,
    pageSize,
    { initial = false, search, categoryId } = {}
  ) => {
    if (initial) {
      setIsLoading(true);
    } else {
      setIsFetching(true);
    }
    setError(null);
    try {
      const params = { page: pageIndex + 1, per_page: pageSize };
      if (search && String(search).trim() !== '') params.search = search;
      if (categoryId && String(categoryId).trim() !== '') params.category_id = categoryId;
      const response = await api.get('/admin/products', { params });

      // Extrai apenas o array de produtos para a tabela
      const items = Array.isArray(response?.data?.data) ? response.data.data : [];
      const normalized = items.map((p) => ({
        ...p,
        image_url: p.image_url ?? deriveImageUrl(p),
      }));
      setData(normalized);

      // Guarda os metadados da paginação (compatível com paginator do Laravel e fallback antigo)
      const lastPage =
        response?.data?.meta?.last_page ??
        response?.data?.pagination?.total_pages ??
        response?.data?.last_page ??
        0;
      const parsedLastPage = Number(lastPage);
      if (!Number.isNaN(parsedLastPage) && parsedLastPage > 0) {
        setPageCount(parsedLastPage);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Erro ao carregar produtos');
    } finally {
      if (initial) {
        setIsLoading(false);
      } else {
        setIsFetching(false);
      }
    }
  };

  

  // Carregar categorias ao montar o componente
  useEffect(() => {
    let isMounted = true;
    const loadCategories = async () => {
      try {
        const response = await api.get('/categories');
        // Aceita diferentes formatos de resposta
        const list = Array.isArray(response?.data?.data)
          ? response.data.data
          : Array.isArray(response?.data)
          ? response.data
          : [];
        if (isMounted) setCategories(list);
      } catch {
        // Silencioso por enquanto; podemos ligar ao estado de erro no futuro
        // console.error('Erro ao carregar categorias', e);
      }
    };
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    // Paginação, pageSize, pesquisa e categoria
    if (!(pagination.pageIndex === 0 && pagination.pageSize === 10 && data.length === 0)) {
      fetchProducts(pagination.pageIndex, pagination.pageSize, {
        initial: false,
        search: debouncedSearchQuery,
        categoryId: selectedCategory,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.pageIndex, pagination.pageSize, debouncedSearchQuery, selectedCategory]);

  // Debounce para a pesquisa: espera 500ms após o utilizador parar de digitar
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      // Reset para a primeira página quando a pesquisa muda
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, 500);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Reset da página ao mudar a categoria
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [selectedCategory]);

  const TableSkeleton = () => (
    <div className="overflow-x-auto border rounded-md">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th key={col.header} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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

  const headers = table.getHeaderGroups();
  const rows = table.getRowModel().rows;

  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Produtos</h2>
        {isLoading && <p className="text-sm text-gray-500">A carregar...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {/* Filtros: Pesquisa e Categoria */}
      <div className="mb-4 flex flex-col md:flex-row gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Pesquisar produtos..."
          className="w-full md:w-1/2 px-3 py-2 border rounded"
        />
        <select
          value={selectedCategory ?? ''}
          onChange={(e) => setSelectedCategory(e.target.value || null)}
          className="w-full md:w-1/2 px-3 py-2 border rounded"
        >
          <option value="">Todas as Categorias</option>
          {Array.isArray(categories) && categories.map((cat) => (
            <option key={cat.id ?? cat.slug ?? cat.name} value={cat.id ?? cat.slug ?? ''}>
              {cat.name ?? cat.title ?? 'Categoria'}
            </option>
          ))}
        </select>
      </div>

      {isLoading || isFetching ? (
        <TableSkeleton />
      ) : (
        <div className="relative overflow-x-auto border rounded-md">
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
              {rows.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan={columns.length}>
                    Sem produtos para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

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


