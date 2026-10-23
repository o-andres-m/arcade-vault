'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Profile {
  username: string;
  avatar_url: string | null;
}

export function useProfile(userId: string | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }

    const fetch = async () => {
      setLoading(true);
      const supabase = createClient();

      const { data, error: queryError } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', userId)
        .single();

      if (queryError) {
        setError(queryError as Error);
        setProfile(null);
      } else {
        setProfile(data);
      }
      setLoading(false);
    };

    fetch();
  }, [userId]);

  return { profile, loading, error };
}
