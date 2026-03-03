import { useState, useMemo } from "react";
import { X } from "lucide-react";

// ─── Data ────────────────────────────────────────────────────────────────────

interface Store {
  id: string;
  name: string;
  address: string;
  province: string;   // tỉnh / TP key
  district: string;   // quận / huyện key
  ward: string;       // phường / xã key
}

interface LocationData {
  [province: string]: {
    label: string;
    districts: {
      [district: string]: {
        label: string;
        wards: { value: string; label: string }[];
      };
    };
  };
}

const LOCATION_DATA: LocationData = {
  hcm: {
    label: "Hồ Chí Minh",
    districts: {
      thuduc: {
        label: "TP Thủ Đức",
        wards: [
          { value: "thaodien", label: "Phường Thảo Điền" },
          { value: "anphu", label: "Phường An Phú" },
          { value: "binhtrung", label: "Phường Bình Trưng Đông" },
          { value: "catlai", label: "Phường Cát Lái" },
          { value: "linh_trung", label: "Phường Linh Trung" },
        ],
      },
      q1: {
        label: "Quận 1",
        wards: [
          { value: "bennghe", label: "Phường Bến Nghé" },
          { value: "benthann", label: "Phường Bến Thành" },
          { value: "dakao", label: "Phường Đa Kao" },
        ],
      },
      q3: {
        label: "Quận 3",
        wards: [
          { value: "vo_thi_sau", label: "Phường Võ Thị Sáu" },
          { value: "nguyen_cu_trinh", label: "Phường Nguyễn Cư Trinh" },
        ],
      },
      q7: {
        label: "Quận 7",
        wards: [
          { value: "tan_phong", label: "Phường Tân Phong" },
          { value: "phu_my", label: "Phường Phú Mỹ" },
          { value: "tan_quy", label: "Phường Tân Quy" },
        ],
      },
      binh_thanh: {
        label: "Quận Bình Thạnh",
        wards: [
          { value: "p25", label: "Phường 25" },
          { value: "p26", label: "Phường 26" },
          { value: "p27", label: "Phường 27" },
        ],
      },
      phu_nhuan: {
        label: "Quận Phú Nhuận",
        wards: [
          { value: "p2_pn", label: "Phường 2" },
          { value: "p7_pn", label: "Phường 7" },
          { value: "p9_pn", label: "Phường 9" },
        ],
      },
    },
  },
  hanoi: {
    label: "Hà Nội",
    districts: {
      hoan_kiem: {
        label: "Quận Hoàn Kiếm",
        wards: [
          { value: "hang_bac", label: "Phường Hàng Bạc" },
          { value: "hang_dao", label: "Phường Hàng Đào" },
        ],
      },
      tay_ho: {
        label: "Quận Tây Hồ",
        wards: [
          { value: "quang_an", label: "Phường Quảng An" },
          { value: "nhat_tan", label: "Phường Nhật Tân" },
        ],
      },
    },
  },
  danang: {
    label: "Đà Nẵng",
    districts: {
      hai_chau: {
        label: "Quận Hải Châu",
        wards: [
          { value: "hai_chau1", label: "Phường Hải Châu 1" },
          { value: "hai_chau2", label: "Phường Hải Châu 2" },
        ],
      },
      son_tra: {
        label: "Quận Sơn Trà",
        wards: [
          { value: "an_hai_bac", label: "Phường An Hải Bắc" },
          { value: "tho_quang", label: "Phường Thọ Quang" },
        ],
      },
    },
  },
};

