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
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
};

const DAY_LABELS: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const DURATION_LABELS: Record<string, string> = {
  "1": "1 month",
  "3": "3 months",
  "6": "6 months",
  "12": "12 months",
  unlimited: "Unlimited",
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
            Schedule Recurring Delivery
          </h2>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Info banner */}
          <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <Calendar className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              Schedule recurring deliveries to save time and get{" "}
              <strong>5%</strong> off every order!
            </p>
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Delivery frequency
            </label>
            <select
              name="recurringFrequency"
              value={data.recurringFrequency}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 text-sm appearance-none bg-white"
            >
              <option value="weekly">Weekly</option>
              <option value="biweekly">Every 2 weeks</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {/* Day + Duration side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {data.recurringFrequency === "monthly" ? "Day of the month" : "Day of the week"}
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
                      Day {d}
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
                  <option value="monday">Monday</option>
                  <option value="tuesday">Tuesday</option>
                  <option value="wednesday">Wednesday</option>
                  <option value="thursday">Thursday</option>
                  <option value="friday">Friday</option>
                  <option value="saturday">Saturday</option>
                  <option value="sunday">Sunday</option>
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Duration
              </label>
              <select
                name="recurringDuration"
                value={data.recurringDuration}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 text-sm appearance-none bg-white"
              >
                <option value="1">1 month</option>
                <option value="3">3 months</option>
                <option value="6">6 months</option>
                <option value="12">12 months</option>
                <option value="unlimited">Unlimited</option>
              </select>
            </div>
          </div>

          {/* Start date */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Start date <span className="text-red-500">*</span>
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
                Your start date falls on a{" "}
                {DAY_LABELS[data.recurringDay]} — would you like to:
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
                  Deliver today ({data.recurringStartDate.split("-").reverse().join("/")})
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
                  Start from next {DAY_LABELS[data.recurringDay]}
                </span>
              </label>
            </div>
          )}

          {/* Ngày nhận hàng đầu tiên – hiển thị real-time */}
          {firstDelivery && (
            <div className="flex items-center gap-2.5 p-3 bg-green-50 border border-green-200 rounded-xl">
              <Truck className="w-4 h-4 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-800">
                First delivery date:{" "}
                <span className="font-bold">{formatDateVN(firstDelivery)}</span>
              </p>
            </div>
          )}

          {/* Live summary */}
          {data.recurringStartDate && (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-xs font-medium text-gray-700 mb-1">
                Delivery schedule summary:
              </p>
              <p className="text-xs text-gray-600 leading-relaxed">
                Deliver{" "}
                <span className="font-semibold text-gray-900">
                  {FREQUENCY_LABELS[data.recurringFrequency]}
                </span>{" "}
                {data.recurringFrequency === "monthly" ? (
                  <>
                    on{" "}
                    <span className="font-semibold text-gray-900">
                      day {data.recurringDay} of each month
                    </span>
                  </>
                ) : (
                  <>
                    on{" "}
                    <span className="font-semibold text-gray-900">
                      {DAY_LABELS[data.recurringDay]}
                    </span>
                  </>
                )}
                , for{" "}
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
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
