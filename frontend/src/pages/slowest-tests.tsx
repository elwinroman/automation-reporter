import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { trpc } from '@/lib/trpc'
import { useVersion } from '@/context/version-context'
import { formatTime, formatNumber } from '@/lib/format'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, type Column } from '@/components/shared/data-table'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { ErrorFallback } from '@/components/shared/error-fallback'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tooltip as UiTooltip } from '@/components/ui/tooltip'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type SortField = 'testCaseName' | 'executionCount' | 'avgTime' | 'maxTime' | 'totalTime' | 'minTime'
type ChartMetric = 'executionCount' | 'avgTime' | 'maxTime' | 'totalTime' | 'minTime'
type ProductSortField = 'product' | 'executionCount' | 'avgTime' | 'totalTime'
type ProductChartMetric = 'executionCount' | 'avgTime' | 'totalTime'

const chartLabels: Record<ChartMetric, string> = {
  executionCount: 'Runs',
  avgTime: 'Avg Time',
  maxTime: 'Max Time',
  totalTime: 'Total Time',
  minTime: 'Min Time',
}

const productChartLabels: Record<ProductChartMetric, string> = {
  executionCount: 'Runs',
  avgTime: 'Avg Time',
  totalTime: 'Total Time',
}

const chartAxisColor = 'hsl(var(--muted-foreground))'
const chartGridColor = 'hsl(var(--border) / 0.35)'
const chartBarColor = 'hsl(var(--primary))'
const chartTooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border) / 0.8)',
  borderRadius: '0.2rem',
  boxShadow: '0 10px 30px hsl(0 0% 0% / 0.18)',
  color: 'hsl(var(--card-foreground))',
  fontSize: '11px',
  padding: '10px 12px',
}
const chartTooltipLabelStyle = {
  color: 'hsl(var(--foreground))',
  fontSize: '11px',
  fontWeight: 600,
  marginBottom: '2px',
}
const chartTooltipItemStyle = {
  color: 'hsl(var(--card-foreground))',
  fontSize: '11px',
  padding: 0,
}

interface TestRow {
  testCaseName: string
  executionCount: number
  avgTime: number
  maxTime: number
  totalTime: number
  minTime: number
  products: string[]
}

interface ProductRow {
  product: string
  category: string
  executionCount: number
  totalTime: number
  avgTime: number
  tags: string[]
}

