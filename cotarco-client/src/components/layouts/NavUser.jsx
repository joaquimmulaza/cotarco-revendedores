import { LogOut } from "lucide-react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"

export function NavUser() {
  const { user, logout } = useAuth()
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  if (!user) return null

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className={cn(
          "flex items-center gap-3 px-2 py-1.5 w-full border-t border-sidebar-border/50",
          isCollapsed && "justify-center px-0"
        )}>
          <Avatar className="h-8 w-8 rounded-lg shrink-0">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          {!isCollapsed && (
            <>
              <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                <span className="elegant-truncate font-semibold text-sidebar-foreground">
                  {user.name}
                </span>
                <span className="elegant-truncate text-xs text-sidebar-foreground/70">
                  {user.email}
                </span>
              </div>
              <button 
                onClick={logout}
                className="p-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors text-sidebar-foreground/70 shrink-0"
                title="Sair"
                type="button"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
