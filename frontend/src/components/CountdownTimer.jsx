import { useState, useEffect } from "react";
import { Clock, AlertCircle } from "lucide-react";

const CountdownTimer = ({ 
  expiresAt, 
  durationSeconds = 900, // 15 minutes default
  onExpire,
  className = "" 
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState(() => {
    if (expiresAt) {
      const now = new Date();
      const expiry = new Date(expiresAt);
      return Math.max(0, Math.floor((expiry - now) / 1000));
    }
    return durationSeconds;
  });

  useEffect(() => {
    if (remainingSeconds <= 0) {
      onExpire && onExpire();
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        const newValue = prev - 1;
        if (newValue <= 0) {
          clearInterval(timer);
          onExpire && onExpire();
          return 0;
        }
        return newValue;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds, onExpire]);

  // Format time as MM:SS
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  // Determine urgency level
  const isUrgent = remainingSeconds < 120; // Less than 2 minutes
  const isCritical = remainingSeconds < 60; // Less than 1 minute
  const isExpired = remainingSeconds <= 0;

  if (isExpired) {
    return (
      <div className={`flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 ${className}`}>
        <AlertCircle className="h-5 w-5 text-red-600" />
        <div>
          <p className="text-sm font-medium text-red-800">
            Session Expired
          </p>
          <p className="text-xs text-red-600">
            Please restart the checkout process
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`
        flex items-center gap-3 rounded-lg px-4 py-3 transition-colors duration-300
        ${isCritical 
          ? "bg-red-50 border border-red-200" 
          : isUrgent 
            ? "bg-amber-50 border border-amber-200" 
            : "bg-blue-50 border border-blue-200"
        }
        ${className}
      `}
    >
      <div 
        className={`
          flex h-10 w-10 items-center justify-center rounded-full
          ${isCritical 
            ? "bg-red-100" 
            : isUrgent 
              ? "bg-amber-100" 
              : "bg-blue-100"
          }
        `}
      >
        <Clock 
          className={`
            h-5 w-5
            ${isCritical 
              ? "text-red-600 animate-pulse" 
              : isUrgent 
                ? "text-amber-600" 
                : "text-blue-600"
            }
          `}
        />
      </div>
      
      <div className="flex-1">
        <p 
          className={`
            text-sm font-medium
            ${isCritical 
              ? "text-red-800" 
              : isUrgent 
                ? "text-amber-800" 
                : "text-blue-800"
            }
          `}
        >
          Complete payment in
        </p>
        <p 
          className={`
            text-2xl font-bold font-mono tracking-wider
            ${isCritical 
              ? "text-red-600" 
              : isUrgent 
                ? "text-amber-600" 
                : "text-blue-600"
            }
          `}
        >
          {formattedTime}
        </p>
      </div>

      {isUrgent && (
        <div className="text-right">
          <p 
            className={`
              text-xs font-medium
              ${isCritical ? "text-red-600" : "text-amber-600"}
            `}
          >
            {isCritical ? "Hurry!" : "Almost there!"}
          </p>
        </div>
      )}
    </div>
  );
};

export default CountdownTimer;
