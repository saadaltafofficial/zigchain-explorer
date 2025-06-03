// Import the TransactionDetailWrapper component
import TransactionDetailWrapper from './TransactionDetailWrapper';

// Define the correct props type for Next.js App Router
type Props = {
  params: Promise<{ hash: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

// Generate static params for build-time generation
// This is required when using output: 'export'
export function generateStaticParams() {
  // Return an empty array since we can't pre-generate all possible transaction hashes
  // This will create a fallback page that can be used as a template
  return [];
}

// This is the server component that serves as the entry point for the route
export default async function TransactionDetailPage({ params, searchParams }: Props) {
  const { hash } = await params;
  return (
    <TransactionDetailWrapper hash={hash} />
  );
}
