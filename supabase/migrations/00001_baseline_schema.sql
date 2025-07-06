-- Baseline Schema Migration for WPDash
-- This creates all necessary tables and functions for the WhatsApp click tracking system

BEGIN;

-- Create the main events table
CREATE TABLE IF NOT EXISTS public.events (
  id BIGSERIAL PRIMARY KEY,
  
  -- Core Event Data
  gtm_unique_event_id UUID UNIQUE NOT NULL,
  button_name VARCHAR(255) NOT NULL,
  whatsapp_number VARCHAR(50) NOT NULL,
  page VARCHAR(1000),
  source VARCHAR(50) DEFAULT 'website',
  action VARCHAR(50) DEFAULT 'whatsapp_click',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  client_timestamp TIMESTAMPTZ,
  server_timestamp TIMESTAMPTZ,
  
  -- Device Information
  device_type VARCHAR(50),
  browser_name VARCHAR(100),
  browser_version VARCHAR(50),
  os_name VARCHAR(100),
  os_version VARCHAR(50),
  is_mobile BOOLEAN,
  
  -- Screen Information
  screen_width INTEGER,
  screen_height INTEGER,
  
  -- Geographic Information
  client_ip INET,
  country VARCHAR(100),
  country_code VARCHAR(2),
  region VARCHAR(100),
  city VARCHAR(100),
  lat FLOAT,
  lon FLOAT,
  timezone VARCHAR(100),
  isp VARCHAR(255),
  
  -- Traffic Source
  referer TEXT,
  
  -- UTM Parameters
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  utm_term VARCHAR(255),
  utm_content VARCHAR(255),
  
  -- Raw Data
  user_agent TEXT,
  enrichment_status VARCHAR(50) DEFAULT 'pending',
  raw_payload JSONB
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_whatsapp_number ON events(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_events_device_type ON events(device_type);
CREATE INDEX IF NOT EXISTS idx_events_country_code ON events(country_code);
CREATE INDEX IF NOT EXISTS idx_events_utm_campaign ON events(utm_campaign);
CREATE INDEX IF NOT EXISTS idx_events_button_name ON events(button_name);
CREATE INDEX IF NOT EXISTS idx_events_page ON events(page);

-- Create countries lookup table
CREATE TABLE IF NOT EXISTS public.countries (
  code VARCHAR(2) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  region VARCHAR(100),
  is_gulf BOOLEAN DEFAULT false
);

-- Insert Gulf countries
INSERT INTO countries (code, name, region, is_gulf) VALUES
  ('SA', 'Saudi Arabia', 'Middle East', true),
  ('AE', 'United Arab Emirates', 'Middle East', true),
  ('KW', 'Kuwait', 'Middle East', true),
  ('QA', 'Qatar', 'Middle East', true),
  ('BH', 'Bahrain', 'Middle East', true),
  ('OM', 'Oman', 'Middle East', true)
ON CONFLICT (code) DO NOTHING;

-- Grant necessary permissions
GRANT SELECT ON public.events TO anon;
GRANT SELECT ON public.countries TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;

COMMIT;