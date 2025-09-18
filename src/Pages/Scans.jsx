import ScanForm from "../components/ScanForm";
import ScanList from "../components/ScanList";

const Scans = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Scans</h1>
      <ScanForm onSuccess={() => window.location.reload()} />
      <ScanList />
    </div>
  );
}

export default Scans;
