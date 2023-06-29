import { IsIn, IsNotEmpty, MaxLength } from "class-validator";

export class StartKidLessonDto {
  @MaxLength(255)
  @IsNotEmpty()
  lessonId: string;

  @IsIn(["lesson", "challenge"])
  type: "lesson" | "challenge";
}
