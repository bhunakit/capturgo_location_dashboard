"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { LocationData } from '../types';
import { supabase } from '../lib/supabase';
import { AuthProvider, useAuth } from '../context/AuthContext';
import LoginPage from '../components/LoginPage';
import LogoutButton from '../components/LogoutButton';

// Import UserSelector component
const UserSelector = dynamic(() => import('../components/UserSelector'), {
  ssr: false
});

// Import Map component with dynamic loading (no SSR) to avoid mapbox-gl issues
const Map = dynamic(() => import('../components/Map'), {
  ssr: false,
  loading: () => <div className="w-full h-[70vh] bg-gray-100 rounded-lg flex items-center justify-center">Loading map...</div>
});

function Dashboard() {
  const [locationData, setLocationData] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");

  const handleUserSelect = async (userId: string) => {
    if (!userId) {
      setLocationData([]);
      setSelectedUserId(null);
      setUsername("");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSelectedUserId(userId);
      
      // Fetch username from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single();
        
      if (profileData?.username) {
        setUsername(profileData.username);
      } else {
        // If no username found, use truncated user ID
        setUsername(`User ${userId.substring(0, 8)}...`);
      }
      
      // Log any profile fetch errors but continue with location data
      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }

      const { data, error } = await supabase
        .from('locations_aggregated')
        .select('latitude, longitude, created_at, speed')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Add user_id to each location data item to match the LocationData type
      const locationsWithUserId = (data || []).map(item => ({
        ...item,
        user_id: userId
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-medium text-gray-900 dark:text-white">Locations</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Select a user to view their location data
            </p>
          </div>
          <LogoutButton />
        </header>

        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-5">
          <UserSelector onUserSelect={handleUserSelect} />
          
          {error && (
            <div className="mb-5 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded-lg">
              {error}
            </div>
          )}

          {loading ? (
            <div className="w-full h-[70vh] bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-300">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading
            </div>
          ) : locationData.length > 0 ? (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-medium text-gray-900 dark:text-white">
                  {username || `User ${selectedUserId?.substring(0, 8)}...`}
                </h2>
                <span className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full">
                  {locationData.length} points
                </span>
              </div>
              <Map locationData={locationData} />
            </div>
          ) : selectedUserId ? (
            <div className="w-full h-[70vh] bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
              No location data available
            </div>
          ) : (
            <div className="w-full h-[70vh] bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
              Select a user to view location data
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Home() {
  const { isAuthenticated } = useAuth();
  
  return isAuthenticated ? <Dashboard /> : <LoginPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <Home />
    </AuthProvider>
  );
}
