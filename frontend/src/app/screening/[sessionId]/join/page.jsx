"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { SOCKET_URL } from "@/lib/config";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  Wifi, WifiOff, User, Loader2, Clock,
  AlertTriangle, Activity, Heart, Thermometer
} from "lucide-react";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject"
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject"
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject"
    }
  ],
};

const fmt = (s) => {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
};

export default function PatientJoinPage() {
  useAuthGuard("citizen");
  const { sessionId } = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [session, setSession]           = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [status, setStatus]             = useState("waiting"); // waiting | connecting | connected | ended
  const [isMuted, setIsMuted]           = useState(false);
  const [isCamOff, setIsCamOff]         = useState(false);
  const [audioOnly, setAudioOnly]       = useState(false);
  const [netQuality, setNetQuality]     = useState("good");
  const [elapsed, setElapsed]           = useState(0);

  const localVideoRef  = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef          = useRef(null);
  const socketRef      = useRef(null);
  const localStreamRef = useRef(null);
  const startTimeRef   = useRef(null);

  /* ── fetch session ──────────────────────────────────────── */
  useEffect(() => {
    fetch(`/api/screening/${sessionId}`, { credentials: "include" })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => setSession(data))
      .catch(() => toast({ variant: "destructive", title: "Session not found or access denied" }))
      .finally(() => setLoadingSession(false));
  }, [sessionId]); // eslint-disable-line

  /* ── timer ──────────────────────────────────────────────── */
  useEffect(() => {
    if (status !== "connected") return;
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  /* ── WebRTC + Socket.IO ─────────────────────────────────── */
  useEffect(() => {
    if (!session) return;
    let destroyed = false;

    const setupMedia = async () => {
      if (typeof window !== 'undefined' && !navigator.mediaDevices) {
        toast({ variant: "destructive", title: "Media Blocked", description: "Browsers block camera on local HTTP IPs. Connect via HTTPS or localhost for video." });
        setAudioOnly(true);
        return null;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 } },
          audio: true,
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        return stream;
      } catch (err) {
        console.warn("Camera failed, falling back to audio", err);
        setAudioOnly(true);
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          localStreamRef.current = stream;
          return stream;
        } catch (e) {
          console.error("No media devices available", e);
          return null;
        }
      }
    };

    const createPC = (stream) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;
      
      // Ensure local tracks are added before createOffer
      if (stream) {
        stream.getTracks().forEach(t => pc.addTrack(t, stream));
      } else {
        pc.addTransceiver('video', { direction: 'recvonly' });
        pc.addTransceiver('audio', { direction: 'recvonly' });
      }

      pc.ontrack = (e) => {
        console.log("📡 Remote track received:", e.track.kind);
        if (remoteVideoRef.current) {
          if (remoteVideoRef.current.srcObject !== e.streams[0]) {
            remoteVideoRef.current.srcObject = e.streams[0];
          }
        }
        if (!destroyed) {
          setStatus("connected");
          if (!startTimeRef.current) {
            startTimeRef.current = Date.now();
          }
        }
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socketRef.current?.emit("ice-candidate", {
            roomId: session.room_id,
            candidate: e.candidate,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        console.log("WebRTC Connection State changed:", state);
        if (state === "connected") setNetQuality("good");
        if (state === "disconnected") setNetQuality("poor");
      };

      pc.oniceconnectionstatechange = () => {
        console.log("ICE Connection State changed:", pc.iceConnectionState);
      };

      const qInterval = setInterval(async () => {
        if (!pc || pc.connectionState !== "connected") return;
        const stats = await pc.getStats();
        stats.forEach(r => {
          if (r.type === "candidate-pair" && r.state === "succeeded") {
            const rtt = r.currentRoundTripTime ?? 0;
            if (rtt < 0.15) setNetQuality("good");
            else if (rtt < 0.4) setNetQuality("fair");
            else setNetQuality("poor");
          }
        });
      }, 3000);
      pc._qualityInterval = qInterval;
      return pc;
    };

    const init = async () => {
      const stream = await setupMedia();
      const pc = createPC(stream);
      let pendingCandidates = [];
      let isNegotiating = false;

      const socket = io(SOCKET_URL, { path: "/socket.io", withCredentials: true });
      socketRef.current = socket;

      socket.on("connect", () => {
        socket.emit("join-room", { roomId: session.room_id, role: "patient" });
        setStatus("connecting");
      });

      // Receive offer from ASHA, send answer
      socket.on("offer", async ({ sdp }) => {
        if (isNegotiating) return;
        isNegotiating = true;
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          
          if (pc.signalingState !== "have-remote-offer") return; // Safety check
          
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("answer", { roomId: session.room_id, sdp: answer });
          
          // Flush any pending candidates that arrived before the remote description was set
          for (const c of pendingCandidates) {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          }
          pendingCandidates = [];
        } catch (e) {
          console.error("Error handling offer:", e);
        } finally {
          isNegotiating = false;
        }
      });

      socket.on("ice-candidate", async ({ candidate }) => {
        try {
          if (pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } else {
            pendingCandidates.push(candidate);
          }
        } catch(e) {
          console.error("Error adding ice candidate:", e);
        }
      });

      socket.on("call-ended", () => {
        if (!destroyed) endCall(false);
      });
    };

    init().catch(console.error);

    return () => {
      destroyed = true;
      cleanup(false);
    };
  }, [session]); // eslint-disable-line

  const cleanup = (notifySocket = true) => {
    clearInterval(pcRef.current?._qualityInterval);
    pcRef.current?.close();
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    if (notifySocket) {
      socketRef.current?.emit("call-ended", { roomId: session?.room_id });
    }
    socketRef.current?.disconnect();
  };

  const endCall = useCallback((notify = true) => {
    setStatus("ended");
    cleanup(notify);
    toast({ title: "Call ended", description: "The screening session has ended." });
    setTimeout(() => router.push("/citizen/dashboard"), 2500);
  }, [router, toast]); // eslint-disable-line

  const toggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsMuted(m => !m); }
  };
  const toggleCam = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsCamOff(c => !c); }
  };

  /* ── network badge ────────────────────────────────────────── */
  const NetBadge = () => {
    const map = {
      good: { icon: <Wifi className="h-3 w-3" />, label: "Good", cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
      fair: { icon: <Wifi className="h-3 w-3" />, label: "Fair", cls: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
      poor: { icon: <WifiOff className="h-3 w-3" />, label: "Poor", cls: "bg-red-500/20 text-red-300 border-red-500/30" },
    };
    const { icon, label, cls } = map[netQuality];
    return (
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${cls}`}>
        {icon} {label}
      </span>
    );
  };

  /* ── Loading ─────────────────────────────────────────────── */
  if (loadingSession) return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
    </div>
  );

  /* ── Ended ───────────────────────────────────────────────── */
  if (status === "ended") return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center gap-4">
      <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
        <PhoneOff className="h-8 w-8 text-white/50" />
      </div>
      <p className="text-white text-xl font-semibold">Session Ended</p>
      <p className="text-slate-400 text-sm">Redirecting to your dashboard…</p>
    </div>
  );

  /* ── Main UI ─────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col">

      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-cyan-400 font-bold text-sm tracking-wide">HealthBridge AI</span>
          <span className="text-white/30">|</span>
          <span className="text-xs text-white/60">Health Screening</span>
          {audioOnly && (
            <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-300 border-amber-500/30">
              <AlertTriangle className="h-3 w-3 mr-1" /> Audio-only Mode
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          {status === "connected" && (
            <span className="flex items-center gap-1.5 text-sm text-white/70">
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              <span className="font-mono">{fmt(elapsed)}</span>
            </span>
          )}
          <NetBadge />
        </div>
      </header>

      {/* Videos */}
      <div className="flex-1 flex flex-col">
        {/* Remote (ASHA) */}
        <div className="relative flex-1 bg-black flex items-center justify-center">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Waiting overlay */}
          {status === "waiting" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0d1117]">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <User className="h-12 w-12 text-cyan-400/50" />
                </div>
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#0d1117] flex items-center justify-center">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                </span>
              </div>
              <div className="text-center">
                <p className="text-white font-semibold">
                  {session?.asha_name || "ASHA Worker"} is starting your session
                </p>
                <p className="text-white/50 text-sm mt-1">Please wait — your call will begin automatically</p>
              </div>
            </div>
          )}

          {status === "connecting" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0d1117]">
              <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
              <p className="text-white/70 text-sm">Connecting to ASHA…</p>
            </div>
          )}

          {status === "connected" && (
            <div className="absolute top-3 left-3">
              <span className="text-xs bg-black/50 text-white px-2 py-1 rounded-md">
                {session?.asha_name || "ASHA Worker"}
              </span>
            </div>
          )}
        </div>

        {/* Local (Patient) video */}
        <div className="relative h-36 sm:h-44 bg-[#161b22] border-t border-white/10 flex items-center justify-center">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-auto max-w-full object-cover"
          />
          {isCamOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#161b22]">
              <VideoOff className="h-8 w-8 text-white/30" />
            </div>
          )}
          <span className="absolute bottom-2 left-3 text-xs bg-black/50 text-white px-2 py-0.5 rounded">
            You
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6 py-4 bg-[#161b22] border-t border-white/10">
          {/* Mute */}
          <button onClick={toggleMute} className="flex flex-col items-center gap-1 group">
            <span className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${isMuted ? "bg-red-600" : "bg-white/10 group-hover:bg-white/20"}`}>
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </span>
            <span className="text-[10px] text-white/50">{isMuted ? "Unmute" : "Mute"}</span>
          </button>

          {/* Camera */}
          <button onClick={toggleCam} className="flex flex-col items-center gap-1 group">
            <span className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${isCamOff ? "bg-red-600" : "bg-white/10 group-hover:bg-white/20"}`}>
              {isCamOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
            </span>
            <span className="text-[10px] text-white/50">{isCamOff ? "Cam On" : "Cam Off"}</span>
          </button>

          {/* Leave */}
          <button onClick={() => endCall(true)} className="flex flex-col items-center gap-1 group">
            <span className="w-14 h-11 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-700 transition-colors">
              <PhoneOff className="h-5 w-5" />
            </span>
            <span className="text-[10px] text-white/50">Leave</span>
          </button>
        </div>
      </div>
    </div>
  );
}
