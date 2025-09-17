import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Croissant, ShoppingCart, User, History, LogOut, ChevronDown } from "lucide-react";
import { authService, type AuthUser } from "@/lib/auth";
import { useLocation } from "wouter";

interface HeaderProps {
  cartCount: number;
  onCartClick: () => void;
  onLogout: () => void;
}

export default function Header({ cartCount, onCartClick, onLogout }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [, setLocation] = useLocation();
  const user = authService.getUser() as AuthUser;
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    authService.logout();
    onLogout();
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Croissant className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Pão na Hora</h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Cart Button */}
            <Button
              variant="ghost"
              size="sm"
              className="relative p-2"
              onClick={onCartClick}
              data-testid="button-cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  data-testid="text-cart-count"
                >
                  {cartCount}
                </Badge>
              )}
            </Button>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <Button
                variant="ghost"
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted"
                onClick={() => setShowUserMenu(!showUserMenu)}
                data-testid="button-user-menu"
              >
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                  <span className="text-secondary-foreground text-sm font-medium" data-testid="text-user-initials">
                    {getUserInitials(user.fullName)}
                  </span>
                </div>
                <span className="text-foreground font-medium hidden sm:block" data-testid="text-user-name">
                  {user.fullName}
                </span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </Button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-popover border border-border rounded-lg shadow-lg" data-testid="menu-user-dropdown">
                  <div className="p-3 border-b border-border">
                    <p className="font-medium text-popover-foreground" data-testid="text-dropdown-name">
                      {user.fullName}
                    </p>
                    <p className="text-sm text-muted-foreground" data-testid="text-dropdown-classroom">
                      {user.classroom ? `Sala ${user.classroom}` : 'Sala não informada'}
                    </p>
                  </div>
                  <div className="p-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-left p-2 text-sm"
                      onClick={() => {
                        setLocation('/orders');
                        setShowUserMenu(false);
                      }}
                      data-testid="button-my-orders"
                    >
                      <History className="w-4 h-4 mr-2" />
                      Meus Pedidos
                    </Button>
                    {user.role === 'admin' && (
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-left p-2 text-sm"
                        onClick={() => {
                          setLocation('/admin');
                          setShowUserMenu(false);
                        }}
                        data-testid="button-admin"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Administração
                      </Button>
                    )}
                    <hr className="my-2 border-border" />
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-left p-2 text-sm text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={handleLogout}
                      data-testid="button-logout"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
