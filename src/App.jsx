import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

import Home from "./Pages/Home";
import Rootlayout from "./layout/Rootlayout";
import About from "./Pages/About";
import Contact from "./Pages/Contact";
import SignIn from "./Pages/SignIn";
import SignUp from "./Pages/SignUp";
import ResetPassword from "./Pages/ResetPassword";
import ScrollToTop from "./components/ScrollToTop";

import DashboardLayout from "./layout/DashboardLayout";
import DashboardRedirect from "./components/dashboard/DashboardRedirects";

import AdminDashboard from "./components/dashboard/AdminDashboard";
import UserDashboard from "./components/dashboard/UserDashboard";

// USERS
import Dashboard from "./components/dashboard/user/Dashboard";
import CreateUser from "./components/dashboard/user/CreateUser";
import MyAccount from "./components/dashboard/user/MyAccount";
import UserPerformance from "./components/dashboard/user/UserPerformance";

// FARMERS
import FarmerDashboard from "./components/dashboard/farmer/farmerDashboard";
import CreateFarmer from "./components/dashboard/farmer/CreateFarmer";

// BATCHES
import BatchDashboard from "./components/dashboard/batch/batchDashboard";
import CreateBatch from "./components/dashboard/batch/CreateBatch";
import BatchStats from "./components/dashboard/batch/BatchStats";

// PACKAGES
import PackageDashboard from "./components/dashboard/package/packageDashboard";
import CreatePackage from "./components/dashboard/package/CreatePackage";
import PackageStats from "./components/dashboard/package/PackageStats";

// SCANS
import ScanDashboard from "./components/dashboard/scan/scanDashboard";
import PerformScan from "./components/dashboard/scan/PerformScan";


// ✅ Corrected Router
const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <>
        <ScrollToTop />
        <Rootlayout />
      </>
    ),
    children: [
      { index: true, element: <Home /> },
      { path: "about", element: <About /> },
      { path: "contact", element: <Contact /> },
    ],
  },

  { path: "signin", element: <SignIn /> },
  { path: "signup", element: <SignUp /> },
  { path: "reset-password", element: <ResetPassword /> },

  // 📦 Dashboard Routes
  {
    path: "dashboard",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <DashboardRedirect /> },

      // 🛠 ADMIN ROUTES
      {
        path: "admin",
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: "users", element: <Dashboard /> },
          { path: "users/create", element: <CreateUser /> },
          { path: "users/me", element: <MyAccount /> },
          { path: "users/performance", element: <UserPerformance /> },

          { path: "farmers", element: <FarmerDashboard /> },
          { path: "farmers/create", element: <CreateFarmer /> },

          { path: "batches", element: <BatchDashboard /> },
          { path: "batches/create", element: <CreateBatch /> },
          { path: "batches/stats", element: <BatchStats /> },

          { path: "packages", element: <PackageDashboard /> },
          { path: "packages/create", element: <CreatePackage /> },
          { path: "packages/stats", element: <PackageStats /> },

          { path: "scans", element: <ScanDashboard /> },
          { path: "scans/perform", element: <PerformScan /> },
        ],
      },

      // 👤 USER ROUTES
      {
        path: "user",
        children: [
          { index: true, element: <UserDashboard /> },

          { path: "farmers", element: <FarmerDashboard /> },
          { path: "farmers/create", element: <CreateFarmer /> },

          { path: "batches", element: <BatchDashboard /> },
          { path: "batches/create", element: <CreateBatch /> },
          { path: "batches/stats", element: <BatchStats /> },
          
          { path: "packages", element: <PackageDashboard /> },
          { path: "packages/create", element: <CreatePackage /> },
          { path: "packages/stats", element: <PackageStats /> },

          { path: "scans", element: <ScanDashboard /> },
          { path: "scans/perform", element: <PerformScan /> },
        ],
      },
    ],
  },

  { path: "*", element: <h1>404 Page Not Found</h1> },
]);

const App = () => {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
};

export default App;
