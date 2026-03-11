import { useNavigate, useLocation } from "react-router-dom";
import { ShoppingBag, X, Crown, Users } from "lucide-react";
import { useGroup } from "../context/GroupContext";

export default function GroupSessionBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { groupSession, clearGroupSession } = useGroup();

  if (!groupSession) return null;

  const isOwner = groupSession.role === "owner";

  // Ẩn bar owner khi đang ở trang quản lý nhóm của owner
  if (isOwner && location.pathname === "/group-order/active") return null;
  // Ẩn bar member khi đang ở trang xem giỏ hàng nhóm của member
  if (!isOwner && location.pathname === "/group/members") return null;

  if (isOwner) {
    return (
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
            onClick={clearGroupSession}
            title="Cancel / Exit group"
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-emerald-300 hover:text-white transition-colors flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
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
          onClick={clearGroupSession}
          title="Leave group"
          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white transition-colors flex-shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
