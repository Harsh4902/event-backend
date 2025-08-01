export interface FunnelStep {
  event: string;
}

export interface FunnelRequestDto {
  orgId: string;
  projectId: string;
  steps: FunnelStep[];
  startDate?: string;
  endDate?: string; 
}