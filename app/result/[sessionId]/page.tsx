import { notFound } from 'next/navigation';
import ResultViews from '@/components/results/ResultViews';
import { getExampleResults } from '@/lib/examples';
import { loadSession } from '@/lib/storage';

export function generateStaticParams() {
  return getExampleResults().map((result) => ({
    sessionId: result.sessionId,
  }));
}

export default async function ResultPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const result = loadSession(sessionId);
  if (!result) notFound();

  return <ResultViews result={result} isExample={getExampleResults().some((example) => example.sessionId === sessionId)} />;
}
