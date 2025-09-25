# Azure OAuth Configuration Guide for Conference Hub

This guide will walk you through setting up Microsoft Azure OAuth authentication for your Conference Hub application.

## Prerequisites

- Azure account with access to Azure Active Directory
- Supabase project with admin access
- Conference Hub application deployed or running locally

## Step 1: Azure AD App Registration

### 1.1 Create Azure AD Application

1. Go to the [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **"New registration"**
4. Fill in the application details:
   - **Name**: `Conference Hub`
   - **Supported account types**: Choose based on your needs:
     - **Single tenant**: Only your organization users
     - **Multi-tenant**: Any Azure AD organization users  
     - **Personal + organizational**: Broadest access (includes personal Microsoft accounts)
   - **Redirect URI**: 
     - Platform: **Web**
     - URI: `https://your-supabase-project.supabase.co/auth/v1/callback`
     - Replace `your-supabase-project` with your actual Supabase project reference

5. Click **"Register"**

### 1.2 Get Application Credentials

1. After registration, note down these values from the **Overview** page:
   - **Application (client) ID**
   - **Directory (tenant) ID**

2. Generate a client secret:
   - Go to **Certificates & secrets** > **Client secrets**
   - Click **"New client secret"**
   - Add description: `Conference Hub Secret`
   - Choose expiration period (recommend 24 months)
   - Click **"Add"**
   - **Important**: Copy the secret **Value** immediately (it won't be shown again)

### 1.3 Configure API Permissions (Optional)

1. Go to **API permissions**
2. The default **User.Read** permission should be sufficient
3. Optionally add:
   - **profile** - to get user's profile information
   - **email** - to get user's email (usually included by default)

## Step 2: Supabase Configuration

### 2.1 Enable Azure Provider

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your Conference Hub project
3. Navigate to **Authentication** > **Providers**
4. Find **Azure** and toggle it **ON**

### 2.2 Configure Azure Provider Settings

Fill in the following fields:

- **Azure Client ID**: The Application (client) ID from Step 1.2
- **Azure Client Secret**: The client secret value from Step 1.2
- **Azure Tenant URL**: Choose based on your Step 1.1 choice:
  - **Single tenant**: `https://login.microsoftonline.com/{tenant-id}`
  - **Multi-tenant**: `https://login.microsoftonline.com/common`
  - **Personal + organizational**: `https://login.microsoftonline.com/common`

Replace `{tenant-id}` with your actual Directory (tenant) ID from Step 1.2.

### 2.3 Configure Redirect URLs

1. In Supabase, go to **Authentication** > **URL Configuration**
2. Add your application URLs to **Redirect URLs**:
   - Development: `http://localhost:3000/**`
   - Production: `https://yourdomain.com/**`

## Step 3: Environment Variables

Add these environment variables to your `.env.local` file:

```env
# Azure OAuth Configuration (optional - for reference)
NEXT_PUBLIC_AZURE_TENANT_ID=your-tenant-id-here
NEXT_PUBLIC_AZURE_CLIENT_ID=your-client-id-here

# Note: Client secret is configured in Supabase, not in your app
```

## Step 4: Update Azure Redirect URIs

1. Back in Azure Portal, go to your app registration
2. Navigate to **Authentication** > **Platform configurations**
3. Under **Web**, add these redirect URIs:
   - `https://your-supabase-project.supabase.co/auth/v1/callback`
   - Add any additional redirect URIs you configured in Supabase

## Step 5: Test the Integration

### 5.1 Local Testing

1. Start your Next.js application: `npm run dev`
2. Navigate to the login page
3. Click **"Sign in with Microsoft"**
4. You should be redirected to Microsoft login
5. After authentication, you should be redirected back to your app

### 5.2 User Flow Verification

1. **New User**: Should create profile and redirect to complete-profile if needed
2. **Existing User**: Should log in directly to dashboard
3. **Admin User**: Should be able to access admin areas
4. **Email Verification**: OAuth users should NOT be required to verify emails

## Step 6: Production Deployment

1. Update environment variables in your production environment
2. Update redirect URIs in both Azure and Supabase for production domain
3. Test the complete flow in production

## Troubleshooting

### Common Issues

1. **"Redirect URI mismatch"**
   - Ensure redirect URIs match exactly in Azure and Supabase
   - Check for trailing slashes or protocol mismatches

2. **"Application not found"**
   - Verify Client ID is correct
   - Ensure app registration is active

3. **"Invalid client secret"**
   - Client secret may have expired
   - Generate a new secret in Azure

4. **"User not found after OAuth"**
   - Check your `handle_new_user()` database function
   - Verify user creation logic in your application

### Debug Steps

1. Check browser console for error messages
2. Check Supabase logs in Dashboard > Logs
3. Verify database trigger is working properly
4. Test with a fresh incognito/private browser session

## Security Considerations

1. **Client Secret**: Never expose client secret in client-side code
2. **Redirect URIs**: Only add trusted domains to redirect URI list
3. **Scopes**: Request only necessary permissions
4. **Token Storage**: Supabase handles secure token storage

## Testing with Different Account Types

1. **Personal Microsoft Account**: Test with @outlook.com, @hotmail.com
2. **Work Account**: Test with your organization's Azure AD account  
3. **School Account**: Test with educational institution accounts

## Next Steps

After successful configuration:

1. Monitor authentication logs for any issues
2. Consider implementing additional Azure features:
   - Group-based role assignment
   - Conditional access policies
   - Multi-factor authentication requirements
3. Set up monitoring and alerts for authentication failures

## Support

If you encounter issues:

1. Check Azure AD logs in Azure Portal
2. Review Supabase authentication logs
3. Verify your database trigger function is working correctly
4. Test with different browser/account combinations

---

✅ **Your Azure OAuth integration is now complete!**

Users can now sign in and sign up using their Microsoft accounts without email verification.
