import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from "recharts";

const TrafficDashboard = ({ data }) => {
  // Process data for chart display
  const chartData = data
    ?.map((item) => ({
      date: new Date(item.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      fullDate: new Date(item.date).toLocaleDateString(),
      totalPhotos: item.total_photos_captured,
      pendingReview: item.pending_review,
      challanGenerated: item.challan_generated,
      challanRejected: item.challan_rejected,
      processed: item.challan_generated + item.challan_rejected,
    }))

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload?.[0].payload;
      return (
        <div className="bg-white rounded-lg shadow-xl p-4 border border-gray-200">
          <p className="font-semibold text-gray-800 mb-2">{data.fullDate}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between items-center min-w-40">
              <span className="text-gray-600">Total Photos:</span>
              <span className="font-medium text-gray-800">
                {data.totalPhotos}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending Review:</span>
              <span className="font-medium text-gray-800">
                {data.pendingReview}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Challan Generated:</span>
              <span className="font-medium text-gray-800">
                {data.challanGenerated}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Challan Rejected:</span>
              <span className="font-medium text-gray-800">
                {data.challanRejected}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-96">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          barCategoryGap="20%"
        >
          <XAxis
            dataKey="date"
            tick={{ fill: "#6B7280", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            interval={0}
          />
          <YAxis
            tick={{ fill: "#6B7280", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />

          <Bar
            dataKey="processed"
            stackId="a"
            fill="#9E77ED"
            radius={[6, 6, 0, 0]}
          >
            {chartData?.map((entry, index) => (
              <Cell
                key={`processed-${index}`}
                className="transition-all duration-300 hover:brightness-110 hover:drop-shadow-md cursor-pointer"
              />
            ))}
          </Bar>

          {/* Pending Review (top gray section) */}
          <Bar
            dataKey="pendingReview"
            stackId="a"
            fill="#E4E7EC"
            radius={[6, 6, 0, 0]}
          >
            {chartData?.map((entry, index) => (
              <Cell
                key={`pending-${index}`}
               
              />
            ))}
          </Bar>

          <Tooltip content={<CustomTooltip />} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};



export default TrafficDashboard;
