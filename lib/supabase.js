"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminClient = exports.supabase = void 0;
var supabase_js_1 = require("@supabase/supabase-js");
// These environment variables need to be set in your .env.local file
var supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
var supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
// Create a single supabase client for interacting with your database
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey);
// Create a client that bypasses RLS for server-side operations
// Note: In a production app, you should only use this on the server side
// and protect it with proper authentication checks
// This is just for demonstration purposes
var createAdminClient = function () {
    var supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseServiceKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables.');
    }
    return (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
};
exports.createAdminClient = createAdminClient;
