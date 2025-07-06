# PHP Server File Deployment Guide

This guide will walk you through deploying the PHP proxy file to your web server step by step.

## Prerequisites
- FTP/SFTP access to your web server
- PHP 7.4 or higher installed on the server
- Ability to set environment variables

## Step 1: Prepare the PHP File

1. Locate the file: `track-whatsapp-enhanced.php` in your project directory
2. Open it and verify the configuration at the top:

```php
// Configuration
$config = [
    'supabase_url' => $_ENV['SUPABASE_URL'] ?? 'https://ytzjxxzmgzwggjnmsxop.supabase.co',
    'supabase_anon_key' => $_ENV['SUPABASE_ANON_KEY'] ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    'ingest_secret' => $_ENV['INGEST_SECRET'] ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    // ... other settings
];
```

## Step 2: Create Environment Variables

### Option A: Using .env file (Recommended)

1. Create a file named `.env` in the same directory as the PHP file:

```bash
SUPABASE_URL=https://ytzjxxzmgzwggjnmsxop.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0emp4eHptZ3p3Z2dqbm1zeG9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMjE3NjAsImV4cCI6MjA2NjU5Nzc2MH0.Dchr1Qh87TvMNFFAepTKcwT3kRe_-OsPV9zJRO0HxlM
INGEST_SECRET=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
```

2. Add this to your `.htaccess` file to protect the .env file:

```apache
# Protect .env file
<Files .env>
    Order allow,deny
    Deny from all
</Files>
```

### Option B: Using Server Environment Variables

Add to your Apache configuration or .htaccess:

```apache
SetEnv SUPABASE_URL https://ytzjxxzmgzwggjnmsxop.supabase.co
SetEnv SUPABASE_ANON_KEY eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0emp4eHptZ3p3Z2dqbm1zeG9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMjE3NjAsImV4cCI6MjA2NjU5Nzc2MH0.Dchr1Qh87TvMNFFAepTKcwT3kRe_-OsPV9zJRO0HxlM
SetEnv INGEST_SECRET eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
```

## Step 3: Upload Files to Server

### Using FTP/SFTP:

1. Connect to your server using your FTP client (FileZilla, Cyberduck, etc.)
2. Navigate to your website's public directory (usually `public_html`, `www`, or `htdocs`)
3. Create a directory for the API endpoint:
   ```
   /public_html/api/
   ```
4. Upload the following files to `/api/`:
   - `track-whatsapp-enhanced.php`
   - `.env` (if using Option A)
   - `.htaccess` (with the security rules)

### Using cPanel File Manager:

1. Log into cPanel
2. Open File Manager
3. Navigate to public_html
4. Create new folder named "api"
5. Upload the PHP file into the api folder
6. Create .env file using the File Manager editor

## Step 4: Set Proper Permissions

Set the following permissions:
- PHP file: 644 (readable by all, writable by owner)
- .env file: 600 (readable/writable by owner only)
- api directory: 755 (standard directory permissions)

```bash
chmod 644 track-whatsapp-enhanced.php
chmod 600 .env
chmod 755 api/
```

## Step 5: Test the Endpoint

1. Access your endpoint URL:
   ```
   https://yourdomain.com/api/track-whatsapp-enhanced.php
   ```

2. You should see:
   ```json
   {"error":"Method not allowed","details":"Only POST requests are accepted"}
   ```

3. Test with curl:
   ```bash
   curl -X POST https://yourdomain.com/api/track-whatsapp-enhanced.php \
     -H "Content-Type: application/json" \
     -d '{
       "button_name": "Test Button",
       "whatsapp_number": "966501234567",
       "gtm_unique_event_id": "test-123",
       "source": "website",
       "page": "https://example.com",
       "action": "whatsapp_click",
       "client_timestamp": "2025-01-02T10:30:00Z"
     }'
   ```

## Step 6: Security Checklist

- [ ] Environment variables are set and not hardcoded
- [ ] .env file is protected from web access
- [ ] CORS is properly configured in the PHP file
- [ ] Rate limiting is enabled
- [ ] Error messages don't expose sensitive information
- [ ] HTTPS is enforced on your domain

## Troubleshooting

### Common Issues:

1. **500 Internal Server Error**
   - Check PHP error logs
   - Verify PHP version (must be 7.4+)
   - Check file permissions

2. **CORS Errors**
   - Verify allowed origins in PHP file
   - Add your domain to the $allowedOrigins array

3. **Connection to Supabase Failed**
   - Verify environment variables are loaded
   - Check if your server can make outbound HTTPS requests
   - Verify the Supabase URL and keys are correct

4. **Rate Limit Errors**
   - The default is 100 requests per minute per IP
   - Adjust in the PHP file if needed

## Final URL Structure

Your tracking endpoint will be available at:
```
https://yourdomain.com/api/track-whatsapp-enhanced.php
```

This is the URL you'll use in your GTM configuration.