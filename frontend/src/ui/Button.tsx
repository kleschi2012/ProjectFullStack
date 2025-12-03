import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode };

export default function Button({ children, style, ...props }: Props) {
  return (
    <button
      {...props}
      style={{
        background: "#2ecc71",
        border: "none",
        padding: "10px 16px",
        color: "white",
        borderRadius: 8,
        cursor: "pointer",
        fontWeight: 600,
        transition: "background 0.15s ease",
        ...(style || {}),
      }}
      onMouseOver={(e) => ((e.currentTarget.style.background = "#27ae60"))}
      onMouseOut={(e) => ((e.currentTarget.style.background = "#2ecc71"))}
    >
      {children}
    </button>
  );
}