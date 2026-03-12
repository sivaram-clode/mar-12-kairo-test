import "@testing-library/jest-dom";

// React 19 exports act only in development mode
// Ensure the correct act function is available for @testing-library/react
import React from "react";
if (typeof (React as unknown as { act?: unknown }).act !== "function") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { act } = require("react") as { act: unknown };
  (React as unknown as Record<string, unknown>).act = act;
}
