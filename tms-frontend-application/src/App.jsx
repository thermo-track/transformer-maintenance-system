import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import List from './features/transformers/pages/List.jsx';
import Create from './features/transformers/pages/Create.jsx';
import Edit from './features/transformers/pages/Edit.jsx';
import View from './features/transformers/pages/View.jsx';


export default function App() {
return (
<Layout>

<Routes>
<Route path="/" element={<Navigate to="/transformers" replace />} />
<Route path="/transformers" element={<List />} />
<Route path="/transformers/new" element={<Create />} />
{/* <Route path="/transformers/:id" element={<View />} /> */}
<Route path="/transformers/:id/edit" element={<Edit />} />
<Route path="*" element={<p>Not found</p>} />
</Routes>
</Layout>
);
}