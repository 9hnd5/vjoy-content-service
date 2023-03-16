import { Allow, IsIn, IsJSON, IsNotEmpty, IsOptional } from "class-validator";
import { UNIT_STATUS } from "entities/unit.entity";

export class CreateUnitDto {
  @Allow()
  name?: string;

  @IsOptional()
  @IsIn(Object.values(UNIT_STATUS))
  status?: number = UNIT_STATUS.NEW;

  @IsNotEmpty()
  levelCode: string;

  @IsOptional()
  @IsJSON()
  rules?: any;

  @IsOptional()
  @IsJSON()
  asset?: any;
}