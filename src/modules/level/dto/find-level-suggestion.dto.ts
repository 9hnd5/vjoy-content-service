import { IsNotEmpty, IsIn, ValidateIf, IsOptional } from "class-validator";

export class FindLevelSuggestionDto {
  @IsIn([6, 9, 11])
  fromAge: number;

  @IsOptional()
  @IsIn([8, 11])
  toAge?: number;
}
