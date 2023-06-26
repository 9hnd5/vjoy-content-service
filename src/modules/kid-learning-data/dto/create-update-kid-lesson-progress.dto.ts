import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Matches } from "class-validator";

export class CreateUpdateKidLessonProgressDto {
  @IsOptional()
  @IsIn(["PreA1", "A1", "A2"])
  levelId?: string;

  @IsOptional()
  @IsString()
  unitId?: string;

  @IsString()
  lessonId: string;

  @IsIn([1, 2, 3])
  star: number;

  @Matches(/^(lesson|challenge)$/)
  type: "lesson" | "challenge";

  @IsBoolean()
  isWin: boolean;
}
