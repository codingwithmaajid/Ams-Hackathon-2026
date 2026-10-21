import { BrowserRouter, Route, Routes } from "react-router-dom";
import { BackendProvider } from "@/lib/backend";
import { DocumentViewerProvider } from "@/components/jolly/citations";
import { Layout } from "@/components/jolly/layout";
import TodayPage from "@/pages/today";
import MattersPage from "@/pages/matters";
import MatterPage from "@/pages/matter";
import CallPage from "@/pages/call";
import ApprovalsPage from "@/pages/approvals";
import HowPage from "@/pages/how";
import NotFoundPage from "@/pages/not-found";

export default function App() {
  return (
    <BrowserRouter>
      <BackendProvider>
        <DocumentViewerProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<TodayPage />} />
              <Route path="/matters" element={<MattersPage />} />
              <Route path="/matters/:caseId" element={<MatterPage />} />
              <Route path="/call" element={<CallPage />} />
              <Route path="/approvals" element={<ApprovalsPage />} />
              <Route path="/how" element={<HowPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Layout>
        </DocumentViewerProvider>
      </BackendProvider>
    </BrowserRouter>
  );
}
