"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const sampleData = [
  {
    date: "2025-08-28",
    total_photos_captured: 24,
    in_process: 6,
    pending_review: 3,
    challan_generated: 15,
  },
  {
    date: "2025-08-29",
    total_photos_captured: 22,
    in_process: 5,
    pending_review: 4,
    challan_generated: 13,
  },
  {
    date: "2025-08-30",
    total_photos_captured: 21,
    in_process: 4,
    pending_review: 5,
    challan_generated: 12,
  },
  {
    date: "2025-08-31",
    total_photos_captured: 23,
    in_process: 6,
    pending_review: 4,
    challan_generated: 13,
  },
  {
    date: "2025-09-01",
    total_photos_captured: 26,
    in_process: 7,
    pending_review: 5,
    challan_generated: 14,
  },
  {
    date: "2025-09-02",
    total_photos_captured: 27,
    in_process: 8,
    pending_review: 4,
    challan_generated: 15,
  },
  {
    date: "2025-09-03",
    total_photos_captured: 25,
    in_process: 6,
    pending_review: 4,
    challan_generated: 15,
  },
];



export default function DashboardCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
      {/* Chart 1: Total Photos Captured */}
      <div className="bg-white p-6 rounded-2xl shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Total Photos Captured (7 Days)
        </h2>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={sampleData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              label={{ value: "Date", position: "insideBottom", offset: -5 }}
            />
            <YAxis
              label={{ value: "Photos", angle: -90, position: "insideLeft" }}
            />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="total_photos_captured"
              fill="#3b82f6"
              name="Total Photos"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Chart 2: Breakdown by Status */}
      {/* <div className="bg-white p-6 rounded-2xl shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Status Breakdown (7 Days)
        </h2>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={sampleData} barGap={6}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              label={{ value: "Date", position: "insideBottom", offset: -5 }}
            />
            <YAxis
              label={{ value: "Count", angle: -90, position: "insideLeft" }}
            />
            <Tooltip />
            <Legend />
            <Bar dataKey="in_process" fill="#f59e0b" name="In Process" />
            <Bar
              dataKey="pending_review"
              fill="#ef4444"
              name="Pending Review"
            />
            <Bar
              dataKey="challan_generated"
              fill="#10b981"
              name="Challan Generated"
            />
          </BarChart>
        </ResponsiveContainer>
      </div> */}
    </div>
  );
}
