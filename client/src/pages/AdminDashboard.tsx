import React, { useState, useEffect } from "react";
import { MapPin, Users, FileText, Settings, Plus, Eye } from "lucide-react";
import LeafletMap from "@/components/LeafletMap";
import L from "leaflet";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"wards" | "workers" | "worklogs">(
    "wards"
  );
  const [wards, setWards] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [worklogs, setWorklogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [map, setMap] = useState<L.Map | null>(null);

  useEffect(() => {
    // Load initial data
    loadWards();
    loadWorkers();
    loadWorklogs();
  }, []);

  const loadWards = async () => {
    setLoading(true);
    try {
      // TODO: Call API to fetch wards
      setWards([]);
    } catch (error) {
      console.error("Error loading wards:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkers = async () => {
    try {
      // TODO: Call API to fetch workers
      setWorkers([]);
    } catch (error) {
      console.error("Error loading workers:", error);
    }
  };

  const loadWorklogs = async () => {
    try {
      // TODO: Call API to fetch worklogs
      setWorklogs([]);
    } catch (error) {
      console.error("Error loading worklogs:", error);
    }
  };

  const handleMapReady = (mapInstance: L.Map) => {
    setMap(mapInstance);
  };

  return (
    <div className="min-h-screen bg-white p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          SWM PRO Admin Dashboard
        </h1>
        <p className="text-gray-600">Manage wards, workers, and work logs</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { icon: MapPin, label: "Total Wards", value: wards.length },
          { icon: Users, label: "Active Workers", value: workers.length },
          { icon: FileText, label: "Work Logs", value: worklogs.length },
          { icon: Settings, label: "Config", value: "Active" },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="bg-white rounded-[20px] p-6 backdrop-blur-md border border-blue-100 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stat.value}
                </p>
              </div>
              <stat.icon className="w-12 h-12 text-blue-600" strokeWidth={1.5} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[20px] p-6 backdrop-blur-md border border-blue-100 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Ward Map & Tracking
            </h2>
            <LeafletMap
              center={[40.7128, -74.006]}
              zoom={12}
              onMapReady={handleMapReady}
              className="rounded-[20px] overflow-hidden"
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="bg-white rounded-[20px] p-4 backdrop-blur-md border border-blue-100 shadow-lg">
            <div className="flex flex-col gap-2">
              {[
                { id: "wards", label: "Wards", icon: MapPin },
                { id: "workers", label: "Workers", icon: Users },
                { id: "worklogs", label: "Work Logs", icon: FileText },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-[20px] p-4 backdrop-blur-md border border-blue-100 shadow-lg space-y-3">
            <button className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              <Plus className="w-5 h-5" />
              Create Ward
            </button>
            <button className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-900 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors">
              <Eye className="w-5 h-5" />
              View Reports
            </button>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-[20px] p-4 backdrop-blur-md border border-blue-100 shadow-lg">
            <h3 className="font-bold text-gray-900 mb-3">Quick Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Completed Tasks</span>
                <span className="font-bold text-gray-900">
                  {worklogs.filter((w) => w.status === "COMPLETED").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pending Tasks</span>
                <span className="font-bold text-gray-900">
                  {worklogs.filter((w) => w.status === "PENDING").length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="mt-8 bg-white rounded-[20px] p-6 backdrop-blur-md border border-blue-100 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {activeTab === "wards" && "Ward Management"}
          {activeTab === "workers" && "Worker Management"}
          {activeTab === "worklogs" && "Work Logs"}
        </h2>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-bold text-gray-900">
                    ID
                  </th>
                  <th className="text-left py-3 px-4 font-bold text-gray-900">
                    Details
                  </th>
                  <th className="text-left py-3 px-4 font-bold text-gray-900">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-bold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {activeTab === "wards" &&
                  wards.map((ward) => (
                    <tr key={ward.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900">{ward.id}</td>
                      <td className="py-3 px-4 text-gray-600">Ward {ward.ward_no}</td>
                      <td className="py-3 px-4">
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          Active
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button className="text-blue-600 hover:text-blue-800 font-medium">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                {activeTab === "workers" &&
                  workers.map((worker) => (
                    <tr key={worker.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900">{worker.id}</td>
                      <td className="py-3 px-4 text-gray-600">{worker.name}</td>
                      <td className="py-3 px-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {worker.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button className="text-blue-600 hover:text-blue-800 font-medium">
                          Track
                        </button>
                      </td>
                    </tr>
                  ))}
                {activeTab === "worklogs" &&
                  worklogs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900">{log.id}</td>
                      <td className="py-3 px-4 text-gray-600">{log.module}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            log.status === "COMPLETED"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button className="text-blue-600 hover:text-blue-800 font-medium">
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {(activeTab === "wards" ? wards : activeTab === "workers" ? workers : worklogs).length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No data available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
