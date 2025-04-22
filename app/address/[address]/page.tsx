export default function AddressPage({ params }: { params: { address: string } }) {
  return (
    <div className="p-8">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <p className="text-yellow-700">
          Address details page is currently under maintenance.
        </p>
      </div>
      
      <h1 className="text-2xl font-bold mb-4">Address Details</h1>
      <p className="mb-4">Address: {params.address}</p>
      
      <a href="/" className="text-blue-500 hover:underline">
        Return to Home
      </a>
    </div>
  );
}
