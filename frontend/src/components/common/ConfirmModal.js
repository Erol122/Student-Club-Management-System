export function ConfirmModal({ title, message, confirmLabel = 'Confirm', onConfirm, onCancel, isDangerous = false }) {
  return (
    <>
      <div className="modal-backdrop" onClick={onCancel} />
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h3 className="modal-title" id="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button type="button" className="ghost-button" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className={isDangerous ? 'danger-button' : 'primary-button'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}
