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
    <div className="mb-6">
      <label htmlFor="user-select" className="block text-sm font-medium text-gray-700 mb-2">
        Select User
      </label>
      
      {loading ? (
        <p className="text-sm text-gray-500">Loading user IDs...</p>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : (
        <div className="relative">
          <select
            id="user-select"
            value={selectedUserId}
            onChange={handleUserChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3"
          >
            <option value="">Select a user</option>
            {userOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default UserSelector;
