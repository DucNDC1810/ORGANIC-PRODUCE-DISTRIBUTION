import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  ShoppingBag,
  CheckCircle2,
  Clock,
  RefreshCw,
  Crown,
  LogOut,
} from "lucide-react";
import { io } from "socket.io-client";
import { groupService, type Group, type GroupMember } from "../../services/groupService";
import { useGroup } from "../../context/GroupContext";

// ── Helpers ───────────────────────────────────────────────────────────────────
const AVATARS = ["🧑‍🌾", "👩‍🍳", "🧑‍💼", "👩‍🌾", "👨‍🍳", "🧑‍🦱", "👩‍🦰", "🧑‍🦳"];

function getMemberName(m: GroupMember): string {
  return m.userId?.name || m.tempName || "Khách";
}
function getAvatar(idx: number): string {
  return AVATARS[idx % AVATARS.length];
}

// ─────────────────────────────────────────────────────────────────────────────

export default function GroupMemberPage() {
  const navigate = useNavigate();
  const { groupSession, clearGroupSession } = useGroup();

  const [group,   setGroup]   = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const groupId     = groupSession?.groupId;
  const displayName = groupSession?.displayName;
  const memberId    = groupSession?.memberId;

  // ── Fetch group + members ─────────────────────────────────────────────────
  useEffect(() => {
    if (!groupId) { setError("Không tìm thấy phiên nhóm."); setLoading(false); return; }

    Promise.all([
      groupService.getGroup(groupId),
      groupService.getMembers(groupId),
    ])
      .then(([g, m]) => { setGroup(g); setMembers(m); })
      .catch(() => setError("Không tải được thông tin nhóm."))
      .finally(() => setLoading(false));
  }, [groupId]);

  // ── Socket.io realtime ────────────────────────────────────────────────────
  useEffect(() => {
    if (!groupId) return;
    const socketUrl =
      (import.meta.env.VITE_API_URL as string)?.replace("/api", "") ||
      "http://localhost:5000";
    const socket = io(socketUrl, { transports: ["websocket", "polling"] });
    socket.emit("join-group-room", groupId);
    socket.on("member:joined", (m: GroupMember) =>
      setMembers((prev) => (prev.find((x) => x._id === m._id) ? prev : [...prev, m]))
    );
    socket.on("member:updated", (m: GroupMember) =>
      setMembers((prev) => prev.map((x) => (x._id === m._id ? m : x)))
    );
    return () => { socket.disconnect(); };
  }, [groupId]);

  const handleLeave = () => {
    clearGroupSession();
    navigate("/products");
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-7 h-7 text-green-500 animate-spin" />
      </div>
    );
  }

  // ── Error / no session ────────────────────────────────────────────────────
  if (error || !groupSession || !group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-sm w-full text-center space-y-4">
          <Users className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-gray-500 text-sm">{error || "Bạn chưa tham gia nhóm nào."}</p>
          <button
            onClick={() => navigate("/products")}
            className="w-full py-3 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-colors"
          >
            Về trang sản phẩm
          </button>
        </div>
      </div>
    );
  }

  const readyCount = members.filter((m) => m.isReady).length;
  const allReady   = members.length > 0 && readyCount === members.length;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header bar ── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/products")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Chọn món
          </button>
          <div className="h-5 w-px bg-gray-200" />
          <span className="text-sm font-bold text-gray-900 truncate flex-1">
            {group.groupName}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Đang mở
          </span>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-5">

        {/* ── Identity card ── */}
        <div className="bg-gradient-to-br from-green-600 to-emerald-500 rounded-2xl px-6 py-5 text-white shadow-lg">
          <p className="text-green-100 text-xs font-medium mb-1">Bạn đang đặt đơn cùng nhóm</p>
          <h1 className="text-xl font-extrabold leading-snug">{group.groupName}</h1>
          {displayName && (
            <div className="mt-3 inline-flex items-center gap-2 bg-white/20 rounded-xl px-3 py-1.5">
              <span className="text-lg">{AVATARS[0]}</span>
              <span className="text-sm font-semibold">{displayName}</span>
              <span className="text-xs text-green-100">(bạn)</span>
            </div>
          )}
        </div>

        {/* ── CTA: chọn món ── */}
        <button
          onClick={() => navigate("/products")}
          className="w-full py-4 rounded-2xl bg-green-600 text-white font-extrabold text-base hover:bg-green-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 shadow-md"
        >
          <ShoppingBag className="w-5 h-5" />
          Tiếp tục chọn món
        </button>

        {/* ── Member list ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-green-600" />
              Thành viên nhóm
            </h2>
            <span className="text-xs text-gray-400">
              {readyCount}/{members.length} đã chọn xong
            </span>
          </div>

          {members.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              Chưa có thành viên nào
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {members.map((m, idx) => {
                const name    = getMemberName(m);
                const isMe    = m._id === memberId;
                const isOwner = m.role === "owner";
                return (
                  <li
                    key={m._id}
                    className={`flex items-center gap-3 px-5 py-3.5 ${isMe ? "bg-green-50" : ""}`}
                  >
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">
                      {getAvatar(idx)}
                    </div>

                    {/* Name + badges */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-sm font-semibold truncate ${isMe ? "text-green-700" : "text-gray-900"}`}>
                          {name}
                        </span>
                        {isMe && (
                          <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5 font-medium">
                            bạn
                          </span>
                        )}
                        {isOwner && (
                          <Crown className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {isOwner ? "Chủ nhóm" : "Thành viên"}
                      </p>
                    </div>

                    {/* Status */}
                    {m.isReady ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <Clock className="w-5 h-5 text-gray-300 flex-shrink-0" />
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {/* Progress footer */}
          {allReady && (
            <div className="px-5 py-3 bg-green-50 border-t border-green-100 text-center text-xs text-green-700 font-semibold">
              🎉 Mọi người đã chọn xong món!
            </div>
          )}
        </div>

        {/* ── Leave group ── */}
        <button
          onClick={handleLeave}
          className="w-full py-3 rounded-2xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Rời khỏi nhóm
        </button>

      </div>
    </div>
  );
}
