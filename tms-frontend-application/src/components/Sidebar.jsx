import { NavLink } from "react-router-dom";
import "../styles/layout.css";
import "../styles/sidebar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import menuData from "../data/menuData";
import { useAuth } from "../contexts/AuthContext";

const Sidebar = ({ isOpen, onClose }) => {
  const { hasRole, user } = useAuth();

  console.log('[Sidebar] Rendering with user:', user);

  // Filter menu sections based on role requirements
  const filteredMenuData = menuData.filter((menu) => {
    // If menu requires admin role, check if user is admin
    if (menu.adminOnly) {
      const isAdmin = hasRole('ROLE_ADMIN');
      console.log('[Sidebar] Menu:', menu.label, 'adminOnly:', menu.adminOnly, 'isAdmin:', isAdmin);
      return isAdmin;
    }
    return true; // Show non-admin menus to everyone
  });

  console.log('[Sidebar] Filtered menus:', filteredMenuData.map(m => m.label));

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 1000,
          }}
        />
      )}

      <nav className={`slide-panel ${isOpen ? "open" : ""}`}>
        <div className="menu-content">
          <ul className="menu-list" style={{ listStyleType: "none" }}>
            {filteredMenuData.map((menu, index) => (
              <li key={index} className="menu-item">
                <span className="menu-label">{menu.label}</span>
                <ul className="submenu-list" style={{ listStyleType: "none", paddingLeft: "15px" }}>
                  {menu.subMenu.map((item, subIndex) => (
                    <li className="menu-item2" key={subIndex}>
                      <NavLink to={item.path} className="submenu-link" onClick={onClose}>
                        <FontAwesomeIcon icon={item.icon} />
                        <span>{item.label}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
