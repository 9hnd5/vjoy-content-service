import { IsBoolean, IsIn, IsInt, IsOptional, Matches } from "class-validator";

export class CreateUpdateKidLessonProgressDto {
  @IsOptional()
  @IsInt()
  levelId?: number;

  @IsOptional()
  @IsInt()
  unitId?: number;

  @IsInt()
  lessonId: number;

  @IsIn([1, 2, 3])
  star: number;

  @Matches(/^(lesson|challenge)$/)
  type: "lesson" | "challenge";

  @IsBoolean()
  isWin: boolean;
}
