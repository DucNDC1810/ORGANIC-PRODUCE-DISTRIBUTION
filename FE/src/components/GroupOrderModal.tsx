import { useState } from "react";
import { X, Users } from "lucide-react";

export interface GroupOrderData {
  groupName: string;
  groupMembers: string;
  groupAddress: string;
  groupNotes: string;
}

interface GroupOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: GroupOrderData) => void;
  initialData?: GroupOrderData;
}

const DEFAULT_DATA: GroupOrderData = {
  groupName: "",
  groupMembers: "",
  groupAddress: "",
  groupNotes: "",
};

export default function GroupOrderModal({
  isOpen,
  onClose,
  onConfirm,
  initialData,
}: GroupOrderModalProps) {
  const [data, setData] = useState<GroupOrderData>(
    initialData ?? DEFAULT_DATA
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleConfirm = () => {
    if (!data.groupName.trim()) return;
    onConfirm(data);
    onClose();
  };

  const handleClose = () => {
    // Reset to initial if user cancels without saving
    setData(initialData ?? DEFAULT_DATA);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="relative flex items-center justify-center px-4 py-4 border-b border-gray-100">
          <button
            onClick={handleClose}
            className="absolute left-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
          <h2 className="text-base font-semibold text-gray-900">
            Đặt theo nhóm
          </h2>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Info banner */}
          <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
            <Users className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-green-700">
              Đặt cùng nhóm để được miễn phí giao hàng và thêm nhiều ưu đãi!
            </p>
          </div>

          {/* Group name */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Tên nhóm / cộng đồng <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="groupName"
              value={data.groupName}
              onChange={handleChange}
              placeholder="VD: Chung cư Vinhomes, Công ty ABC…"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 text-sm"
            />
          </div>

          {/* Number of members */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Số thành viên
            </label>
            <input
              type="number"
              name="groupMembers"
              value={data.groupMembers}
              onChange={handleChange}
              placeholder="Số lượng thành viên (tối thiểu 2)"
              min="2"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 text-sm"
            />
          </div>

          {/* Shared address */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Địa chỉ giao hàng chung
            </label>
            <input
              type="text"
              name="groupAddress"
              value={data.groupAddress}
              onChange={handleChange}
              placeholder="Địa chỉ nhận hàng chung của nhóm"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 text-sm"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Ghi chú cho đơn nhóm
            </label>
            <textarea
              name="groupNotes"
              value={data.groupNotes}
              onChange={handleChange}
              placeholder="VD: Chia đều cho từng thành viên, liên hệ trưởng nhóm…"
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 text-sm resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleConfirm}
            disabled={!data.groupName.trim()}
            className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}
