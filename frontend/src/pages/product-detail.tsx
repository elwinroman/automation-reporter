import { useParams } from 'react-router';
import { trpc } from '@/lib/trpc';
import { useVersion } from '@/context/version-context';
import { formatTime, formatNumber } from '@/lib/format';
import { PageHeader } from '@/components/shared/page-header';
import { KpiCard } from '@/components/shared/kpi-card';
import { PassRateBadge } from '@/components/shared/pass-rate-badge';
import { DataTable, type Column } from '@/components/shared/data-table';
import { LoadingSkeleton } from '@/components/shared/loading-skeleton';
import { ErrorFallback } from '@/components/shared/error-fallback';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, FolderTree, Play, CheckCircle } from 'lucide-react';

interface RunRow {
  folderName: string;
  executionDate: string;
  tests: number;
  passed: number;
  failed: number;
  time: number;
}

interface TestCaseRow {
  testCaseName: string;
  executionCount: number;
  passCount: number;
  failCount: number;
  passRate: number;
  avgTime: number;
}

export default function ProductDetail() {
  const { product } = useParams<{ product: string }>();
  const { version } = useVersion();

  const query = trpc.report.productDetail.useQuery({
    version: version!,
    product: product!,
  });

  if (query.isLoading) return <LoadingSkeleton />;
  if (query.isError) return <ErrorFallback message={query.error.message} onRetry={() => query.refetch()} />;

  const d = query.data!;

  const runColumns: Column<RunRow>[] = [
    { key: 'folderName', header: 'Run', render: (r) => <span className="truncate max-w-[200px] block">{r.folderName}</span> },
    { key: 'executionDate', header: 'Date', render: (r) => new Date(r.executionDate).toLocaleString() },
    { key: 'tests', header: 'Tests', className: 'text-right', render: (r) => formatNumber(r.tests) },
    { key: 'passed', header: 'Passed', className: 'text-right', render: (r) => <span className="text-emerald-600">{r.passed}</span> },
    { key: 'failed', header: 'Failed', className: 'text-right', render: (r) => <span className={r.failed > 0 ? 'text-red-600 font-medium' : ''}>{r.failed}</span> },
    { key: 'time', header: 'Time', className: 'text-right', render: (r) => formatTime(r.time) },
  ];

  const testColumns: Column<TestCaseRow>[] = [
    { key: 'testCaseName', header: 'Test Case', render: (r) => <span className="truncate max-w-[300px] block">{r.testCaseName}</span> },
    { key: 'executionCount', header: 'Runs', className: 'text-right', render: (r) => formatNumber(r.executionCount) },
    { key: 'passCount', header: 'Passed', className: 'text-right', render: (r) => r.passCount },
    { key: 'failCount', header: 'Failed', className: 'text-right', render: (r) => r.failCount },
    { key: 'passRate', header: 'Pass Rate', className: 'text-right', render: (r) => <PassRateBadge rate={r.passRate} /> },
    { key: 'avgTime', header: 'Avg Time', className: 'text-right', render: (r) => formatTime(r.avgTime) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={d.product} description={`Category: ${d.category}`} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Product" value={d.product} icon={Package} />
        <KpiCard title="Category" value={d.category} icon={FolderTree} />
        <KpiCard title="Executions" value={formatNumber(d.executionCount)} icon={Play} />
        <KpiCard title="Pass Rate" value={`${d.passRate.toFixed(1)}%`} icon={CheckCircle} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Execution History
            <Badge variant="secondary">{d.runs.length} runs</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={runColumns} data={d.runs} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Related Test Cases
            <Badge variant="secondary">{d.relatedTestCases.length} tests</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={testColumns} data={d.relatedTestCases} />
        </CardContent>
      </Card>
    </div>
  );
}
