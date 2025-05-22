import React from 'react';

interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  iconColor: string;
  iconBgColor: string;
  trend: {
    value: string;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  iconColor, 
  iconBgColor,
  trend
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-5 border border-neutral-200">
      <div className="flex justify-between items-start">
        <div className={`p-2 rounded-full ${iconBgColor}`}>
          <span className={`material-icons text-lg ${iconColor}`}>
            {icon}
          </span>
        </div>
        <div className={`text-xs font-medium flex items-center ${trend.isPositive ? 'text-success-500' : 'text-error-500'}`}>
          <span className="material-icons text-sm mr-1">
            {trend.isPositive ? 'trending_up' : 'trending_down'}
          </span>
          <span>{trend.value}</span>
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-sm text-neutral-600 font-medium">{title}</h3>
        <p className="text-2xl font-semibold mt-1">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;