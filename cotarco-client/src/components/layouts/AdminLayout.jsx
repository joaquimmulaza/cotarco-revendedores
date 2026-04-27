import React from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";

/**
 * UX-first breadcrumb map.
 *
 * Each key is a pathname (or prefix for dynamic routes).
 * Each value is an array of breadcrumb segments:
 *   { label: string, to?: string }
 * The last item is always the current page (no link).
 * Segments without `to` are non-clickable labels.
 */
const BREADCRUMB_MAP = [
  // ── Dashboard ──────────────────────────────────────────────
  {
    match: /^\/admin\/dashboard\/?$/,
    crumbs: [{ label: "Overview" }],
  },
  {
    match: /^\/admin\/dashboard\/overview\/?$/,
    crumbs: [{ label: "Overview" }],
  },
  // ── Parceiros ──────────────────────────────────────────────
  {
    match: /^\/admin\/dashboard\/partners\/?$/,
    crumbs: [{ label: "Parceiros" }],
  },
  {
    match: /^\/admin\/dashboard\/partners\/(.+)$/,
    crumbs: [
      { label: "Parceiros", to: "/admin/dashboard/partners" },
      { label: "Detalhe do Parceiro" },
    ],
  },
  // ── Catálogo ───────────────────────────────────────────────
  {
    match: /^\/admin\/dashboard\/product-list\/?$/,
    crumbs: [{ label: "Catálogo" }],
  },
  {
    match: /^\/admin\/dashboard\/product-list\/(.+)$/,
    crumbs: [
      { label: "Catálogo", to: "/admin/dashboard/product-list" },
      { label: "Detalhe do Produto" },
    ],
  },
  // ── Stocks ─────────────────────────────────────────────────
  {
    match: /^\/admin\/dashboard\/stock-files\/?$/,
    crumbs: [{ label: "Stocks" }],
  },
  // ── Encomendas ─────────────────────────────────────────────
  {
    match: /^\/admin\/dashboard\/orders\/?$/,
    crumbs: [{ label: "Encomendas" }],
  },
  {
    match: /^\/admin\/dashboard\/orders\/(.+)$/,
    crumbs: [
      { label: "Encomendas", to: "/admin/dashboard/orders" },
      { label: "Detalhe da Encomenda" },
    ],
  },
  // ── Definições ─────────────────────────────────────────────
  {
    match: /^\/admin\/dashboard\/settings\/?$/,
    crumbs: [{ label: "Definições" }],
  },
];

/** Resolve the breadcrumb trail for the current pathname. */
function resolveBreadcrumbs(pathname) {
  for (const entry of BREADCRUMB_MAP) {
    if (entry.match.test(pathname)) {
      return entry.crumbs;
    }
  }
  // Fallback: show just the last meaningful segment capitalised
  const last = pathname.split("/").filter(Boolean).at(-1) ?? "Admin";
  return [{ label: last.charAt(0).toUpperCase() + last.slice(1) }];
}

export default function AdminLayout() {
  const location = useLocation();
  const crumbs = resolveBreadcrumbs(location.pathname);

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="h-svh overflow-y-auto bg-gray-50/50 transition-all duration-300 ease-in-out">
        <header className="flex h-16 shrink-0 items-center border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-20">
          <div className="max-w-7xl mx-auto w-full flex items-center px-4 md:px-6 transition-all duration-300">
            <div className="flex items-center gap-2 mr-4 shrink-0">
              <SidebarTrigger className="transition-transform duration-300 hover:scale-110 active:scale-95 shrink-0" />
              <Separator orientation="vertical" className="h-4 shrink-0" />
            </div>

            <div className="flex-1 flex items-center justify-between min-w-0">
              <Breadcrumb>
                <BreadcrumbList>
                  {crumbs.map((crumb, index) => {
                    const isLast = index === crumbs.length - 1;

                    return (
                      <React.Fragment key={crumb.label + index}>
                        <BreadcrumbItem className={isLast ? "" : "hidden md:block"}>
                          {isLast ? (
                            <BreadcrumbPage
                              data-testid="breadcrumb-page"
                              className="font-semibold text-[#f22f1d]"
                            >
                              {crumb.label}
                            </BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink asChild>
                              <Link
                                to={crumb.to}
                                className="text-gray-500 hover:text-[#f22f1d] transition-colors"
                              >
                                {crumb.label}
                              </Link>
                            </BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                        {!isLast && <BreadcrumbSeparator className="hidden md:block" />}
                      </React.Fragment>
                    );
                  })}
                </BreadcrumbList>
              </Breadcrumb>

              <div className="flex items-center gap-4 shrink-0">
                {/* Ações de header futuras */}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col w-full">
          <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-6 md:py-8 animate-in fade-in slide-in-from-bottom-4 duration-300 transition-all">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
