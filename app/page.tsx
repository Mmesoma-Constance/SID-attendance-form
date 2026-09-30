"use client";

import { useEffect, useState } from "react";


const SID_LOCATION = { lat: 6.232186, lng: 7.093276 }; 
const ALLOWED_RADIUS_METERS = 150; // how close (in metres) a person must be
const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSeqIIxt5REKIixmWbNeKS6Hk_wdKTvI5b9y0DkobnJCsRF0xg/viewform?usp=dialog"; // your attendance form link
// -------------------------------------------------------

// How long (in milliseconds) each screen stays before moving on
const CONFIRMED_SCREEN_MS = 1500; // "Location confirmed" tick
const REDIRECTING_SCREEN_MS = 2000; // "Redirecting..." spinner

// Haversine formula: distance in metres between two GPS points
function getDistanceInMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) {
  const R = 6371000; // Earth's radius in metres
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---------------- Small icons ----------------

// Spinning circle shown while checking and while redirecting
function Spinner() {
  return (
    <div
      className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-slate-200 border-t-teal-600"
      aria-hidden="true"
    />
  );
}

// Teal circle with a tick, shown when the location is confirmed
function CheckIcon() {
  return (
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-100">
      <svg
        className="h-8 w-8 text-teal-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={3}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );
}

// Red circle with a warning triangle, shown for errors
function WarningIcon() {
  return (
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
      <svg
        className="h-8 w-8 text-red-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        />
      </svg>
    </div>
  );
}

export default function Page() {
  const [status, setStatus] = useState("idle");
  const [distance, setDistance] = useState<number | null>(null);

  // Success flow: show the tick first, then the redirecting spinner, then go to the form
  useEffect(() => {
    if (status === "success") {
      const timer = setTimeout(() => setStatus("redirecting"), CONFIRMED_SCREEN_MS);
      return () => clearTimeout(timer);
    }

    if (status === "redirecting") {
      const timer = setTimeout(() => {
        window.location.href = GOOGLE_FORM_URL;
      }, REDIRECTING_SCREEN_MS);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const checkLocation = () => {
    if (!("geolocation" in navigator)) {
      setStatus("unavailable");
      return;
    }

    setStatus("checking");

    const onSuccess = (position: GeolocationPosition) => {
      const meters = getDistanceInMeters(
        position.coords.latitude,
        position.coords.longitude,
        SID_LOCATION.lat,
        SID_LOCATION.lng
      );

      console.log("Your location:", position.coords.latitude, position.coords.longitude);
      
      console.log("Distance (metres):", Math.round(meters));
      console.log("Accuracy (metres):", Math.round(position.coords.accuracy));

      setDistance(Math.round(meters));
      setStatus(meters <= ALLOWED_RADIUS_METERS ? "success" : "too-far");
    };

    navigator.geolocation.getCurrentPosition(
      onSuccess,
      (error) => {
        if (error.code === 1) {
          setStatus("denied"); // user blocked location
          return;
        }
        // timed out or not found: try again with the faster, less accurate method
        navigator.geolocation.getCurrentPosition(
          onSuccess,
          (err) => setStatus(err.code === 1 ? "denied" : "unavailable"),
          { enableHighAccuracy: false, timeout: 30000, maximumAge: 0 }
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <main className="min-h-screen bg-white">
      <h1 className="p-10 text-center text-2xl font-semibold">SID Attendance</h1>

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center bg-black/60 p-4 font-sans">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          {status === "idle" && (
            <>
              <h2 className="text-xl font-semibold text-teal-600 font-mono">Current location needed</h2>
              <p className="mt-2 text-slate-600">
                Please turn on your location so we can confirm you are at the
                SID location.
              </p>
              <button
                onClick={checkLocation}
                className="mt-6 w-full rounded-lg bg-teal-600 cursor-pointer hover:bg-teal-700 px-4 py-3 text-white"
              >
                Turn on location
              </button>
            </>
          )}

          {status === "checking" && (
            <>
              <Spinner />
              <h2 className="mt-4 text-xl font-semibold text-teal-600 font-mono">Checking your location...</h2>
              <p className="mt-2 text-slate-600">
                If your browser asks, tap Allow.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckIcon />
              <h2 className="mt-4 text-xl font-semibold text-teal-600 font-mono">Location confirmed</h2>
              <p className="mt-2 text-slate-600">
                You are at the SID attendance location.
              </p>
            </>
          )}

          {status === "redirecting" && (
            <>
              <Spinner />
              <h2 className="mt-4 text-xl font-semibold text-teal-600 font-mono">Redirecting...</h2>
              <p className="mt-2 text-slate-600">
                Taking you to the attendance form. Please wait.
              </p>
            </>
          )}

          {status === "too-far" && (
            <>
              <WarningIcon />
              <h2 className="mt-4 text-xl font-semibold text-teal-600 font-mono">
                You are not at the SID attendance location
              </h2>
              <p className="mt-2 text-slate-600">
                Please move to the correct location and try again.
              </p>
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                You appear to be about {distance?.toLocaleString()} m away from
                the SID attendance location.
              </p>
              <button
                onClick={checkLocation}
                className="mt-6 w-full rounded-lg bg-teal-600 cursor-pointer hover:bg-teal-700 px-4 py-3 text-white"
              >
                Try again
              </button>
            </>
          )}

          {status === "denied" && (
            <>
              <WarningIcon />
              <h2 className="mt-4 text-xl font-semibold text-teal-600 font-mono">Location is blocked</h2>
              <p className="mt-2 text-slate-600">
                Click the lock icon next to the website address, set Location to
                Allow, then try again.
              </p>
              <button
                onClick={checkLocation}
                className="mt-6 w-full rounded-lg bg-teal-600 cursor-pointer hover:bg-teal-700 px-4 py-3 text-white"
              >
                Try again
              </button>
            </>
          )}

          {status === "unavailable" && (
            <>
              <WarningIcon />
              <h2 className="mt-4 text-xl font-semibold text-teal-600 font-mono">
                We could not find your location
              </h2>
              <p className="mt-2 text-slate-600">
                Make sure your location and Wi-Fi are switched on, then try
                again.
              </p>
              <button
                onClick={checkLocation}
                className="mt-6 w-full rounded-lg bg-teal-600 cursor-pointer hover:bg-teal-700 px-4 py-3 text-white"
              >
                Try again
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
