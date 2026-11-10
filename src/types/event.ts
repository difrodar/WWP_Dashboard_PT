/**
 * Data model for the Community Fundraising Monitor prototype.
 *
 * All values are synthetic. The option lists below are DEMONSTRATION
 * taxonomies chosen by Team 10 for the prototype; they are not officially
 * approved Wounded Warrior Project classifications.
 */

/** Calendar date as an ISO date-only string: `YYYY-MM-DD`. */
export type ISODate = string;

export const PRIORITIES = ['High', 'Medium', 'Low'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const REVIEW_STATUSES = [
  'Needs Review',
  'Awaiting Bank or Check Processing',
  'Awaiting Advisory Board',
  'Post-Event Donations Expected',
  'Host Contact Needed',
  'Data or Attribution Mismatch',
  'Confirmed No Activity',
  'Resolved or Funds Attributed',
] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

/** The single review status that represents a resolved case. */
export const RESOLVED_STATUS: ReviewStatus = 'Resolved or Funds Attributed';
/** Default status the monitoring rule implies for a newly flagged event. */
export const DEFAULT_REVIEW_STATUS: ReviewStatus = 'Needs Review';
/** Unresolved operational status for pending offline donations. */
export const AWAITING_PROCESSING_STATUS: ReviewStatus = 'Awaiting Bank or Check Processing';

export const REVIEW_REASONS = [
  'Not yet determined',
  'No posted donations',
  'Offline check or bank deposit pending',
  'Advisory board activity pending',
  'Post-event donations expected',
  'Possible identity or attribution mismatch',
  'Donations made on another WWP page',
  'Third-party payment collection',
  'Host unresponsive',
  'Event cancelled or did not occur',
  'Event date missing or invalid',
] as const;
export type ReviewReason = (typeof REVIEW_REASONS)[number];

export const PROCESSING_STATUSES = [
  'None reported',
  'Offline check in transit',
  'Bank deposit pending',
  'Partially posted',
  'Posted',
  'Unknown',
] as const;
export type ProcessingStatus = (typeof PROCESSING_STATUSES)[number];

export const EVENT_TYPES = [
  '5K Run/Walk',
  'Bake Sale',
  'Car Show',
  'Community Meal',
  'Gala/Dinner',
  'Gaming Marathon',
  'Golf Tournament',
  'Hike/Ruck Challenge',
  'Motorcycle Ride',
  'School Fundraiser',
  'Sports Tournament',
  'Trivia/Game Night',
  'Workout Challenge',
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const SOURCE_SYSTEMS = ['Simulated NPSP', 'Simulated DonorDrive'] as const;
export type SourceSystem = (typeof SOURCE_SYSTEMS)[number];

export type TimelineEntryType =
  | 'registration'
  | 'event'
  | 'review'
  | 'processing'
  | 'assignment'
  | 'status'
  | 'priority'
  | 'note'
  | 'scheduling'
  | 'resolution'
  | 'closure'
  | 'data-quality';

export interface TimelineEntry {
  id: string;
  date: ISODate;
  type: TimelineEntryType;
  description: string;
  /** Fictional person or "System" that produced the entry. */
  actor: string;
  /** True when the entry was created by an action during this demo session. */
  isDemoAction?: boolean;
}

export interface FollowUpNote {
  id: string;
  date: ISODate;
  author: string;
  text: string;
  isDemoAction?: boolean;
}

export interface FundraisingEvent {
  /** Fictional prototype identifier (not a Salesforce or DonorDrive ID). */
  id: string;
  eventName: string;
  /** Fundraiser registrant / host (fictional). */
  hostName: string;
  /** Event date; null when missing in the source data. */
  eventDate: ISODate | null;
  eventType: EventType;
  /** Posted fundraising amount in USD. */
  amountRaised: number;
  fundraisingGoal: number | null;
  /** Staff-managed operational status. "Resolved or Funds Attributed" = resolved. */
  reviewStatus: ReviewStatus;
  reviewReason: ReviewReason;
  /** Staff-assigned / illustrative priority — not an official risk model. */
  priority: Priority;
  assignedSpecialist: string | null;
  lastReviewed: ISODate | null;
  nextActionDate: ISODate | null;
  processingStatus: ProcessingStatus;
  lastUpdated: ISODate;
  sourceSystem: SourceSystem;
  notes: FollowUpNote[];
  timeline: TimelineEntry[];
  /** Administratively closed (independent of review status). */
  isClosed: boolean;
}
