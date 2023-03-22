import { QueryDto, ValidateFilter } from "@common";
import { IsIn, IsOptional } from "class-validator";
import { BUDDY_STATUS } from "entities/buddy.entity";
import { IsInt } from "sequelize-typescript";

class Filter {
  @IsOptional()
  @IsIn(Object.values(BUDDY_STATUS))
  status?: number;
}

export class FindBuddiesQueryDto extends QueryDto {
  @IsOptional()
  @ValidateFilter(Filter)
  filter?: Filter;
}
