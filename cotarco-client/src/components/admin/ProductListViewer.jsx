import React, { useEffect, useRef, useState, Fragment } from 'react';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
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
    pageIndex: 0,
    pageSize: 10
  });
  const [pageCount, setPageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  
  // Para controlar quando já tivemos dados carregados
  const hasInitialFetch = useRef(false);
  const hasDataLoaded = useRef(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  const table = useReactTable({
    data,
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

  const fetchProducts = async (
    pageIndex,
    pageSize,
    { initial = false, search, categoryId } = {}
  ) => {
    // Determina se deve mostrar skeleton (loading) ou overlay (fetching)
    const shouldShowSkeleton = initial || !hasDataLoaded.current;
    
    if (shouldShowSkeleton) {
      setIsLoading(true);
    } else {
      setIsFetching(true);
    }
    
    setError(null);

    try {
      const params = {
        page: pageIndex + 1,
        per_page: pageSize
      };

      if (search != null && String(search).trim() !== '') {
        params.search = search;
      }

      if (categoryId != null && String(categoryId).trim() !== '') {
        params.category_id = categoryId;
      }

      const response = await api.get('/admin/products', { params });

      // Extrai apenas o array de produtos para a tabela
      const items = Array.isArray(response?.data?.data) ? response.data.data : [];
      const normalized = items.map((p) => ({
        ...p,
        image_url: p.image_url ?? deriveImageUrl(p),
      }));

      setData(normalized);

      // Guarda os metadados da paginação (compatível com paginator do Laravel e fallback antigo)
      const lastPage = response?.data?.meta?.last_page ?? 
                      response?.data?.pagination?.total_pages ?? 
                      response?.data?.last_page ?? 0;
      const parsedLastPage = Number(lastPage);
      if (!Number.isNaN(parsedLastPage) && parsedLastPage > 0) {
        setPageCount(parsedLastPage);
      }

      // Marca que já temos dados carregados
      hasDataLoaded.current = true;

    } catch (err) {
      setError(err?.response?.data?.message || 'Erro ao carregar produtos');
    } finally {
      if (shouldShowSkeleton) {
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
        const CACHE_KEY = 'categories_cache_v1';
        const now = Date.now();
        let usedCache = false;
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed && Array.isArray(parsed.data) && typeof parsed.ts === 'number') {
              const isFresh = now - parsed.ts < 10 * 60 * 1000; // 10 min
              if (isFresh) {
                if (isMounted) setCategories(parsed.data);
                usedCache = true;
              }
            }
          } catch {
            // Ignora cache inválido
          }
        }

        if (!usedCache) setIsLoadingCategories(true);

        const response = await api.get('/categories');
        // Aceita diferentes formatos de resposta
        const list = Array.isArray(response?.data?.data) 
          ? response.data.data 
          : Array.isArray(response?.data) 
            ? response.data 
            : [];
        if (isMounted) setCategories(list);
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: list, ts: now }));
        } catch {
          // Ignora falhas de armazenamento
        }
      } catch {
        // Silencioso por enquanto
      } finally {
        if (isMounted) setIsLoadingCategories(false);
      }
    };

    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    // Paginação, pageSize, pesquisa e categoria
    const isInitial = !hasInitialFetch.current;
    
    fetchProducts(pagination.pageIndex, pagination.pageSize, {
      initial: isInitial,
      search: debouncedSearchQuery,
      categoryId: selectedCategory,
    });

    if (isInitial) {
      hasInitialFetch.current = true;
    }
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