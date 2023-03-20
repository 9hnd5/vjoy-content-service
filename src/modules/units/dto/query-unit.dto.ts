import { QueryDto } from "@common";
import { Allow, IsIn, IsOptional } from "class-validator";
import { UNIT_STATUS } from "entities/unit.entity";

export class QueryUnitDto extends QueryDto {
  @IsOptional()
  filter?: string;

  @Allow()
  levelCode?: string;

  @IsOptional()
  @IsIn(Object.values(UNIT_STATUS))
  status?: number;
}
