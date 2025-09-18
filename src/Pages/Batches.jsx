import BatchForm from "../components/BatchForm";
import BatchList from "../components/BatchList";

const Batches = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Batches</h1>
      <BatchForm onSuccess={() => window.location.reload()} />
      <BatchList />
    </div>
  );
}

export default Batches;
