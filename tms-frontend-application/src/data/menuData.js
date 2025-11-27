import { faSearch, faBolt, faTools, faChartLine, faGear, faCogs, faPlug, faClipboardCheck, faEye, faUserShield, faUserCheck, faBrain, faRobot, faHistory, faUsers, faUserPlus } from '@fortawesome/free-solid-svg-icons';

const menuData = [
  {
    label: "Operations",  // Main menu
    subMenu: [
      {
        path: "/transformers",
        label: "Transformers",
        icon: faPlug,
      },
      {
        path: "/inspections",
        label: "Inspections",
        icon: faClipboardCheck,
      },
            {
        path: "/transformers/map",
        label: "Transformer Map",
        icon: faClipboardCheck,
      },
    ],
  },
  {
    label: "Annotations",  // Regular users can view annotation history
    subMenu: [
      {
        path: "/annotation-history",
        label: "Annotation History",
        icon: faHistory,
      },
    ],
  },
  {
    label: "User Management",  // Admin-only section
    adminOnly: true,  // Only visible to admins
    subMenu: [
      {
        path: "/admin/approvals",
        label: "Admin Approvals",
        icon: faUserCheck,
      },
      {
        path: "/admin/user-management",
        label: "Role Requests",
        icon: faUsers,
      },
    ],
  },
  {
    label: "Model Management",  // Admin-only AI/ML section
    adminOnly: true,  // Only visible to admins
    subMenu: [
      {
        path: "/admin/model-retraining",
        label: "Model Retraining",
        icon: faBrain,
      },
    ],
  },
  {
    label: "Settings",  // Another main menu
    subMenu: [
      {
        path: "/settings/system",
        label: "System Settings",
        icon: faGear,
      },
      {
        path: "/settings/user",
        label: "User Settings",
        icon: faTools,
      },
      {
        path: "/profile/request-role-change",
        label: "Request Role Change",
        icon: faUserPlus,
        excludeRoles: ['ROLE_ADMIN'],  // Hide from admins - they can directly manage roles
      },
    ],
  },
  // Add more main menus here later
];

export default menuData;