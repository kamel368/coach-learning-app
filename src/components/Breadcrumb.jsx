// src/components/Breadcrumb.jsx
import { Link } from "react-router-dom";

export default function Breadcrumb({ items }) {
  return (
    <nav
      style={{
        fontSize: 13,
        color: "var(--color-muted)",
        marginBottom: 16,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      {items.map((item, index) => (
        <span key={index} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {item.path ? (
            <Link
              to={item.path}
              style={{
                color: "var(--color-primary)",
                textDecoration: "none",
              }}
            >
              {item.label}
            </Link>
          ) : (
            <span style={{ color: "var(--color-text)" }}>{item.label}</span>
          )}
          {index < items.length - 1 && <span>›</span>}
        </span>
      ))}
    </nav>
  );
}