export default function SlowestTests() {
  const navigate = useNavigate()
  const { version } = useVersion()
  const [view, setView] = useState<'test-cases' | 'products'>('test-cases')
  const [topN, setTopN] = useState(10)
  const [sort, setSort] = useState<{ field: SortField; direction: 'asc' | 'desc' }>({
    field: 'avgTime',
    direction: 'desc',
  })
  const [productSort, setProductSort] = useState<{ field: ProductSortField; direction: 'asc' | 'desc' }>({
    field: 'avgTime',
    direction: 'desc',
  })

  const backendSort = sort.field === 'testCaseName'
    ? { field: 'totalTime' as const, direction: 'desc' as const }
    : { field: sort.field, direction: sort.direction }

  const query = trpc.report.slowestTests.useQuery({
    version: version!,
    topN,
    sortBy: backendSort,
  })
  const backendProductSort = productSort.field === 'product'
    ? { field: 'avgTime' as const, direction: 'desc' as const }
    : { field: productSort.field, direction: productSort.direction }
  const productsQuery = trpc.report.slowestProducts.useQuery({
    version: version!,
    topN,
    sortBy: backendProductSort,
  })

  const data = query.data ?? []
  const productData = productsQuery.data ?? []
  const sortedData = useMemo(() => {
    const multiplier = sort.direction === 'asc' ? 1 : -1
    return [...data].sort((a, b) => {
      if (sort.field === 'testCaseName') {
        return a.testCaseName.localeCompare(b.testCaseName) * multiplier
      }
      return (a[sort.field] - b[sort.field]) * multiplier
    })
  }, [data, sort])
  const sortedProducts = useMemo(() => {
    const multiplier = productSort.direction === 'asc' ? 1 : -1
    return [...productData].sort((a, b) => {
      if (productSort.field === 'product') {
        return a.product.localeCompare(b.product) * multiplier
      }
      return (a[productSort.field] - b[productSort.field]) * multiplier
    })
  }, [productData, productSort])

  if (query.isLoading || productsQuery.isLoading) return <LoadingSkeleton />
  if (query.isError) return <ErrorFallback message={query.error.message} onRetry={() => query.refetch()} />
  if (productsQuery.isError) return <ErrorFallback message={productsQuery.error.message} onRetry={() => productsQuery.refetch()} />

  const chartMetric: ChartMetric = sort.field === 'testCaseName' ? 'totalTime' : sort.field
  const chartData = sortedData.map((d) => ({
    name: d.testCaseName.length > 30 ? d.testCaseName.slice(0, 30) + '...' : d.testCaseName,
    fullName: d.testCaseName,
    value: d[chartMetric],
  }))
  const productChartMetric: ProductChartMetric = productSort.field === 'product' ? 'avgTime' : productSort.field
  const productChartData = sortedProducts.map((d) => ({
    name: d.product.length > 28 ? d.product.slice(0, 28) + '...' : d.product,
    fullName: d.product,
    value: d[productChartMetric],
  }))

  function formatChartValue(value: number) {
    return chartMetric === 'executionCount' ? value.toString() : formatTime(value)
  }
  function formatProductChartValue(value: number) {
    return productChartMetric === 'executionCount' ? formatNumber(value) : formatTime(value)
  }

  function metricColumnClass(target: 'avgTime' | 'maxTime' | 'totalTime') {
    return target === chartMetric ? 'text-right font-semibold text-foreground' : 'text-right'
  }
  function productMetricColumnClass(target: 'avgTime' | 'totalTime') {
    return target === productChartMetric ? 'text-right font-semibold text-foreground' : 'text-right'
  }

  function ProductBadges({ products }: { products: string[] }) {
    const unique = [...new Set(products)]
    return (
      <div className="flex flex-wrap gap-1">
        {unique.map((product) => (
          <button
            key={product}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/products/${encodeURIComponent(product)}`)
            }}
          >
            <Badge variant="secondary" className="cursor-pointer rounded-md border border-border/30 bg-secondary text-[11px] font-medium text-muted-foreground hover:bg-secondary/80 hover:text-foreground">
              {product}
              <ArrowUpRight className="ml-1 h-3 w-3 opacity-70" />
            </Badge>
          </button>
        ))}
      </div>
    )
  }

  function handleSort(field: string) {
    setSort((prev) => ({
      field: field as SortField,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }
  function handleProductSort(field: string) {
    setProductSort((prev) => ({
      field: field as ProductSortField,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const columns: Column<TestRow>[] = [
    {
      key: 'testCaseName',
      header: 'Test Case',
      sortable: true,
      render: (r) => (
        <UiTooltip content={<div className="max-w-md break-words text-xs">{r.testCaseName}</div>}>
          <span className="truncate max-w-[300px] block">
            {r.testCaseName}
          </span>
        </UiTooltip>
      ),
    },
    { key: 'products', header: 'Products', render: (r) => <ProductBadges products={r.products} /> },
    { key: 'executionCount', header: 'Runs', sortable: true, className: 'text-right', render: (r) => r.executionCount },
    { key: 'avgTime', header: 'Avg Time', sortable: true, className: metricColumnClass('avgTime'), render: (r) => formatTime(r.avgTime) },
    { key: 'maxTime', header: 'Max Time', sortable: true, className: metricColumnClass('maxTime'), render: (r) => formatTime(r.maxTime) },
    { key: 'totalTime', header: 'Total Time', sortable: true, className: metricColumnClass('totalTime'), render: (r) => formatTime(r.totalTime) },
    { key: 'minTime', header: 'Min Time', sortable: true, className: 'text-right', render: (r) => formatTime(r.minTime) },
  ]
  const productColumns: Column<ProductRow>[] = [
    {
      key: 'product',
      header: 'Product',
      sortable: true,
      render: (r) => (
        <UiTooltip content={<div className="max-w-md break-words text-xs">{r.product}</div>}>
          <span className="truncate max-w-[300px] block">{r.product}</span>
        </UiTooltip>
      ),
    },
    { key: 'category', header: 'Category', render: (r) => r.category },
    { key: 'executionCount', header: 'Runs', sortable: true, className: 'text-right', render: (r) => formatNumber(r.executionCount) },
    { key: 'avgTime', header: 'Avg Time', sortable: true, className: productMetricColumnClass('avgTime'), render: (r) => formatTime(r.avgTime) },
    { key: 'totalTime', header: 'Total Time', sortable: true, className: productMetricColumnClass('totalTime'), render: (r) => formatTime(r.totalTime) },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        description="Analisis de tiempos de ejecucion por caso de prueba y por producto. Usa los tabs para cambiar de perspectiva y detectar si la lentitud esta concentrada en pruebas puntuales o en componentes completos del flujo."
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={view} onValueChange={(value) => setView(value as 'test-cases' | 'products')}>
          <TabsList>
            <TabsTrigger value="test-cases">Test Cases</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select value={String(topN)} onChange={(e) => setTopN(Number(e.target.value))} className="w-32">
          {[5, 10, 20, 50].map((n) => (
            <option key={n} value={n}>Top {n}</option>
          ))}
        </Select>
      </div>

      <Tabs value={view} onValueChange={(value) => setView(value as 'test-cases' | 'products')} className="space-y-4">
        <TabsContent value="test-cases" className="space-y-4">
          <Card>
            <CardHeader className="px-4 pb-3 sm:px-6">
              <CardTitle className="text-base">{chartLabels[chartMetric]}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-5 sm:px-6">
              <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 35)}>
                <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 8, bottom: 8, left: 12 }}>
                  <CartesianGrid stroke={chartGridColor} strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    tickFormatter={(value: number) => formatChartValue(value)}
                    tick={{ fontSize: 10, fill: chartAxisColor }}
                    axisLine={{ stroke: chartGridColor }}
                    tickLine={{ stroke: chartGridColor }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={176}
                    tick={{ fontSize: 10, fill: chartAxisColor }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatChartValue(value), 'Time']}
                    labelFormatter={(_label, payload) => {
                      const item = payload?.[0]?.payload as { fullName?: string } | undefined
                      return item?.fullName ?? ''
                    }}
                    contentStyle={chartTooltipStyle}
                    labelStyle={chartTooltipLabelStyle}
                    itemStyle={chartTooltipItemStyle}
                    cursor={{ fill: 'hsl(var(--primary) / 0.08)' }}
                  />
                  <Bar dataKey="value" fill={chartBarColor} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <DataTable
            columns={columns}
            data={sortedData}
            sort={sort}
            onSort={handleSort}
          />
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader className="px-4 pb-3 sm:px-6">
              <CardTitle className="text-base">{productChartLabels[productChartMetric]}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-5 sm:px-6">
              <ResponsiveContainer width="100%" height={Math.max(260, productChartData.length * 35)}>
                <BarChart data={productChartData} layout="vertical" margin={{ top: 8, right: 8, bottom: 8, left: 12 }}>
                  <CartesianGrid stroke={chartGridColor} strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    tickFormatter={(value: number) => formatProductChartValue(value)}
                    tick={{ fontSize: 10, fill: chartAxisColor }}
                    axisLine={{ stroke: chartGridColor }}
                    tickLine={{ stroke: chartGridColor }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={176}
                    tick={{ fontSize: 10, fill: chartAxisColor }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatProductChartValue(value), productChartLabels[productChartMetric]]}
                    labelFormatter={(_label, payload) => {
                      const item = payload?.[0]?.payload as { fullName?: string } | undefined
                      return item?.fullName ?? ''
                    }}
                    contentStyle={chartTooltipStyle}
                    labelStyle={chartTooltipLabelStyle}
                    itemStyle={chartTooltipItemStyle}
                    cursor={{ fill: 'hsl(var(--primary) / 0.08)' }}
                  />
                  <Bar dataKey="value" fill={chartBarColor} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <DataTable
            columns={productColumns}
            data={sortedProducts}
            sort={productSort}
            onSort={handleProductSort}
            onRowClick={(row) => navigate(`/products/${encodeURIComponent(row.product)}`)}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
