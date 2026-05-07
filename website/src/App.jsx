import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { lazy, Suspense } from 'react'
import Layout from './components/layout/Layout'
import ScrollToTop from './components/shared/ScrollToTop'
import LoadingScreen from './components/shared/LoadingScreen'
import { CartProvider } from './store/cart'
import CartDrawer from './components/shop/CartDrawer'
import RequireAuth from './dashboard/components/RequireAuth'

// Public pages
const Home = lazy(() => import('./pages/Home'))
const About = lazy(() => import('./pages/About'))
const Services = lazy(() => import('./pages/Services'))
const Portfolio = lazy(() => import('./pages/Portfolio'))
const Products = lazy(() => import('./pages/Products'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const Projects = lazy(() => import('./pages/Projects'))
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'))
const Contact = lazy(() => import('./pages/Contact'))
const Careers = lazy(() => import('./pages/Careers'))
const FAQ = lazy(() => import('./pages/FAQ'))
const Blog = lazy(() => import('./pages/Blog'))
const Shop = lazy(() => import('./pages/Shop'))

// Dashboard
const DashboardLayout = lazy(() => import('./dashboard/components/DashboardLayout'))
const Login = lazy(() => import('./dashboard/pages/Login'))
const Overview = lazy(() => import('./dashboard/pages/Overview'))
const DashCustomers = lazy(() => import('./dashboard/pages/Customers'))
const DashProjects = lazy(() => import('./dashboard/pages/Projects'))
const DashProjectDetail = lazy(() => import('./dashboard/pages/ProjectDetail'))
const DashQuotations = lazy(() => import('./dashboard/pages/Quotations'))
const DashInvoices = lazy(() => import('./dashboard/pages/Invoices'))
const DashReceipts = lazy(() => import('./dashboard/pages/Receipts'))
const DashEmployees = lazy(() => import('./dashboard/pages/Employees'))
const DashEmployeeDetail = lazy(() => import('./dashboard/pages/EmployeeDetail'))
const DashPayrollList = lazy(() =>
  import('./dashboard/pages/Payroll').then((m) => ({ default: m.PayrollList })),
)
const DashPayrollDetail = lazy(() =>
  import('./dashboard/pages/Payroll').then((m) => ({ default: m.PayrollDetail })),
)
const DashLoans = lazy(() => import('./dashboard/pages/Loans'))
const DashLeave = lazy(() => import('./dashboard/pages/Leave'))
const DashHolidays = lazy(() => import('./dashboard/pages/Holidays'))
const DashTimeClock = lazy(() => import('./dashboard/pages/TimeClock'))
const DashCompliance = lazy(() => import('./dashboard/pages/Compliance'))
const DashStudioMap = lazy(() => import('./dashboard/pages/StudioMap'))
const DashUsers = lazy(() => import('./dashboard/pages/Users'))
const DashInventory = lazy(() => import('./dashboard/pages/Inventory'))
const DashInventoryDetail = lazy(() => import('./dashboard/pages/InventoryDetail'))
const DashSuppliers = lazy(() => import('./dashboard/pages/Suppliers'))
const DashMovements = lazy(() => import('./dashboard/pages/Movements'))
const DashPurchaseOrders = lazy(() => import('./dashboard/pages/PurchaseOrders'))
const DashBurnRate = lazy(() => import('./dashboard/pages/BurnRate'))
const DashInventoryNotifications = lazy(() => import('./dashboard/pages/InventoryNotifications'))

export default function App() {
  const location = useLocation()
  const isDashboard = location.pathname.startsWith('/dashboard')

  // Dashboard runs OUTSIDE the public Layout so it has its own chrome.
  if (isDashboard) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/dashboard/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <DashboardLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Overview />} />
            <Route path="customers" element={<DashCustomers />} />
            <Route path="projects" element={<DashProjects />} />
            <Route path="projects/:id" element={<DashProjectDetail />} />
            <Route path="quotations" element={<DashQuotations />} />
            <Route path="invoices" element={<DashInvoices />} />
            <Route path="receipts" element={<DashReceipts />} />
            <Route path="employees" element={<DashEmployees />} />
            <Route path="employees/:id" element={<DashEmployeeDetail />} />
            <Route path="payroll" element={<DashPayrollList />} />
            <Route path="payroll/:id" element={<DashPayrollDetail />} />
            <Route path="loans" element={<DashLoans />} />
            <Route path="leave" element={<DashLeave />} />
            <Route path="holidays" element={<DashHolidays />} />
            <Route path="time-clock" element={<DashTimeClock />} />
            <Route path="inventory" element={<DashInventory />} />
            <Route path="inventory/suppliers" element={<DashSuppliers />} />
            <Route path="inventory/movements" element={<DashMovements />} />
            <Route path="inventory/purchase-orders" element={<DashPurchaseOrders />} />
            <Route path="inventory/burn-rate" element={<DashBurnRate />} />
            <Route path="inventory/notifications" element={<DashInventoryNotifications />} />
            <Route path="inventory/:id" element={<DashInventoryDetail />} />
            <Route path="settings/compliance" element={<DashCompliance />} />
            <Route path="map" element={<DashStudioMap />} />
            <Route path="users" element={<DashUsers />} />
          </Route>
        </Routes>
      </Suspense>
    )
  }

  return (
    <CartProvider>
      <ScrollToTop />
      <Layout>
        <AnimatePresence mode="wait">
          <Suspense fallback={<LoadingScreen />}>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/services" element={<Services />} />
              <Route path="/services/:serviceSlug" element={<Services />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:slug" element={<ProductDetail />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:slug" element={<ProjectDetail />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/shop" element={<Shop />} />
            </Routes>
          </Suspense>
        </AnimatePresence>
      </Layout>
      <CartDrawer />
    </CartProvider>
  )
}
