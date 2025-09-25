import React, { useEffect, useState, Fragment } from 'react';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
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
      return num.toLocaleString('pt-AO', {
        style: 'currency',
        currency: 'AOA'
      });
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
      return num.toLocaleString('pt-AO', {
        style: 'currency',
        currency: 'AOA'
      });
    },
  },
  {
    header: 'Quantidade',
    accessorKey: 'stock_quantity',
    cell: ({ getValue }) => {
      const value = getValue();
      if (value === null || value === undefined) return 'N/D';
      const num = Number(value);
      if (Number.isNaN(num)) return 'N/D';
      return num.toLocaleString('pt-AO');
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
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  
  const { data: categories, isLoading: isLoadingCategories, error: categoriesError } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(res => res.data?.data),
    staleTime: Infinity,
  });

  const fetchProducts = async () => {
    const params = {
      page: pagination.pageIndex + 1,
      per_page: pagination.pageSize,
    };
    if (debouncedSearchQuery != null && String(debouncedSearchQuery).trim() !== '') {
      params.search = debouncedSearchQuery;
    }
    if (selectedCategory != null && String(selectedCategory).trim() !== '') {
      params.category_id = selectedCategory;
    }
    const response = await api.get('/admin/products', { params });
    return response.data;
  };

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['adminProducts', pagination.pageIndex, pagination.pageSize, debouncedSearchQuery, selectedCategory],
    queryFn: fetchProducts,
    keepPreviousData: true,
  });

  const items = (Array.isArray(data?.data) ? data.data : []).map((p) => ({
    ...p,
    image_url: p.image_url ?? deriveImageUrl(p),
  }));

  const pageCount = (() => {
    const lastPage = data?.meta?.last_page ?? data?.pagination?.total_pages ?? data?.last_page ?? 0;
    const parsed = Number(lastPage);
    return !Number.isNaN(parsed) && parsed > 0 ? parsed : 0;
  })();

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: pageCount,
    onPaginationChange: setPagination,
    state: {
      pagination
    },
  });

  // Removido o carregamento manual de categorias; agora é feito via useQuery

  useEffect(() => {
    // Reset para a primeira página quando a pesquisa muda
    // (o useQuery reagirá ao queryKey e buscará os dados)
  }, [pagination.pageIndex, pagination.pageSize, debouncedSearchQuery, selectedCategory]);

  // Debounce para a pesquisa: espera 500ms após o utilizador parar de digitar
  useEffect(() => {
    const handler = setTimeout(() => {
      // Apenas atualiza se houver mudança real (evita chamada dupla no carregamento)
      if (searchQuery !== debouncedSearchQuery) {
        setDebouncedSearchQuery(searchQuery);
        // Reset para a primeira página quando a pesquisa muda, somente se necessário
        setPagination((prev) => 
          prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }
        );
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [searchQuery, debouncedSearchQuery]);

  // Reset da página ao mudar a categoria (somente se necessário)
  useEffect(() => {
    setPagination((prev) => 
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }
    );
  }, [selectedCategory]);

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

  const headers = table.getHeaderGroups();
  const rows = table.getRowModel().rows;

  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Produtos</h2>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {categoriesError && <p className="text-sm text-red-600">Erro ao carregar categorias</p>}
      </div>

      {/* Filtros: Pesquisa e Categoria */}
      <div className="mb-4 flex flex-col md:flex-row gap-3">
        <div className="w-full md:w-1/2">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 103.473 9.749l3.139 3.139a.75.75 0 101.06-1.06l-3.139-3.139A5.5 5.5 0 009 3.5zM4.5 9a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0z" clipRule="evenodd" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar produtos por nome ou referência..."
              className="w-full rounded border bg-white py-2 pl-10 pr-10 text-sm shadow-sm outline-none transition focus:"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                aria-label="Limpar pesquisa"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path fillRule="evenodd" d="M6.225 4.811a1 1 0 011.414 0L12 9.172l4.361-4.361a1 1 0 111.414 1.414L13.414 10.586l4.361 4.361a1 1 0 01-1.414 1.414L12 12l-4.361 4.361a1 1 0 01-1.414-1.414l4.361-4.361-4.361-4.361a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className="w-full md:w-1/2">
          <Listbox
            value={selectedCategory ?? ''}
            onChange={(val) => setSelectedCategory(val === '' ? null : val)}
          >
            <div className="relative">
              <ListboxButton className="relative w-full cursor-default rounded border bg-white py-2 pl-3 pr-10 text-left sm:text-sm">
                <span className="block truncate">
                  {(selectedCategory === null || selectedCategory === '')
                    ? 'Todas as Categorias'
                    : (Array.isArray(categories)
                        ? (categories.find((c) => (c.id ?? c.slug ?? '') === selectedCategory)?.name ?? 'Categoria')
                        : 'Categoria')}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  {isLoadingCategories ? (
                    <svg className="h-5 w-5 animate-spin text-red-500" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                  ) : (
                    <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  )}
                </span>
              </ListboxButton>
              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <ListboxOptions className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                  <ListboxOption
                    className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-gray-100 text-gray-900' : 'text-gray-800'}`}
                    value=""
                  >
                    {({ selected }) => (
                      <>
                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                          Todas as Categorias
                        </span>
                        {selected ? (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-red-600">
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </ListboxOption>
                  {Array.isArray(categories) && categories.map((cat) => {
                    const value = cat.id ?? cat.slug ?? '';
                    const label = cat.name ?? cat.title ?? 'Categoria';
                    return (
                      <ListboxOption
                        key={`${value}`}
                        className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-gray-50 text-gray-900' : 'text-gray-800'}`}
                        value={value}
                      >
                        {({ selected }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                              {label}
                            </span>
                            {selected ? (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-red-600">
                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                              </span>
                            ) : null}
                          </>
                        )}
                      </ListboxOption>
                    );
                  })}
                </ListboxOptions>
              </Transition>
            </div>
          </Listbox>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : (
        <div className="relative overflow-x-auto border rounded-md">
          {isFetching && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500 border-t-transparent"></div>
            </div>
          )}

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
              {rows.map((row) => (
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
              {rows.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-6 text-center text-sm text-gray-500"
                    colSpan={columns.length}
                  >
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