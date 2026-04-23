// Backend: /api/safety-rules
export type SafetyRuleSeverity = 'NORMAL' | 'CAUTION' | 'WARNING' | 'CRITICAL'

export interface SafetyRule {
  id: number
  industryCode: string
  ruleNo: string
  title: string
  content: string
  severity: SafetyRuleSeverity
  sortOrder: number
  active: boolean
}

export interface SafetyRulePayload {
  industryCode: string
  ruleNo: string
  title: string
  content: string
  severity: SafetyRuleSeverity
  sortOrder: number
  active: boolean
}

export interface SafetyRuleListParams {
  industryCode?: string
}
