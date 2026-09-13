import { useState, useEffect, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts'
import { TrendingUp, Users, ShoppingBag, IndianRupee, Download } from 'lucide-react'
import api from '../../lib/api'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'
import './Analytics.css'

export default function Analytics() {
  const [orders, setOrders] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7days')
  
  const dashboardRef = useRef(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [ordersRes, usersRes] = await Promise.all([
        api.get('orders'),
        api.get('users')
      ])
      
      setOrders(ordersRes.data || [])
      setUsers(usersRes.data || [])
    } catch (error) {
      console.error('Error fetching analytics data:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const currentYear = new Date().getFullYear()

  // Process data for charts based on timeRange
  let revenueData = []
  let filteredOrders = []

  if (timeRange === '7days') {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return d.toISOString().split('T')[0]
    })

    revenueData = last7Days.map(date => {
      const dayOrders = orders.filter(o => o.created_at.startsWith(date) && o.status !== 'Cancelled')
      return {
        date: new Date(date).toLocaleDateString('en-IN', { weekday: 'short' }),
        revenue: dayOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
        orders: dayOrders.length
      }
    })
    
    // Filter orders for the summary cards
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setHours(0,0,0,0)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    filteredOrders = orders.filter(o => new Date(o.created_at) >= sevenDaysAgo)
    
  } else {
    // 365days or Specific Year
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    let targetMonths = []
    
    if (timeRange === '365days') {
      const today = new Date()
      for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
        targetMonths.push({ month: d.getMonth(), year: d.getFullYear(), label: `${monthNames[d.getMonth()]} ${d.getFullYear().toString().substring(2)}` })
      }
      
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
      filteredOrders = orders.filter(o => new Date(o.created_at) >= oneYearAgo)
    } else {
      // Specific Year
      const targetYear = parseInt(timeRange)
      for (let i = 0; i < 12; i++) {
        targetMonths.push({ month: i, year: targetYear, label: monthNames[i] })
      }
      filteredOrders = orders.filter(o => new Date(o.created_at).getFullYear() === targetYear)
    }
    
    revenueData = targetMonths.map(tm => {
      const monthOrders = filteredOrders.filter(o => {
        const od = new Date(o.created_at)
        return od.getMonth() === tm.month && od.getFullYear() === tm.year && o.status !== 'Cancelled'
      })
      return {
        date: tm.label,
        revenue: monthOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
        orders: monthOrders.length
      }
    })
  }

  const orderStatusData = [
    { name: 'Delivered', count: filteredOrders.filter(o => o.status === 'Delivered').length },
    { name: 'Processing', count: filteredOrders.filter(o => ['Food Processing', 'Preparing'].includes(o.status)).length },
    { name: 'Out for delivery', count: filteredOrders.filter(o => o.status === 'Out for delivery').length },
    { name: 'Cancelled', count: filteredOrders.filter(o => o.status === 'Cancelled').length },
  ]

  const totalRevenue = filteredOrders.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + Number(o.total_amount || 0), 0)

  // Export functions
  const downloadExcel = () => {
    if (filteredOrders.length === 0) {
      toast.error('No data to export for selected range')
      return
    }
    const data = filteredOrders.map(o => ({
      'Order ID': o.id,
      'Date': new Date(o.created_at).toLocaleString(),
      'Status': o.status,
      'Total Amount': o.total_amount,
      'Payment Status': o.payment_status ? 'Paid' : 'Pending',
      'Payment Method': o.payment_method || 'COD',
      'Items Count': o.items?.length || 0,
      'Customer First Name': o.address?.firstName || '',
      'Customer Last Name': o.address?.lastName || '',
      'Customer Phone': o.address?.phone || ''
    }))
    
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "AnalyticsData")
    XLSX.writeFile(workbook, `SpiceKitchen_Analytics_${timeRange}.xlsx`)
  }

  return (
    <div className="analytics-page" ref={dashboardRef}>
      <div className="analytics-header">
        <h2 className="page-title">Analytics Overview</h2>
        
        <div className="analytics-controls">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-range-select"
          >
            <option value="7days">Last 7 Days</option>
            <option value="365days">Last 365 Days</option>
            <option value={currentYear.toString()}>Year {currentYear}</option>
          </select>

          <button className="btn-export excel" onClick={downloadExcel} disabled={loading}>
            <Download size={16} /> Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="analytics-summary">
        <div className="summary-card">
          <div className="sc-icon" style={{ color: '#22c55e', background: 'rgba(34, 197, 94, 0.1)' }}>
            <IndianRupee size={24} />
          </div>
          <div className="sc-info">
            <p className="sc-label">Revenue ({timeRange})</p>
            <p className="sc-value">₹{totalRevenue.toFixed(0)}</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="sc-icon" style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)' }}>
            <ShoppingBag size={24} />
          </div>
          <div className="sc-info">
            <p className="sc-label">Orders ({timeRange})</p>
            <p className="sc-value">{filteredOrders.length}</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="sc-icon" style={{ color: '#a78bfa', background: 'rgba(167, 139, 250, 0.1)' }}>
            <Users size={24} />
          </div>
          <div className="sc-info">
            <p className="sc-label">Registered Users</p>
            <p className="sc-value">{users.length}</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="sc-icon" style={{ color: '#FF6B35', background: 'rgba(255, 107, 53, 0.1)' }}>
            <TrendingUp size={24} />
          </div>
          <div className="sc-info">
            <p className="sc-label">Avg. Order Value</p>
            <p className="sc-value">₹{filteredOrders.length ? (totalRevenue / filteredOrders.length).toFixed(0) : 0}</p>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        {/* Revenue Chart */}
        <div className="chart-container">
          <h3>Revenue & Orders ({timeRange === '7days' ? 'Last 7 Days' : timeRange === '365days' ? 'Last 365 Days' : `Year ${timeRange}`})</h3>
          <div className="chart-wrapper">
            {loading ? <p className="chart-loading">Loading chart...</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                  <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ background: '#1a1a25', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="#22c55e" strokeWidth={3} dot={{ r: 4, fill: '#22c55e' }} activeDot={{ r: 6 }} />
                  <Line yAxisId="right" type="monotone" dataKey="orders" name="Orders" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Order Status Chart */}
        <div className="chart-container">
          <h3>Orders by Status</h3>
          <div className="chart-wrapper">
            {loading ? <p className="chart-loading">Loading chart...</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orderStatusData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ background: '#1a1a25', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar dataKey="count" name="Orders" fill="#FF6B35" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
