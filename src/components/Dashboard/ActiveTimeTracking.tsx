'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PlayIcon, PauseIcon, StopIcon, ClockIcon } from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

// Time tracking interfaces
interface TimeEntry {
  id: string;
  taskId: string;
  taskTitle: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  status: 'active' | 'paused' | 'completed';
  description?: string;
}

interface ActiveSession {
  taskId: string;
  taskTitle: string;
  startTime: Date;
  pausedTime: number; // accumulated paused time in seconds
  isPaused: boolean;
}

interface TimeStats {
  todayTotal: number;
  weekTotal: number;
  averageSession: number;
  sessionsToday: number;
}

interface ActiveTimeTrackingProps {
  projectPath: string;
  onTimeUpdate?: (timeData: { taskId: string; duration: number }) => void;
}

const ActiveTimeTracking: React.FC<ActiveTimeTrackingProps> = ({ 
  projectPath, 
  onTimeUpdate 
}) => {
  // State management
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [currentTime, setCurrentTime] = useState(0); // current session time in seconds
  const [stats, setStats] = useState<TimeStats>({
    todayTotal: 0,
    weekTotal: 0,
    averageSession: 0,
    sessionsToday: 0
  });
  const [availableTasks, setAvailableTasks] = useState<Array<{id: string; title: string}>>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (activeSession && !activeSession.isPaused) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - activeSession.startTime.getTime()) / 1000) - activeSession.pausedTime;
        setCurrentTime(elapsed);
        
        // Notify parent component
        onTimeUpdate?.({
          taskId: activeSession.taskId,
          duration: elapsed
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeSession, onTimeUpdate]);

  // Load available tasks from .taskmaster/tasks/tasks.json
  const loadAvailableTasks = useCallback(async () => {
    try {
      const { electronAPI } = await import('../../lib/electronAPI');

      if (electronAPI.isElectron()) {
        const tasksPath = `${projectPath}/.taskmaster/tasks/tasks.json`;
        const result = await electronAPI.readFile(tasksPath);
        
        if (result.success && result.content) {
          const taskData: any = JSON.parse(result.content);
          const allTasks = taskData.master?.tasks || [];
          
          // Filter to pending and in-progress tasks
          const workableTasks = allTasks
            .filter((task: any) => ['pending', 'in-progress'].includes(task.status))
            .map((task: any) => ({
              id: task.id.toString(),
              title: task.title
            }));
          
          setAvailableTasks(workableTasks);
        }
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
  }, [projectPath]);

  // Load time entries from storage
  const loadTimeEntries = useCallback(async () => {
    try {
      const { electronAPI } = await import('../../lib/electronAPI');

      if (electronAPI.isElectron()) {
        const timeDataPath = `${projectPath}/.taskmaster/time-tracking.json`;
        const result = await electronAPI.readFile(timeDataPath);
        
        if (result.success && result.content) {
          const data = JSON.parse(result.content);
          const entries = data.entries?.map((entry: any) => ({
            ...entry,
            startTime: new Date(entry.startTime),
            endTime: entry.endTime ? new Date(entry.endTime) : undefined
          })) || [];
          
          setTimeEntries(entries);
          calculateStats(entries);
          
          // Restore active session if exists
          if (data.activeSession) {
            const session = {
              ...data.activeSession,
              startTime: new Date(data.activeSession.startTime)
            };
            setActiveSession(session);
            
            // Calculate current time
            const elapsed = Math.floor((Date.now() - session.startTime.getTime()) / 1000) - session.pausedTime;
            setCurrentTime(elapsed);
          }
        } else {
          // Initialize empty time tracking file
          await saveTimeData([], null);
        }
      }
    } catch (err) {
      console.error('Failed to load time entries:', err);
    }
  }, [projectPath]);

  // Save time data to storage
  const saveTimeData = async (entries: TimeEntry[], session: ActiveSession | null) => {
    try {
      const { electronAPI } = await import('../../lib/electronAPI');

      if (electronAPI.isElectron()) {
        const timeDataPath = `${projectPath}/.taskmaster/time-tracking.json`;
        const data = {
          entries,
          activeSession: session,
          lastUpdated: new Date().toISOString()
        };
        
        await electronAPI.writeFile(timeDataPath, JSON.stringify(data, null, 2));
      }
    } catch (err) {
      console.error('Failed to save time data:', err);
    }
  };

  // Calculate statistics
  const calculateStats = (entries: TimeEntry[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const todayEntries = entries.filter(entry => entry.startTime >= today);
    const weekEntries = entries.filter(entry => entry.startTime >= weekAgo);
    
    const todayTotal = todayEntries.reduce((sum, entry) => sum + entry.duration, 0);
    const weekTotal = weekEntries.reduce((sum, entry) => sum + entry.duration, 0);
    const averageSession = entries.length > 0 ? entries.reduce((sum, entry) => sum + entry.duration, 0) / entries.length : 0;

    setStats({
      todayTotal,
      weekTotal,
      averageSession,
      sessionsToday: todayEntries.length
    });
  };

  // Start time tracking
  const startTracking = async () => {
    if (!selectedTaskId) return;

    const task = availableTasks.find(t => t.id === selectedTaskId);
    if (!task) return;

    const session: ActiveSession = {
      taskId: selectedTaskId,
      taskTitle: task.title,
      startTime: new Date(),
      pausedTime: 0,
      isPaused: false
    };

    setActiveSession(session);
    setCurrentTime(0);
    await saveTimeData(timeEntries, session);
  };

  // Pause/Resume tracking
  const togglePause = async () => {
    if (!activeSession) return;

    if (activeSession.isPaused) {
      // Resume
      const newSession = {
        ...activeSession,
        startTime: new Date(Date.now() - currentTime * 1000 - activeSession.pausedTime * 1000),
        isPaused: false
      };
      setActiveSession(newSession);
      await saveTimeData(timeEntries, newSession);
    } else {
      // Pause
      const newSession = {
        ...activeSession,
        pausedTime: activeSession.pausedTime + currentTime,
        isPaused: true
      };
      setActiveSession(newSession);
      await saveTimeData(timeEntries, newSession);
    }
  };

  // Stop tracking
  const stopTracking = async () => {
    if (!activeSession) return;

    const entry: TimeEntry = {
      id: Date.now().toString(),
      taskId: activeSession.taskId,
      taskTitle: activeSession.taskTitle,
      startTime: activeSession.startTime,
      endTime: new Date(),
      duration: currentTime,
      status: 'completed'
    };

    const updatedEntries = [...timeEntries, entry];
    setTimeEntries(updatedEntries);
    calculateStats(updatedEntries);
    setActiveSession(null);
    setCurrentTime(0);
    setSelectedTaskId('');
    
    await saveTimeData(updatedEntries, null);
  };

  // Format time display
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Format duration for display
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Load data on component mount
  useEffect(() => {
    loadAvailableTasks();
    loadTimeEntries();
  }, [loadAvailableTasks, loadTimeEntries]);

  // Get recent time entries (last 5)
  const recentEntries = timeEntries
    .filter(entry => entry.status === 'completed')
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
    .slice(0, 5);

  // Prepare chart data for last 7 days
  const getWeeklyTimeData = () => {
    const lastWeek = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    return lastWeek.map(date => {
      const dateStr = date.toISOString().split('T')[0];
      const dayEntries = timeEntries.filter(entry => 
        entry.startTime.toISOString().split('T')[0] === dateStr
      );
      const totalTime = dayEntries.reduce((sum, entry) => sum + entry.duration, 0);
      
      return {
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        hours: totalTime / 3600
      };
    });
  };

  return (
    <div className="h-full bg-white rounded-lg border border-gray-200 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Time Tracking</h3>
        <ClockIcon className="w-5 h-5 text-gray-500" />
      </div>

      {/* Active Session Display */}
      {activeSession ? (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${activeSession.isPaused ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`}></div>
              <span className="text-sm font-medium text-blue-700">
                {activeSession.isPaused ? 'Paused' : 'Active Session'}
              </span>
            </div>
            <div className="text-2xl font-mono font-bold text-blue-800">
              {formatTime(currentTime)}
            </div>
          </div>
          
          <div className="mb-3">
            <p className="text-sm text-gray-600 mb-1">Working on:</p>
            <p className="font-medium text-gray-800 truncate">{activeSession.taskTitle}</p>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={togglePause}
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeSession.isPaused
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
              }`}
            >
              {activeSession.isPaused ? <PlayIcon className="w-4 h-4" /> : <PauseIcon className="w-4 h-4" />}
              <span>{activeSession.isPaused ? 'Resume' : 'Pause'}</span>
            </button>
            
            <button
              onClick={stopTracking}
              className="flex items-center space-x-1 px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-md text-sm font-medium transition-colors"
            >
              <StopIcon className="w-4 h-4" />
              <span>Stop</span>
            </button>
          </div>
        </div>
      ) : (
        /* Start New Session */
        <div className="mb-6 p-4 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-3">Start Time Tracking</h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Select Task
              </label>
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a task...</option>
                {availableTasks.map(task => (
                  <option key={task.id} value={task.id}>
                    #{task.id} - {task.title}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={startTracking}
              disabled={!selectedTaskId}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <PlayIcon className="w-4 h-4" />
              <span>Start Tracking</span>
            </button>
          </div>
        </div>
      )}

      {/* Time Statistics */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Today</p>
          <p className="text-lg font-bold text-gray-800">{formatDuration(stats.todayTotal)}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 uppercase tracking-wide">This Week</p>
          <p className="text-lg font-bold text-gray-800">{formatDuration(stats.weekTotal)}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Avg Session</p>
          <p className="text-lg font-bold text-gray-800">{formatDuration(Math.round(stats.averageSession))}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Sessions</p>
          <p className="text-lg font-bold text-gray-800">{stats.sessionsToday}</p>
        </div>
      </div>

      {/* Weekly Time Chart */}
      {timeEntries.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-800 mb-3">Weekly Time Tracking</h4>
          <div className="h-32 bg-gray-50 rounded-lg p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getWeeklyTimeData()}>
                <XAxis 
                  dataKey="day" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#6B7280' }}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                  formatter={(value: any) => [`${Number(value).toFixed(1)}h`, 'Time Spent']}
                />
                <Bar 
                  dataKey="hours" 
                  fill="#3B82F6" 
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Sessions */}
      {recentEntries.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-800 mb-3">Recent Sessions</h4>
          <div className="space-y-2">
            {recentEntries.map(entry => (
              <div key={entry.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-800 truncate">{entry.taskTitle}</p>
                  <span className="text-sm font-mono text-gray-600">{formatDuration(entry.duration)}</span>
                </div>
                <p className="text-xs text-gray-500">
                  {entry.startTime.toLocaleDateString()} at {entry.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {recentEntries.length === 0 && !activeSession && (
        <div className="text-center py-8">
          <ClockIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No time tracking sessions yet</p>
          <p className="text-sm text-gray-400">Select a task above to start tracking time</p>
        </div>
      )}
    </div>
  );
};

export default ActiveTimeTracking; 