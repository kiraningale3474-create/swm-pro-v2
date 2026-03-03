import React, { useState, useEffect } from "react";
import {
  Home,
  Wind,
  Droplets,
  Truck,
  MapPin,
  Camera,
  CheckCircle,
  Clock,
} from "lucide-react";

interface Module {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

interface WorkLog {
  id: number;
  module: string;
  status: string;
  timestamp: string;
}

export default function WorkerDashboard() {
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [gpsLocation, setGpsLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [tracking, setTracking] = useState(false);

  const modules: Module[] = [
    {
      id: "DOOR_TO_DOOR",
      name: "Door-to-Door",
      description: "Collect waste from households",
      icon: <Home className="w-8 h-8" />,
      color: "bg-blue-50 border-blue-200",
    },
    {
      id: "SWEEPING",
      name: "Street Sweeping",
      description: "Sweep and clean streets",
      icon: <Wind className="w-8 h-8" />,
      color: "bg-green-50 border-green-200",
    },
    {
      id: "DRAINAGE",
      name: "Drainage Cleaning",
      description: "Clean drainage systems",
      icon: <Droplets className="w-8 h-8" />,
      color: "bg-purple-50 border-purple-200",
    },
    {
      id: "DEPOT",
      name: "Depot Management",
      description: "Manage waste depot",
      icon: <Truck className="w-8 h-8" />,
      color: "bg-orange-50 border-orange-200",
    },
  ];

  useEffect(() => {
    // Load work logs
    loadWorkLogs();
    // Start GPS tracking
    startGPSTracking();
  }, []);

  const loadWorkLogs = async () => {
    try {
      // TODO: Call API to fetch work logs
      setWorkLogs([]);
    } catch (error) {
      console.error("Error loading work logs:", error);
    }
  };

  const startGPSTracking = () => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setGpsLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.error("GPS error:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  };

  const handleModuleSelect = (moduleId: string) => {
    setActiveModule(moduleId);
    // TODO: Navigate to module-specific page
  };

  const handleStartWork = async () => {
    if (!activeModule) return;

    try {
      // TODO: Create worklog entry
      console.log("Starting work for module:", activeModule);
      setTracking(true);
    } catch (error) {
      console.error("Error starting work:", error);
    }
  };

  return (
    <div className="min-h-screen bg-white p-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Worker Dashboard</h1>
        <p className="text-gray-600">Select a module to start work</p>
      </div>

      {/* GPS Status Card */}
      {gpsLocation && (
        <div className="max-w-4xl mx-auto mb-6 bg-white rounded-[20px] p-4 backdrop-blur-md border border-blue-100 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Current Location</p>
                <p className="font-medium text-gray-900">
                  {gpsLocation.lat.toFixed(4)}, {gpsLocation.lng.toFixed(4)}
                </p>
              </div>
            </div>
            <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse"></div>
          </div>
        </div>
      )}

      {/* Module Selection Grid */}
      <div className="max-w-4xl mx-auto mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Available Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modules.map((module) => (
            <button
              key={module.id}
              onClick={() => handleModuleSelect(module.id)}
              className={`p-6 rounded-[20px] border-2 transition-all text-left ${
                activeModule === module.id
                  ? "bg-blue-50 border-blue-600 shadow-lg"
                  : `${module.color} border-transparent hover:shadow-md`
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-blue-600">{module.icon}</div>
                {activeModule === module.id && (
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{module.name}</h3>
              <p className="text-sm text-gray-600">{module.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Active Module Details */}
      {activeModule && (
        <div className="max-w-4xl mx-auto mb-8 bg-white rounded-[20px] p-6 backdrop-blur-md border border-blue-100 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {modules.find((m) => m.id === activeModule)?.name} - Work Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Module Type</p>
              <p className="font-bold text-gray-900">{activeModule}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Status</p>
              <p className="font-bold text-gray-900">
                {tracking ? "In Progress" : "Ready to Start"}
              </p>
            </div>
          </div>

          {/* Work Options */}
          <div className="space-y-3 mb-6">
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="checkbox" className="w-4 h-4" />
              <span className="text-gray-900 font-medium">Enable GPS Tracking</span>
            </label>
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="checkbox" className="w-4 h-4" />
              <span className="text-gray-900 font-medium">Capture Photos</span>
            </label>
          </div>

          <button
            onClick={handleStartWork}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            {tracking ? (
              <>
                <Clock className="w-5 h-5" />
                Work in Progress
              </>
            ) : (
              <>
                <Camera className="w-5 h-5" />
                Start Work
              </>
            )}
          </button>
        </div>
      )}

      {/* Recent Work Logs */}
      <div className="max-w-4xl mx-auto bg-white rounded-[20px] p-6 backdrop-blur-md border border-blue-100 shadow-lg">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Work Logs</h2>

        {workLogs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No work logs yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {workLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium text-gray-900">{log.module}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(log.timestamp).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    log.status === "COMPLETED"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
