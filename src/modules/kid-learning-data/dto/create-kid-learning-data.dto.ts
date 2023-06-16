import { IsNotEmpty } from "class-validator";

export class CreateKidLearningDataDto {
  @IsNotEmpty()
  currentLevelId: number;

  @IsNotEmpty()
  buddyId: string;

  @IsNotEmpty()
  parentId: number;

  @IsNotEmpty()
  character: string;

  @IsNotEmpty()
  kidName: string;
}
