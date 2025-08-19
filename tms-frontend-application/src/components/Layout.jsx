export default function Layout({ children }) {
return (
<div className="container">
<header className="row" style={{justifyContent:'space-between'}}>
<h1 style={{margin:0}}>Transformer Maintenance</h1>
</header>
<main className="card" style={{marginTop:'1rem'}}>{children}</main>
<div className="footer">React + Vite · Ready to extend (modules/features)</div>
</div>
);
}