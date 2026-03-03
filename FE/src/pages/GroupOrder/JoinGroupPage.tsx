import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Users, CheckCircle, Loader2, ShoppingBag } from "lucide-react";
import { groupService, type Group } from "../../services/groupService";
import { useGroup } from "../../context/GroupContext";

const REDIRECT_SECONDS = 5;

export default function JoinGroupPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate    = useNavigate();
  const { setGroupSession } = useGroup();

  const [group,        setGroup]        = useState<Group | null>(null);
  const [loadingGroup, setLoadingGroup] = useState(true);
  const [groupError,   setGroupError]   = useState("");

  const [tempName, setTempName] = useState("");
  const [joining,  setJoining]  = useState(false);
  const [joined,   setJoined]   = useState(false);
  const [error,    setError]    = useState("");

  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Lấy thông tin nhóm
  useEffect(() => {
    if (!groupId) return;
    groupService
      .getGroup(groupId)
      .then(setGroup)
      .catch(() => setGroupError("Không tìm thấy nhóm hoặc nhóm đã đóng."))
      .finally(() => setLoadingGroup(false));
  }, [groupId]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName.trim()) { setError("Vui lòng nhập tên của bạn."); return; }
    if (!groupId || !group) return;

    setJoining(true);
    setError("");
    try {
      const member = await groupService.joinGroup(groupId, { tempName: tempName.trim() });
      // Lưu group session vào Context + localStorage (bao gồm memberId và displayName)
      setGroupSession({
        groupId,
        groupName: group.groupName,
        memberId: member._id,
        displayName: tempName.trim(),
      });
      setJoined(true);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setJoining(false);
    }
  };

  // Đếm ngược + tự động chuyển hướng sau khi join thành công
  useEffect(() => {
    if (!joined) return;
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          navigate("/products");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [joined, navigate]);

  // ── Loading group info ─────────────────────────────────────────────────────
  if (loadingGroup) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    );
  }

  // ── Group not found ────────────────────────────────────────────────────────
  if (groupError || !group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 mb-2">Nhóm không tồn tại</h2>
          <p className="text-sm text-gray-500">{groupError}</p>
        </div>
      </div>
    );
  }

  // ── Joined successfully ────────────────────────────────────────────────────
  if (joined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Đã tham gia nhóm!</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Bạn đã được thêm vào nhóm{" "}
            <span className="font-bold text-gray-700">"{group.groupName}"</span>.{" "}
            Chủ nhóm sẽ thấy tên bạn trong danh sách thành viên.
          </p>

          {/* Nút hành động chính */}
          <button
            onClick={() => { if (timerRef.current) clearInterval(timerRef.current); navigate("/products"); }}
            className="mt-6 w-full py-3.5 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold text-base hover:from-green-700 hover:to-emerald-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <ShoppingBag className="w-5 h-5" />
            Bắt đầu chọn món ngay
          </button>

          {/* Thông báo đếm ngược */}
          <p className="mt-3 text-xs text-gray-400">
            Đang chuyển bạn đến menu sau{" "}
            <span className="font-semibold text-green-600">{countdown}</span> giây...
          </p>
        </div>
      </div>
    );
  }

  // ── Join form ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-green-600 to-emerald-500 px-8 py-8 text-center">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
            <Users className="w-7 h-7 text-white" />
          </div>
          <p className="text-green-100 text-xs font-medium mb-1">Bạn được mời tham gia nhóm</p>
          <h1 className="text-xl font-extrabold text-white leading-tight">
            {group.groupName}
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleJoin} className="px-8 py-8 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tên của bạn
            </label>
            <input
              autoFocus
              type="text"
              placeholder="Nhập tên để tham gia..."
              value={tempName}
              onChange={(e) => { setTempName(e.target.value); setError(""); }}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400 transition-all"
              maxLength={50}
            />
            {error && (
              <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={joining || !tempName.trim()}
            className="w-full py-3.5 rounded-2xl bg-green-600 text-white font-bold text-base hover:bg-green-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {joining ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Đang tham gia...</>
            ) : (
              "Tham gia nhóm →"
            )}
          </button>
          <p className="text-center text-xs text-gray-400">
            Bạn không cần tài khoản để tham gia nhóm này.
          </p>
        </form>
      </div>
    </div>
  );
}
