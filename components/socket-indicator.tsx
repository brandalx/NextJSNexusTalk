"use client";

import { useEffect } from "react";
import { useSocket } from "./providers/socket-provider";
import { Badge } from "./ui/badge";
export const SocketIndicator = () => {
  const { isConnected } = useSocket();
  useEffect(() => {
    console.log(isConnected);
  }, []);
  if (!isConnected) {
    return (
      <Badge variant="outline" className="bg-yellow-600 text-white border-none">
        Fallback: Pooling every 1s
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="bg-emerald-600 text-white border-none">
      Live: Real-time update
    </Badge>
  );
};