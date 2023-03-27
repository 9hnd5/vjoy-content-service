import { QueryDto, ValidateFilter } from "@common";
import { IsIn, IsOptional } from "class-validator";
import { GAME_TYPE, LESSON_STATUS } from "entities/lesson.entity";

class Filter {
  @IsOptional()
  @IsIn(Object.values(LESSON_STATUS))
  status?: number;

  @IsOptional()
  @IsIn(Object.values(GAME_TYPE))
  gameType?: string;
}

export class FindLessonsQueryDto extends QueryDto {
  @IsOptional()
  @ValidateFilter(Filter)
  filter?: Filter;
}
