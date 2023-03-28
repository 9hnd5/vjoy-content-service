import { IsIn, IsInt, IsJSON, IsString, IsNotEmpty, IsOptional, IsArray, Length, ValidateIf, ValidateNested} from "class-validator";
import { Type } from 'class-transformer';

import { GAME_TYPE, LESSON_DIFFICULTY, LESSON_STATUS } from "entities/lesson.entity";

export class CreateLessonDto {
  
  @Length(1, 255)
  name: string;

  @IsOptional()
  @IsIn(Object.values(LESSON_STATUS))
  status?: number = LESSON_STATUS.SAVED;

  @IsNotEmpty() 
  @IsInt()
  unitId: number;

  @IsOptional()
  @IsJSON()
  rules?: any;

  @IsNotEmpty()
  @IsIn(Object.values(GAME_TYPE))
  gameType: string;

  @IsOptional()
  @ValidateIf((o) => o.gameType == GAME_TYPE.WORD_BALLOON)
  @ValidateNested()
  @Type(() => WordBalloonAssetDto)
  asset?: any;

  @IsIn(Object.values(LESSON_DIFFICULTY))
  difficulty: number;

  @IsOptional()
  @IsJSON()
  curriculum?: any;
}

class WordBalloonAssetDto {
  @IsString()
  bg: string;

  @IsString()
  cannon: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BalloonDto)
  balloons: BalloonDto[];

  @IsInt()
  behavior: number;

  @IsInt()
  wordLength: number;

  @IsInt()
  missingLetter: number;
}

class BalloonDto {
  @IsString()
  name: string;

  @IsIn(["W", "E"])
  type: string;

  @IsString()
  position: string;
}