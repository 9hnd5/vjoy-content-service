import { IsBoolean, IsIn, IsNotEmpty, IsString, Matches, MaxLength } from "class-validator";

export class CreateKidLessonDto {
  @IsIn(["PreA1", "A1", "A2"])
  levelId: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  unitId: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  lessonId: string;

  @IsIn([1, 2, 3])
  star: number;

  @Matches(/^(lesson|challenge)$/)
  type: "lesson" | "challenge";

  @IsBoolean()
  isWin: boolean;
}
