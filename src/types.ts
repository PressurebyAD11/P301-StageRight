export type Status = "ready" | "watch" | "action"

export type CategoryId =
  | "staffing"
  | "security"
  | "ticketing"
  | "concessions"
  | "parking"
  | "vip"
  | "merchandise"
  | "facilities"

export type ResolutionType = "assignStaff" | "confirmDelivery" | "restoreDevice"

export interface EventInfo {
  id: string
  name: string
  venue: string
  capacity: number
  date: string
  doorsAt: string
  showAt: string
  expectedAttendance: number
}

export interface Requirement {
  id: string
  label: string
  critical: boolean
  satisfied: boolean
  current?: string | number
  target?: string | number
}

export interface DetailMetric {
  label: string
  value: string
  emphasis?: "default" | "warning" | "critical"
}

export interface StaffingPost {
  id: string
  label: string
  role: string
  zone: string
  critical: boolean
  status: "confirmed" | "open"
  assignedStaffId?: string
  requiredQualifications: string[]
}

export interface MerchandiseDelivery {
  item: string
  originalEta: string
  revisedEta: string
  affectedStands: string[]
  impact: string
  status: "delayed" | "received"
}

export interface TicketingDeviceIssue {
  id: string
  section: string
  lastHeartbeatMinutes: number
  uptimePercent: number
  backupOptions: string[]
  online: boolean
}

export interface CategoryDetails {
  description?: string
  metrics?: DetailMetric[]
  staffingPosts?: StaffingPost[]
  delayedDelivery?: MerchandiseDelivery
  deviceIssue?: TicketingDeviceIssue
  notes?: string[]
}

export type CategoryMetricValue = string | number | boolean

export interface Category {
  id: CategoryId
  name: string
  weight: number
  readiness: number
  status: Status
  summary: string
  requirements: Requirement[]
  statusRule: string
  lastUpdated: string
  metrics: Record<string, CategoryMetricValue>
  details?: CategoryDetails
}

export interface Alert {
  id: string
  categoryId: CategoryId
  severity: Extract<Status, "watch" | "action">
  title: string
  detail: string
  impact?: string
  timeContext?: string
  resolutionType: ResolutionType
  resolved: boolean
}

export interface StaffMember {
  id: string
  name: string
  qualifications: string[]
  status: "available" | "assigned" | "on_break"
  zone?: string
}

export interface AppState {
  schemaVersion: number
  isAuthenticated: boolean
  event: EventInfo
  categories: Category[]
  alerts: Alert[]
  staff: StaffMember[]
  overallReadiness: number
}