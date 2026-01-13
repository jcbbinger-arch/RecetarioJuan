import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://crezcevjhvbzwucnmfjb.supabase.co';
const supabaseKey = 'sb_secret_Glk2l56ZOshck--tbXKeBQ_6ZemDaed';

export const supabase = createClient(supabaseUrl, supabaseKey);
