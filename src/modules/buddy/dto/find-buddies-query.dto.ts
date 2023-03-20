import { QueryDto } from "@common";
import { IsIn, IsOptional } from "class-validator";
import { BUDDY_STATUS } from "entities/buddy.entity";

export class FindBuddiesQueryDto extends QueryDto {
  @IsOptional()
  @IsIn(Object.values(BUDDY_STATUS))
  status?: number;
}
