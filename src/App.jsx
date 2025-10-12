import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

import Home from "./Pages/Home";
import Rootlayout from "./layout/Rootlayout";
import About from "./Pages/About";
import Contact from "./Pages/Contact";
import Farmers from "./Pages/Farmers";
import Batches from "./Pages/Batches";
import Scans from "./Pages/Scans";
import Packages from "./Pages/Packages";
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
import ListUsers from "./components/dashboard/user/ListUser";
import MyAccount from "./components/dashboard/user/MyAccount";

// FARMERS
import FarmerDashboard from "./components/dashboard/farmer/farmerDashboard";
import CreateFarmer from "./components/dashboard/farmer/CreateFarmer";
import ListFarmers from "./components/dashboard/farmer/ListFarmer";

// BATCHES
import BatchDashboard from "./components/dashboard/batch/batchDashboard";
import CreateBatch from "./components/dashboard/batch/CreateBatch";
import ListBatches from "./components/dashboard/batch/ListBatch";

// PACKAGES
import PackageDashboard from "./components/dashboard/package/packageDashboard";
import CreatePackage from "./components/dashboard/package/CreatePackage";
import ListPackages from "./components/dashboard/package/ListPackage";

// SCANS
import ScanDashboard from "./components/dashboard/scan/scanDashboard";
import PerformScan from "./components/dashboard/scan/PerformScan";
import ListScans from "./components/dashboard/scan/ListScan";

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
      { path: "farmers", element: <Farmers /> },
      { path: "batches", element: <Batches /> },
      { path: "packages", element: <Packages /> },
      { path: "scans", element: <Scans /> },
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
          { path: "users/list", element: <ListUsers /> },
          { path: "users/me", element: <MyAccount /> },

          { path: "farmers", element: <FarmerDashboard /> },
          { path: "farmers/create", element: <CreateFarmer /> },
          { path: "farmers/list", element: <ListFarmers /> },

          { path: "batches", element: <BatchDashboard /> },
          { path: "batches/create", element: <CreateBatch /> },
          { path: "batches/list", element: <ListBatches /> },

          { path: "packages", element: <PackageDashboard /> },
          { path: "packages/create", element: <CreatePackage /> },
          { path: "packages/list", element: <ListPackages /> },

          { path: "scans", element: <ScanDashboard /> },
          { path: "scans/perform", element: <PerformScan /> },
          { path: "scans/list", element: <ListScans /> },
        ],
      },

      // 👤 USER ROUTES
      {
        path: "user",
        children: [
          { index: true, element: <UserDashboard /> },

          { path: "farmers", element: <FarmerDashboard /> },
          { path: "farmers/create", element: <CreateFarmer /> },
          { path: "farmers/list", element: <ListFarmers /> },

          { path: "batches", element: <BatchDashboard /> },
          { path: "batches/create", element: <CreateBatch /> },
          { path: "batches/list", element: <ListBatches /> },

          { path: "packages", element: <PackageDashboard /> },
          { path: "packages/create", element: <CreatePackage /> },
          { path: "packages/list", element: <ListPackages /> },

          { path: "scans", element: <ScanDashboard /> },
          { path: "scans/perform", element: <PerformScan /> },
          { path: "scans/list", element: <ListScans /> },
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
