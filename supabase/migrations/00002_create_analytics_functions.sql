-- Analytics Functions for WPDash Dashboard
-- These functions power the various dashboard views

BEGIN;

-- Function to get device analytics with aggregated data
CREATE OR REPLACE FUNCTION get_device_analytics_aggregated(
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_whatsapp_number TEXT DEFAULT NULL
)
RETURNS TABLE (
  mobile_percentage NUMERIC,
  desktop_percentage NUMERIC,
  tablet_percentage NUMERIC,
  mobile_count BIGINT,
  desktop_count BIGINT,
  tablet_count BIGINT,
  total_count BIGINT,
  top_browsers JSONB,
  top_screen_sizes JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH device_counts AS (
    SELECT
      COUNT(*) FILTER (WHERE device_type = 'mobile') as mobile_count,
      COUNT(*) FILTER (WHERE device_type = 'desktop') as desktop_count,
      COUNT(*) FILTER (WHERE device_type = 'tablet') as tablet_count,
      COUNT(*) as total_count
    FROM events
    WHERE created_at >= p_start_date
      AND created_at <= p_end_date
      AND (p_whatsapp_number IS NULL OR whatsapp_number = p_whatsapp_number)
  ),
  browser_stats AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'browser', browser_name,
        'count', browser_count,
        'percentage', ROUND((browser_count::NUMERIC / NULLIF(total_browsers, 0) * 100), 1)
      ) ORDER BY browser_count DESC
    ) as top_browsers
    FROM (
      SELECT
        browser_name,
        COUNT(*) as browser_count,
        SUM(COUNT(*)) OVER () as total_browsers
      FROM events
      WHERE created_at >= p_start_date
        AND created_at <= p_end_date
        AND (p_whatsapp_number IS NULL OR whatsapp_number = p_whatsapp_number)
        AND browser_name IS NOT NULL
      GROUP BY browser_name
      ORDER BY browser_count DESC
      LIMIT 5
    ) b
  ),
  screen_stats AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'resolution', screen_width || 'x' || screen_height,
        'count', resolution_count,
        'percentage', ROUND((resolution_count::NUMERIC / NULLIF(total_resolutions, 0) * 100), 1)
      ) ORDER BY resolution_count DESC
    ) as top_screen_sizes
    FROM (
      SELECT
        screen_width,
        screen_height,
        COUNT(*) as resolution_count,
        SUM(COUNT(*)) OVER () as total_resolutions
      FROM events
      WHERE created_at >= p_start_date
        AND created_at <= p_end_date
        AND (p_whatsapp_number IS NULL OR whatsapp_number = p_whatsapp_number)
        AND screen_width IS NOT NULL
        AND screen_height IS NOT NULL
      GROUP BY screen_width, screen_height
      ORDER BY resolution_count DESC
      LIMIT 5
    ) s
  )
  SELECT
    ROUND((mobile_count::NUMERIC / NULLIF(total_count, 1) * 100), 1) as mobile_percentage,
    ROUND((desktop_count::NUMERIC / NULLIF(total_count, 1) * 100), 1) as desktop_percentage,
    ROUND((tablet_count::NUMERIC / NULLIF(total_count, 1) * 100), 1) as tablet_percentage,
    mobile_count,
    desktop_count,
    tablet_count,
    total_count,
    COALESCE(browser_stats.top_browsers, '[]'::jsonb) as top_browsers,
    COALESCE(screen_stats.top_screen_sizes, '[]'::jsonb) as top_screen_sizes
  FROM device_counts
  CROSS JOIN browser_stats
  CROSS JOIN screen_stats;
END;
$$;

-- Function to get geographic analytics for world map
CREATE OR REPLACE FUNCTION get_geographic_world_analytics(
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_whatsapp_number TEXT DEFAULT NULL
)
RETURNS TABLE (
  country_code VARCHAR(2),
  country_name VARCHAR(100),
  click_count BIGINT,
  unique_users BIGINT,
  percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH country_stats AS (
    SELECT
      e.country_code,
      e.country,
      COUNT(*) as click_count,
      COUNT(DISTINCT e.client_ip) as unique_users
    FROM events e
    WHERE e.created_at >= p_start_date
      AND e.created_at <= p_end_date
      AND (p_whatsapp_number IS NULL OR e.whatsapp_number = p_whatsapp_number)
      AND e.country_code IS NOT NULL
    GROUP BY e.country_code, e.country
  ),
  total_clicks AS (
    SELECT SUM(click_count) as total FROM country_stats
  )
  SELECT
    cs.country_code,
    cs.country as country_name,
    cs.click_count,
    cs.unique_users,
    ROUND((cs.click_count::NUMERIC / NULLIF(tc.total, 0) * 100), 2) as percentage
  FROM country_stats cs
  CROSS JOIN total_clicks tc
  ORDER BY cs.click_count DESC;
END;
$$;

-- Function to get campaign analytics
CREATE OR REPLACE FUNCTION get_campaign_analytics(
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_whatsapp_number TEXT DEFAULT NULL
)
RETURNS TABLE (
  campaign_id TEXT,
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  click_count BIGINT,
  unique_users BIGINT,
  avg_clicks_per_user NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(utm_source, '') || '|' || COALESCE(utm_medium, '') || '|' || COALESCE(utm_campaign, '') as campaign_id,
    utm_source,
    utm_medium,
    utm_campaign,
    COUNT(*) as click_count,
    COUNT(DISTINCT client_ip) as unique_users,
    ROUND(COUNT(*)::NUMERIC / NULLIF(COUNT(DISTINCT client_ip), 0), 2) as avg_clicks_per_user
  FROM events
  WHERE created_at >= p_start_date
    AND created_at <= p_end_date
    AND (p_whatsapp_number IS NULL OR whatsapp_number = p_whatsapp_number)
    AND (utm_source IS NOT NULL OR utm_medium IS NOT NULL OR utm_campaign IS NOT NULL)
  GROUP BY utm_source, utm_medium, utm_campaign
  ORDER BY click_count DESC;
END;
$$;

COMMIT;