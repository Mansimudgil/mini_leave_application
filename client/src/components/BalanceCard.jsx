import React from 'react';
import { Sun, HeartPulse, CheckSquare } from 'lucide-react';

export default function BalanceCard({ type, balance, initial, title }) {
  const isCasual = type === 'casual';
  const isSick = type === 'sick';
  const isTotal = type === 'total';

  const used = Math.max(0, (initial || 10) - (balance || 0));
  const percentage = initial > 0 ? Math.min(100, Math.max(0, (balance / initial) * 100)) : 100;

  const renderIcon = () => {
    if (isCasual) return <Sun size={18} />;
    if (isSick) return <HeartPulse size={18} />;
    return <CheckSquare size={18} />;
  };

  return (
    <div className={`balance-card ${type}`} id={`balance-card-${type}`}>
      <div className="card-header-flex">
        <div className="card-title-group">
          <div className="card-type-icon">{renderIcon()}</div>
          <h3>{title}</h3>
        </div>
        <span className={`badge badge-${type}`}>
          {isCasual ? 'Casual' : isSick ? 'Medical' : 'All Quotas'}
        </span>
      </div>

      <div className="balance-numbers">
        <span className="balance-value" id={`val-balance-${type}`}>
          {balance ?? 0}
        </span>
        <span className="balance-total">/ {initial ?? 10} days available</span>
      </div>

      <div className="progress-track" title={`${percentage.toFixed(0)}% balance remaining`}>
        <div className="progress-fill" style={{ width: `${percentage}%` }}></div>
      </div>

      <div className="card-footer-info">
        <span>{used} days consumed</span>
        <span>{percentage.toFixed(0)}% remaining</span>
      </div>
    </div>
  );
}
