"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { LocationData } from '../types';
import { supabase } from '../lib/supabase';

// Import UserSelector component
const UserSelector = dynamic(() => import('../components/UserSelector'), {
  ssr: false
});

// Import Map component with dynamic loading (no SSR) to avoid mapbox-gl issues
const Map = dynamic(() => import('../components/Map'), {
  ssr: false,
  loading: () => <div className="w-full h-[70vh] bg-gray-100 rounded-lg flex items-center justify-center">Loading map...</div>
});

export default function Home() {
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Location Traces Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            View location traces for users by selecting a username
          </p>
        </header>

        <div className="bg-white shadow rounded-lg p-6">
          <UserSelector onUserSelect={handleUserSelect} />
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {loading ? (
            <div className="w-full h-[70vh] bg-gray-100 rounded-lg flex items-center justify-center">
              Loading location data...
            </div>
          ) : locationData.length > 0 ? (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">
                  Location Trace for {username || `User ${selectedUserId?.substring(0, 8)}...`}
                </h2>
                <span className="text-sm text-gray-500">
                  {locationData.length} data points
                </span>
              </div>
              <Map locationData={locationData} />
            </div>
          ) : selectedUserId ? (
            <div className="w-full h-[70vh] bg-gray-100 rounded-lg flex items-center justify-center">
              No location data found for this user
            </div>
          ) : (
            <div className="w-full h-[70vh] bg-gray-100 rounded-lg flex items-center justify-center">
              Select a user to view their location traces
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
