import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { groupService } from "../../services/groupService";
import { useAuth } from "../../context/AuthContext";
import { useGroup } from "../../context/GroupContext";
import {
  ArrowLeft,
  Users,
  CreditCard,
  Check,
  Edit3,
} from "lucide-react";
import Header from "../../components/Header";

// ─── Constants ───────────────────────────────────────────────────────────────

const TIERS = [
  { members: 2,  pct: 2  },
  { members: 3,  pct: 4  },
  { members: 5,  pct: 6  },
  { members: 8,  pct: 10 },
];

type PaymentOption = 'owner_only' | 'individual' | 'equal_split';

const PAYMENT_OPTIONS: { value: PaymentOption; label: string; subtitle: string | null; icon: string }[] = [
  { value: 'owner_only',   label: 'You pay for everyone',        subtitle: null,                                                      icon: '💳' },
  { value: 'individual',   label: 'Each person pays for their own items', subtitle: 'Each member pays their own share',                icon: '🧾' },
  { value: 'equal_split',  label: 'Split bill equally for everyone', subtitle: 'Total bill divided equally among all group members',   icon: '⚖️' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function GroupOrderPage() {
  const navigate = useNavigate();
  const location  = useLocation();
  const passedCartItems = (location.state as any)?.cartItems ?? [];
  const { user } = useAuth();
  const { setGroupSession } = useGroup();

  const [groupName,    setGroupName]    = useState(`Order by ${user?.username ?? user?.name ?? "me"}`);
  const [editingName,  setEditingName]  = useState(false);
  const [paymentMode,  setPaymentMode]  = useState<PaymentOption>('owner_only');
  // Payment sheet
  const [showPaySheet,  setShowPaySheet]  = useState(false);
  const [confirming,    setConfirming]    = useState(false);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const group = await groupService.createGroup({
        groupName,
        paymentMethod: paymentMode,
        paymentOption: paymentMode,
        timeLimit: null,
      });
      setGroupSession({
        groupId: group._id,
        groupName,
        role: 'owner',
      });
      navigate("/group-order/active", {
        state: { groupName, cartItems: passedCartItems, groupId: group._id, paymentOption: paymentMode },
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to create group. Please try again.");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* ── Page header bar ── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="h-5 w-px bg-gray-200" />
          <h1 className="text-base font-bold text-gray-900">Group Order</h1>
          <span className="ml-auto text-xs text-gray-400">FreshMarket · {new Date().toLocaleDateString("en-US")}</span>
        </div>
      </div>

      {/* ── Main two-column layout ── */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* ════════════════════════════════
            LEFT COLUMN  (2/3 width)
        ════════════════════════════════ */}
        <div className="lg:col-span-2 space-y-6">

          {/* ── Hero banner card ── */}
          <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <div className="relative bg-gradient-to-br from-green-600 to-emerald-500 px-8 py-8 flex items-center justify-between">
              {/* text */}
              <div className="z-10">
                <p className="text-green-100 text-sm font-medium mb-1">FreshMarket</p>
                <h2 className="text-3xl font-extrabold text-white leading-tight mb-2">
                  Group Order<br />
                  <span className="text-yellow-300">– save more!</span>
                </h2>
                <p className="text-green-100 text-sm max-w-xs leading-relaxed">
                  Invite friends to order together, get up to <span className="font-bold text-white">10%</span> off for the whole group.
                </p>
              </div>
              {/* decorative avatars */}
              <div className="flex items-end gap-2 select-none pointer-events-none">
                {["🧑‍🌾", "👩‍🍳", "🧑‍💼", "👩‍🌾"].map((e, i) => (
                  <span key={i} className="text-5xl drop-shadow-lg" style={{ marginBottom: i % 2 === 1 ? 16 : 0 }}>{e}</span>
                ))}
              </div>
              {/* decorative circles */}
              <div className="absolute top-4 right-40 w-16 h-16 bg-yellow-400/70 rounded-full flex items-center justify-center text-3xl font-black text-white shadow-lg">G</div>
              <div className="absolute top-10 right-28 w-10 h-10 bg-yellow-300/60 rounded-full flex items-center justify-center text-xl font-black text-white shadow">G</div>
            </div>
          </div>

          {/* ── Group name & invite link ── */}
          {/* ── Single setup card ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-5 pb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Group Setup
              </h3>
            </div>

            {/* Group name inline edit */}
            <div className="px-6 pb-4 border-t border-gray-100 pt-4">
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">Group name</label>
              <div className="flex items-center gap-3">
                {editingName ? (
                  <input
                    autoFocus
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    onBlur={() => setEditingName(false)}
                    onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
                    className="flex-1 px-4 py-2.5 border border-green-400 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-300"
                  />
                ) : (
                  <span className="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl text-sm font-semibold text-gray-900 border border-transparent">
                    {groupName}
                  </span>
                )}
                <button
                  onClick={() => setEditingName((v) => !v)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    editingName
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {editingName ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                  {editingName ? "Save" : "Edit"}
                </button>
              </div>
            </div>

            {/* Payment */}
            <SettingCard
              icon={<CreditCard className="w-5 h-5 text-green-600" />}
              label="Bill payment"
              value={PAYMENT_OPTIONS.find(o => o.value === paymentMode)?.label ?? paymentMode}
              onEdit={() => setShowPaySheet(true)}
            />

          </div>

        </div>

        {/* ════════════════════════════════
            RIGHT COLUMN  (1/3 width, sticky)
        ════════════════════════════════ */}
        <div className="lg:col-span-1 space-y-5 lg:sticky lg:top-[72px]">

          {/* ── Discount progress card ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start justify-between mb-1">
              <p className="text-base font-extrabold text-gray-900">Get up to 10% off!</p>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed mb-6">
              Invite more members and make sure everyone orders at least 1 item.
            </p>

            {/* Static roadmap bar */}
            <div className="relative pt-1">
              <div className="relative h-2 bg-gray-200 rounded-full mb-8">
                {/* tier dots */}
                {TIERS.map((tier, i) => {
                  const left = (i / (TIERS.length - 1)) * 100;
                  return (
                    <div
                      key={tier.members}
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
                      style={{ left: `${left}%` }}
                    >
                      <div className="w-4 h-4 rounded-full border-2 bg-white border-gray-300 z-10" />
                      <div className="absolute top-5 flex flex-col items-center">
                        <span className="text-xs font-bold whitespace-nowrap text-gray-500">{tier.pct}%</span>
                        <span className="text-[10px] whitespace-nowrap text-gray-400">{tier.members} members</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Confirm button ── */}
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 text-white text-base font-extrabold shadow-lg hover:from-green-700 hover:to-emerald-600 active:scale-[0.98] transition-all duration-150 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {confirming ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Creating group...
              </>
            ) : "Create Group Order →"}
          </button>
          <p className="text-center text-xs text-gray-400">
            You can invite members after creating the group
          </p>
        </div>
      </div>

      {/* ════════════ PAYMENT SHEET ════════════ */}
      {showPaySheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPaySheet(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 pt-6 pb-2 flex items-center gap-3 border-b border-gray-100">
              <button onClick={() => setShowPaySheet(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <h3 className="text-lg font-bold text-gray-900">Choose payment method</h3>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Choose how the group will pay. You can change this after the group is created.
              </p>
              <div className="space-y-2">
                {PAYMENT_OPTIONS.map((opt) => {
                  const selected = paymentMode === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => { setPaymentMode(opt.value); setShowPaySheet(false); }}
                      className={`w-full flex items-center justify-between py-4 px-4 text-left rounded-2xl border-2 transition-all ${
                        selected
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm text-xl">
                          {opt.icon}
                        </div>
                        <div>
                          <p className={`text-sm ${selected ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{opt.label}</p>
                          {opt.subtitle && <p className="text-xs text-gray-400 mt-0.5">{opt.subtitle}</p>}
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-3 transition-colors ${selected ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}>
                        {selected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              
            
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SettingCard ─────────────────────────────────────────────────────────────

function SettingCard({
  icon,
  label,
  value,
  onEdit,
  valueClass = "text-gray-900",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onEdit: () => void;
  valueClass?: string;
}) {
  return (
    <div className="px-6 py-4 flex items-center gap-4 group hover:bg-gray-50/80 transition-colors cursor-pointer" onClick={onEdit}>
      <div className="w-11 h-11 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className={`text-sm font-bold ${valueClass} truncate`}>{value}</p>
      </div>
      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 group-hover:bg-green-100 group-hover:text-green-700 transition-colors">
        <Edit3 className="w-3.5 h-3.5" />
        Edit
      </button>
    </div>
  );
}
