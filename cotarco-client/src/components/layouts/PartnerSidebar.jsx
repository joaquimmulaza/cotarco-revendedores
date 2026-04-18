import { NavLink } from "react-router-dom";
import { 
  Home,
  Clock,
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
  useSidebar
} from "@/components/ui/sidebar";

export function PartnerSidebar() {
  const { isMobile, setOpenMobile } = useSidebar();

  const items = [
    { title: "Início", url: "/dashboard", icon: Home },
    { title: "Histórico", url: "/orders", icon: Clock },
    { title: "Perfil", url: "/profile", icon: User },
  ];

  return (
    <Sidebar className="border-none shadow-[4px_0_24px_rgba(28,28,22,0.02)] bg-[#f3f4f5]">
      <SidebarHeader className="p-4 pt-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#ae2b00] flex items-center justify-center text-[#ffffff] font-medium text-lg shadow-sm">
            P
          </div>
          <span className="font-sans text-[#191c1d] text-xl font-medium tracking-tight truncate">
            Painel Parceiro
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2 px-2 mt-4">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    tooltip={item.title} 
                    className="data-[active=true]:bg-[#ae2b00] data-[active=true]:text-white hover:bg-[#edeeef] text-[#5c4039] transition-colors rounded-lg py-6"
                  >
                    <NavLink
                      to={item.url}
                      onClick={() => isMobile && setOpenMobile(false)}
                      className={({ isActive }) => 
                        isActive ? "is-active text-white bg-[#ae2b00]" : ""
                      }
                      data-active={window.location.pathname === item.url || undefined}
                    >
                      <item.icon className="w-[1.5em] h-[1.5em]" strokeWidth={1.5} />
                      <span className="font-sans font-medium text-base ml-2">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
