"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { SOCKET_URL } from "@/lib/config";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  Copy, CheckCheck, Wifi, WifiOff, AlertTriangle,
  User, Activity, Thermometer, Heart, BarChart2,
  Loader2, Clock
} from "lucide-react";

/* ── ICE servers (Google STUN + Free TURN relay) ─────────────── */
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

/* ── helpers ────────────────────────────────────────────────── */
const fmt = (s) => {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
};

const riskVariant = { High: "destructive", Medium: "default", Low: "secondary" };

export default function ScreeningRoomPage() {
  useAuthGuard("asha");
  const { sessionId } = useParams();
  const router = useRouter();
  const { toast } = useToast();

  /* ── session info ─────────────────────────────────────────── */
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  /* ── WebRTC state ─────────────────────────────────────────── */
  const localVideoRef  = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef          = useRef(null);
  const socketRef      = useRef(null);
  const localStreamRef = useRef(null);
  const startTimeRef   = useRef(null);

  const [peerConnected, setPeerConnected] = useState(false);
  const [audioOnly, setAudioOnly]         = useState(false);
  const [netQuality, setNetQuality]       = useState("good"); // good | fair | poor
  const [isMuted, setIsMuted]             = useState(false);
  const [isCamOff, setIsCamOff]           = useState(false);
  const [elapsed, setElapsed]             = useState(0);
  const [callActive, setCallActive]       = useState(false);
  const [callEnded, setCallEnded]         = useState(false);

  /* ── notes ────────────────────────────────────────────────── */
  const [notes, setNotes] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem(`screening-notes-${sessionId}`) || ""
      : ""
  );

  /* ── share link ───────────────────────────────────────────── */
  const [copied, setCopied] = useState(false);
  const joinLink = typeof window !== "undefined"
    ? `${window.location.origin}/screening/${sessionId}/join`
    : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(joinLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  /* ── fetch session info ───────────────────────────────────── */
  useEffect(() => {
    fetch(`/api/screening/${sessionId}`, { credentials: "include" })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => setSession(data))
      .catch(() => toast({ variant: "destructive", title: "Session not found" }))
      .finally(() => setLoadingSession(false));
  }, [sessionId]); // eslint-disable-line

  /* ── timer ────────────────────────────────────────────────── */
  useEffect(() => {
    if (!callActive) return;
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [callActive]);

  /* ── notes auto-save ──────────────────────────────────────── */
  useEffect(() => {
    localStorage.setItem(`screening-notes-${sessionId}`, notes);
  }, [notes, sessionId]);

  /* ── WebRTC + Socket.IO ───────────────────────────────────── */
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
        setPeerConnected(true);
        setCallActive(true);
        if (!startTimeRef.current) {
          startTimeRef.current = Date.now();
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
        if (state === "failed") {
          console.warn("Connection failed. Attempting ICE restart...");
          pc.createOffer({ iceRestart: true })
            .then(offer => pc.setLocalDescription(offer).then(() => {
              socketRef.current?.emit("offer", { roomId: session.room_id, sdp: offer });
            }))
            .catch(console.error);
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log("ICE Connection State changed:", pc.iceConnectionState);
      };

      // Network quality via stats
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

      // Socket.IO bypassing proxy
      const socket = io(SOCKET_URL, { path: "/socket.io", withCredentials: true });
      socketRef.current = socket;

      socket.on("connect", () => {
        socket.emit("join-room", { roomId: session.room_id, role: "asha" });
      });

      // When patient joins, ASHA makes the offer
      socket.on("peer-joined", async ({ role }) => {
        if (role !== "patient" || isNegotiating) return;
        isNegotiating = true;
        try {
          if (pc.signalingState !== "stable") return;
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("offer", { roomId: session.room_id, sdp: offer });
        } catch (e) {
          console.error("Error creating offer:", e);
        } finally {
          isNegotiating = false;
        }
      });

      socket.on("answer", async ({ sdp }) => {
        try {
          if (pc.signalingState === "stable") {
             console.warn("Received answer while stable, ignoring duplicate.");
             return;
          }
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          for (const c of pendingCandidates) {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          }
          pendingCandidates = [];
        } catch (e) {
          console.error("Error setting remote description:", e);
        }
      });

      socket.on("ice-candidate", async ({ candidate }) => {
        try {
          if (pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } else {
            pendingCandidates.push(candidate);
          }
        } catch (e) {
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

  /* ── cleanup ──────────────────────────────────────────────── */
  const cleanup = (notifySocket = true) => {
    clearInterval(pcRef.current?._qualityInterval);
    pcRef.current?.close();
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    if (notifySocket) {
      socketRef.current?.emit("call-ended", { roomId: session?.room_id });
    }
    socketRef.current?.disconnect();
  };

  /* ── end call ─────────────────────────────────────────────── */
  const endCall = useCallback(async (notify = true) => {
    setCallEnded(true);
    const dur = startTimeRef.current
      ? Math.floor((Date.now() - startTimeRef.current) / 1000)
      : elapsed;

    cleanup(notify);

    try {
      await fetch(`/api/screening/${sessionId}/end`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, durationSeconds: dur }),
      });
      localStorage.removeItem(`screening-notes-${sessionId}`);
    } catch {}

    toast({ title: "Call ended", description: `Duration: ${fmt(dur)}` });
    setTimeout(() => { window.location.href = "/asha/dashboard"; }, 2000);
  }, [sessionId, notes, elapsed, router, toast]); // eslint-disable-line

  /* ── controls ─────────────────────────────────────────────── */
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

  /* ── loading / ended states ───────────────────────────────── */
  if (loadingSession) return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
    </div>
  );

  if (callEnded) return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center gap-4">
      <CheckCheck className="h-12 w-12 text-emerald-400" />
      <p className="text-white text-xl font-semibold">Call Ended</p>
      <p className="text-slate-400 text-sm">Redirecting to dashboard…</p>
    </div>
  );

  /* ── main UI ──────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col">

      {/* ── Top Bar ── */}
      <header className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-cyan-400 font-bold text-sm tracking-wide">HealthBridge AI</span>
          <span className="text-white/30">|</span>
          <span className="text-xs text-white/60">Screening Room</span>
          {audioOnly && (
            <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-300 border-amber-500/30">
              <AlertTriangle className="h-3 w-3 mr-1" /> Audio-only Mode
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          {callActive && (
            <span className="flex items-center gap-1.5 text-sm text-white/70">
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              <span className="font-mono">{fmt(elapsed)}</span>
            </span>
          )}
          <NetBadge />
          {!peerConnected && (
            <span className="text-xs text-amber-400 animate-pulse">Waiting for patient…</span>
          )}
        </div>
      </header>

      {/* ── Main Content ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Video Area ── */}
        <div className="flex-1 flex flex-col">
          {/* Remote (patient) video */}
          <div className="relative flex-1 bg-black flex items-center justify-center">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {!peerConnected && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <User className="h-10 w-10 text-white/30" />
                </div>
                <p className="text-white/40 text-sm">
                  {session?.patient_name || "Patient"} hasn&apos;t joined yet
                </p>
                <Loader2 className="h-5 w-5 animate-spin text-cyan-500" />
              </div>
            )}
            {peerConnected && (
              <div className="absolute top-3 left-3">
                <span className="text-xs bg-black/50 text-white px-2 py-1 rounded-md">
                  {session?.patient_name || "Patient"}
                </span>
              </div>
            )}
          </div>

          {/* Local (ASHA) video — PiP */}
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
              You (ASHA)
            </span>
          </div>

          {/* ── Call Controls ── */}
          <div className="flex items-center justify-center gap-4 py-4 bg-[#161b22] border-t border-white/10">
            {/* Share Link */}
            <button
              onClick={handleCopy}
              className="flex flex-col items-center gap-1 group"
              title="Copy join link"
            >
              <span className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${copied ? "bg-emerald-600" : "bg-white/10 group-hover:bg-white/20"}`}>
                {copied ? <CheckCheck className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              </span>
              <span className="text-[10px] text-white/50">{copied ? "Copied!" : "Share"}</span>
            </button>

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

            {/* End Call */}
            <button onClick={() => endCall(true)} className="flex flex-col items-center gap-1 group">
              <span className="w-14 h-11 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-700 transition-colors">
                <PhoneOff className="h-5 w-5" />
              </span>
              <span className="text-[10px] text-white/50">End Call</span>
            </button>
          </div>
        </div>

        {/* ── Side Panel ── */}
        <aside className="hidden lg:flex w-80 xl:w-96 flex-col border-l border-white/10 bg-[#161b22]">

          {/* Patient info */}
          <div className="p-4 border-b border-white/10">
            <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">Patient</p>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <User className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <p className="font-semibold text-sm">{session?.patient_name || "—"}</p>
                <p className="text-xs text-white/50">{session?.patient_email || "—"}</p>
              </div>
            </div>

            {/* Vitals */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {session?.temperature && (
                <div className="p-2 rounded-lg bg-white/5 flex items-center gap-1.5">
                  <Thermometer className="h-3.5 w-3.5 text-orange-400" />
                  <span className="text-white/60">Temp:</span>
                  <span>{session.temperature}°F</span>
                </div>
              )}
              {session?.spo2 && (
                <div className="p-2 rounded-lg bg-white/5 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-blue-400" />
                  <span className="text-white/60">SpO2:</span>
                  <span>{session.spo2}%</span>
                </div>
              )}
              {session?.bp && (
                <div className="p-2 rounded-lg bg-white/5 flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5 text-red-400" />
                  <span className="text-white/60">BP:</span>
                  <span>{session.bp}</span>
                </div>
              )}
              {session?.severity && (
                <div className="p-2 rounded-lg bg-white/5 flex items-center gap-1.5">
                  <BarChart2 className="h-3.5 w-3.5 text-violet-400" />
                  <span className="text-white/60">Severity:</span>
                  <span>{session.severity}</span>
                </div>
              )}
            </div>
          </div>

          {/* Latest symptoms */}
          {session?.latest_symptoms && (
            <div className="p-4 border-b border-white/10">
              <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2">Latest Symptoms</p>
              <p className="text-sm text-white/80 italic bg-white/5 rounded-lg p-3 leading-relaxed">
                &ldquo;{session.latest_symptoms}&rdquo;
              </p>
              {session.latest_risk && (
                <div className="mt-2">
                  <Badge variant={riskVariant[session.latest_risk] || "secondary"}>
                    {session.latest_risk} Risk
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="flex-1 flex flex-col p-4">
            <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
              Clinical Notes
              <span className="ml-1 text-white/30 normal-case">(auto-saved)</span>
            </p>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Enter observations, diagnosis, referral notes…"
              className="flex-1 min-h-[140px] bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none focus:border-cyan-500/50 focus:ring-cyan-500/20"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
