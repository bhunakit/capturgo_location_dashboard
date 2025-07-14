import React, { useState, useEffect } from 'react';
import { UserIdOption } from '../types';
import { supabase } from '../lib/supabase';

interface UserSelectorProps {
  onUserSelect: (userId: string) => void;
  onFilterSelect: (filters: { age_range?: string; gender?: string; commute_mode?: string }) => void;
  onModeChange: (mode: 'user' | 'filter') => void;
}

const UserSelector: React.FC<UserSelectorProps> = ({ onUserSelect, onFilterSelect, onModeChange }) => {
  const [userOptions, setUserOptions] = useState<UserIdOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'user' | 'filter'>('user');
  const [filters, setFilters] = useState<{ age_range?: string; gender?: string; commute_mode?: string }>({});

  useEffect(() => {
    async function fetchUserIds() {
      try {
        setLoading(true);
        
        // Call the get_distinct_users function to fetch unique users
        const { data, error } = await supabase.rpc('get_distinct_users');

        if (error) throw error;

        // Format the result for the dropdown
        const options = data?.map((user: { user_id: string; username: string }) => ({
          value: user.user_id,
          label: user.username || `User ${user.user_id.substring(0, 8)}...`
        })) || [];

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

  const handleModeChange = () => {
    const newMode = mode === 'user' ? 'filter' : 'user';
    setMode(newMode);
    onModeChange(newMode);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>, field: string) => {
    const value = e.target.value;
    const updatedFilters = { ...filters, [field]: value || undefined };
    setFilters(updatedFilters);
    onFilterSelect(updatedFilters);
  };

  return (
    <div className="w-full">
      <div className="max-w-md mx-auto">
        {loading ? (
          <div className="flex items-center justify-center space-x-2 bg-gray-800/90 backdrop-blur-sm rounded-full py-3 px-4 shadow-lg text-sm text-gray-400">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading users</span>
          </div>
        ) : error ? (
          <div className="bg-red-500/90 backdrop-blur-sm text-white rounded-full py-3 px-4 shadow-lg text-sm">
            {error}
          </div>
        ) : (
          <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg transition-all">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-gray-300">View Mode</h3>
              <div className="flex items-center space-x-2">
                <span className={`text-xs font-medium ${mode === 'user' ? 'text-gray-300' : 'text-gray-400'}`}>User</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mode === 'filter'}
                    onChange={handleModeChange}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-600 rounded-full peer peer-checked:bg-gray-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                </label>
                <span className={`text-xs font-medium ${mode === 'filter' ? 'text-gray-300' : 'text-gray-400'}`}>Filter</span>
              </div>
            </div>
            {mode === 'user' ? (
              <div className="relative">
                <select
                  id="user-select"
                  value={selectedUserId}
                  onChange={handleUserChange}
                  className="block w-full rounded-full border-0 bg-gray-800/90 backdrop-blur-sm text-white ring-1 ring-inset ring-gray-600/50 focus:ring-2 focus:ring-gray-500 py-3 px-5 text-sm shadow-lg appearance-none transition-all"
                >
                  <option value="">Select user</option>
                  {userOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <select
                    id="age-range-select"
                    value={filters.age_range || ''}
                    onChange={(e) => handleFilterChange(e, 'age_range')}
                    className="block w-full rounded-full border-0 bg-gray-800/90 backdrop-blur-sm text-white ring-1 ring-inset ring-gray-600/50 focus:ring-2 focus:ring-gray-500 py-2.5 px-5 text-sm shadow-lg appearance-none transition-all"
                  >
                    <option value="">Any Age Range</option>
                    <option value="18-24">18-24</option>
                    <option value="25-34">25-34</option>
                    <option value="35-44">35-44</option>
                    <option value="45-54">45-54</option>
                    <option value="55+">55+</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
                <div className="relative">
                  <select
                    id="gender-select"
                    value={filters.gender || ''}
                    onChange={(e) => handleFilterChange(e, 'gender')}
                    className="block w-full rounded-full border-0 bg-gray-800/90 backdrop-blur-sm text-white ring-1 ring-inset ring-gray-600/50 focus:ring-2 focus:ring-gray-500 py-2.5 px-5 text-sm shadow-lg appearance-none transition-all"
                  >
                    <option value="">Any Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
                <div className="relative">
                  <select
                    id="commute-mode-select"
                    value={filters.commute_mode || ''}
                    onChange={(e) => handleFilterChange(e, 'commute_mode')}
                    className="block w-full rounded-full border-0 bg-gray-800/90 backdrop-blur-sm text-white ring-1 ring-inset ring-gray-600/50 focus:ring-2 focus:ring-gray-500 py-2.5 px-5 text-sm shadow-lg appearance-none transition-all"
                  >
                    <option value="">Any Commute Mode</option>
                    <option value="Car">Car</option>
                    <option value="Public Transport">Public Transport</option>
                    <option value="Bike">Bike</option>
                    <option value="Walk">Walk</option>
                    <option value="Other">Other</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSelector;
