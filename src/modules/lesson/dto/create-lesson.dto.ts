import { Type } from "class-transformer";
import {
  ArrayNotEmpty,
  IsIn,
  IsInt,
  IsJSON,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  ValidateNested
} from "class-validator";

import { GAME_TYPE, LESSON_DIFFICULTY, LESSON_STATUS } from "entities/lesson.entity";
import { ValidateAsset } from "../decorators/validate-asset.decorator";

class BustAWordAsset {
  @Matches(/^(?:(?!\.png$).)*$/i, { message: 'String must not end with ".png"' })
  bg: string;

  @Matches(/^(?:(?!\.png$).)*$/i, { message: 'String must not end with ".png"' })
  cannon: string;

  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => Sphere)
  spheres: Sphere[];

  @IsUrl()
  bundleUrl: string;
}
class Sphere {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  type: string;
}

class WordBalloonAsset {
  @IsUrl()
  bundleUrl: string;

  @Matches(/^(?:(?!\.png$).)*$/i, { message: 'String must not end with ".png"' })
  bg: string;

  @Matches(/^(?:(?!\.png$).)*$/i, { message: 'String must not end with ".png"' })
  cannon: string;

  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => Balloon)
  balloons: Balloon[];

  @IsInt()
  behavior: number;
}
class Balloon {
  @Matches(/^(?:(?!\.png$).)*$/i, { message: 'String must not end with ".png"' })
  name: string;

  @IsIn(["W", "E"])
  type: string;

  @IsString()
  position: string;
}
class CurriculumData {
  @IsString()
  word: string;

  @IsInt()
  difficulty: number;

  @IsInt()
  missingLetterCount: number;
}
class Curriculum {
  @IsString()
  name: string;

  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CurriculumData)
  data: CurriculumData[];
}

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
  gameType: keyof typeof GAME_TYPE;

  @ValidateAsset([
    { type: "BUST_A_WORD", value: BustAWordAsset },
    { type: "WORD_BALLOON", value: WordBalloonAsset },
  ])
  asset: BustAWordAsset | WordBalloonAsset;

  @IsIn(Object.values(LESSON_DIFFICULTY))
  difficulty: number;

  @IsNotEmpty()
  @ValidateNested()
  curriculum: Curriculum;
}
