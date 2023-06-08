import { OmitType } from "@nestjs/mapped-types";
import { CreateKidLearningDataDto } from "./create-kid-learning-data.dto";

export class UpdateKidLearningDataDto extends OmitType(CreateKidLearningDataDto, ["kidId"] as const) {}
