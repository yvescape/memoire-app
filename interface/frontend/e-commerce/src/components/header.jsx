import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/header.css";
import ElyseeLogo from "./logo";
import { isAuthenticated, clearTokens, authFetch } from "../utils/auth";

const getSessionId = () => {
  let sid = localStorage.getItem("session_id");
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem("session_id", sid);
  }
  return sid;
};

export default function Header({ isTransparent = false }) {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showCartPreview, setShowCartPreview] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const userMenuRef = useRef(null);

  // Auth + cart count
  useEffect(() => {
    const fetchCartCount = async () => {
      try {
        const loggedIn = isAuthenticated();
        const sessionParam = !loggedIn ? `?session_id=${getSessionId()}` : "";
        const response = loggedIn
          ? await authFetch(`/api/orders/cart/count/${sessionParam}`)
          : await fetch(`/api/orders/cart/count/${sessionParam}`);

        if (!response || !response.ok) {
          setCartCount(0);
          return;
        }

        const data = await response.json();
        setCartCount(data.count || 0);
      } catch {
        setCartCount(0);
      }
    };

    const checkAuth = () => {
      setIsLoggedIn(isAuthenticated());
    };

    const handleAuthChange = () => {
      checkAuth();
      fetchCartCount();
    };

    checkAuth();
    fetchCartCount();

    const interval = setInterval(() => {
      checkAuth();
      fetchCartCount();
    }, 30000);

    window.addEventListener("storage", checkAuth);
    window.addEventListener("auth-change", handleAuthChange);
    window.addEventListener("cart-change", fetchCartCount);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("auth-change", handleAuthChange);
      window.removeEventListener("cart-change", fetchCartCount);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
    setShowCartPreview(false);
    setShowUserMenu(false);
  };

  const handleLogout = () => {
    clearTokens();
    setIsLoggedIn(false);
    setCartCount(0);
    setShowUserMenu(false);
    setIsMobileMenuOpen(false);
    navigate("/");
  };

  const headerClass = `navbar ${isScrolled ? "scrolled" : ""} ${isTransparent && !isScrolled ? "transparent" : ""}`;

  return (
    <header className={headerClass}>
      <div className="navbar-container">
        <div className="navbar-logo">
          <ElyseeLogo
            onClick={() => handleNavigation("/")}
            variant={isScrolled || !isTransparent ? "dark" : "light"}
          />
        </div>

        <nav className="navbar-nav">
          <button className="nav-link" onClick={() => handleNavigation("/products")}>Collection</button>
          <button className="nav-link" onClick={() => handleNavigation("/about")}>Notre histoire</button>
          <button className="nav-link" onClick={() => handleNavigation("/contact")}>Contact</button>
        </nav>

        <div className="navbar-actions">
          <div className="user-wrapper" ref={userMenuRef}>
            <button
              className="action-icon account-icon"
              onClick={() => {
                if (isLoggedIn) {
                  setShowUserMenu(!showUserMenu);
                } else {
                  handleNavigation("/login");
                }
              }}
              aria-label="Mon compte"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {isLoggedIn && <span className="user-dot" />}
            </button>

            {showUserMenu && isLoggedIn && (
              <div className="user-dropdown">
                <div className="user-dropdown-header">
                  <span className="user-dropdown-label">Mon compte</span>
                </div>
                <div className="user-dropdown-items">
                  <button className="user-dropdown-item" onClick={() => handleNavigation("/orders")}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                      <rect x="9" y="3" width="6" height="4" rx="1" />
                      <line x1="9" y1="12" x2="15" y2="12" />
                      <line x1="9" y1="16" x2="13" y2="16" />
                    </svg>
                    Mes commandes
                  </button>
                  <button className="user-dropdown-item" onClick={() => handleNavigation("/change-password")}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                    Modifier le mot de passe
                  </button>
                  <div className="user-dropdown-divider" />
                  <button className="user-dropdown-item user-dropdown-logout" onClick={handleLogout}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="cart-wrapper" onMouseEnter={() => setShowCartPreview(true)} onMouseLeave={() => setShowCartPreview(false)}>
            <button className="action-icon cart-icon" onClick={() => handleNavigation("/cart")} aria-label="Panier">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              {cartCount > 0 && <span className="cart-badge" aria-label="Nombre d'articles dans le panier">{cartCount}</span>}
            </button>
            {showCartPreview && cartCount > 0 && (
              <div className="cart-preview">
                <p className="cart-preview-title">Votre panier</p>
                <p className="cart-preview-count">{cartCount} article{cartCount > 1 ? "s" : ""}</p>
                <button className="btn btn-gold cart-preview-btn" onClick={() => handleNavigation("/cart")}>Voir le panier</button>
              </div>
            )}
          </div>

          <button className={`mobile-menu-btn ${isMobileMenuOpen ? "active" : ""}`} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Menu">
            <span className="menu-bar"></span>
            <span className="menu-bar"></span>
            <span className="menu-bar"></span>
          </button>
        </div>

        <div className={`mobile-menu ${isMobileMenuOpen ? "active" : ""}`}>
          <nav className="mobile-nav">
            <button className="mobile-nav-link" onClick={() => handleNavigation("/products")}>Collection</button>
            <button className="mobile-nav-link" onClick={() => handleNavigation("/about")}>Notre histoire</button>
            <button className="mobile-nav-link" onClick={() => handleNavigation("/contact")}>Contact</button>
            <div className="mobile-divider"></div>
            {isLoggedIn ? (
              <>
                <button className="mobile-nav-link" onClick={() => handleNavigation("/orders")}>Mes commandes</button>
                <button className="mobile-nav-link" onClick={() => handleNavigation("/change-password")}>Modifier le mot de passe</button>
                <button className="mobile-nav-link mobile-logout" onClick={handleLogout}>Déconnexion</button>
              </>
            ) : (
              <button className="mobile-nav-link" onClick={() => handleNavigation("/login")}>Connexion / Inscription</button>
            )}
            <button className="mobile-nav-link" onClick={() => handleNavigation("/cart")}>Panier {cartCount > 0 && `(${cartCount})`}</button>
          </nav>
        </div>
      </div>
    </header>
  );
}