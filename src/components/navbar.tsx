import { Link, useLocation } from "@tanstack/react-router";
import { Compass, LayoutDashboard, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const navItem = (to: string, label: string) => (
    <Link
      to={to}
      className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      activeProps={{ className: "text-foreground" }}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-sunset shadow-warm">
            <Compass className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">Wanderly</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {navItem("/", "Home")}
          {user && navItem("/dashboard", "Dashboard")}
          {user && navItem("/plan", "Plan a trip")}
          {user && navItem("/trips", "My trips")}
          {user && navItem("/chat", "AI assistant")}
        </nav>

        <div className="flex items-center gap-2">
          {!user ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/login" search={{ redirect: location.pathname }}>
                  Sign in
                </Link>
              </Button>
              <Button asChild size="sm" className="bg-gradient-sunset shadow-warm hover:opacity-95">
                <Link to="/signup">Get started</Link>
              </Button>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Menu className="h-4 w-4" />
                  <span className="max-w-[120px] truncate">{user.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/plan">Plan a trip</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/trips">My trips</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/chat">AI assistant</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
