import { QueryDto } from "@common";
import { IsInt, IsOptional } from "class-validator";

export class FindLessonsQueryDto extends QueryDto {
  @IsOptional()
  filter?: string;

  @IsOptional()
  @IsInt()
  status?: number;
}
