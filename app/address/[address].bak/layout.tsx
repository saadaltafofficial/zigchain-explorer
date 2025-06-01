export function generateStaticParams() {
  // Return an empty array as this is a placeholder page
  // In a real implementation, you would fetch addresses and return them as params
  return [];
}

export default function AddressLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
