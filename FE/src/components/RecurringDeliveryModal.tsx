import { useState, useMemo } from "react";
import { X, Calendar, Truck } from "lucide-react";
import {
  getFirstDeliveryDate,
  getFirstMonthlyDeliveryDate,
  isSameDeliveryDay,
  formatDateVN,
} from "../utils/deliveryDate";

export interface RecurringData {
  recurringFrequency: "weekly" | "biweekly" | "monthly";
  recurringDay: string;
  recurringStartDate: string;
  recurringDuration: string;
  /** Ngày nhận hàng đầu tiên thực tế – dùng cho nextDeliveryDate trong DB. */
  firstDeliveryDate?: string;
}

interface RecurringDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: RecurringData) => void;
  initialData?: RecurringData;
}

const DEFAULT_DATA: RecurringData = {
  recurringFrequency: "weekly",
  recurringDay: "monday",
  recurringStartDate: "",
  recurringDuration: "3",
};

const FREQUENCY_LABELS: Record<string, string> = {
  weekly: "Hàng tuần",
  biweekly: "2 tuần / lần",
  monthly: "Hàng tháng",
};

const DAY_LABELS: Record<string, string> = {
  monday: "Thứ Hai",
  tuesday: "Thứ Ba",
  wednesday: "Thứ Tư",
  thursday: "Thứ Năm",
  friday: "Thứ Sáu",
  saturday: "Thứ Bảy",
  sunday: "Chủ Nhật",
};

const DURATION_LABELS: Record<string, string> = {
  "1": "1 tháng",
  "3": "3 tháng",
  "6": "6 tháng",
  "12": "12 tháng",
  unlimited: "Không giới hạn",
};

export { FREQUENCY_LABELS, DAY_LABELS, DURATION_LABELS };

