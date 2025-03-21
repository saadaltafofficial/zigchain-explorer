import TransactionDetailClient from './TransactionDetailClient';

// Define the correct props type for Next.js App Router
type Props = {
  params: Promise<{ hash: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

// This is the server component that serves as the entry point for the route
export default async function TransactionDetailPage({ params, searchParams }: Props) {
  const { hash } = await params;
  return (
    <TransactionDetailClient params={{ hash }} />
  );
}
