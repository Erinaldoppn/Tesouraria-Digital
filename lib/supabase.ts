
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ffyfockrgkuvrcxkakpw.supabase.co';
const supabaseAnonKey = 'sb_publishable_JDOXVIm_HXyVu9JZMjhSGA_LQedcX1x';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
