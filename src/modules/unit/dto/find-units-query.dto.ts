import { QueryDto, ValidateFilter } from "@common";
import { IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { UNIT_STATUS } from "entities/unit.entity";

class Filter {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  levelId?: string;

  @IsOptional()
  @IsIn(Object.values(UNIT_STATUS))
  status?: number;
}

export class FindUnitsQueryDto extends QueryDto {
  @IsOptional()
  @ValidateFilter(Filter)
  filter?: Filter;
}
