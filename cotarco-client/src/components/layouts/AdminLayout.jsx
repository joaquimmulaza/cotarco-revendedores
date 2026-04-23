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

export default function AdminLayout() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  const routeMap = {
    admin: "Administração",
    dashboard: "Dashboard",
    partners: "Parceiros",
    "product-list": "Catálogo",
    "stock-files": "Stock",
    orders: "Encomendas",
    settings: "Definições",
  };

  const nonClickableSegments = ["admin", "distribuidores", "distribuidor"];

  const getBreadcrumbLabel = () => {
    const lastPath = pathnames[pathnames.length - 1];
    return routeMap[lastPath] || lastPath?.charAt(0).toUpperCase() + lastPath?.slice(1) || "Admin";
  };

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
                  {pathnames.map((value, index) => {
                    const last = index === pathnames.length - 1;
                    const to = `/${pathnames.slice(0, index + 1).join("/")}`;
                    const title = routeMap[value] || value.charAt(0).toUpperCase() + value.slice(1);
                    const isClickable = !last && !nonClickableSegments.includes(value);

                    return (
                      <React.Fragment key={to}>
                        <BreadcrumbItem className={last ? "" : "hidden md:block"}>
                          {last ? (
                            <BreadcrumbPage data-testid="breadcrumb-page" className="font-semibold text-[#f22f1d]">{title}</BreadcrumbPage>
                          ) : isClickable ? (
                            <BreadcrumbLink asChild>
                              <Link to={to} className="text-gray-500 hover:text-[#f22f1d] transition-colors">{title}</Link>
                            </BreadcrumbLink>
                          ) : (
                            <span className="text-gray-500 cursor-default">{title}</span>
                          )}
                        </BreadcrumbItem>
                        {!last && <BreadcrumbSeparator className="hidden md:block" />}
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
