import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

export default function ExportMenu({ label, actions, buttonClassName }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAction = async (action) => {
    setOpen(false);
    try {
      await action.onClick();
    } catch (error) {
      console.error('[ExportMenu] action error', error);
    }
  };

  return (
    <div className="export-menu-container" ref={containerRef}>
      <button
        type="button"
        className={buttonClassName}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        {label} ▾
      </button>

      {open && (
        <div role="menu" className="export-dropdown">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              role="menuitem"
              className="export-dropdown-item"
              onClick={() => handleAction(action)}
            >
              {action.icon && <span className="export-dropdown-icon">{action.icon}</span>}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

ExportMenu.propTypes = {
  label: PropTypes.string,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func.isRequired,
      icon: PropTypes.node,
    })
  ).isRequired,
  buttonClassName: PropTypes.string,
};

ExportMenu.defaultProps = {
  label: 'Exporter',
  buttonClassName: 'chip premium-btn',
};
