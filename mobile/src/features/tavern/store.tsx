import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Action, initialState, reducer, State } from "./model";
const KEY = "rexburg-tavern-v2";
const Context = createContext<null | {
  state: State;
  ready: boolean;
  storageError: string | null;
  act: (action: Action) => boolean;
  retrySave: () => void;
}>(null);
export function TavernProvider({ children }: React.PropsWithChildren) {
  const [state, setState] = useState<State>(initialState),
    [ready, setReady] = useState(false),
    [storageError, setStorageError] = useState<string | null>(null);
  const current = useRef(state);
  const queue = useRef(Promise.resolve());
  function save(next: State) {
    queue.current = queue.current
      .then(() => AsyncStorage.setItem(KEY, JSON.stringify(next)))
      .then(() => setStorageError(null))
      .catch(() =>
        setStorageError(
          "Could not save on this device. Your changes are still available until you close the app.",
        ),
      );
  }
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!alive) return;
        if (raw) {
          const data = JSON.parse(raw);
          if (
            data.version !== 2 ||
            !Array.isArray(data.people) ||
            !Array.isArray(data.bounties) ||
            !Array.isArray(data.claims) ||
            !Array.isArray(data.notices) ||
            !Array.isArray(data.messages) ||
            !Array.isArray(data.ratings) ||
            !Number.isFinite(data.nextId)
          )
            throw Error("Unsupported save");
          current.current = { ...data, error: null };
          setState(current.current);
        }
      })
      .catch(() => {
        if (alive)
          setStorageError(
            "Saved demo data could not be loaded. A fresh demo is available.",
          );
      })
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);
  function act(action: Action) {
    const next = reducer(current.current, action);
    current.current = next;
    setState(next);
    if (!next.error) save(next);
    return !next.error;
  }
  return (
    <Context.Provider
      value={{
        state,
        ready,
        storageError,
        act,
        retrySave: () => save(current.current),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useTavern() {
  const v = useContext(Context);
  if (!v) throw Error("TavernProvider required");
  return v;
}
