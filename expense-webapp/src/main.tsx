import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Reset + theme CSS must load before anything renders. No `## Brand colors`
// section exists in specs/design/design.md, so this project uses the stock
// neutral theme rather than a compiled brand theme.
import "@astryxdesign/core/reset.css";
import "@astryxdesign/theme-neutral/theme.css";
import { Theme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";

import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Theme theme={neutralTheme}>
      <App />
    </Theme>
  </StrictMode>,
);
