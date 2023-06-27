import { IsIn, IsNotEmpty } from "class-validator";

export class StartKidLessonDto {
  @IsIn(["PreA1", "A1", "A2"])
  levelId: string;

  @IsIn(["lessons", "challenge"])
  type: string;
}
