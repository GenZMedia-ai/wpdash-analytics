'use client'

import { useState } from 'react'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { OverviewTab } from './tabs/overview-tab'
import { TechnologyTab } from './tabs/technology-tab'
import { TrafficTab } from './tabs/traffic-tab'
import { GeographyTab } from './tabs/geography-tab'
import { CampaignsTab } from './tabs/campaigns-tab'
import { InteractionsTab } from './tabs/interactions-tab'
import { addDays } from 'date-fns'

export function DashboardContent() {
  const [dateRange, setDateRange] = useState({
    from: addDays(new Date(), -7),
    to: new Date()
  })
  const [whatsappNumber, setWhatsappNumber] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
            />
            <Select value={whatsappNumber} onValueChange={setWhatsappNumber}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select WhatsApp number" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Numbers</SelectItem>
                <SelectItem value="966501234567">+966 50 123 4567</SelectItem>
                <SelectItem value="966557654321">+966 55 765 4321</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Tab Navigation */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'technology', label: 'Technology' },
            { id: 'traffic', label: 'Traffic Sources' },
            { id: 'geography', label: 'Geography' },
            { id: 'campaigns', label: 'Campaigns' },
            { id: 'interactions', label: 'Interactions' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium
                ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && <OverviewTab dateRange={dateRange} whatsappNumber={whatsappNumber} />}
        {activeTab === 'technology' && <TechnologyTab dateRange={dateRange} whatsappNumber={whatsappNumber} />}
        {activeTab === 'traffic' && <TrafficTab dateRange={dateRange} whatsappNumber={whatsappNumber} />}
        {activeTab === 'geography' && <GeographyTab dateRange={dateRange} whatsappNumber={whatsappNumber} />}
        {activeTab === 'campaigns' && <CampaignsTab dateRange={dateRange} whatsappNumber={whatsappNumber} />}
        {activeTab === 'interactions' && <InteractionsTab dateRange={dateRange} whatsappNumber={whatsappNumber} />}
      </div>
    </div>
  )
}