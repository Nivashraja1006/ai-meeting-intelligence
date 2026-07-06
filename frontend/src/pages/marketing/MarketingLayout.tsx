import { Link, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import "./assets/style.css";

function Nav() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="nav">
      <div className="wrap">
        <Link to="/" className="brand">
          <span className="brand-mark">AI</span>
          Meeting Intelligence
        </Link>
        <div className="nav-links">
          <Link to="/" className={isActive("/") ? "active" : ""}>
            Home
          </Link>
          <Link to="/about" className={isActive("/about") ? "active" : ""}>
            About
          </Link>
          <Link
            to="/services"
            className={isActive("/services") ? "active" : ""}
          >
            Services
          </Link>
          <Link to="/contact" className={isActive("/contact") ? "active" : ""}>
            Contact
          </Link>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Link
            to="/login"
            className="nav-cta"
            style={{ background: "transparent", border: "1px solid var(--border, #333)" }}
          >
            Log in
          </Link>
          <Link to="/signup" className="nav-cta">
            Sign up
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div>
          <Link to="/" className="brand">
            <span className="brand-mark">AI</span>
            Meeting Intelligence
          </Link>
          <p
            style={{
              color: "var(--text-dim)",
              fontSize: 14,
              marginTop: 14,
              maxWidth: 260,
            }}
          >
            Structured meeting intelligence, extracted from your own
            transcripts.
          </p>
        </div>
        <div className="footer-cols">
          <div className="footer-col">
            <h4>Product</h4>
            <Link to="/">Home</Link>
            <Link to="/services">Services</Link>
            <Link to="/services#pricing">Pricing</Link>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} AI Meeting Intelligence</span>
        <span>Built for teams who'd rather build than transcribe.</span>
      </div>
    </footer>
  );
}

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Nav />
      {children}
      <Footer />
    </>
  );
}