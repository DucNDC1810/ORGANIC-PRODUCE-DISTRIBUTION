import { useNavigate } from "react-router-dom";
import { ShoppingBag, X } from "lucide-react";
import { useGroup } from "../context/GroupContext";

export default function GroupSessionBar() {
  const navigate = useNavigate();
  const { groupSession, clearGroupSession } = useGroup();

  if (!groupSession) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 flex justify-center px-4 pb-4 pointer-events-none">
      <div className="w-full max-w-2xl bg-gray-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl px-5 py-3.5 flex items-center gap-3 pointer-events-auto border border-white/10">
        <div className="flex-1 min-w-0 flex items-center gap-2.5">
          <span className="text-base flex-shrink-0">📦</span>
          <div className="min-w-0">
            <p className="text-xs text-gray-400 leading-none mb-0.5">Bạn đang đặt đơn cùng nhóm</p>
            <p className="text-sm font-bold text-white truncate">{groupSession.groupName}</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/group/members")}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-green-500 hover:bg-green-400 text-white text-xs font-bold transition-colors flex-shrink-0"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          Xem giỏ hàng nhóm
        </button>
        <button
          onClick={clearGroupSession}
          title="Rời khỏi nhóm"
          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white transition-colors flex-shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
