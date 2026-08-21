// Moderation state of a submitted Proposal report.
// Verbatim from `components.schemas.ProposalReportStatus` in docs/api-spec/openapi.json.
export const PROPOSAL_REPORT_STATUSES = ['PENDING', 'ACCEPTED', 'REJECTED'] as const

export type ProposalReportStatus = (typeof PROPOSAL_REPORT_STATUSES)[number]
