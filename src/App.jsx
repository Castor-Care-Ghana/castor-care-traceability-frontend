import { createBrowserRouter } from "react-router-dom";
import Farmers from "./Pages/Farmers";
import Batches from "./Pages/Batches";
import Scans from "./Pages/Scans";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <>
      <Rootlayout/>
      </>
    ),
  children: [
    {
      path: "farmers",
      element: <Farmers />,
    },
    {
      path: "batches",
      element: <Batches />,
    },
    {
      path: "scans",
      element: <Scans />,
  },
]
  }
]
);


const App = () => {
  return (
    <RouterProvider router={router} />
  );
}

export default App;