import { QueryDto, ValidateFilter } from "@common";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

class Filter {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber({}, { each: true })
  ids: number[];
}

export class FindLevelsQueryDto extends QueryDto {
  @IsOptional()
  @ValidateFilter(Filter)
  filter?: Filter;
}
