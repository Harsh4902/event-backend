import { IsString, IsNotEmpty, IsObject, IsISO8601, IsOptional } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  orgId: string;

  @IsString()
  @IsNotEmpty()
  projectId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  event: string;

  @IsObject()
  @IsOptional()
  properties?: Record<string, any>;

  @IsISO8601()
  timestamp: string;
}
