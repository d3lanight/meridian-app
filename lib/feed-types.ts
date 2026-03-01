// ━━━ Feed Types ━━━
// v1.0.0 · ca-story83 · Sprint 20
// Discriminated union for journal feed entries

export type FeedEntryType =
  | 'greeting'
  | 'regime'
  | 'price_pair'
  | 'posture'
  | 'insight'
  | 'market_snippet'
  | 'signal'
  | 'learn'
  | 'divider'
  | 'anon_cta'

export interface EntryGreetingData {
  name: string
}

export interface EntryRegimeData {
  regime: string
  confidence: number
  persistence: number
  narrative: string
}

export interface EntryPricePairData {
  btcPrice: number
  btcChange: number
  ethPrice: number
  ethChange: number
}

export interface EntryPostureData {
  score: number
  label: string
  narrative: string
}

export interface EntryInsightData {
  icon: 'zap' | 'shield' | 'trending' | 'activity'
  iconVariant: 'accent' | 'positive' | 'eth' | 'neutral'
  text: string
  subtext?: string
  link?: boolean
}

export interface EntryMarketSnippetData {
  label: string
  value: string
  change?: string
  positive?: boolean
}

export interface EntrySignalData {
  severity: 'info' | 'watch' | 'action'
  title: string
  text: string
  time: string
}

export interface EntryLearnData {
  text: string
  topic?: string
  slug?: string
}

export interface EntryDividerData {
  label: string
}

export interface EntryAnonCtaData {
  title: string
  text: string
}

export type FeedEntry =
  | { type: 'greeting'; data: EntryGreetingData }
  | { type: 'regime'; data: EntryRegimeData }
  | { type: 'price_pair'; data: EntryPricePairData }
  | { type: 'posture'; data: EntryPostureData }
  | { type: 'insight'; data: EntryInsightData }
  | { type: 'market_snippet'; data: EntryMarketSnippetData }
  | { type: 'signal'; data: EntrySignalData }
  | { type: 'learn'; data: EntryLearnData }
  | { type: 'divider'; data: EntryDividerData }
  | { type: 'anon_cta'; data: EntryAnonCtaData } 
  