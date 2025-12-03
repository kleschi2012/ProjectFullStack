import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export default function Input(props: Props) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        padding: "10px 12px",
        borderRadius: 8,
        border: "1px solid #d1d5db",
        marginBottom: 12,
        fontSize: 15,
        boxSizing: "border-box",
      }}
    />
  );
}