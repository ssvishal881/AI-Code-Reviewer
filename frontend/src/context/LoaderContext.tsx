import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import GlobalLoader from "../components/GlobalLoader";

type LoaderContextType = {
  showLoader: (message?: string) => void;
  hideLoader: () => void;
};

type LoaderProviderProps = {
  children: ReactNode;
};

const LoaderContext = createContext<LoaderContextType | undefined>(undefined);

export function LoaderProvider({ children }: LoaderProviderProps) {
  const [loadingCount, setLoadingCount] = useState(0);
  const [message, setMessage] = useState("Analyzing source code...");

  const showLoader = useCallback((newMessage?: string) => {
    setMessage(newMessage || "Analyzing source code...");
    setLoadingCount((count) => count + 1);
  }, []);

  const hideLoader = useCallback(() => {
    setLoadingCount((count) => Math.max(0, count - 1));
  }, []);

  const value = useMemo(
    () => ({ showLoader, hideLoader }),
    [showLoader, hideLoader],
  );

  return (
    <LoaderContext.Provider value={value}>
      {children}
      <GlobalLoader isLoading={loadingCount > 0} message={message} />
    </LoaderContext.Provider>
  );
}

export function useGlobalLoader() {
  const context = useContext(LoaderContext);

  if (!context) {
    throw new Error("useGlobalLoader must be used inside a LoaderProvider");
  }

  return context;
}
