import { IsIn, IsInt, IsJSON, IsNotEmpty, IsOptional, Length } from "class-validator";
import { GAME_TYPE, LESSON_DIFFICULTY, LESSON_STATUS } from "entities/lesson.entity";

export class CreateLessonDto {
  @IsOptional()
  @Length(1, 255)
  name?: string;

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

  @IsNotEmpty()
  @IsIn(Object.values(GAME_TYPE))
  gameType: string;

  @IsIn(Object.values(LESSON_DIFFICULTY))
  difficulty: number;

  @IsOptional()
  @IsJSON()
  curriculum?: any;
}
