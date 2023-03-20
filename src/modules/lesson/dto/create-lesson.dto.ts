import { IsIn, IsInt, IsJSON, IsNotEmpty, IsOptional, Length } from "class-validator";
import { LESSON_STATUS } from "entities/lesson.entity";

export class CreateLessonDto {
  @IsOptional()
  @Length(1, 255)
  name?: string;

  @IsOptional()
  @IsJSON()
  curriculum?: any;

  @IsOptional()
  @IsIn(Object.values(LESSON_STATUS))
  status?: number = LESSON_STATUS.NEW;

  @IsNotEmpty()
  @IsInt()
  unitId: number;

  @IsOptional()
  @IsJSON()
  rules?: any;

  @IsOptional()
  @IsJSON()
  asset?: any;
}
