import { faSearch, faBolt, faTools, faChartLine, faGear, faCogs, faPlug, faClipboardCheck, faEye} from '@fortawesome/free-solid-svg-icons';

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
    ],
  },
  // Add more main menus here later
];

export default menuData;
