export function generateStaticParams() {
  // Return an empty array as this is a placeholder page
  // In a real implementation, you would fetch block heights and return them as params
  return [];
}

export default function BlockLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
