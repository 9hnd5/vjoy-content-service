import { PartialType } from "@nestjs/mapped-types";
import { CreateBuddyDto } from "./create-buddy.dto";

export class UpdateBuddyDto extends PartialType(CreateBuddyDto) {}
