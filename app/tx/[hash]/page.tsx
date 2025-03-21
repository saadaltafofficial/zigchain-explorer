import TransactionDetailClient from './TransactionDetailClient';

// Define the correct props type for Next.js App Router
type Props = {
  params: { hash: string };
  searchParams?: { [key: string]: string | string[] | undefined };
};

// This is the server component that serves as the entry point for the route
export default function TransactionDetailPage({ params, searchParams }: Props) {
  return (
    <TransactionDetailClient params={params} />
  );
}
