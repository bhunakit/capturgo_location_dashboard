export interface LocationData {
  latitude: number;
  longitude: number;
  created_at: string;
  speed: number;
  user_id: string;
  username?: string;
  age_range?: string;
  gender?: string;
  commute_mode?: string;
}

export interface UserIdOption {
  value: string;
  label: string;
}
