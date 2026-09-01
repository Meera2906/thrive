import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import UploadPage from "./pages/UploadPage";
import CallListPage from "./pages/CallListPage";
import EmailsPage from "./pages/EmailsPage";
import ParallaxAtmosphere from "./components/showcase/ParallaxAtmosphere";

/**
 * Thin routing shell. All data-fetching and UI logic lives in the page components.
 * ParallaxAtmosphere provides the universal dark twilight background.
 */
export default function App() {
  return (
    <ParallaxAtmosphere className="min-h-screen text-white">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/calls" element={<CallListPage />} />
        <Route path="/emails" element={<EmailsPage />} />
      </Routes>
    </ParallaxAtmosphere>
  );
}
