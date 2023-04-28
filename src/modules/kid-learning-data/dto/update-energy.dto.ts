import { IsNegative, IsOptional } from "class-validator";

export class UpdateEnergyDto {
  @IsOptional()
  @IsNegative()
  energy: number;
}
