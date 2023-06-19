import { IsNotEmpty, IsIn } from "class-validator";
import {} from "sequelize-typescript";

export class CreateKidLearningDataDto {
  @IsNotEmpty()
  @IsIn(["eng-A1", "eng-A2", "eng-preA1"])
  currentLevelId: string;

  @IsNotEmpty()
  buddyId: string;

  @IsNotEmpty()
  parentId: number;

  @IsNotEmpty()
  character: string;

  @IsNotEmpty()
  kidName: string;
}
