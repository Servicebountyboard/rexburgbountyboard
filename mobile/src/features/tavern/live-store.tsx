import React, { createContext, useContext } from "react";

import { emptyState, State } from "./live-model";

type ContextValue = {
  state: State;
  ready: boolean;
  clearError: () => void;
};

const Context = createContext<ContextValue | null>(null);

/**
 * Temporary local-only provider retained while the application is rebuilt.
 * It deliberately performs no persistence, authentication, or network work.
 */
export function TavernProvider({ children }: React.PropsWithChildren) {
  return (
    <Context.Provider
      value={{ state: emptyState, ready: true, clearError: () => undefined }}
    >
      {children}
    </Context.Provider>
  );
}

export function useTavern() {
  const context = useContext(Context);
  if (!context) throw new Error("TavernProvider required");
  return context;
}
