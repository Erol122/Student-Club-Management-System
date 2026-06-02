import { createContext, useContext, useEffect, useReducer } from 'react';
import { initialState, reducer } from './appReducer';

const StateCtx = createContext(null);
const DispatchCtx = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (!state.toast) return;
    const id = setTimeout(() => dispatch({ type: 'DISMISS_TOAST' }), 3200);
    return () => clearTimeout(id);
  }, [state.toast]);

  return (
    <StateCtx.Provider value={state}>
      <DispatchCtx.Provider value={dispatch}>{children}</DispatchCtx.Provider>
    </StateCtx.Provider>
  );
}

export function useAppState() {
  return useContext(StateCtx);
}

export function useAppDispatch() {
  return useContext(DispatchCtx);
}
