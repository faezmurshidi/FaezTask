'use client';

import React, { useState, useMemo } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import '../styles/dashboard-responsive.css';
import GitActivityWidget from './Dashboard/GitActivityWidget';
import TodaysTasks from './Dashboard/TodaysTasks';
import ActiveTimeTracking from './Dashboard/ActiveTimeTracking';
import DailyProgressSummary from './Dashboard/DailyProgressSummary';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardProps {
  className?: string;
  projectPath?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  className = '', 
  projectPath = '/Users/faez/Documents/FaezPM' 
}) => {
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
    'today-tasks': <TodaysTasks projectPath={projectPath} />,
    'time-tracking': <ActiveTimeTracking projectPath={projectPath} />,
    'progress-summary': <DailyProgressSummary projectPath={projectPath} />,
    'git-activity': <GitActivityWidget projectPath={projectPath} />,
  }), [projectPath]);

  return (
    <div className={`flex-1 flex flex-col overflow-hidden bg-gray-50 ${className}`}>
      {/* Dashboard Header */}
      <div className="flex-shrink-0 p-4 sm:p-6 bg-white border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 text-xs sm:text-sm mt-1 hidden sm:block">
              Your personal software project management companion
            </p>
          </div>
          
          {/* Dashboard Controls */}
          <div className="dashboard-controls flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={() => setIsLayoutLocked(!isLayoutLocked)}
              className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors touch-target ${
                isLayoutLocked
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              <span className="hidden sm:inline">
                {isLayoutLocked ? 'Unlock Layout' : 'Lock Layout'}
              </span>
              <span className="sm:hidden">
                {isLayoutLocked ? 'Unlock' : 'Lock'}
              </span>
            </button>
            
            <button
              onClick={() => setLayouts(defaultLayouts)}
              className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors touch-target"
            >
              <span className="hidden sm:inline">Reset Layout</span>
              <span className="sm:hidden">Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="flex-1 p-2 sm:p-4 lg:p-6 overflow-auto">
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          onLayoutChange={handleLayoutChange}
          breakpoints={breakpoints}
          cols={cols}
          rowHeight={60}
          isDraggable={!isLayoutLocked}
          isResizable={!isLayoutLocked}
          margin={[8, 8]}
          containerPadding={[0, 0]}
          useCSSTransforms={true}
          measureBeforeMount={false}
          preventCollision={false}
          compactType="vertical"
          autoSize={true}
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