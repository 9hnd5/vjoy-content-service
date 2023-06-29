import { IsIn, IsNotEmpty, IsString, Matches, MaxLength } from "class-validator";

export class CreateKidLessonDto {
  @MaxLength(255)
  @IsNotEmpty()
  lessonId: string;

  @IsIn(["lesson", "challenge"])
  type: "lesson" | "challenge";

  @IsIn([1, 2, 3])
  difficulty: 1 | 2 | 3;
}
