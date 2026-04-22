import React, { useState } from "react";
import { Outlet, useLocation, Link, useSearchParams } from "react-router-dom";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { PartnerSidebar } from "./PartnerSidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext.jsx";
import CartDrawer from "@/components/CartDrawer";

export default function PartnerLayout() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { totalItems } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const pathnames = location.pathname.split("/").filter((x) => x);
  const showStockMap = searchParams.get('view') === 'stock-map';

  const routeMap = {
    dashboard: "Dashboard",
    catalog: "Catálogo",
    checkout: "Checkout",
    orders: "Histórico",
    profile: "O Meu Perfil",
  };

  const nonClickableSegments = ["distribuidores", "distribuidor"];

  const toggleStockMap = () => {
    if (showStockMap) {
      searchParams.delete('view');
    } else {
      searchParams.set('view', 'stock-map');
    }
    setSearchParams(searchParams);
  };

  return (
    <SidebarProvider>
      <PartnerSidebar />
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
                            <BreadcrumbPage className="font-semibold text-[#f22f1d]">{title}</BreadcrumbPage>
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
                {/* Botão Mapa de Stock */}
                <div className="relative hidden sm:block">
                  <button
                    onClick={toggleStockMap}
                    className={`cursor-pointer px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none relative z-10 ${
                      showStockMap
                        ? 'bg-gray-100 text-gray-900 border border-gray-200'
                        : 'bg-[#F23C13] text-white hover:bg-[#E0350F]'
                    }`}
                  >
                    {showStockMap ? 'Sair do Mapa' : 'Mapa de Stock'}
                  </button>
                  {!showStockMap && (
                    <div 
                      className="absolute inset-x-2 -inset-y-0 rounded-lg bg-[#f23c13] opacity-20 animate-ping -z-10"
                      style={{ animationDuration: '1.5s' }}
                    ></div>
                  )}
                </div>

                {/* Carrinho */}
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="relative p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600 group"
                  aria-label="Carrinho"
                >
                  <ShoppingCart className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  {totalItems > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-[#f23c13] animate-in zoom-in duration-300">
                      {totalItems}
                    </Badge>
                  )}
                </button>
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
      <CartDrawer open={isCartOpen} onOpenChange={setIsCartOpen} />
    </SidebarProvider>
  );
}
