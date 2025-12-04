import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode };

export default function Button({ children, style, ...props }: Props) {
  return (
    <button
      {...props}
      style={{
        background: props.disabled ? "rgba(15,23,42,0.15)" : "linear-gradient(135deg, #0ea5e9, #0bd2a3)",
        border: "none",
        padding: "12px 16px",
        color: "#0f172a",
        borderRadius: 12,
        cursor: props.disabled ? "not-allowed" : "pointer",
        fontWeight: 700,
        fontSize: 15,
        letterSpacing: 0.2,
        boxShadow: props.disabled ? "none" : "0 12px 30px rgba(14,165,233,0.35)",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        ...(style || {}),
      }}
      onMouseOver={(e) => {
        if (!props.disabled) e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseOut={(e) => {
        if (!props.disabled) e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {children}
    </button>
  );
}
