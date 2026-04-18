import { NavLink } from "react-router-dom";
import { 
  BarChart, 
  Package, 
  Users, 
  CheckSquare 
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

// "Digital Agronomist" specific variables in tailwind:
// We use utility classes to reflect the aesthetic.

export function AdminSidebar() {
  const { isMobile, setOpenMobile } = useSidebar();

  const items = [
    { title: "Estatísticas", url: "/admin/dashboard", icon: BarChart },
    { title: "Produtos", url: "/admin/products", icon: Package },
    { title: "Parceiros", url: "/admin/partners", icon: Users },
    { title: "Aprovações", url: "/admin/approvals", icon: CheckSquare },
  ];

  return (
    <Sidebar className="border-none shadow-[4px_0_24px_rgba(28,28,22,0.02)] bg-[#f7f4e9]">
      <SidebarHeader className="p-4 pt-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#173809] flex items-center justify-center text-[#ffffff] font-serif font-bold text-lg shadow-sm">
            C
          </div>
          <span className="font-serif text-[#173809] text-xl font-medium tracking-tight truncate">
            Cotarco Admin
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
                    className="data-[active=true]:bg-[#173809] data-[active=true]:text-white hover:bg-[#e0e5cc] text-[#43493e] transition-colors rounded-lg py-6"
                  >
                    <NavLink
                      to={item.url}
                      onClick={() => isMobile && setOpenMobile(false)}
                      className={({ isActive }) => 
                        isActive ? "is-active text-white bg-[#173809]" : ""
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
