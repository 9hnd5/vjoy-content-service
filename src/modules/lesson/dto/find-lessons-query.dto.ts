import { QueryDto } from "@common";
import { IsIn, IsOptional } from "class-validator";
import { LESSON_STATUS } from "entities/lesson.entity";

export class FindLessonsQueryDto extends QueryDto {
  @IsOptional()
  filter?: string;

  @IsOptional()
  @IsIn(Object.values(LESSON_STATUS))
  status?: number;
}
