import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/strategies', label: 'Strategy Builder' },
  { to: '/backtest', label: 'Backtesting' },
  { to: '/live', label: 'Live Trading' },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-dark-900 border-r border-dark-800 flex flex-col">
      <div className="p-6">
        <h1 className="text-xl font-bold text-primary-400">Algoroom</h1>
        <p className="text-xs text-dark-500 mt-1">Algo Trading Platform</p>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `block px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive
                  ? 'bg-primary-600/20 text-primary-400'
                  : 'text-dark-400 hover:text-white hover:bg-dark-800'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
