export type FieldTestedVariant = 'v1' | 'v2' | 'v3' | 'v4'

export type AudienceLens = 'prospect' | 'parent' | 'influencer'

export type WarriorAttribute = 'strength' | 'skills' | 'support' | 'stability'

export type ConcernFlag = 'autonomy' | 'safety' | 'fit' | 'timeline' | 'benefits'

export type ContentAffinity = 'story' | 'practical' | 'benefits' | 'non_combat' | 'team'

export type AssetAvailability = 'HAVE' | 'PARTIAL' | 'MISSING'

export interface DesiredAsset {
  name: string
  availability: AssetAvailability
  notes: string
}

export interface FieldTestedSectionSpec {
  id:
    | 's1_hero'
    | 's2_lens'
    | 's3_wheel'
    | 's4_stories'
    | 's5_reality'
    | 's6_path_builder'
    | 's7_copilot'
    | 's8_recap'
    | 's9_action'
  title: string
  objective: string
  behavior: string[]
  desiredAssets: DesiredAsset[]
}

export interface FieldTestedProfile {
  audienceLens: AudienceLens | null
  topAttribute: WarriorAttribute | null
  confidenceScore: number
  concernFlags: ConcernFlag[]
  contentAffinity: ContentAffinity[]
  completedSections: string[]
}

export interface FieldStoryCardAsset {
  id: string
  title: string
  bucket: 'operations' | 'humans' | 'field'
  description: string
  imageUrl: string
  sourcePageTitle?: string
  sourcePageUrl?: string
}
