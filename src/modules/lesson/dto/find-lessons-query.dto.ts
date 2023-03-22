import { QueryDto, ValidateFilter } from "@common";
import { IsIn, IsOptional } from "class-validator";
import { LESSON_STATUS } from "entities/lesson.entity";

class Filter {
  @IsOptional()
  @IsIn(Object.values(LESSON_STATUS))
  status?: number;
}

export class FindLessonsQueryDto extends QueryDto {
  @IsOptional()
  @ValidateFilter(Filter)
  filter?: Filter;
}
