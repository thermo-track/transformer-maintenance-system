import { NavLink } from 'react-router-dom';
import '../styles/layout.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faBolt } from '@fortawesome/free-solid-svg-icons';

const Sidebar = ({ isOpen, onClose }) => {
  return (
    <>

      {isOpen && (
        <div 
          className="sidebar-overlay"
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000 
          }}
        />
      )}

      <nav className={`slide-panel ${isOpen ? 'open' : ''}`}>
        <div className="menu-content">
          <ul className="menu-list" style={{ listStyleType: 'none' }}>
            <li className="menu-item2">
              <NavLink to="/transformers" className="submenu-link" onClick={onClose}>
                <FontAwesomeIcon icon={faBolt} />
                <span>Transformers</span>
              </NavLink>
            </li>
            <li className="menu-item2">
              <NavLink to="/inspections" className="submenu-link" onClick={onClose}>
                <FontAwesomeIcon icon={faSearch} />
                <span>Inspections</span>
              </NavLink>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
};

export default Sidebar;