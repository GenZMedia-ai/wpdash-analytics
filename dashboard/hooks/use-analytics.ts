import useSWR from 'swr'
import { analytics } from '@/lib/supabase'
import { DateRange } from 'react-day-picker'

export function useOverviewStats(dateRange: DateRange | undefined, whatsappNumber: string) {
  const { data, error, isLoading } = useSWR(
    dateRange?.from && dateRange?.to
      ? ['overview-stats', dateRange.from, dateRange.to, whatsappNumber]
      : null,
    ([_, from, to, number]) => analytics.getOverviewStats(from, to, number === 'all' ? undefined : number),
    {
      refreshInterval: 60000, // 1 minute
    }
  )

  return {
    data,
    error,
    isLoading,
  }
}

export function useTimeSeriesData(dateRange: DateRange | undefined, whatsappNumber: string) {
  const { data, error, isLoading } = useSWR(
    dateRange?.from && dateRange?.to
      ? ['time-series', dateRange.from, dateRange.to, whatsappNumber]
      : null,
    ([_, from, to, number]) => analytics.getTimeSeriesData(from, to, number === 'all' ? undefined : number),
    {
      refreshInterval: 60000,
    }
  )

  return {
    data,
    error,
    isLoading,
  }
}

export function useDeviceAnalytics(dateRange: DateRange | undefined, whatsappNumber: string) {
  const { data, error, isLoading } = useSWR(
    dateRange?.from && dateRange?.to
      ? ['device-analytics', dateRange.from, dateRange.to, whatsappNumber]
      : null,
    ([_, from, to, number]) => analytics.getDeviceAnalytics(from, to, number === 'all' ? undefined : number),
    {
      refreshInterval: 60000,
    }
  )

  return {
    data,
    error,
    isLoading,
  }
}

export function useReferrerAnalytics(dateRange: DateRange | undefined, whatsappNumber: string) {
  const { data, error, isLoading } = useSWR(
    dateRange?.from && dateRange?.to
      ? ['referrer-analytics', dateRange.from, dateRange.to, whatsappNumber]
      : null,
    ([_, from, to, number]) => analytics.getReferrerAnalytics(from, to, number === 'all' ? undefined : number),
    {
      refreshInterval: 60000,
    }
  )

  return {
    data,
    error,
    isLoading,
  }
}

export function useGeographicAnalytics(dateRange: DateRange | undefined, whatsappNumber: string) {
  const { data, error, isLoading } = useSWR(
    dateRange?.from && dateRange?.to
      ? ['geographic-analytics', dateRange.from, dateRange.to, whatsappNumber]
      : null,
    ([_, from, to, number]) => analytics.getGeographicAnalytics(from, to, number === 'all' ? undefined : number),
    {
      refreshInterval: 60000,
    }
  )

  return {
    data,
    error,
    isLoading,
  }
}

export function useCampaignAnalytics(dateRange: DateRange | undefined, whatsappNumber: string) {
  const { data, error, isLoading } = useSWR(
    dateRange?.from && dateRange?.to
      ? ['campaign-analytics', dateRange.from, dateRange.to, whatsappNumber]
      : null,
    ([_, from, to, number]) => analytics.getCampaignAnalytics(from, to, number === 'all' ? undefined : number),
    {
      refreshInterval: 60000,
    }
  )

  return {
    data,
    error,
    isLoading,
  }
}

export function useButtonAnalytics(dateRange: DateRange | undefined, whatsappNumber: string) {
  const { data, error, isLoading } = useSWR(
    dateRange?.from && dateRange?.to
      ? ['button-analytics', dateRange.from, dateRange.to, whatsappNumber]
      : null,
    ([_, from, to, number]) => analytics.getButtonAnalytics(from, to, number === 'all' ? undefined : number),
    {
      refreshInterval: 60000,
    }
  )

  return {
    data,
    error,
    isLoading,
  }
}

export function usePageAnalytics(dateRange: DateRange | undefined, whatsappNumber: string) {
  const { data, error, isLoading } = useSWR(
    dateRange?.from && dateRange?.to
      ? ['page-analytics', dateRange.from, dateRange.to, whatsappNumber]
      : null,
    ([_, from, to, number]) => analytics.getPageAnalytics(from, to, number === 'all' ? undefined : number),
    {
      refreshInterval: 60000,
    }
  )

  return {
    data,
    error,
    isLoading,
  }
}