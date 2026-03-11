import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GroupSession {
  groupId: string;
  groupName: string;
  /** 'owner' = người tạo nhóm, 'member' = thành viên tham gia qua link */
  role: 'owner' | 'member';
  /** ID bản ghi GroupMember – dùng để đánh dấu isReady */
  memberId?: string;
  /** Tên hiển thị (nickname nhập khi join, hoặc tên tài khoản) */
  displayName?: string;
}

interface GroupContextValue {
  groupSession: GroupSession | null;
  setGroupSession: (session: GroupSession | null) => void;
  clearGroupSession: () => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const GroupContext = createContext<GroupContextValue | null>(null);

const STORAGE_KEY = "group_session";

// ── Provider ──────────────────────────────────────────────────────────────────

export function GroupProvider({ children }: { children: ReactNode }) {
  const [groupSession, setGroupSessionState] = useState<GroupSession | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as GroupSession) : null;
    } catch {
      return null;
    }
  });

  const setGroupSession = (session: GroupSession | null) => {
    setGroupSessionState(session);
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const clearGroupSession = () => setGroupSession(null);

  // Sync across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      if (e.newValue) {
        try {
          setGroupSessionState(JSON.parse(e.newValue));
        } catch {/* ignore */}
      } else {
        setGroupSessionState(null);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return (
    <GroupContext.Provider value={{ groupSession, setGroupSession, clearGroupSession }}>
      {children}
    </GroupContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useGroup() {
  const ctx = useContext(GroupContext);
  if (!ctx) throw new Error("useGroup must be used inside <GroupProvider>");
  return ctx;
}
