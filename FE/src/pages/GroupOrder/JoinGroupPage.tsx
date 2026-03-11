import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Users, CheckCircle, Loader2, ShoppingBag, LogIn } from "lucide-react";
import { groupService, type Group } from "../../services/groupService";
import { useGroup } from "../../context/GroupContext";
import { useAuth } from "../../context/AuthContext";

const REDIRECT_SECONDS = 5;
const STORAGE_KEY = "redirectAfterLogin";

export default function JoinGroupPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { setGroupSession } = useGroup();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [loadingGroup, setLoadingGroup] = useState(true);
  const [groupError, setGroupError] = useState("");

  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState("");

  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Bước 1: Kiểm tra xác thực – nếu chưa đăng nhập, lưu URL rồi chuyển về /login ──
  useEffect(() => {
    if (authLoading) return; // chờ AuthContext khởi tạo xong
    if (!isAuthenticated) {
      // Lưu URL hiện tại vào sessionStorage để LoginPage có thể redirect lại sau khi đăng nhập
      sessionStorage.setItem(STORAGE_KEY, `/join-group/${groupId}`);
      navigate("/login", { replace: true });
    }
  }, [authLoading, isAuthenticated, groupId, navigate]);

  // ── Bước 2: Lấy thông tin nhóm (chỉ khi đã đăng nhập) ──────────────────────
  useEffect(() => {
    if (!groupId || !isAuthenticated) return;
    groupService
      .getGroup(groupId)
      .then(setGroup)
      .catch(() => setGroupError("Group not found or already closed."))
      .finally(() => setLoadingGroup(false));
  }, [groupId, isAuthenticated]);

  // ── Bước 3: Xử lý tham gia nhóm ──────────────────────────────────────────────
  const handleJoin = async () => {
    if (!groupId || !group || !user) return;
    setJoining(true);
    setError("");
    try {
      // Gọi API tham gia nhóm – không cần tempName vì đã đăng nhập
      const member = await groupService.joinGroup(groupId);
      // Lưu session nhóm vào Context & localStorage, dùng tên tài khoản thực
      setGroupSession({
        groupId,
        groupName: group.groupName,
        role: 'member',
        memberId: member._id,
        displayName: user.name,
      });
      setJoined(true);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "An error occurred. Please try again.");
    } finally {
      setJoining(false);
    }
  };

  // ── Đếm ngược & tự động chuyển hướng sau khi join thành công ─────────────────
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

  // ── Loading: AuthContext đang khởi tạo ────────────────────────────────────────
  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    );
  }

  // ── Loading thông tin nhóm ────────────────────────────────────────────────────
  if (loadingGroup) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    );
  }

  // ── Nhóm không tồn tại ────────────────────────────────────────────────────────
  if (groupError || !group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 mb-2">Group not found</h2>
          <p className="text-sm text-gray-500">{groupError}</p>
        </div>
      </div>
    );
  }

  // ── Đã tham gia thành công ────────────────────────────────────────────────────
  if (joined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">You've joined the group!</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            You (<span className="font-bold text-gray-700">{user?.name}</span>) have been added to the group{" "}
            <span className="font-bold text-gray-700">"{group.groupName}"</span>.{" "}
            The group owner will see your name in the members list.
          </p>

          {/* Nút hành động chính */}
          <button
            onClick={() => { if (timerRef.current) clearInterval(timerRef.current); navigate("/products"); }}
            className="mt-6 w-full py-3.5 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold text-base hover:from-green-700 hover:to-emerald-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <ShoppingBag className="w-5 h-5" />
            Start selecting items
          </button>

          {/* Thông báo đếm ngược */}
          <p className="mt-3 text-xs text-gray-400">
            Redirecting to menu in{" "}
            <span className="font-semibold text-green-600">{countdown}</span> seconds...
          </p>
        </div>
      </div>
    );
  }

  // ── Màn hình xác nhận tham gia (đã đăng nhập) ────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-green-600 to-emerald-500 px-8 py-8 text-center">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
            <Users className="w-7 h-7 text-white" />
          </div>
          <p className="text-green-100 text-xs font-medium mb-1">You're invited to join</p>
          <h1 className="text-xl font-extrabold text-white leading-tight">
            {group.groupName}
          </h1>
        </div>

        {/* User info + join button */}
        <div className="px-8 py-8 space-y-5">
          {/* Hiển thị tên tài khoản đang đăng nhập */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-green-50 border border-green-100">
            <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium">Joining as</p>
              <p className="text-sm font-bold text-gray-800 truncate">{user?.name}</p>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 font-medium text-center">{error}</p>
          )}

          <button
            onClick={handleJoin}
            disabled={joining}
            className="w-full py-3.5 rounded-2xl bg-green-600 text-white font-bold text-base hover:bg-green-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {joining ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Joining...</>
            ) : (
              <><LogIn className="w-4 h-4" /> Join Group →</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
