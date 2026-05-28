import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { CaseProgressModal } from "@/components/cases/CaseProgressModal";

interface CaseProgressModalContextValue {
  activeCaseId: string | null;
  openModal: (caseId: string) => void;
  closeModal: () => void;
}

const CaseProgressModalContext =
  createContext<CaseProgressModalContextValue | null>(null);

export function CaseProgressModalProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);

  const openModal = useCallback((caseId: string) => {
    setActiveCaseId(caseId);
  }, []);

  const closeModal = useCallback(() => {
    setActiveCaseId(null);
  }, []);

  const value = useMemo(
    () => ({ activeCaseId, openModal, closeModal }),
    [activeCaseId, closeModal, openModal],
  );

  return (
    <CaseProgressModalContext.Provider value={value}>
      {children}
      {activeCaseId && (
        <CaseProgressModal caseId={activeCaseId} onClose={closeModal} />
      )}
    </CaseProgressModalContext.Provider>
  );
}

export function useCaseProgressModal() {
  const context = useContext(CaseProgressModalContext);
  if (!context) {
    throw new Error(
      "useCaseProgressModal must be used within CaseProgressModalProvider",
    );
  }
  return context;
}