const STORES: Store[] = [
  {
    id: "s1",
    name: "Organica Thảo Điền",
    address:
      "169 Song Hành, Thảo Điền, TP Thủ Đức, TP HCM, Phường Thảo Điền, Thành phố Thủ Đức, Hồ Chí Minh",
    province: "hcm",
    district: "thuduc",
    ward: "thaodien",
  },
  {
    id: "s2",
    name: "Organica An Phú",
    address:
      "45 Lương Định Của, An Phú, TP Thủ Đức, TP HCM, Phường An Phú, Thành phố Thủ Đức, Hồ Chí Minh",
    province: "hcm",
    district: "thuduc",
    ward: "anphu",
  },
  {
    id: "s3",
    name: "Organica Quận 1 – Bến Nghé",
    address: "15 Tôn Đức Thắng, Bến Nghé, Quận 1, Hồ Chí Minh",
    province: "hcm",
    district: "q1",
    ward: "bennghe",
  },
  {
    id: "s4",
    name: "Organica Quận 3 – Võ Thị Sáu",
    address: "72 Võ Thị Sáu, Phường Võ Thị Sáu, Quận 3, Hồ Chí Minh",
    province: "hcm",
    district: "q3",
    ward: "vo_thi_sau",
  },
  {
    id: "s5",
    name: "Organica Quận 7 – Tân Phong",
    address:
      "328 Nguyễn Thị Thập, Tân Phong, Quận 7, Hồ Chí Minh",
    province: "hcm",
    district: "q7",
    ward: "tan_phong",
  },
  {
    id: "s6",
    name: "Organica Bình Thạnh",
    address:
      "126 Đinh Bộ Lĩnh, Phường 26, Quận Bình Thạnh, Hồ Chí Minh",
    province: "hcm",
    district: "binh_thanh",
    ward: "p26",
  },
  {
    id: "s7",
    name: "Organica Phú Nhuận",
    address:
      "9 Hoàng Văn Thụ, Phường 9, Quận Phú Nhuận, Hồ Chí Minh",
    province: "hcm",
    district: "phu_nhuan",
    ward: "p9_pn",
  },
  {
    id: "s8",
    name: "Organica Hà Nội – Tây Hồ",
    address: "88 Xuân Diệu, Phường Quảng An, Tây Hồ, Hà Nội",
    province: "hanoi",
    district: "tay_ho",
    ward: "quang_an",
  },
  {
    id: "s9",
    name: "Organica Đà Nẵng – Hải Châu",
    address: "22 Trần Phú, Phường Hải Châu 1, Quận Hải Châu, Đà Nẵng",
    province: "danang",
    district: "hai_chau",
    ward: "hai_chau1",
  },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface StorePickupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (store: Store) => void;
  selectedStoreId?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StorePickupModal({
  isOpen,
  onClose,
  onConfirm,
  selectedStoreId,
}: StorePickupModalProps) {
  const [province, setProvince] = useState("hcm");
  const [district, setDistrict] = useState("");
  const [ward, setWard] = useState("");
  const [tempSelectedId, setTempSelectedId] = useState(selectedStoreId ?? "");

  // Derived lists
  const provinceList = Object.entries(LOCATION_DATA).map(([k, v]) => ({
    value: k,
    label: v.label,
  }));

  const districtList = useMemo(() => {
    if (!province || !LOCATION_DATA[province]) return [];
    return Object.entries(LOCATION_DATA[province].districts).map(
      ([k, v]) => ({ value: k, label: v.label })
    );
  }, [province]);

  const wardList = useMemo(() => {
    if (!province || !district) return [];
    return LOCATION_DATA[province]?.districts[district]?.wards ?? [];
  }, [province, district]);

  // Filtered stores
  const filteredStores = useMemo(() => {
    return STORES.filter((s) => {
      if (province && s.province !== province) return false;
      if (district && s.district !== district) return false;
      if (ward && s.ward !== ward) return false;
      return true;
    });
  }, [province, district, ward]);

  const handleProvinceChange = (val: string) => {
    setProvince(val);
    setDistrict("");
    setWard("");
    setTempSelectedId("");
  };

  const handleDistrictChange = (val: string) => {
    setDistrict(val);
    setWard("");
    setTempSelectedId("");
  };

  const handleConfirm = () => {
    const store = STORES.find((s) => s.id === tempSelectedId);
    if (store) {
      onConfirm(store);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    // Overlay
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Modal card */}
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden">
        {/* ── Header ── */}
        <div className="relative flex items-center justify-center px-4 py-4 border-b border-gray-100">
          <button
            onClick={onClose}
            className="absolute left-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
          <h2 className="text-base font-semibold text-gray-900">
            Chọn cửa hàng
          </h2>
        </div>

        {/* ── Body ── */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* ── Filters ── */}
          {/* Quốc gia */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Quốc gia
            </label>
            <div className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 bg-gray-50 select-none">
              Vietnam
            </div>
          </div>

          {/* Tỉnh / TP */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Tỉnh / TP
            </label>
            <div className="relative">
              <select
                value={province}
                onChange={(e) => handleProvinceChange(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-400 appearance-none bg-white"
              >
                <option value="">-- Chọn tỉnh / TP --</option>
                {provinceList.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                ▾
              </span>
            </div>
          </div>

          {/* Quận/Huyện & Phường/Xã — side by side */}
          <div className="grid grid-cols-2 gap-3">
            {/* Quận / Huyện */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Quận / Huyện
              </label>
              <div className="relative">
                <select
                  value={district}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  disabled={!province}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-400 appearance-none bg-white disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <option value="">Quận / Huyện</option>
                  {districtList.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  ▾
                </span>
              </div>
            </div>

            {/* Phường / Xã */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Phường / Xã
              </label>
              <div className="relative">
                <select
                  value={ward}
                  onChange={(e) => {
                    setWard(e.target.value);
                    setTempSelectedId("");
                  }}
                  disabled={!district}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-400 appearance-none bg-white disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <option value="">Phường / Xã</option>
                  {wardList.map((w) => (
                    <option key={w.value} value={w.value}>
                      {w.label}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  ▾
                </span>
              </div>
            </div>
          </div>

          {/* ── Store list ── */}
          {filteredStores.length > 0 ? (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">
                Cửa hàng phù hợp
              </p>
              <ul
                className="space-y-2 max-h-56 overflow-y-auto pr-1"
                style={{ scrollbarWidth: "thin" }}
              >
                {filteredStores.map((store) => {
                  const selected = tempSelectedId === store.id;
                  return (
                    <li key={store.id}>
                      <label
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                          selected
                            ? "border-gray-900 bg-gray-50"
                            : "border-gray-200 hover:border-gray-400"
                        }`}
                      >
                        {/* Custom radio */}
                        <span
                          className={`mt-0.5 flex-shrink-0 w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center ${
                            selected
                              ? "border-gray-900"
                              : "border-gray-400"
                          }`}
                          style={{ width: 18, height: 18 }}
                        >
                          {selected && (
                            <span
                              className="block rounded-full bg-gray-900"
                              style={{ width: 10, height: 10 }}
                            />
                          )}
                        </span>

                        <input
                          type="radio"
                          name="store"
                          value={store.id}
                          checked={selected}
                          onChange={() => setTempSelectedId(store.id)}
                          className="sr-only"
                        />

                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 leading-snug">
                            {store.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                            {store.address}
                          </p>
                        </div>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">
              Không tìm thấy cửa hàng phù hợp.
            </p>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleConfirm}
            disabled={!tempSelectedId}
            className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Xong
          </button>
        </div>
      </div>
    </div>
  );
}

export type { Store };
