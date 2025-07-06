import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to format date for Supabase queries
export function formatDateForDB(date: Date): string {
  return date.toISOString()
}

// Analytics API functions
export const analytics = {
  async getOverviewStats(startDate: Date, endDate: Date, whatsappNumber?: string) {
    const { data, error } = await supabase.rpc('get_overview_stats', {
      p_start_date: formatDateForDB(startDate),
      p_end_date: formatDateForDB(endDate),
      p_whatsapp_number: whatsappNumber === 'all' ? null : whatsappNumber
    })
    
    if (error) throw error
    return data
  },

  async getTimeSeriesData(startDate: Date, endDate: Date, whatsappNumber?: string) {
    const { data, error } = await supabase.rpc('get_time_series_data', {
      p_start_date: formatDateForDB(startDate),
      p_end_date: formatDateForDB(endDate),
      p_whatsapp_number: whatsappNumber === 'all' ? null : whatsappNumber,
      p_interval: 'hour'
    })
    
    if (error) throw error
    return data
  },

  async getDeviceAnalytics(startDate: Date, endDate: Date, whatsappNumber?: string) {
    const { data, error } = await supabase.rpc('get_device_analytics_aggregated', {
      p_start_date: formatDateForDB(startDate),
      p_end_date: formatDateForDB(endDate),
      p_whatsapp_number: whatsappNumber === 'all' ? null : whatsappNumber
    })
    
    if (error) throw error
    return data
  },

  async getReferrerAnalytics(startDate: Date, endDate: Date, whatsappNumber?: string) {
    const { data, error } = await supabase.rpc('get_referrer_analytics', {
      p_start_date: formatDateForDB(startDate),
      p_end_date: formatDateForDB(endDate),
      p_whatsapp_number: whatsappNumber === 'all' ? null : whatsappNumber
    })
    
    if (error) throw error
    return data
  },

  async getGeographicAnalytics(startDate: Date, endDate: Date, whatsappNumber?: string) {
    const { data, error } = await supabase.rpc('get_geographic_world_analytics', {
      p_start_date: formatDateForDB(startDate),
      p_end_date: formatDateForDB(endDate),
      p_whatsapp_number: whatsappNumber === 'all' ? null : whatsappNumber
    })
    
    if (error) throw error
    return data
  },

  async getCampaignAnalytics(startDate: Date, endDate: Date, whatsappNumber?: string) {
    const { data, error } = await supabase.rpc('get_campaign_analytics', {
      p_start_date: formatDateForDB(startDate),
      p_end_date: formatDateForDB(endDate),
      p_whatsapp_number: whatsappNumber === 'all' ? null : whatsappNumber
    })
    
    if (error) throw error
    return data
  },

  async getButtonAnalytics(startDate: Date, endDate: Date, whatsappNumber?: string) {
    const { data, error } = await supabase.rpc('get_button_analytics', {
      p_start_date: formatDateForDB(startDate),
      p_end_date: formatDateForDB(endDate),
      p_whatsapp_number: whatsappNumber === 'all' ? null : whatsappNumber
    })
    
    if (error) throw error
    return data
  },

  async getPageAnalytics(startDate: Date, endDate: Date, whatsappNumber?: string) {
    const { data, error } = await supabase.rpc('get_page_analytics', {
      p_start_date: formatDateForDB(startDate),
      p_end_date: formatDateForDB(endDate),
      p_whatsapp_number: whatsappNumber === 'all' ? null : whatsappNumber
    })
    
    if (error) throw error
    return data
  }
}