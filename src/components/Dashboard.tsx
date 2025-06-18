'use client';

import React, { useState, useMemo } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import GitActivityWidget from './Dashboard/GitActivityWidget';

const ResponsiveGridLayout = WidthProvider(Responsive);

// Widget components (placeholders for now, will be implemented in subsequent subtasks)
const TodaysTasks = () => (
  <div className="h-full bg-white rounded-lg border border-gray-200 p-4">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">Today&apos;s Tasks</h3>
    <div className="text-gray-500 text-center">
      <p>TodaysTasks widget coming soon...</p>
    </div>
  </div>
);

const ActiveTimeTracking = () => (
  <div className="h-full bg-white rounded-lg border border-gray-200 p-4">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">Active Time Tracking</h3>
    <div className="text-gray-500 text-center">
      <p>ActiveTimeTracking widget coming soon...</p>
    </div>
  </div>
);

const DailyProgressSummary = () => (
  <div className="h-full bg-white rounded-lg border border-gray-200 p-4">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Progress Summary</h3>
    <div className="text-gray-500 text-center">
      <p>DailyProgressSummary widget coming soon...</p>
    </div>
  </div>
);

interface DashboardProps {
  className?: string;
  projectPath?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  className = '', 
  projectPath = '/Users/faez/Documents/FaezPM' 
}) => {
  // Git Activity widget that uses the project path
  const GitActivity = () => (
    <GitActivityWidget projectPath={projectPath} />
  );

  // Default layout configuration for dashboard widgets
  const defaultLayouts = {
    lg: [
      { i: 'today-tasks', x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
      { i: 'time-tracking', x: 6, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
      { i: 'progress-summary', x: 0, y: 4, w: 6, h: 4, minW: 4, minH: 3 },
      { i: 'git-activity', x: 6, y: 4, w: 6, h: 4, minW: 4, minH: 3 },
    ],
    md: [
      { i: 'today-tasks', x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
      { i: 'time-tracking', x: 6, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
      { i: 'progress-summary', x: 0, y: 4, w: 6, h: 4, minW: 4, minH: 3 },
      { i: 'git-activity', x: 6, y: 4, w: 6, h: 4, minW: 4, minH: 3 },
    ],
    sm: [
      { i: 'today-tasks', x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
      { i: 'time-tracking', x: 0, y: 4, w: 6, h: 4, minW: 4, minH: 3 },
      { i: 'progress-summary', x: 0, y: 8, w: 6, h: 4, minW: 4, minH: 3 },
      { i: 'git-activity', x: 0, y: 12, w: 6, h: 4, minW: 4, minH: 3 },
    ],
    xs: [
      { i: 'today-tasks', x: 0, y: 0, w: 4, h: 4, minW: 4, minH: 3 },
      { i: 'time-tracking', x: 0, y: 4, w: 4, h: 4, minW: 4, minH: 3 },
      { i: 'progress-summary', x: 0, y: 8, w: 4, h: 4, minW: 4, minH: 3 },
      { i: 'git-activity', x: 0, y: 12, w: 4, h: 4, minW: 4, minH: 3 },
    ],
  };

  const [layouts, setLayouts] = useState(defaultLayouts);
  const [isLayoutLocked, setIsLayoutLocked] = useState(false);

  // Breakpoints for responsive design
  const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480 };
  const cols = { lg: 12, md: 12, sm: 6, xs: 4 };

  // Handle layout changes
  const handleLayoutChange = (layout: Layout[], allLayouts: any) => {
    setLayouts(allLayouts);
    // TODO: Persist layout to localStorage or user preferences
  };

  // Widget renderer mapping
  const widgets = useMemo(() => ({
    'today-tasks': <TodaysTasks />,
    'time-tracking': <ActiveTimeTracking />,
    'progress-summary': <DailyProgressSummary />,
    'git-activity': <GitActivity />,
  }), []);

  return (
    <div className={`flex-1 flex flex-col overflow-hidden bg-gray-50 ${className}`}>
      {/* Dashboard Header */}
      <div className="flex-shrink-0 p-6 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 text-sm mt-1">
              Your personal software project management companion
            </p>
          </div>
          
          {/* Dashboard Controls */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsLayoutLocked(!isLayoutLocked)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                isLayoutLocked
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {isLayoutLocked ? 'Unlock Layout' : 'Lock Layout'}
            </button>
            
            <button
              onClick={() => setLayouts(defaultLayouts)}
              className="px-3 py-1.5 text-sm font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Reset Layout
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="flex-1 p-6 overflow-auto">
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          onLayoutChange={handleLayoutChange}
          breakpoints={breakpoints}
          cols={cols}
          rowHeight={60}
          isDraggable={!isLayoutLocked}
          isResizable={!isLayoutLocked}
          margin={[16, 16]}
          containerPadding={[0, 0]}
          useCSSTransforms={true}
          measureBeforeMount={false}
          preventCollision={false}
          compactType="vertical"
        >
          {Object.entries(widgets).map(([key, component]) => (
            <div key={key} className="dashboard-widget">
              {component}
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>
    </div>
  );
};

export default Dashboard; 