import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import Home from "./pages/home";
import Login from "./pages/login";
import Register from "./pages/register";
import ForgotPassword from "./pages/forgotpassword";
import Products from "./pages/products";
import ProductDetail from "./pages/productdetail";
import Cart from "./pages/cart";
import Checkout from "./pages/checkout";
import OrderConfirmation from "./pages/orderconfirmation";
import Contact from "./pages/contact";
import About from "./pages/about";
import Legal from "./pages/legal";
import Header from "./components/header";
import NotFound from "./pages/notfound";

import "./styles/global.css";
import ScrollToTop from "./components/scrollToTop";

function AppContent() {
  const location = useLocation();

  // Routes valides de l'application
  const validPaths = [
    "/", "/login", "/register", "/forgot-password",
    "/products", "/cart", "/checkout",
    "/order-confirmation", "/about", "/contact", "/legal",
  ];

  const isKnownRoute =
    validPaths.includes(location.pathname) ||
    location.pathname.startsWith("/product/");

  // ================= RENDER =================
  return (
    <div className="app">
      {isKnownRoute && <Header/>}

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/products"
            element={<Products />}
          />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout/>} />
          <Route
            path="/order-confirmation"
            element={<OrderConfirmation />}
          />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

// ================= WRAPPER =================
export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppContent />
    </BrowserRouter>
  );
}