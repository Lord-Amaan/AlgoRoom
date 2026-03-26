import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/strategy-builder', label: 'Strategy Builder' },
  { to: '/strategies', label: 'Strategies' },
  { to: '/backtest', label: 'Backtesting' },
  { to: '/live', label: 'Live Trading' },
];

export default function Sidebar() {
  return (
    <aside className="w-64 border-r border-[#dfe6f2] bg-[#f6f9ff] flex flex-col">
      <div className="p-6">
        <h1 className="text-xl font-bold tracking-tight text-[#255a98]">Algoroom</h1>
        <p className="mt-1 text-xs text-[#8190a5]">Algo Trading Platform</p>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `block px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
                isActive
                  ? 'bg-[#2f6fbc] text-white shadow-sm'
                  : 'text-[#60708a] hover:text-[#264f82] hover:bg-[#e9f1ff]'
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
