import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const DashboardRedirect = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      // If no user → go back to signin
      navigate("/signin");
      return;
    }

    if (user.role === "admin") {
      navigate("/dashboard/admin");
    } else if (user.role === "user") {
      navigate("/dashboard/user");
    } else {
      // If role is unknown → default to signin
      navigate("/signin");
    }
  }, [user, navigate]);

  return null; // Nothing to render
};

export default DashboardRedirect;
