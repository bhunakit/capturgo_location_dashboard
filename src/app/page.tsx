'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '../lib/supabase';
import { LocationData } from '../types';
import ServerLogoutButton from '../components/ServerLogoutButton';

// Import Map component with dynamic loading to prevent SSR issues
const Map = dynamic(() => import('../components/Map'), {
  ssr: false,
});

// Import UserSelector component
const UserSelector = dynamic(() => import('../components/UserSelector'), {
  ssr: false,
});

function Dashboard() {
  const [locationData, setLocationData] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [mode, setMode] = useState<'user' | 'filter'>('user');
  const [filters, setFilters] = useState<{ age_range?: string; gender?: string; commute_mode?: string }>({});
  const [filterSummary, setFilterSummary] = useState<string>('');

  useEffect(() => {
    // Check if we're authenticated on the client side
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check');
        if (!response.ok) {
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('Auth check error:', error);
      }
    };

    checkAuth();
  }, []);

  const handleUserSelect = async (userId: string) => {
    if (!userId) {
      setLocationData([]);
      setSelectedUserId(null);
      setUsername('');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSelectedUserId(userId);

      // Fetch location data and username from the aggregated table
      const { data, error } = await supabase
        .from('locations_aggregated')
        .select('latitude, longitude, created_at, speed, username')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Set username from the first record (it's the same for all)
      if (data && data.length > 0) {
        setUsername(data[0].username || `User ${userId.substring(0, 8)}...`);
      } else {
        // Fallback if no data is returned but a user is selected
        setUsername(`User ${userId.substring(0, 8)}...`);
      }

      // Add user_id to each location data item to match the LocationData type
      const locationsWithUserId = (data || []).map((item) => ({
        ...item,
        user_id: userId,
      }));
      setLocationData(locationsWithUserId);
    } catch (err) {
      console.error('Error fetching location data:', err);
      setError('Failed to load location data');
      setLocationData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSelect = async (newFilters: {
    age_range?: string;
    gender?: string;
    commute_mode?: string;
  }) => {
    setFilters(newFilters);

    // Build a readable summary of applied filters
    const filterParts = [];
    if (newFilters.age_range) filterParts.push(`Age: ${newFilters.age_range}`);
    if (newFilters.gender) filterParts.push(`Gender: ${newFilters.gender}`);
    if (newFilters.commute_mode) filterParts.push(`Commute: ${newFilters.commute_mode}`);
    setFilterSummary(filterParts.join(', ') || 'No filters applied');

    // Only fetch data if there are actual filters applied
    if (Object.values(newFilters).some((val) => val)) {
      try {
        setLoading(true);
        setError(null);
        setSelectedUserId(null);
        setUsername(null);

        // Build the query with filters
        let query = supabase
          .from('locations_aggregated')
          .select('latitude, longitude, created_at, speed, user_id, username, age_range, gender, commute_mode');

        if (newFilters.age_range) {
          query = query.eq('age_range', newFilters.age_range);
        }
        if (newFilters.gender) {
          query = query.eq('gender', newFilters.gender);
        }
        if (newFilters.commute_mode) {
          query = query.eq('commute_mode', newFilters.commute_mode);
        }

        const { data, error } = await query.order('created_at', { ascending: true });

        if (error) throw error;
        setLocationData(data || []);
      } catch (err) {
        console.error('Error fetching filtered data:', err);
        setError('Failed to load filtered data');
        setLocationData([]);
      } finally {
        setLoading(false);
      }
    } else {
      // If no filters are selected, clear the map
      setLocationData([]);
    }
  };

  const handleModeChange = (newMode: 'user' | 'filter') => {
    setMode(newMode);
    setLocationData([]);
    setSelectedUserId(null);
    setUsername(null);
    setFilterSummary('');
    setFilters({});
  };

  return (
    <div className="min-h-screen">
      {/* Map component - lowest z-index */}
      <div className="fixed inset-0 z-0">
        {locationData.length > 0 ? (
          <Map locationData={locationData} />
        ) : (
          <div className="w-full h-screen bg-gray-100 dark:bg-gray-800" />
        )}
      </div>

      {/* UI Layer - higher z-index */}
      <div className="relative z-10 w-full h-screen pointer-events-none">
        {/* Floating logout button */}
        <div className="absolute top-5 right-5 pointer-events-auto">
          <ServerLogoutButton />
        </div>

        {/* User selector - explicitly enable pointer events */}
        <div className="absolute top-5 left-0 right-0 px-4 sm:px-6 md:px-8 pointer-events-auto">
          <UserSelector
            onUserSelect={handleUserSelect}
            onFilterSelect={handleFilterSelect}
            onModeChange={handleModeChange}
          />
        </div>

        {/* Status indicators */}
        {error && (
          <div className="absolute top-20 left-0 right-0 px-4 sm:px-6 md:px-8 pointer-events-auto">
            <div className="max-w-md mx-auto bg-red-500/90 backdrop-blur-sm text-white rounded-full py-3 px-5 shadow-lg text-sm">
              {error}
            </div>
          </div>
        )}

        {/* User info overlay */}
        {locationData.length > 0 && mode === 'user' && (
          <div className="absolute bottom-5 left-0 right-0 px-4 sm:px-6 md:px-8 pointer-events-auto">
            <div className="max-w-md mx-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full py-3 px-5 shadow-lg flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-900 dark:text-white">
                {username || `User ${selectedUserId?.substring(0, 8)}...`}
              </h2>
              <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded-full">
                {locationData.length} Location Points
              </span>
            </div>
          </div>
        )}

        {/* Filter summary overlay */}
        {locationData.length > 0 && mode === 'filter' && (
          <div className="absolute bottom-5 left-0 right-0 px-4 sm:px-6 md:px-8 pointer-events-auto">
            <div className="max-w-md mx-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full py-3 px-5 shadow-lg flex items-center justify-between text-gray-900 dark:text-white">
              <h2 className="text-sm font-medium flex-1 truncate">
                {filterSummary}
              </h2>
              <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded-full">
                {locationData.length} Location Points
              </span>
            </div>
          </div>
        )}

        {/* Empty state overlay */}
        {!loading && locationData.length === 0 && selectedUserId && mode === 'user' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full py-3 px-5 shadow-lg text-gray-500 dark:text-gray-400 text-sm pointer-events-auto">
              No location data available
            </div>
          </div>
        )}

        {/* Empty filter state overlay */}
        {!loading && locationData.length === 0 && mode === 'filter' && Object.values(filters).some((val) => val) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full py-3 px-5 shadow-lg text-gray-500 dark:text-gray-400 text-sm pointer-events-auto">
              No data matching selected filters
            </div>
          </div>
        )}

        {/* Initial state overlay */}
        {!loading && !selectedUserId && mode === 'user' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full py-3 px-5 shadow-lg text-gray-500 dark:text-gray-400 text-sm pointer-events-auto">
              Select a user to view location data
            </div>
          </div>
        )}

        {/* Initial filter state overlay */}
        {!loading && mode === 'filter' && !Object.values(filters).some((val) => val) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full py-3 px-5 shadow-lg text-gray-500 dark:text-gray-400 text-sm pointer-events-auto">
              Apply filters to view demographic data
            </div>
          </div>
        )}
      </div>

      {/* Loading overlay - highest z-index */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white/90 dark:bg-gray-800/90 rounded-full py-3 px-5 shadow-lg flex items-center space-x-3 text-gray-500 dark:text-gray-300">
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Loading</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return <Dashboard />;
}
