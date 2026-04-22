import { NavLink, useLocation } from "react-router-dom";
import { 
  Home,
  ShoppingCart,
  ClipboardList,
  History,
  User
} from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar
} from "@/components/ui/sidebar";
import { NavUser } from "./NavUser";
import logo from "@/assets/logo-cotarco.png";
import logoIcon from "@/assets/COTARCO_icon.png";

export function PartnerSidebar() {
  const { isMobile, setOpenMobile } = useSidebar();
  const location = useLocation();

  const items = [
    { title: "Início", url: "/catalog", icon: Home },
    { title: "Comprar", url: "/catalog", icon: ShoppingCart },
    { title: "Histórico", url: "/orders", icon: History },
    { title: "O Meu Perfil", url: "/profile", icon: User },
  ];

  return (
    <Sidebar collapsible="icon" className="border-none shadow-[2px_0_12px_rgba(0,0,0,0.05)] bg-[#fcfcfc]">
      <SidebarHeader className="h-16 px-6 flex items-center justify-center border-b border-transparent transition-all duration-300 group-data-[state=collapsed]:h-16 group-data-[state=collapsed]:px-0">
        <div className="flex items-center justify-center w-full">
          <img src={logo} alt="Cotarco" className="h-8 w-auto object-contain transition-all group-data-[state=collapsed]:hidden" />
          <img src={logoIcon} alt="Cotarco" className="h-8 w-8 object-contain hidden group-data-[state=collapsed]:block animate-in fade-in zoom-in duration-300" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 px-3 mt-2 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:items-center">
              {items.map((item) => {
                // Check if active: exact match or starts with (for nested routes)
                const isActive = location.pathname === item.url;
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      tooltip={item.title} 
                      isActive={isActive}
                      className={`
                        transition-all duration-200 rounded-lg py-6
                        ${isActive 
                          ? "bg-[#f22f1d] text-white shadow-md hover:bg-[#c32517] hover:text-white" 
                          : "text-gray-600 hover:bg-[#f22f1d0c] hover:text-[#f22f1d]"}
                      `}
                    >
                      <NavLink
                        to={item.url}
                        onClick={() => isMobile && setOpenMobile(false)}
                      >
                        <item.icon className="w-5 h-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                        <span className="font-sans font-medium text-sm ml-3 group-data-[state=collapsed]:hidden elegant-truncate">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