export default function RecurringDeliveryModal({
  isOpen,
  onClose,
  onConfirm,
  initialData,
}: RecurringDeliveryModalProps) {
  const [data, setData] = useState<RecurringData>(
    initialData ?? DEFAULT_DATA
  );
  /** Trường hợp đặc biệt: startDate trùng với deliveryDay → cho chọn hôm nay hay tuần sau */
  const [sameDayChoice, setSameDayChoice] = useState<"today" | "next_week">("today");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setData((prev) => {
      // When switching frequency type, reset recurringDay to a sensible default
      if (name === "recurringFrequency") {
        const switchingToMonthly = value === "monthly";
        const wasMonthly = prev.recurringFrequency === "monthly";
        if (switchingToMonthly !== wasMonthly) {
          return {
            ...prev,
            [name]: value as RecurringData["recurringFrequency"],
            recurringDay: switchingToMonthly ? "15" : "monday",
          };
        }
      }
      return { ...prev, [name]: value };
    });
    // Reset choice khi đổi ngày bắt đầu hoặc thứ giao
    if (name === "recurringStartDate" || name === "recurringDay") {
      setSameDayChoice("today");
    }
  };

  /**
   * Tính ngày nhận hàng đầu tiên thực tế (real-time, reactive).
   * – weekly/biweekly: tìm thứ gần nhất >= startDate
   * – monthly: tìm ngày trong tháng gần nhất >= startDate
   */
  const firstDelivery = useMemo((): Date | null => {
    if (!data.recurringStartDate) return null;
    const start = new Date(data.recurringStartDate);
    if (isNaN(start.getTime())) return null;

    if (data.recurringFrequency === "monthly") {
      const dom = parseInt(data.recurringDay);
      return getFirstMonthlyDeliveryDate(start, dom);
    }
    // weekly / biweekly
    const skipToNextWeek = sameDayChoice === "next_week";
    return getFirstDeliveryDate(start, data.recurringDay, skipToNextWeek);
  }, [data.recurringStartDate, data.recurringDay, data.recurringFrequency, sameDayChoice]);

  /** Kiểm tra trường hợp đặc biệt: ngày bắt đầu trùng với thứ giao */
  const isEdgeCase = useMemo(() => {
    if (!data.recurringStartDate || data.recurringFrequency === "monthly") return false;
    const start = new Date(data.recurringStartDate);
    if (isNaN(start.getTime())) return false;
    return isSameDeliveryDay(start, data.recurringDay);
  }, [data.recurringStartDate, data.recurringDay, data.recurringFrequency]);

  const handleConfirm = () => {
    if (!data.recurringStartDate || !firstDelivery) return;
    onConfirm({
      ...data,
      firstDeliveryDate: firstDelivery.toISOString(),
    });
    onClose();
  };

  const handleClose = () => {
    setData(initialData ?? DEFAULT_DATA);
    setSameDayChoice("today");
    onClose();
  };

  const todayStr = new Date().toISOString().split("T")[0];

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
            Đặt hẹn giao định kỳ
          </h2>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Info banner */}
          <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <Calendar className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              Lên lịch giao hàng định kỳ để tiết kiệm thời gian và nhận ưu đãi
              giảm <strong>5%</strong> mỗi đơn!
            </p>
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Tần suất giao hàng
            </label>
            <select
              name="recurringFrequency"
              value={data.recurringFrequency}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 text-sm appearance-none bg-white"
            >
              <option value="weekly">Hàng tuần</option>
              <option value="biweekly">Mỗi 2 tuần</option>
              <option value="monthly">Hàng tháng</option>
            </select>
          </div>

          {/* Day + Duration side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {data.recurringFrequency === "monthly" ? "Ngày trong tháng" : "Thứ trong tuần"}
              </label>
              {data.recurringFrequency === "monthly" ? (
                <select
                  name="recurringDay"
                  value={data.recurringDay}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 text-sm appearance-none bg-white"
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={String(d)}>
                      Ngày {d}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  name="recurringDay"
                  value={data.recurringDay}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 text-sm appearance-none bg-white"
                >
                  <option value="monday">Thứ Hai</option>
                  <option value="tuesday">Thứ Ba</option>
                  <option value="wednesday">Thứ Tư</option>
                  <option value="thursday">Thứ Năm</option>
                  <option value="friday">Thứ Sáu</option>
                  <option value="saturday">Thứ Bảy</option>
                  <option value="sunday">Chủ Nhật</option>
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Thời gian duy trì
              </label>
              <select
                name="recurringDuration"
                value={data.recurringDuration}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 text-sm appearance-none bg-white"
              >
                <option value="1">1 tháng</option>
                <option value="3">3 tháng</option>
                <option value="6">6 tháng</option>
                <option value="12">12 tháng</option>
                <option value="unlimited">Không giới hạn</option>
              </select>
            </div>
          </div>

          {/* Start date */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Ngày bắt đầu <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="recurringStartDate"
              value={data.recurringStartDate}
              onChange={handleChange}
              min={todayStr}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 text-sm"
            />
          </div>

          {/* Edge-case: startDate == deliveryDay → cho chọn hôm nay hay tuần sau */}
          {isEdgeCase && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <p className="text-xs font-semibold text-amber-800">
                Ngày bắt đầu bạn chọn đúng vào{" "}
                {DAY_LABELS[data.recurringDay]} — bạn muốn:
              </p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="sameDayChoice"
                  value="today"
                  checked={sameDayChoice === "today"}
                  onChange={() => setSameDayChoice("today")}
                  className="accent-green-600"
                />
                <span className="text-xs text-amber-900 font-medium">
                  Giao ngay hôm nay ({data.recurringStartDate.split("-").reverse().join("/")})
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="sameDayChoice"
                  value="next_week"
                  checked={sameDayChoice === "next_week"}
                  onChange={() => setSameDayChoice("next_week")}
                  className="accent-green-600"
                />
                <span className="text-xs text-amber-900 font-medium">
                  Bắt đầu từ {DAY_LABELS[data.recurringDay]} tuần sau
                </span>
              </label>
            </div>
          )}

          {/* Ngày nhận hàng đầu tiên – hiển thị real-time */}
          {firstDelivery && (
            <div className="flex items-center gap-2.5 p-3 bg-green-50 border border-green-200 rounded-xl">
              <Truck className="w-4 h-4 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-800">
                Ngày nhận hàng đầu tiên:{" "}
                <span className="font-bold">{formatDateVN(firstDelivery)}</span>
              </p>
            </div>
          )}

          {/* Live summary */}
          {data.recurringStartDate && (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-xs font-medium text-gray-700 mb-1">
                Tóm tắt lịch giao hàng:
              </p>
              <p className="text-xs text-gray-600 leading-relaxed">
                Giao{" "}
                <span className="font-semibold text-gray-900">
                  {FREQUENCY_LABELS[data.recurringFrequency]}
                </span>{" "}
                {data.recurringFrequency === "monthly" ? (
                  <>
                    vào{" "}
                    <span className="font-semibold text-gray-900">
                      ngày {data.recurringDay} hàng tháng
                    </span>
                  </>
                ) : (
                  <>
                    vào{" "}
                    <span className="font-semibold text-gray-900">
                      {DAY_LABELS[data.recurringDay]}
                    </span>
                  </>
                )}
                , trong{" "}
                <span className="font-semibold text-gray-900">
                  {DURATION_LABELS[data.recurringDuration]}
                </span>
                .
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleConfirm}
            disabled={!data.recurringStartDate}
            className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}
