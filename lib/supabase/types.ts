export interface SignUpData {
  email: string;
  password: string;
  username: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface UpdateProfileData {
  username?: string;
  bio?: string;
  avatar_url?: string;
}

export interface SaveScoreData {
  game_id: string;
  score: number;
}
