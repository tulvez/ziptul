import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "@fontsource-variable/manrope";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import { temaUygula } from "./tema";

/* İlk çizimden önce tema: açılışta yanlış renk parlaması olmasın */
temaUygula();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
