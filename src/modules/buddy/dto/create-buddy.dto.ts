import { Allow, IsIn, IsJSON, IsNotEmpty, IsOptional } from "class-validator";
import { BUDDY_STATUS } from "entities/buddy.entity";

export class CreateBuddyDto {
  @IsNotEmpty()
  id: string;

  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsIn(Object.values(BUDDY_STATUS))
  status?: number = BUDDY_STATUS.NEW;

  @IsOptional()
  @IsJSON()
  asset?: any;

  @Allow()
  type?: string;

  @Allow()
  voice?: string;
}
