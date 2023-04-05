import { IsIn, IsJSON, IsNotEmpty, IsOptional, Length } from "class-validator";
import { UNIT_STATUS } from "entities/unit.entity";

export class CreateUnitDto {
  @Length(1, 255)
  name: string;

  @IsOptional()
  @IsIn(Object.values(UNIT_STATUS))
  status?: number = UNIT_STATUS.NEW;

  @IsNotEmpty()
  levelId: string;

  @IsOptional()
  @IsJSON()
  rules?: any;

  @IsOptional()
  @IsJSON()
  asset?: any;
}