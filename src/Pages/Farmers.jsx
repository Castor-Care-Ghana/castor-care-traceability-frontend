import FarmerForm from "../components/FarmerForm";
import FarmerList from "../components/FarmerList";

const Farmers = () =>  {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Farmers</h1>
      <FarmerForm onSuccess={() => window.location.reload()} />
      <FarmerList />
    </div>
  );
}

export default Farmers;
