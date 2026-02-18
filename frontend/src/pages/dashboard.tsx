import { Play, TestTubes, CheckCircle, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { trpc } from '@/lib/trpc';
import { useVersion } from '@/context/version-context';
import { formatTime, formatNumber, formatPassRate } from '@/lib/format';
import { KpiCard } from '@/components/shared/kpi-card';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSkeleton } from '@/components/shared/loading-skeleton';
import { ErrorFallback } from '@/components/shared/error-fallback';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PIE_COLORS = ['#10b981', '#ef4444'];

export default function Dashboard() {
  const { version } = useVersion();
  const summary = trpc.report.globalSummary.useQuery({ version: version! });
  const categories = trpc.report.categories.useQuery({ version: version! });

  if (summary.isLoading || categories.isLoading) return <LoadingSkeleton />;
  if (summary.isError) return <ErrorFallback message={summary.error.message} onRetry={() => summary.refetch()} />;
  if (categories.isError) return <ErrorFallback message={categories.error.message} onRetry={() => categories.refetch()} />;

  const s = summary.data!;
  const cats = categories.data ?? [];

  const pieData = [
    { name: 'Passed', value: s.totalPassed },
    { name: 'Failed', value: s.totalFailed },
  ];

  const barData = cats.map((c) => ({
    name: c.category.length > 20 ? c.category.slice(0, 20) + '...' : c.category,
    passRate: Number(c.passRate.toFixed(1)),
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview of test execution results" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Executions" value={formatNumber(s.totalExecutions)} icon={Play} />
        <KpiCard title="Total Test Cases" value={formatNumber(s.totalTestCases)} icon={TestTubes} />
        <KpiCard title="Pass Rate" value={formatPassRate(s.globalPassRate)} icon={CheckCircle} />
        <KpiCard title="Total Time" value={formatTime(s.totalTime)} icon={Clock} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pass / Fail Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${formatNumber(value)}`}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pass Rate by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} unit="%" />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Bar dataKey="passRate" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
