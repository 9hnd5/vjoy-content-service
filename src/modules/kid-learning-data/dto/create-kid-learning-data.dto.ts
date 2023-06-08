import { IsNotEmpty } from "class-validator";

export class CreateKidLearningDataDto {
  @IsNotEmpty()
  kidId: number;

  @IsNotEmpty()
  currentLevelId: number;

  @IsNotEmpty()
  buddyId: string;
}
