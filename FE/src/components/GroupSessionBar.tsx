import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ShoppingBag, X, Crown, Users, AlertTriangle, Loader2 } from "lucide-react";
import { useGroup } from "../context/GroupContext";
import { groupService } from "../services/groupService";
import { toast } from "sonner";
import { io } from "socket.io-client";

export default function GroupSessionBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { groupSession, clearGroupSession } = useGroup();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── Listen for group:deleted / group:order_placed from owner, even when browsing other pages
  useEffect(() => {
    if (!groupSession) return;
    const socketUrl =
      (import.meta.env.VITE_API_URL as string)?.replace("/api", "") ||
      "http://localhost:5000";
    const socket = io(socketUrl, { transports: ["websocket", "polling"] });
    socket.emit("join-group-room", groupSession.groupId);

    socket.on("group:deleted", () => {
      clearGroupSession();
      toast.info("The group order has been cancelled by the owner.");
    });

    socket.on("group:order_placed", () => {
      clearGroupSession();
    });

    return () => { socket.disconnect(); };
  }, [groupSession?.groupId]);

  if (!groupSession) return null;

  const isOwner = groupSession.role === "owner";

  // Ẩn bar owner khi đang ở trang quản lý nhóm của owner
  if (isOwner && location.pathname === "/group-order/active") return null;
  // Ẩn bar member khi đang ở trang xem giỏ hàng nhóm của member
  if (!isOwner && location.pathname === "/group/members") return null;

  const handleClose = async () => {
    setLoading(true);
    try {
      if (isOwner) {
        await groupService.cancelGroup(groupSession.groupId);
        toast.success("Group order cancelled.");
      } else if (groupSession.memberId) {
        await groupService.leaveGroup(groupSession.groupId, groupSession.memberId);
        toast.success("You have left the group.");
      }
    } catch {
      // Vẫn clear local session kể cả khi API lỗi (group đã kết thúc)
    } finally {
      clearGroupSession();
      setLoading(false);
      setShowConfirm(false);
    }
  };

  const confirmModal = (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !loading && setShowConfirm(false)} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <h3 className="text-base font-bold text-gray-900">
            {isOwner ? "Cancel group order?" : "Leave group?"}
          </h3>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          {isOwner
            ? "This will cancel the entire group order and all members will be notified."
            : "You will leave the group and your selected items will be removed."}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowConfirm(false)}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Keep it
          </button>
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isOwner ? "Cancel group" : "Leave"}
          </button>
        </div>
      </div>
    </div>
  );

  if (isOwner) {
    return (
      <>
        {showConfirm && confirmModal}
        <div className="fixed bottom-0 inset-x-0 z-50 flex justify-center px-4 pb-4 pointer-events-none">
          <div className="w-full max-w-2xl bg-emerald-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl px-5 py-3.5 flex items-center gap-3 pointer-events-auto border border-emerald-500/30">
            <div className="flex-1 min-w-0 flex items-center gap-2.5">
              <Crown className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-emerald-300 leading-none mb-0.5">You are organizing a group event.</p>
                <p className="text-sm font-bold text-white truncate">{groupSession.groupName}</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/group-order/active")}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition-colors flex-shrink-0"
            >
              <Users className="w-3.5 h-3.5" />
              Group Management
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              title="Cancel group order"
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-emerald-300 hover:text-white transition-colors flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {showConfirm && confirmModal}
      <div className="fixed bottom-0 inset-x-0 z-50 flex justify-center px-4 pb-4 pointer-events-none">
        <div className="w-full max-w-2xl bg-gray-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl px-5 py-3.5 flex items-center gap-3 pointer-events-auto border border-white/10">
          <div className="flex-1 min-w-0 flex items-center gap-2.5">
            <span className="text-base flex-shrink-0">📦</span>
            <div className="min-w-0">
              <p className="text-xs text-gray-400 leading-none mb-0.5">You are ordering with a group</p>
              <p className="text-sm font-bold text-white truncate">{groupSession.groupName}</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/group/members")}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-green-500 hover:bg-green-400 text-white text-xs font-bold transition-colors flex-shrink-0"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            View Group Cart
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            title="Leave group"
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white transition-colors flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  );
}
