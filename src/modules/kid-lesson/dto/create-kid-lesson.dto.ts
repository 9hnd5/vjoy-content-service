import { IsIn, IsNotEmpty, IsString, Matches, MaxLength } from "class-validator";

export class CreateKidLessonDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  lessonId: string;

  @Matches(/^(lesson|challenge)$/)
  type: "lesson" | "challenge";

  @IsIn([1, 2, 3])
  difficulty: 1 | 2 | 3;
}
