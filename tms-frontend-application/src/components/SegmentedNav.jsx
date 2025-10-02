import { NavLink } from 'react-router-dom';

export default function SegmentedNav() {
  return (
    <nav className="topnav">
      <div className="segmented">
        <NavLink
          to="/transformers"
          className={({ isActive }) => `segbtn ${isActive ? 'active' : ''}`}
          end
        >
          Transformers
        </NavLink>

        <NavLink
          to="/inspections"
          className={({ isActive }) => `segbtn ${isActive ? 'active' : ''}`}
        >
          Inspections
        </NavLink>
      </div>
    </nav>
  );
}
