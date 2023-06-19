import { IsBoolean, IsIn, IsInt, IsOptional, Matches } from "class-validator";

export class CreateUpdateKidLessonProgressDto {
  @IsOptional()
  @IsIn(["eng-A1", "eng-A2", "eng-preA1"])
  levelId?: string;

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
