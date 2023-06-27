import { IsIn, IsNotEmpty, IsString } from "class-validator";

export class StartKidLessonDto {
  @IsNotEmpty()
  @IsString()
  lessonId: string;

  @IsIn(["lesson", "challenge"])
  type: "lesson" | "challenge";
}
