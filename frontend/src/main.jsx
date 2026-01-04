import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { GOOGLE_CLIENT_ID } from "./config/constants.js";

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
			<BrowserRouter>
				<App />
			</BrowserRouter>
		</GoogleOAuthProvider>
	</StrictMode>
);
