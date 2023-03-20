import { QueryDto } from "@common";
import { IsNotEmpty, IsOptional } from "class-validator";

export class FindLevelsQueryDto extends QueryDto {
  @IsOptional()
  @IsNotEmpty()
  code?: string;

  @IsOptional()
  @IsNotEmpty()
  name?: string;
}
