import { Allow, IsInt, IsOptional } from "class-validator";
import { QueryDto } from "@common";

export class QueryUnitDto extends QueryDto {
  @IsOptional()
  filter?: string;

  @Allow()
  levelCode?: string;

  @IsOptional()
  @IsInt()
  status?: number;
}
