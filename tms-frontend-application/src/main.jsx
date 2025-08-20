// to enable additional checks and warnings during development.
import { StrictMode } from "react";
// for creating a root for the React app
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
//Initializes a React root in the DOM (Document Object Model) by targeting the HTML element with the ID root
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
