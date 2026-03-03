import React, { useEffect, useRef, useState } from "react";
import { Camera, MapPin, AlertCircle, CheckCircle } from "lucide-react";
import Html5QrcodePlugin from "html5-qrcode";

interface GeoLocation {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
    mocked?: boolean;
  };
}

export default function QRScanner() {
  const [gpsStatus, setGpsStatus] = useState<"idle" | "checking" | "valid" | "invalid">(
    "idle"
  );
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [scanResult, setScanResult] = useState<string>("");
  const [scannerActive, setScannerActive] = useState(false);
  const [error, setError] = useState("");
  const qrRef = useRef<HTMLDivElement>(null);

  /**
   * Check for mock location (Android)
   */
  const checkMockLocation = async (): Promise<boolean> => {
    try {
      // Check if running on Android with mock location
      if (navigator.userAgent.includes("Android")) {
        // Try to detect mock location via accuracy
        // Real GPS typically has accuracy < 50m, mock location often has very high accuracy
        if (accuracy && accuracy > 100) {
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  };

  /**
   * Get GPS location and validate
   */
  const getGPSLocation = async () => {
    setGpsStatus("checking");
    setError("");

    return new Promise<void>((resolve) => {
      if (!navigator.geolocation) {
        setError("Geolocation not supported on this device");
        setGpsStatus("invalid");
        resolve();
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position: GeoLocation) => {
          const { latitude, longitude, accuracy } = position.coords;
          setAccuracy(accuracy);
          setLocation({ lat: latitude, lng: longitude });

          // Check for mock location
          const isMocked = await checkMockLocation();

          if (isMocked || accuracy > 100) {
            setError(
              "Mock location detected or GPS accuracy too low. Please use real GPS."
            );
            setGpsStatus("invalid");
            setScannerActive(false);
          } else {
            setGpsStatus("valid");
            setScannerActive(true);
          }
          resolve();
        },
        (err) => {
          setError(`GPS Error: ${err.message}`);
          setGpsStatus("invalid");
          resolve();
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  /**
   * Initialize QR Scanner
   */
  useEffect(() => {
    if (!scannerActive || !qrRef.current) return;

    const scanner = new Html5QrcodePlugin.Html5Qrcode(qrRef.current.id);

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText: string) => {
          setScanResult(decodedText);
          scanner.stop();
          setScannerActive(false);
        },
        (error: any) => {
          console.log("QR scan error:", error);
        }
      )
      .catch((err: any) => {
        setError(`Camera Error: ${err.message}`);
        setScannerActive(false);
      });

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [scannerActive]);

  const handleStartScan = async () => {
    await getGPSLocation();
  };

  const handleRetry = () => {
    setScanResult("");
    setError("");
    setGpsStatus("idle");
    setScannerActive(false);
  };

  return (
    <div className="min-h-screen bg-white p-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">QR Code Scanner</h1>
        <p className="text-gray-600">Scan ward QR code to start work</p>
      </div>

      {/* Main Card */}
      <div className="max-w-md mx-auto bg-white rounded-[20px] p-6 backdrop-blur-md border border-blue-100 shadow-lg">
        {/* GPS Status */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="font-medium text-gray-900">GPS Status</label>
            {gpsStatus === "valid" && (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}
            {gpsStatus === "invalid" && (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            {gpsStatus === "checking" && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            )}
          </div>

          {location && accuracy !== null && (
            <div className="p-3 bg-blue-50 rounded-lg text-sm">
              <div className="flex items-center gap-2 text-blue-900 mb-1">
                <MapPin className="w-4 h-4" />
                <span>Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
              </div>
              <div className="text-blue-700">Accuracy: ±{accuracy.toFixed(1)}m</div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* QR Scanner */}
        {scannerActive ? (
          <div className="mb-6">
            <div
              id="qr-scanner"
              ref={qrRef}
              className="w-full rounded-[20px] overflow-hidden bg-gray-900"
              style={{ minHeight: "300px" }}
            />
            <p className="text-center text-gray-600 text-sm mt-3">
              Point camera at QR code
            </p>
          </div>
        ) : scanResult ? (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-900">QR Code Scanned!</span>
            </div>
            <p className="text-sm text-green-800 break-all">{scanResult}</p>
          </div>
        ) : (
          <div className="mb-6 p-8 bg-gray-50 rounded-[20px] flex flex-col items-center justify-center">
            <Camera className="w-12 h-12 text-gray-400 mb-3" />
            <p className="text-gray-600 text-center text-sm">
              {gpsStatus === "checking"
                ? "Checking GPS..."
                : "Ready to scan QR code"}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {!scanResult ? (
            <button
              onClick={handleStartScan}
              disabled={gpsStatus === "checking" || scannerActive}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              {scannerActive ? "Scanning..." : "Start Scan"}
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  // TODO: Navigate to work module selection
                  console.log("Proceed to work modules");
                }}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Proceed to Work
              </button>
              <button
                onClick={handleRetry}
                className="w-full bg-gray-100 text-gray-900 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Scan Another
              </button>
            </>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="max-w-md mx-auto mt-6 bg-white rounded-[20px] p-4 backdrop-blur-md border border-blue-100 shadow-lg">
        <h3 className="font-bold text-gray-900 mb-2">Important Notes</h3>
        <ul className="text-sm text-gray-600 space-y-2">
          <li>• Use real GPS, not mock location</li>
          <li>• GPS accuracy must be better than 100m</li>
          <li>• Ensure camera permissions are enabled</li>
          <li>• Keep device in good lighting</li>
        </ul>
      </div>
    </div>
  );
}
