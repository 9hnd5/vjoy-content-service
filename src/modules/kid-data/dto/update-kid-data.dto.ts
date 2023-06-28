import { PickType } from "@nestjs/mapped-types";
import { CreateKidDataDto } from "./create-kid-data.dto";

export class UpdateKidDataDto extends PickType(CreateKidDataDto, ["buddyId", "currentLevelId"] as const) {}
