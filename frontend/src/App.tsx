import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Sidebar, MobileHeader } from "@/components/layout/sidebar";
import { StoreProvider } from "@/store";

import HomePage from "@/pages/home";
import CallsPage from "@/pages/calls";
import EmailsPage from "@/pages/emails";
import KnowledgePage from "@/pages/knowledge";
import ReportsPage from "@/pages/reports";

export default function App() {
  return (
    <BrowserRouter>
      <StoreProvider>
        <div className="flex h-dvh bg-background text-foreground font-sans antialiased min-h-full">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <MobileHeader />
            <main className="min-h-0 flex-1 overflow-hidden">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/calls" element={<CallsPage />} />
                <Route path="/emails" element={<EmailsPage />} />
                <Route path="/knowledge" element={<KnowledgePage />} />
                <Route path="/reports" element={<ReportsPage />} />
              </Routes>
            </main>
          </div>
        </div>
      </StoreProvider>
    </BrowserRouter>
  );
}
