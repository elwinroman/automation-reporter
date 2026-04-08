import { createBrowserRouter, Navigate } from 'react-router'
import { RootLayout } from '@/components/layout/root-layout'
import { VersionGuard } from '@/components/layout/version-guard'
import VersionSelector from '@/pages/version-selector'
import DashboardReference from '@/pages/dashboard-reference'
import Products from '@/pages/products'
import ProductDetail from '@/pages/product-detail'
import TestCases from '@/pages/test-cases'
import FlakyTests from '@/pages/flaky-tests'
import SlowestTests from '@/pages/slowest-tests'
import FailureAnalysis from '@/pages/failure-analysis'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <VersionSelector />,
  },
  {
    element: <VersionGuard />,
    children: [
      {
        element: <RootLayout />,
        children: [
          { path: '/dashboard', element: <DashboardReference /> },
          { path: '/categories', element: <Navigate to="/products" replace /> },
          { path: '/products', element: <Products /> },
          { path: '/products/:product', element: <ProductDetail /> },
          { path: '/test-cases', element: <TestCases /> },
          { path: '/executions', element: <Navigate to="/products" replace /> },
          { path: '/flaky-tests', element: <FlakyTests /> },
          { path: '/slowest-tests', element: <SlowestTests /> },
          { path: '/failure-analysis', element: <FailureAnalysis /> },
        ],
      },
    ],
  },
])
