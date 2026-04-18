import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";

export default function AdminLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#fcf9ef]">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-10 flex items-center h-16 px-6 shrink-0 backdrop-blur-md bg-[#fcf9ef]/80">
            <SidebarTrigger className="mr-4" data-sidebar="trigger" />
            <div className="flex-1" />
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
