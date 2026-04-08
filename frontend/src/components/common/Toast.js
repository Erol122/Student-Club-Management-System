import { memo } from 'react';
import { useAppDispatch, useAppState } from '../../context/AppContext';

const ICONS = { success: '✓', info: 'i', error: '!' };

export const Toast = memo(function Toast() {
  const { toast } = useAppState();
  const dispatch   = useAppDispatch();

  if (!toast) return null;

  return (
    <div className="toast-wrap">
      <div className={`toast toast-${toast.type}`}>
        <span className="toast-icon">{ICONS[toast.type] ?? 'i'}</span>
        <span>{toast.message}</span>
        <button
          type="button"
          className="toast-close"
          onClick={() => dispatch({ type: 'DISMISS_TOAST' })}
        >
          ×
        </button>
      </div>
    </div>
  );
});
