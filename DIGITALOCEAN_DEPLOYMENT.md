# DigitalOcean Deployment Guide for WPDash

This guide provides multiple deployment options for the WPDash analytics system on DigitalOcean.

## Prerequisites

1. A DigitalOcean account
2. A GitHub account (if using GitHub integration)
3. The Supabase project is already set up and running

## Deployment Options

### Option 1: App Platform with GitHub Integration (Recommended)

1. **Fork the Repository**
   - Fork https://github.com/GenZMedia-ai/wpdash-analytics to your GitHub account
   - This allows DigitalOcean to access your repository

2. **Create App via DigitalOcean Dashboard**
   - Go to https://cloud.digitalocean.com/apps
   - Click "Create App"
   - Choose "GitHub" as source
   - Authorize DigitalOcean to access your GitHub
   - Select your forked repository
   - Choose branch: `main`

3. **Configure the App**
   - **Name**: wpdash-analytics
   - **Region**: Choose closest to your users (e.g., NYC)
   - **Service Type**: Web Service
   - **Source Directory**: `/dashboard`
   - **Build Command**: `npm install && npm run build`
   - **Run Command**: `npm start`
   - **HTTP Port**: 3000
   - **Instance Size**: Basic ($5/month)

4. **Set Environment Variables**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://ytzjxxzmgzwggjnmsxop.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0emp4eHptZ3p3Z2dqbm1zeG9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMjE3NjAsImV4cCI6MjA2NjU5Nzc2MH0.Dchr1Qh87TvMNFFAepTKcwT3kRe_-OsPV9zJRO0HxlM
   ```

5. **Deploy**
   - Click "Next" and then "Create Resources"
   - Wait for deployment to complete (5-10 minutes)

### Option 2: Droplet Deployment (More Control)

1. **Create a Droplet**
   - Size: Basic, 1 GB RAM ($6/month)
   - Image: Ubuntu 22.04
   - Region: Choose closest to users
   - Add SSH keys for secure access

2. **Connect to Droplet**
   ```bash
   ssh root@your-droplet-ip
   ```

3. **Install Dependencies**
   ```bash
   # Update system
   apt update && apt upgrade -y
   
   # Install Node.js 18
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   apt-get install -y nodejs
   
   # Install PM2 for process management
   npm install -g pm2
   
   # Install Nginx
   apt install nginx -y
   
   # Install Git
   apt install git -y
   ```

4. **Clone and Setup Application**
   ```bash
   # Clone repository
   cd /var/www
   git clone https://github.com/GenZMedia-ai/wpdash-analytics.git
   cd wpdash-analytics/dashboard
   
   # Install dependencies
   npm install
   
   # Create environment file
   cat > .env.local << EOF
   NEXT_PUBLIC_SUPABASE_URL=https://ytzjxxzmgzwggjnmsxop.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0emp4eHptZ3p3Z2dqbm1zeG9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMjE3NjAsImV4cCI6MjA2NjU5Nzc2MH0.Dchr1Qh87TvMNFFAepTKcwT3kRe_-OsPV9zJRO0HxlM
   EOF
   
   # Build application
   npm run build
   ```

5. **Configure PM2**
   ```bash
   # Start application with PM2
   pm2 start npm --name "wpdash" -- start
   
   # Save PM2 configuration
   pm2 save
   pm2 startup systemd
   ```

6. **Configure Nginx**
   ```bash
   # Create Nginx configuration
   cat > /etc/nginx/sites-available/wpdash << EOF
   server {
       listen 80;
       server_name your-domain.com;
   
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade \$http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host \$host;
           proxy_cache_bypass \$http_upgrade;
       }
   }
   EOF
   
   # Enable site
   ln -s /etc/nginx/sites-available/wpdash /etc/nginx/sites-enabled/
   
   # Test and restart Nginx
   nginx -t
   systemctl restart nginx
   ```

7. **Setup SSL (Optional but Recommended)**
   ```bash
   # Install Certbot
   apt install certbot python3-certbot-nginx -y
   
   # Get SSL certificate
   certbot --nginx -d your-domain.com
   ```

### Option 3: Docker Deployment on Droplet

1. **Create Droplet with Docker**
   - Choose "Marketplace" → "Docker on Ubuntu"
   - Size: 2 GB RAM recommended

2. **Deploy with Docker**
   ```bash
   # Connect to droplet
   ssh root@your-droplet-ip
   
   # Clone repository
   git clone https://github.com/GenZMedia-ai/wpdash-analytics.git
   cd wpdash-analytics
   
   # Create .env file
   cat > dashboard/.env.local << EOF
   NEXT_PUBLIC_SUPABASE_URL=https://ytzjxxzmgzwggjnmsxop.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0emp4eHptZ3p3Z2dqbm1zeG9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMjE3NjAsImV4cCI6MjA2NjU5Nzc2MH0.Dchr1Qh87TvMNFFAepTKcwT3kRe_-OsPV9zJRO0HxlM
   EOF
   
   # Build and run Docker container
   docker build -t wpdash .
   docker run -d -p 80:3000 --name wpdash --restart always wpdash
   ```

## PHP Proxy Deployment

The PHP tracking proxy (`track-whatsapp-enhanced.php`) needs to be deployed on your WordPress/website server, not on DigitalOcean.

1. **Upload to Website Server**
   - Place `track-whatsapp-enhanced.php` in your website's public directory
   - Usually at `/public_html/api/` or similar

2. **Configure PHP Environment**
   ```bash
   # Create .env file in the same directory
   SUPABASE_URL=https://ytzjxxzmgzwggjnmsxop.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0emp4eHptZ3p3Z2dqbm1zeG9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMjE3NjAsImV4cCI6MjA2NjU5Nzc2MH0.Dchr1Qh87TvMNFFAepTKcwT3kRe_-OsPV9zJRO0HxlM
   INGEST_SECRET=your-secret-key
   ```

3. **Update GTM Configuration**
   - Point GTM tags to: `https://your-website.com/api/track-whatsapp-enhanced.php`

## Post-Deployment Steps

1. **Verify Deployment**
   - Visit your app URL
   - Check that the dashboard loads
   - Verify connection to Supabase

2. **Test Tracking**
   - Send a test event using the provided scripts
   - Check that data appears in the dashboard

3. **Monitor Performance**
   - Use DigitalOcean monitoring
   - Set up alerts for downtime

## Costs

- **App Platform**: Starting at $5/month
- **Basic Droplet**: Starting at $6/month
- **Docker Droplet**: Starting at $12/month (2GB RAM)
- **Bandwidth**: Included in pricing tiers

## Support

For issues specific to:
- **Dashboard**: Check browser console for errors
- **Tracking**: Verify PHP proxy logs
- **Database**: Check Supabase logs
- **Deployment**: Review DigitalOcean app logs

## Security Notes

1. Always use HTTPS in production
2. Keep environment variables secure
3. Regularly update dependencies
4. Monitor for suspicious activity
5. Set up firewall rules on Droplets