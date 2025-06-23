'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ChartBarIcon, 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Progress tracking interfaces
interface DailyProgress {
  date: string;
  tasksCompleted: number;
  totalTasks: number;
  timeSpent: number; // in seconds
  completionRate: number; // percentage
}

interface WeeklyTrend {
  direction: 'up' | 'down' | 'stable';
  percentage: number;
  description: string;
}

interface ProgressStats {
  today: DailyProgress;
  yesterday: DailyProgress;
  weekAverage: number;
  monthlyTotal: number;
  streak: number; // consecutive days with progress
  trends: {
    completion: WeeklyTrend;
    timeSpent: WeeklyTrend;
    productivity: WeeklyTrend;
  };
}

interface DailyProgressSummaryProps {
  projectPath: string;
  onProgressUpdate?: (progress: DailyProgress) => void;
}

const DailyProgressSummary: React.FC<DailyProgressSummaryProps> = ({ 
  projectPath, 
  onProgressUpdate 
}) => {
  // State management
  const [progressStats, setProgressStats] = useState<ProgressStats>({
    today: {
      date: new Date().toISOString().split('T')[0],
      tasksCompleted: 0,
      totalTasks: 0,
      timeSpent: 0,
      completionRate: 0
    },
    yesterday: {
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      tasksCompleted: 0,
      totalTasks: 0,
      timeSpent: 0,
      completionRate: 0
    },
    weekAverage: 0,
    monthlyTotal: 0,
    streak: 0,
    trends: {
      completion: { direction: 'stable', percentage: 0, description: 'No change' },
      timeSpent: { direction: 'stable', percentage: 0, description: 'No change' },
      productivity: { direction: 'stable', percentage: 0, description: 'No change' }
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Load progress data
  const loadProgressData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { electronAPI } = await import('../../lib/electronAPI');

      if (electronAPI.isElectron()) {
        // Load tasks data
        const tasksPath = `${projectPath}/.taskmaster/tasks/tasks.json`;
        const tasksResult = await electronAPI.readFile(tasksPath);
        
        // Load time tracking data
        const timeDataPath = `${projectPath}/.taskmaster/time-tracking.json`;
        const timeResult = await electronAPI.readFile(timeDataPath);
        
        // Load or initialize progress history
        const progressPath = `${projectPath}/.taskmaster/progress-history.json`;
        const progressResult = await electronAPI.readFile(progressPath);
        
        let tasks = [];
        let timeEntries = [];
        let progressHistory = [];

        // Parse tasks data
        if (tasksResult.success && tasksResult.content) {
          const taskData = JSON.parse(tasksResult.content);
          tasks = taskData.master?.tasks || [];
        }

        // Parse time data
        if (timeResult.success && timeResult.content) {
          const timeData = JSON.parse(timeResult.content);
          timeEntries = timeData.entries || [];
        }

        // Parse progress history
        if (progressResult.success && progressResult.content) {
          const historyData = JSON.parse(progressResult.content);
          progressHistory = historyData.dailyProgress || [];
        }

        // Calculate today's progress
        const todayProgress = calculateDailyProgress(tasks, timeEntries, new Date());
        const yesterdayProgress = calculateDailyProgress(tasks, timeEntries, new Date(Date.now() - 24 * 60 * 60 * 1000));
        
        // Update progress history
        const updatedHistory = updateProgressHistory(progressHistory, todayProgress);
        await saveProgressHistory(updatedHistory);
        
        // Calculate trends and statistics
        const stats = calculateProgressStats(todayProgress, yesterdayProgress, updatedHistory);
        
        setProgressStats(stats);
        setLastUpdated(new Date());
        
        // Notify parent component
        onProgressUpdate?.(todayProgress);
        
      } else {
        // Use mock data for web environment
        setProgressStats(getMockProgressStats());
      }
    } catch (err) {
      console.error('Failed to load progress data:', err);
      setError('Failed to load progress data');
      // Use mock data as fallback
      setProgressStats(getMockProgressStats());
    } finally {
      setLoading(false);
    }
  }, [projectPath, onProgressUpdate]);

  // Calculate daily progress from tasks and time data
  const calculateDailyProgress = (tasks: any[], timeEntries: any[], date: Date): DailyProgress => {
    const dateStr = date.toISOString().split('T')[0];
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Filter time entries for the specific date
    const dayTimeEntries = timeEntries.filter((entry: any) => {
      const entryDate = new Date(entry.startTime);
      return entryDate >= startOfDay && entryDate < endOfDay;
    });

    // Calculate time spent
    const timeSpent = dayTimeEntries.reduce((total: number, entry: any) => {
      return total + (entry.duration || 0);
    }, 0);

    // Calculate task completion for the day (approximation based on current status)
    const completedTasks = tasks.filter(task => task.status === 'done').length;
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      date: dateStr,
      tasksCompleted: completedTasks,
      totalTasks,
      timeSpent,
      completionRate
    };
  };

  // Update progress history
  const updateProgressHistory = (history: DailyProgress[], todayProgress: DailyProgress): DailyProgress[] => {
    const existingIndex = history.findIndex(entry => entry.date === todayProgress.date);
    
    if (existingIndex >= 0) {
      // Update existing entry
      history[existingIndex] = todayProgress;
    } else {
      // Add new entry
      history.push(todayProgress);
    }
    
    // Keep only last 30 days
    return history
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 30);
  };

  // Save progress history
  const saveProgressHistory = async (history: DailyProgress[]) => {
    try {
      const { electronAPI } = await import('../../lib/electronAPI');

      if (electronAPI.isElectron()) {
        const progressPath = `${projectPath}/.taskmaster/progress-history.json`;
        const data = {
          dailyProgress: history,
          lastUpdated: new Date().toISOString()
        };
        
        await electronAPI.writeFile(progressPath, JSON.stringify(data, null, 2));
      }
    } catch (err) {
      console.error('Failed to save progress history:', err);
    }
  };

  // Calculate progress statistics and trends
  const calculateProgressStats = (today: DailyProgress, yesterday: DailyProgress, history: DailyProgress[]): ProgressStats => {
    // Calculate week average
    const lastWeek = history.slice(0, 7);
    const weekAverage = lastWeek.length > 0 
      ? lastWeek.reduce((sum, day) => sum + day.completionRate, 0) / lastWeek.length 
      : 0;

    // Calculate monthly total
    const monthlyTotal = history.reduce((sum, day) => sum + day.tasksCompleted, 0);

    // Calculate streak (consecutive days with progress)
    let streak = 0;
    for (const day of history) {
      if (day.tasksCompleted > 0) {
        streak++;
      } else {
        break;
      }
    }

    // Calculate trends
    const completionTrend = calculateTrend(today.completionRate, yesterday.completionRate, 'completion rate');
    const timeTrend = calculateTrend(today.timeSpent, yesterday.timeSpent, 'time spent');
    const productivityTrend = calculateProductivityTrend(today, yesterday);

    return {
      today,
      yesterday,
      weekAverage,
      monthlyTotal,
      streak,
      trends: {
        completion: completionTrend,
        timeSpent: timeTrend,
        productivity: productivityTrend
      }
    };
  };

  // Calculate trend direction and percentage
  const calculateTrend = (current: number, previous: number, metric: string): WeeklyTrend => {
    if (previous === 0) {
      return {
        direction: current > 0 ? 'up' : 'stable',
        percentage: 0,
        description: current > 0 ? `Started tracking ${metric}` : `No ${metric}`
      };
    }

    const change = ((current - previous) / previous) * 100;
    const absChange = Math.abs(change);

    if (absChange < 5) {
      return {
        direction: 'stable',
        percentage: absChange,
        description: `${metric} remained stable`
      };
    }

    return {
      direction: change > 0 ? 'up' : 'down',
      percentage: absChange,
      description: `${metric} ${change > 0 ? 'increased' : 'decreased'} by ${absChange.toFixed(1)}%`
    };
  };

  // Calculate productivity trend (tasks per hour)
  const calculateProductivityTrend = (today: DailyProgress, yesterday: DailyProgress): WeeklyTrend => {
    const todayProductivity = today.timeSpent > 0 ? (today.tasksCompleted / (today.timeSpent / 3600)) : 0;
    const yesterdayProductivity = yesterday.timeSpent > 0 ? (yesterday.tasksCompleted / (yesterday.timeSpent / 3600)) : 0;
    
    return calculateTrend(todayProductivity, yesterdayProductivity, 'productivity');
  };

  // Mock data for development/fallback
  const getMockProgressStats = (): ProgressStats => ({
    today: {
      date: new Date().toISOString().split('T')[0],
      tasksCompleted: 5,
      totalTasks: 12,
      timeSpent: 14400, // 4 hours
      completionRate: 41.7
    },
    yesterday: {
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      tasksCompleted: 3,
      totalTasks: 12,
      timeSpent: 10800, // 3 hours
      completionRate: 25.0
    },
    weekAverage: 35.2,
    monthlyTotal: 45,
    streak: 3,
    trends: {
      completion: { direction: 'up', percentage: 16.7, description: 'completion rate increased by 16.7%' },
      timeSpent: { direction: 'up', percentage: 33.3, description: 'time spent increased by 33.3%' },
      productivity: { direction: 'up', percentage: 25.0, description: 'productivity increased by 25.0%' }
    }
  });

  // Format time display
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Get trend icon
  const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up':
        return <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />;
      case 'down':
        return <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />;
      default:
        return <div className="w-4 h-4 bg-gray-400 rounded-full"></div>;
    }
  };

  // Get trend color class
  const getTrendColor = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Prepare chart data
  const getWeeklyChartData = () => {
    const lastWeek = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return lastWeek.map(date => {
      // Find historical data for this date or use mock data
      const dayData = {
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        completionRate: Math.random() * 100, // Replace with actual historical data
        timeSpent: Math.random() * 8, // Replace with actual historical data
        tasksCompleted: Math.floor(Math.random() * 10) // Replace with actual historical data
      };
      return dayData;
    });
  };

  const getTaskStatusData = () => {
    const total = progressStats.today.totalTasks;
    const completed = progressStats.today.tasksCompleted;
    const pending = total - completed;

    return [
      { name: 'Completed', value: completed, color: '#10B981' },
      { name: 'Pending', value: pending, color: '#F59E0B' }
    ];
  };

  // Chart colors
  const CHART_COLORS = {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B',
    muted: '#6B7280'
  };

  // Load data on component mount and refresh every 5 minutes
  useEffect(() => {
    loadProgressData();
    
    const interval = setInterval(loadProgressData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadProgressData]);

  if (loading) {
    return (
      <div className="h-full bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white rounded-lg border border-gray-200 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Daily Progress</h3>
        <ChartBarIcon className="w-5 h-5 text-gray-500" />
      </div>

      {/* Today's Summary */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-blue-800">Today&apos;s Progress</h4>
          <CalendarDaysIcon className="w-5 h-5 text-blue-600" />
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <p className="text-sm text-blue-600 mb-1">Tasks Completed</p>
            <p className="text-2xl font-bold text-blue-800">
              {progressStats.today.tasksCompleted}
              <span className="text-sm font-normal text-blue-600">/{progressStats.today.totalTasks}</span>
            </p>
          </div>
          <div>
            <p className="text-sm text-blue-600 mb-1">Time Spent</p>
            <p className="text-2xl font-bold text-blue-800">{formatTime(progressStats.today.timeSpent)}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-blue-600">Completion Rate</span>
            <span className="text-sm font-medium text-blue-800">
              {progressStats.today.completionRate.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progressStats.today.completionRate, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Week Avg</p>
            <CheckCircleIcon className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-lg font-bold text-gray-800">{progressStats.weekAverage.toFixed(1)}%</p>
        </div>
        
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Month Total</p>
            <ChartBarIcon className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-lg font-bold text-gray-800">{progressStats.monthlyTotal}</p>
        </div>
        
        <div className="p-3 bg-gray-50 rounded-lg col-span-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Current Streak</p>
            <ClockIcon className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-lg font-bold text-gray-800">
            {progressStats.streak} day{progressStats.streak !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Trends */}
      <div className="space-y-3 mb-6">
        <h4 className="font-medium text-gray-800 mb-3">Trends vs Yesterday</h4>
        
        {Object.entries(progressStats.trends).map(([key, trend]) => (
          <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {getTrendIcon(trend.direction)}
              <div>
                <p className="text-sm font-medium text-gray-800 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </p>
                <p className="text-xs text-gray-500">{trend.description}</p>
              </div>
            </div>
            <span className={`text-sm font-medium ${getTrendColor(trend.direction)}`}>
              {trend.direction !== 'stable' && (trend.direction === 'up' ? '+' : '-')}
              {trend.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="space-y-6">
        {/* Weekly Progress Chart */}
        <div>
          <h4 className="font-medium text-gray-800 mb-3">Weekly Progress</h4>
          <div className="h-48 bg-gray-50 rounded-lg p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getWeeklyChartData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: any, name: string) => [
                    `${Number(value).toFixed(1)}%`, 
                    'Completion Rate'
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="completionRate"
                  stroke={CHART_COLORS.primary}
                  fill={CHART_COLORS.primary}
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Distribution Pie Chart */}
        <div>
          <h4 className="font-medium text-gray-800 mb-3">Task Distribution</h4>
          <div className="h-48 bg-gray-50 rounded-lg p-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getTaskStatusData()}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {getTaskStatusData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: any, name: string) => [
                    `${value} tasks`, 
                    name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Legend */}
            <div className="flex justify-center space-x-4 mt-2">
              {getTaskStatusData().map((entry, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-xs text-gray-600">
                    {entry.name} ({entry.value})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Last updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};

export default DailyProgressSummary; 