import SalesDashboard from './SalesDashboard'
import AdminDashboard from './AdminDashboard'
import { useApp } from '../context/useApp'

export default function Dashboard() {
  const { account } = useApp()
  return account?.role === 'admin' ? <AdminDashboard /> : <SalesDashboard />
}
