"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  HiShoppingCart,
  HiSearch,
  HiUser,
  HiHeart,
  HiLogout,
  HiTruck,
  HiCog,
  HiSun,
  HiColorSwatch,
  HiInformationCircle,
  HiPhone
} from "react-icons/hi";

import { Logo } from "@/components/shared/logo";
import { useCart } from "@/components/contexts/cart-context";
import { useAuth } from "@/components/contexts/auth-context";
import { useTheme } from "@/components/contexts/theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [desktopThemeOpen, setDesktopThemeOpen] = useState(false);
  const [mobileThemeOpen, setMobileThemeOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [userInitial, setUserInitial] = useState("");
  const [mounted, setMounted] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const desktopThemeRef = useRef<HTMLDivElement>(null);
  const mobileThemeRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { items } = useCart();
  const {
    user,
    customerProfile,
    logout,
    isAuthenticated,
    refreshCustomerProfile,
  } = useAuth();

  const { theme, setTheme } = useTheme();

  // Set mounted to true after component mounts
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (desktopThemeRef.current && !desktopThemeRef.current.contains(target)) {
        setDesktopThemeOpen(false);
      }

      if (mobileThemeRef.current && !mobileThemeRef.current.contains(target)) {
        setMobileThemeOpen(false);
      }

      if (searchRef.current && !searchRef.current.contains(target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  // Enhanced wishlist count management with real-time updates
  useEffect(() => {
    const handleWishlistUpdate = () => {
      fetchWishlistCount();
    };

    window.addEventListener('wishlistUpdated', handleWishlistUpdate);
    
    return () => {
      window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
    };
  }, [isAuthenticated]);

  // Refresh wishlist count on route changes and auth changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlistCount();
    } else {
      setWishlistCount(0);
    }
  }, [pathname, isAuthenticated]);

  // Close all dropdowns when route changes
  useEffect(() => {
    setDesktopThemeOpen(false);
    setMobileThemeOpen(false);
    setShowSearchResults(false);
    setSearchQuery("");
    setSearchResults([]);
  }, [pathname]);

  // Update display name and initial
  useEffect(() => {
    if (!mounted) return;

    if (customerProfile && customerProfile.firstName) {
      const fullName = `${customerProfile.firstName}${
        customerProfile.lastName ? " " + customerProfile.lastName : ""
      }`;
      setDisplayName(fullName.toUpperCase());
      setUserInitial(customerProfile.firstName.charAt(0).toUpperCase());
    } else if (user?.email) {
      const emailName = user.email.split("@")[0];
      setDisplayName(emailName.toUpperCase());
      setUserInitial(emailName.charAt(0).toUpperCase());
    } else {
      setDisplayName("");
      setUserInitial("");
    }
  }, [user, customerProfile, mounted]);

  // Fetch wishlist count with error handling
  const fetchWishlistCount = async () => {
    if (!isAuthenticated) {
      setWishlistCount(0);
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/wishlist", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setWishlistCount(result.data.items?.length || 0);
        }
      } else {
        setWishlistCount(0);
      }
    } catch (error) {
      console.error("Error fetching wishlist count:", error);
      setWishlistCount(0);
    }
  };

  // Force immediate wishlist refresh
  const forceWishlistRefresh = useCallback(() => {
    if (isAuthenticated) {
      fetchWishlistCount();
    }
  }, [isAuthenticated]);

  if (pathname.startsWith("/admin")) {
    return null;
  }

  // Category mapping system
  const categoryMapping = {
    Electronics: "Electronics",
    "Home & Living": "Home & Living",
    Fitness: "Fitness & Sports",
    Accessories: "Accessories",
    Kitchen: "Kitchen & Dining",
    Beauty: "Beauty & Personal Care",
  };

  // Helper function to create category URLs
  const createCategoryUrl = (categoryKey: string) => {
    const categoryValue = categoryMapping[categoryKey as keyof typeof categoryMapping];
    return `/product?category=${encodeURIComponent(categoryValue)}`;
  };

  // Active state checking function
  const isNavItemActive = (href: string) => {
    if (href === "/" && pathname === "/") return true;
    
    if (href === "/product" && pathname === "/product" && !searchParams.get('category')) return true;
    
    if (href.startsWith("/product?category=")) {
      const currentCategory = searchParams.get('category');
      const hrefCategory = new URLSearchParams(href.split('?')[1]).get('category');
      return currentCategory === hrefCategory;
    }
    
    return pathname === href;
  };

  // Desktop navigation items
  const desktopNavItems = [
    { label: "Home", href: "/" },
    { label: "Products", href: "/product" },
    { label: "Electronics", href: createCategoryUrl("Electronics") },
    { label: "Home & Living", href: createCategoryUrl("Home & Living") },
    { label: "Accessories", href: createCategoryUrl("Accessories") },
  ];

  // Theme options
  const themeOptions = [
    {
      id: "sunset",
      name: "Sunset",
      icon: <HiSun className="w-4 h-4 text-orange-500" />,
    },
    {
      id: "ocean",
      name: "Ocean",
      icon: <HiSun className="w-4 h-4 text-blue-500" />,
    },
    {
      id: "forest",
      name: "Forest",
      icon: <HiSun className="w-4 h-4 text-green-500" />,
    },
  ];

  // Check if search should be visible
  const isSearchVisible = pathname === "/" || pathname === "/product" || pathname.startsWith("/product/");

  // Enhanced search with debouncing
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length === 0) {
      setSearchResults([]);
      setShowSearchResults(false);
      setSearchLoading(false);
      return;
    }

    if (query.length > 1) {
      setSearchLoading(true);
      setShowSearchResults(true);

      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}&limit=8`);
          const data = await response.json();
          if (data.success) {
            setSearchResults(data.data);
          } else {
            setSearchResults([]);
          }
        } catch (error) {
          console.error("Search error:", error);
          setSearchResults([]);
        } finally {
          setSearchLoading(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/product?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  // Search result click handler
  const handleResultClick = (productId: string) => {
    setShowSearchResults(false);
    setSearchQuery("");
    setSearchResults([]);
    setTimeout(() => {
      router.push(`/product/${productId}`);
    }, 10);
  };

  const handleSearchFocus = () => {
    if (searchQuery.length > 0) {
      setShowSearchResults(true);
    }
  };

  const closeAllDropdowns = () => {
    setDesktopThemeOpen(false);
    setMobileThemeOpen(false);
    setShowSearchResults(false);
  };

  const handleLogout = async () => {
    closeAllDropdowns();
    await logout();
    router.push("/");
  };

  // Desktop Profile Navigation
  const handleDesktopProfileNavigation = (path: string) => {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent(path)}`);
      return;
    }
    router.push(path);
  };

  // Handle theme change
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme as any);
    closeAllDropdowns();
  };

  // Handle theme button click
  const handleThemeButtonClick = (isMobile: boolean = false) => {
    if (isMobile) {
      setMobileThemeOpen(!mobileThemeOpen);
    } else {
      setDesktopThemeOpen(!desktopThemeOpen);
    }
  };

  const getThemeIcon = () => {
    switch (theme) {
      case "ocean":
        return <HiSun className="w-5 h-5 text-blue-500" />;
      case "forest":
        return <HiSun className="w-5 h-5 text-green-500" />;
      case "sunset":
      default:
        return <HiSun className="w-5 h-5 text-orange-500" />;
    }
  };

  // Handle cart click with auth check
  const handleCartClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault();
      closeAllDropdowns();
      router.push(`/auth/login?redirect=${encodeURIComponent("/checkout/cart")}`);
    } else {
      closeAllDropdowns();
    }
  };

  // Handle wishlist click with auth check
  const handleWishlistClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault();
      closeAllDropdowns();
      router.push(`/auth/login?redirect=${encodeURIComponent("/account/wishlist")}`);
    } else {
      closeAllDropdowns();
      // Force refresh when navigating to wishlist
      setTimeout(forceWishlistRefresh, 100);
    }
  };

  // Handle navigation item click
  const handleNavItemClick = () => {
    closeAllDropdowns();
  };

  // Fixed image error handler
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.src = "/placeholder.svg";
  };

  // Don't render anything until mounted
  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="w-32 h-8 bg-muted rounded animate-pulse"></div>
            <div className="flex-1 max-w-2xl hidden md:block">
              <div className="w-full h-10 bg-muted rounded animate-pulse"></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-24 h-9 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3">
        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 shrink-0" onClick={closeAllDropdowns}>
            <Logo size="lg" showText={true} className="hover:scale-105 transition-transform duration-200" />
          </Link>

          {/* Desktop Navigation Menu */}
          <nav className="hidden lg:flex items-center gap-8 flex-1 ml-8">
            {desktopNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavItemClick}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isNavItemActive(item.href) ? "text-primary font-semibold" : "text-foreground/80"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Search Bar */}
          {isSearchVisible && (
            <div className="hidden md:block flex-1 max-w-3xl mx-4" ref={searchRef}>
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={handleSearchFocus}
                  className="w-full px-4 py-2 pr-10 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <button type="submit" className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition">
                  <HiSearch className="w-5 h-5" />
                </button>

                {/* Search Results Dropdown */}
                {showSearchResults && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-[100] max-h-96 overflow-y-auto">
                    {searchLoading && (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          Searching...
                        </div>
                      </div>
                    )}

                    {!searchLoading && searchResults.length > 0 && (
                      <>
                        <div className="p-3 border-b border-border bg-muted/30">
                          <p className="text-xs font-medium text-muted-foreground">
                            Found {searchResults.length} products
                          </p>
                        </div>
                        {searchResults.map((product) => (
                          <button
                            key={product.id}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleResultClick(product.id);
                            }}
                            className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left border-b border-border last:border-b-0 group cursor-pointer"
                          >
                            <img
                              src={product.image || "/placeholder.svg"}
                              alt={product.name}
                              className="w-12 h-12 rounded-lg object-cover group-hover:scale-105 transition-transform"
                              onError={handleImageError}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate text-foreground">{product.name}</p>
                              <p className="text-xs text-muted-foreground capitalize">{product.category}</p>
                            </div>
                            <p className="text-sm font-semibold text-primary whitespace-nowrap">₹{product.price}</p>
                          </button>
                        ))}
                        <div className="p-3 border-t border-border bg-muted/30">
                          <button
                            onClick={handleSearchSubmit}
                            className="w-full text-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                          >
                            View all results for "{searchQuery}"
                          </button>
                        </div>
                      </>
                    )}

                    {!searchLoading && searchQuery.length > 1 && searchResults.length === 0 && (
                      <div className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">No products found for "{searchQuery}"</p>
                        <p className="text-xs text-muted-foreground mt-1">Try different keywords or browse categories</p>
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Right Section - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            {/* Desktop Theme Selector */}
            <div className="relative" ref={desktopThemeRef}>
              <button
                onClick={() => handleThemeButtonClick(false)}
                className="p-2.5 hover:bg-muted rounded-lg transition-colors border border-transparent hover:border-border flex items-center gap-2"
                title="Change theme"
              >
                {getThemeIcon()}
              </button>

              {desktopThemeOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-xl z-[100] overflow-hidden">
                  <div className="px-4 py-3 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
                    <p className="text-sm font-semibold flex items-center gap-2">
                      <HiColorSwatch className="w-4 h-4" />
                      Choose Theme
                    </p>
                  </div>
                  <div className="p-2 space-y-1">
                    {themeOptions.map((themeOption) => (
                      <button
                        key={themeOption.id}
                        onClick={() => handleThemeChange(themeOption.id)}
                        className={`w-full flex items-center gap-3 px-3 py-3 text-sm rounded-lg transition-all duration-200 ${
                          theme === themeOption.id
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "hover:bg-muted hover:scale-105"
                        }`}
                      >
                        {themeOption.icon}
                        <span className="font-medium">{themeOption.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Wishlist */}
            <Link
              href="/account/wishlist"
              onClick={handleWishlistClick}
              className="relative p-2.5 hover:bg-muted rounded-lg transition-colors border border-transparent hover:border-border"
              title="Wishlist"
            >
              <HiHeart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {wishlistCount > 9 ? "9+" : wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              href="/checkout/cart"
              onClick={handleCartClick}
              className="relative p-2.5 hover:bg-muted rounded-lg transition-colors border border-transparent hover:border-border"
              title="Cart"
            >
              <HiShoppingCart className="w-5 h-5" />
              {items.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {items.length > 9 ? "9+" : items.length}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <>
                {/* Orders */}
                <Link
                  href="/account/orders"
                  onClick={closeAllDropdowns}
                  className="p-2.5 hover:bg-muted rounded-lg transition-colors border border-transparent hover:border-border"
                  title="Orders"
                >
                  <HiTruck className="w-5 h-5" />
                </Link>

                {/* User Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors border border-transparent hover:border-border">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-semibold leading-none shadow-sm">
                        {userInitial ? userInitial : <HiUser className="w-4 h-4" />}
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-semibold">
                          {userInitial ? userInitial : <HiUser className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{displayName}</p>
                          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleDesktopProfileNavigation("/account")}>
                      <HiUser className="w-4 h-4 mr-2" />
                      My Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDesktopProfileNavigation("/account/orders")}>
                      <HiTruck className="w-4 h-4 mr-2" />
                      My Orders
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDesktopProfileNavigation("/info/about")}>
                      <HiInformationCircle className="w-4 h-4 mr-2" />
                      About Us
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDesktopProfileNavigation("/account/settings")}>
                      <HiCog className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                      <HiLogout className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button
                onClick={() => {
                  closeAllDropdowns();
                  router.push("/auth/login");
                }}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 font-semibold"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden flex items-center justify-between gap-2">
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0" onClick={closeAllDropdowns}>
            <Logo size="sm" showText={false} className="hover:scale-105 transition-transform duration-200" />
          </Link>
          
          {!isSearchVisible && (
            <div className="md:hidden flex-1 text-center">
              <h1 className="text-base font-bold text-primary text-xl">ShopStreak</h1>
            </div>
          )}
          
          {/* Mobile Search Bar */}
          {isSearchVisible && (
            <div className="flex-1 min-w-0 mx-2" ref={searchRef}>
              <form onSubmit={handleSearchSubmit} className="relative w-full">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={handleSearchFocus}
                  className="w-full px-3 py-1.5 pr-10 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition">
                  <HiSearch className="w-4 h-4" />
                </button>

                {/* Mobile Search Dropdown */}
                {showSearchResults && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-[100] max-h-64 overflow-y-auto">
                    {searchLoading && (
                      <div className="p-3 text-center text-sm text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          Searching...
                        </div>
                      </div>
                    )}

                    {!searchLoading && searchResults.length > 0 && (
                      <>
                        <div className="p-2 border-b border-border bg-muted/30">
                          <p className="text-xs font-medium text-muted-foreground">
                            Found {searchResults.length} products
                          </p>
                        </div>
                        {searchResults.map((product) => (
                          <button
                            key={product.id}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleResultClick(product.id);
                            }}
                            className="w-full flex items-center gap-2 p-2 hover:bg-muted/50 transition-colors text-left border-b border-border last:border-b-0"
                          >
                            <img
                              src={product.image || "/placeholder.svg"}
                              alt={product.name}
                              className="w-10 h-10 rounded-md object-cover"
                              onError={handleImageError}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{product.name}</p>
                              <p className="text-xs text-muted-foreground capitalize">{product.category}</p>
                              <p className="text-xs font-semibold text-primary mt-0.5">₹{product.price}</p>
                            </div>
                          </button>
                        ))}
                        <div className="p-2 border-t border-border bg-muted/30">
                          <button
                            onClick={handleSearchSubmit}
                            className="w-full text-center text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                          >
                            View all results for "{searchQuery}"
                          </button>
                        </div>
                      </>
                    )}

                    {!searchLoading && searchQuery.length > 1 && searchResults.length === 0 && (
                      <div className="p-3 text-center text-sm text-muted-foreground">
                        <p>No products found for "{searchQuery}"</p>
                        <p className="text-xs mt-1">Try different keywords</p>
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Mobile Right Section */}
          <div className="flex items-center gap-1">
            {/* Mobile Theme Selector */}
            <div className="relative" ref={mobileThemeRef}>
              <button
                onClick={() => handleThemeButtonClick(true)}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors flex items-center"
                title="Change theme"
              >
                {getThemeIcon()}
              </button>

              {mobileThemeOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-xl z-[100] overflow-hidden">
                  <div className="p-2 space-y-1">
                    {themeOptions.map((themeOption) => (
                      <button
                        key={themeOption.id}
                        onClick={() => handleThemeChange(themeOption.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all ${
                          theme === themeOption.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        }`}
                      >
                        {themeOption.icon}
                        {themeOption.name}
                        {theme === themeOption.id && <span className="ml-auto text-xs">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Wishlist */}
            <Link
              href="/account/wishlist"
              onClick={handleWishlistClick}
              className="relative p-1.5 hover:bg-muted rounded-lg transition-colors"
            >
              <HiHeart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {wishlistCount > 9 ? "9+" : wishlistCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <>
                {/* Mobile Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1.5 hover:bg-muted rounded-lg transition-colors flex items-center gap-1">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-semibold">
                        {userInitial || <HiUser className="w-3 h-3" />}
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-semibold">
                          {userInitial || <HiUser className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{displayName}</p>
                          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleDesktopProfileNavigation("/account")}>
                      <HiUser className="w-4 h-4 mr-2" />
                      My Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDesktopProfileNavigation("/account/orders")}>
                      <HiTruck className="w-4 h-4 mr-2" />
                      My Orders
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDesktopProfileNavigation("/info/contact")}>
                      <HiPhone className="w-4 h-4 mr-2" />
                      Contact Us
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDesktopProfileNavigation("/account/settings")}>
                      <HiCog className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                      <HiLogout className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button
                onClick={() => {
                  closeAllDropdowns();
                  router.push("/auth/login");
                }}
                className="text-xs bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 font-semibold px-2 py-1 h-7"
                size="sm"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}