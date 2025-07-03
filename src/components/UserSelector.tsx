import React, { useState, useEffect } from 'react';
import { UserIdOption } from '../types';
import { supabase } from '../lib/supabase';

interface UserSelectorProps {
  onUserSelect: (userId: string) => void;
}

const UserSelector: React.FC<UserSelectorProps> = ({ onUserSelect }) => {
  const [userOptions, setUserOptions] = useState<UserIdOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserIds() {
      try {
        setLoading(true);
        
        // First get unique user IDs from locations_aggregated
        const { data: locationData, error: locationError } = await supabase
          .from('locations_aggregated')
          .select('user_id')
          .order('user_id');

        if (locationError) throw locationError;
        
        // Get unique user IDs
        const uniqueUserIds = Array.from(new Set(locationData?.map((item: { user_id: string }) => item.user_id) || []));
        
        // Fetch profile data for these user IDs
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', uniqueUserIds);

        if (error) throw error;
        
        // Create a map of user IDs to usernames
        const userMap = new Map<string, string>();
        
        // Add all unique user IDs with default names
        uniqueUserIds.forEach((userId: string) => {
          userMap.set(userId, `User ${userId.substring(0, 8)}...`);
        });
        
        // Update with actual usernames where available
        data?.forEach((profile: { id: string, username: string }) => {
          if (profile.id && profile.username) {
            userMap.set(profile.id, profile.username);
          }
        });
        
        // Format for dropdown
        const options = Array.from(userMap.entries()).map(([id, username]) => ({
          value: id,
          label: username
        }));

        setUserOptions(options);
      } catch (err) {
        console.error('Error fetching user IDs:', err);
        setError('Failed to load user IDs');
      } finally {
        setLoading(false);
      }
    }

    fetchUserIds();
  }, []);

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const userId = e.target.value;
    setSelectedUserId(userId);
    onUserSelect(userId);
  };

  return (
    <div className="mb-5">
      {loading ? (
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading users</span>
        </div>
      ) : error ? (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      ) : (
        <div className="relative">
          <select
            id="user-select"
            value={selectedUserId}
            onChange={handleUserChange}
            className="block w-full rounded-lg border-0 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-blue-500 py-2 px-3 text-sm"
            style={{ appearance: 'none' }}
          >
            <option value="">Select user</option>
            {userOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 dark:text-gray-400">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSelector;
