import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import UAParser from 'https://esm.sh/ua-parser-js@1.0.35'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-ingest-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

// Schema for incoming data
const PHPEnrichedEventSchema = z.object({
  button_name: z.string(),
  whatsapp_number: z.string().regex(/^\d+$/),
  source: z.string(),
  page: z.string(),
  action: z.string(),
  client_timestamp: z.string(),
  gtm_unique_event_id: z.string(),
  
  server_enrichment: z.object({
    client_ip: z.string().ip({ version: 'v4' }).nullable().optional(),
    user_agent_raw: z.string().nullable(),
    referer: z.string().nullable().optional(),
    accept_language: z.string().nullable().optional(),
    server_timestamp: z.string()
  }).optional(),
  
  ua_data: z.object({
    userAgent: z.string().optional(),
    language: z.string().optional(),
    screen: z.object({
      width: z.number().optional(),
      height: z.number().optional(),
    }).optional(),
    timezone: z.string().optional()
  }).optional(),
  
  utm_params: z.record(z.string()).nullable().optional(),
  
  page_context: z.object({
    url: z.string().optional(),
    title: z.string().optional()
  }).optional()
})

// Parse user agent
function parseUserAgent(userAgent: string) {
  const parser = new UAParser(userAgent)
  const result = parser.getResult()
  
  return {
    browser_name: result.browser.name || 'Unknown',
    browser_version: result.browser.version || 'Unknown',
    os_name: result.os.name || 'Unknown',
    os_version: result.os.version || 'Unknown',
    device_type: result.device.type || 'desktop',
    is_mobile: result.device.type === 'mobile' || result.device.type === 'tablet'
  }
}

// Geo lookup function
async function getGeoFromIP(ip: string): Promise<{ country: string; city: string; country_code: string } | null> {
  if (!ip || ip === 'unknown') return null
  
  // Validate IP format
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  if (!ipv4Regex.test(ip)) return null
  
  try {
    // Using ipapi.co free tier
    const response = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`)
    
    if (!response.ok) return null
    
    const data = await response.json()
    
    if (data.error) return null
    
    return {
      country: data.country_name || 'Unknown',
      city: data.city || 'Unknown',
      country_code: data.country_code || 'XX'
    }
  } catch (error) {
    console.error('Geo lookup failed:', error)
    return null
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders
    })
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { 
      status: 405,
      headers: corsHeaders
    })
  }

  // Check security header
  const ingestSecret = req.headers.get('x-ingest-secret')
  const expectedSecret = Deno.env.get('INGEST_SECRET')
  
  if (expectedSecret && ingestSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    // Parse and validate request body
    const body = await req.json()
    const validatedData = PHPEnrichedEventSchema.parse(body)
    
    // Check for duplicate event
    const { data: existing } = await supabase
      .from('events')
      .select('id')
      .eq('gtm_unique_event_id', validatedData.gtm_unique_event_id)
      .single()
    
    if (existing) {
      return new Response(JSON.stringify({ 
        error: 'Duplicate event',
        message: 'This event has already been recorded'
      }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // Extract user agent
    const userAgent = validatedData.server_enrichment?.user_agent_raw || 
                     validatedData.ua_data?.userAgent || 
                     'Unknown'
    
    // Parse user agent
    const uaData = parseUserAgent(userAgent)
    
    // Get client IP
    const clientIP = validatedData.server_enrichment?.client_ip || 'unknown'
    
    // Geo enrichment (async but don't wait)
    const geoPromise = getGeoFromIP(clientIP)
    
    // Parse screen dimensions
    const screenWidth = validatedData.ua_data?.screen?.width || null
    const screenHeight = validatedData.ua_data?.screen?.height || null
    
    // Parse UTM parameters
    const utmParams = validatedData.utm_params || {}
    
    // Wait for geo data (with timeout)
    const geo = await Promise.race([
      geoPromise,
      new Promise<null>(resolve => setTimeout(() => resolve(null), 2000))
    ])
    
    // Prepare event data
    const eventData = {
      // Core fields
      button_name: validatedData.button_name,
      whatsapp_number: validatedData.whatsapp_number,
      page: validatedData.page,
      source: validatedData.source,
      action: validatedData.action,
      gtm_unique_event_id: validatedData.gtm_unique_event_id,
      
      // Timestamps
      client_timestamp: new Date(validatedData.client_timestamp).toISOString(),
      server_timestamp: validatedData.server_enrichment?.server_timestamp ? 
        new Date(validatedData.server_enrichment.server_timestamp).toISOString() : 
        new Date().toISOString(),
      
      // Device info
      device_type: uaData.device_type,
      browser_name: uaData.browser_name,
      browser_version: uaData.browser_version,
      os_name: uaData.os_name,
      os_version: uaData.os_version,
      is_mobile: uaData.is_mobile,
      
      // Screen info
      screen_width: screenWidth,
      screen_height: screenHeight,
      
      // Network info
      client_ip: clientIP,
      user_agent: userAgent,
      referer: validatedData.server_enrichment?.referer || null,
      
      // Geographic info
      country: geo?.country || 'Unknown',
      country_code: geo?.country_code || 'XX',
      city: geo?.city || 'Unknown',
      
      // UTM parameters
      utm_source: utmParams.utm_source || null,
      utm_medium: utmParams.utm_medium || null,
      utm_campaign: utmParams.utm_campaign || null,
      utm_term: utmParams.utm_term || null,
      utm_content: utmParams.utm_content || null,
      
      // Status
      enrichment_status: geo ? 'complete' : 'partial',
      
      // Store raw payload for debugging
      raw_payload: body
    }
    
    // Insert event
    const { data: insertedEvent, error: insertError } = await supabase
      .from('events')
      .insert(eventData)
      .select('id')
      .single()
    
    if (insertError) {
      console.error('Insert error:', insertError)
      throw new Error('Failed to insert event')
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      id: insertedEvent.id,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Processing error:', error)
    
    // Return validation errors with details
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ 
        error: 'Invalid data',
        details: error.errors
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // Generic error response
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: 'Failed to process event'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})