import { createClient } from "@supabase/supabase-js";

// REPLACE THESE with your actual Supabase project URL and Anon Key
// You can find these in your Supabase Dashboard under Settings > API
const supabaseUrl = "https://rmzrusozxhjamefniptw.supabase.co";
const supabaseAnonKey = "sb_publishable_6kq5lWEzFtyA01JDw0ZEvA_L2NzP3ND";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
