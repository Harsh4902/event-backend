export interface FunnelStepResult {
  step: string;
  users: number;
  dropoffFromPrevious?: number;
}

export interface FunnelResponseDto {
  totalUsers: number;
  steps: FunnelStepResult[];
}