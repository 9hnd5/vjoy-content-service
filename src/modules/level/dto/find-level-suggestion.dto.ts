import { Type } from "class-transformer";
import { IsDate, IsNotEmpty, ValidateNested } from "class-validator";

class Filter {
  @IsDate()
  @Type(() => Date)
  dob: Date;
}

export class FindLevelSuggestionDto {
  @IsNotEmpty()
  @ValidateNested()
  filter: Filter;
}
