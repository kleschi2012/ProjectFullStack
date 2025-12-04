import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export default function Input(props: Props) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: 12,
        border: "1px solid rgba(15,23,42,0.1)",
        marginBottom: 14,
        fontSize: 15,
        boxSizing: "border-box",
        background: "rgba(255,255,255,0.8)",
        boxShadow: "0 1px 0 rgba(15, 23, 42, 0.02)",
      }}
    />
  );
}
