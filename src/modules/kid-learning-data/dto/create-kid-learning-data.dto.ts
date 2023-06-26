import { IsNotEmpty, IsIn } from "class-validator";
import {} from "sequelize-typescript";

export class CreateKidLearningDataDto {
  @IsNotEmpty()
  @IsIn(["PreA1", "A1", "A2"])
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
