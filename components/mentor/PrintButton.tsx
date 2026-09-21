"use client";

import { Printer } from "lucide-react";

export default function PrintButton({ label = "Save as PDF" }: { label?: string }) {
  return (
    <button onClick={() => window.print()} className="btn-primary print-hidden">
      <Printer size={14} /> {label}
    </button>
  );
}