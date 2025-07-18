# Environment Variables Setup

To run the notification cron job locally and in production, you need to set up your environment variables correctly.

## Setting up .env.local

Create a `.env.local` file in the project root with the following variables:

```
# Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here

# App configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cron job configuration - use the same key in vercel.json
CRON_API_KEY=dev_cron_api_key_for_testing
```

For local development, replace the placeholders with your actual Supabase credentials, but you can keep the default API key `dev_cron_api_key_for_testing` for testing.

## Production Environment Variables

When deploying to Vercel:

1. Go to your project settings
2. Navigate to "Environment Variables" 
3. Add all the variables from your `.env.local` file
4. For production, consider using a more secure random string for `CRON_API_KEY`

## Important Notes

- The `CRON_API_KEY` value in your environment variables must match the one in `vercel.json`
- Never commit your `.env.local` file to version control
- The `SUPABASE_SERVICE_ROLE_KEY` is sensitive and should be kept secure

## Testing Your Setup

1. Start your development server with `npm run dev`
2. In a separate terminal, run `npm run dev:cron` to start the cron job simulator
3. Check the terminal output to confirm the cron job is running without authorization errors
4. Once it works locally, deploy to Vercel to test the production setup 