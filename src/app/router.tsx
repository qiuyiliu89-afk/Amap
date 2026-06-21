import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { AssetsPage } from "../pages/AssetsPage";
import { BatchPage } from "../pages/BatchPage";
import { BonusPage } from "../pages/BonusPage";
import { BriefPage } from "../pages/BriefPage";
import { HomePage } from "../pages/HomePage";
import { PipelinePage } from "../pages/PipelinePage";
import { PreviewPage } from "../pages/PreviewPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "brief", element: <BriefPage /> },
      { path: "pipeline", element: <PipelinePage /> },
      { path: "assets", element: <AssetsPage /> },
      { path: "preview", element: <PreviewPage /> },
      { path: "batch", element: <BatchPage /> },
      { path: "bonus", element: <BonusPage /> },
    ],
  },
]);
